const readInput = (client, address) => new Promise((resolve, reject) => {
    client.readDiscreteInputs(address, 1, (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data?.data[0] ? 1 : 0);
    });
})
module.exports.readInput = readInput;

const readCoil = async (client, address) => new Promise((resolve, reject) => {
    client.readCoils(address, 1, (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data?.data[0] ? 1 : 0);
    });
})
module.exports.readCoil = readCoil;

const writeCoil = (client, address, state) => new Promise((resolve, reject) => {
    client.writeCoil(address, state, (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data);
    });
})
module.exports.writeCoil = writeCoil;

const waitCoil = async (client, address, state, { interval = 500, timeout = 10000 } = {}) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            const current = await readCoil(client, address);
            if (current === state) {
                return true;
            }
        }
        catch (err) {
            throw new Error(`Ошибка чтения coil ${address}: ${err.message}`);
        }
        await new Promise(res => setTimeout(res, interval));
    }
    throw new Error(`Timeout: состояние ${state} на адресе ${address} не достигнуто за ${timeout}ms`);
}
module.exports.waitCoil = waitCoil;

/*
const checkState = async (client, states) => {
    return new Promise(async (resolve, reject) => {
        let i = 0;
        while (true) {
            let check = true;
            for (const address in states) {
                if (await readCoil(client, address) !== states[ address ]) {
                    check = false;
                }
            }
            if (check) {
                resolve(true);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    });
}
module.exports.checkState = checkState;
*/

/*
const sendCommands = async (client, commands) => {
    for (const command of commands) {
        if (command.address) {
            await new Promise(async (resolve, reject) => {
                setTimeout(async () => {
                    console.log('command', command);

                    if (command.check) {
                        await checkState(client, command.check);
                    }
                    await writeCoil(client, command.address, command.state ? 1 : 0);
                    if (command.duration) {
                        setTimeout(async () => {
                            await writeCoil(client, command.address, command.state ? 0 : 1);
                            resolve();
                        }, command.duration);
                    }
                    else {
                        resolve();
                    }
                }, command.start ?? 10);
            });
        }
    }
    return true;
}
module.exports.sendCommands = sendCommands;
*/