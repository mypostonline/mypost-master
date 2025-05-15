const io = require('socket.io-client');
const { getSocket } = require('./socket.functions');
const { sendPostCommands, runStartOrder } = require('../modbus/modbus.service');
// const { startOrder } = require('../../run');


const initSocket = async () => {
    getSocket().then(socket => {
        /*
        socket.on('commands', async data => {
            console.log('socket commands', data);
            await sendPostCommands(data);
        });
        */
        socket.on('startOrder', async data => {
            await runStartOrder(data);
        });
    });
}
module.exports.initSocket = initSocket;