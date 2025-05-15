const ModbusRTU = require('modbus-serial');
const { readInput, readCoil, writeCoil, checkState, sendCommands } = require('./modbus.functions');
const { getSocket } = require('../socket/socket.functions');
const { getPostState, startOrder, endOrder } = require('../../run');

/*
let postsState = [];
let postsTime = 0;
*/

const connectModbus = (ip, port) => new Promise((resolve, reject) => {
    const client = new ModbusRTU();
    client.connectTCP(ip, { port: port }, (err) => {
        if (err) {
            reject(err);
        }
        resolve(client);
    });
});

const connectPost = (post) => {
    if (post?.ip && post?.port) {
        console.log( `connect ${post.ip}:${post.port}` );
        const timeout = 10000;
        connectModbus(post.ip, post.port)
            .then(client => {
                console.log( `connected ${post.ip}:${post.port}` );
                if (post.unit_id) {
                    client.setID(post.unit_id);
                }
                client._port.on('close', () => {
                    console.log('Соединение разорвано, переподключение...');
                    setTimeout(() => connectPost(post), timeout);
                });
                client._port.on('error', (err) => {
                    console.error('Ошибка сокета:', err);
                    setTimeout(() => connectPost(post), timeout);
                });
                post.client = client;
            })
            .catch(err => {
                if (err) {
                    setTimeout(() => connectPost(post), timeout);
                }
            });
    }
}

/*
const getPost = (id) => {
    return global.PROPERTY.posts.find(post => post.id === id);
}
*/

const initModbus = async () => {
    global.PROPERTY.posts.map(post => {
        connectPost(post);
    });
}
module.exports.initModbus = initModbus;

/*
const readModbus = async () => {
    console.log( 'readModbus' );
    try {
        let currentState = [];
        let currentTime = new Date().valueOf();
        let secondsPassed = Math.round((currentTime - postsTime) / 1000);
        let index = 0;
        for (const post of global.PROPERTY.posts) {
            if (post?.client?._port && !post?.client?._port?.destroyed) {
                if (post?.addresses && post?.read_state?.length) {
                    const state = {};
                    //console.log( post.read_state );
                    for (let command of post.read_state) {
                        try {
                            state[command] = await readCoil(post.client, post.addresses[command]);
                        }
                        catch (err) {
                            console.error('Error:', err);
                        }
                    }
                    currentState.push({ post_id: post.id, state });
                    index++;
                }
            }
        }
        if (index > 0) {
            if (JSON.stringify(postsState) !== JSON.stringify(currentState) || secondsPassed >= 120) {
                postsState = currentState;
                postsTime = currentTime;
                await setPostsState(postsState);
            }
        }
    }
    catch (err) {
        console.error('Непредвиденная ошибка в readModbus:', err);
    }
    finally {
        setTimeout(readModbus, 1000);
    }
}
module.exports.readModbus = readModbus;
*/

const setPostsState = async (postsState) => {
    console.log(new Date(), 'Состояние изменилось', postsState);
    getSocket().then(socket => {
        socket.emit('postsState', postsState);
    });
}

/*
const sendPostCommands = async (data) => {
    if (data.post_id && data.commands) {
        console.log('socket command', data.post_id, data.commands);
        const post = getPost(data.post_id);
        if (post?.client) {
            await sendCommands(post.client, data.commands);
        }
    }
}
module.exports.sendPostCommands = sendPostCommands;
*/


let prevPostsState = [];
let prevPostsTime = 0;

const pollingModbus = async () => {
    try {
        if (global.PROPERTY?.posts?.length) {
            const postsState = [];
            for (const post of global.PROPERTY.posts) {
                if (post?.client?._port && !post?.client?._port?.destroyed) {
                    postsState.push({ post_id: post.id, state: await getPostState(post) });
                }
            }
            const postsTime = new Date().valueOf();
            const secondsPassed = Math.round((postsTime - prevPostsTime) / 1000);
            if (JSON.stringify(postsState) !== JSON.stringify(prevPostsState) || secondsPassed >= 60) {
                prevPostsState = postsState;
                prevPostsTime = postsTime;
                await setPostsState(postsState);
            }
        }
    }
    catch (error) {
        console.error('Polling modbus error:', error);
    }
    finally {
        setTimeout(pollingModbus, 1000);
    }
}
module.exports.pollingModbus = pollingModbus;

const runStartOrder = async (data) => {
    if (data?.post_id && global.PROPERTY?.posts?.length) {
        const post = global.PROPERTY.posts.find(item => item.id === data.post_id);
        if (post?.id) {
            if (post?.client?._port && !post?.client?._port?.destroyed) {
                try {
                    console.log('Start order', data);
                    const isStarted = await startOrder(post, data);
                    if (isStarted) {
                        console.log('Started order');
                        getSocket().then(socket => socket.emit('startedOrder', data));

                        const isEnded = await endOrder(post, data);
                        if (isEnded) {
                            console.log('Ended order');
                            getSocket().then(socket => socket.emit('endedOrder', data));
                        }
                    }
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
    }
}
module.exports.runStartOrder = runStartOrder;