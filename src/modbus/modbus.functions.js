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

const readCoils = async (client, coils) => new Promise((resolve, reject) => {
    let addresses = [];
    if (Array.isArray(coils)) {
        addresses = coils;
    }
    else if (typeof coils === 'object') {
        for (const address of Object.values(coils)) {
            addresses.push(address);
        }
    }
    if (addresses.length) {
        addresses.sort();
        const first = addresses[0];
        const last  = addresses[addresses.length - 1];
        const count = last - first + 1;
        const coilsAddresses = new Map();
        let address = first;
        for (let i=0; i<count; i++) {
            if (addresses.indexOf(address) !== -1) {
                coilsAddresses.set(i, address);
            }
            address++;
        }
        client.readCoils(first, count, (err, data) => {
            if (err) reject(err);
            const result = new Map();
            for (let i=0; i<data?.data?.length; i++) {
                const address = coilsAddresses.get(i);
                if (address !== undefined) {
                    result.set(address, data?.data?.[i] ? 1 : 0);
                }
            }
            if (!Array.isArray(coils) && typeof coils === 'object') {
                const keys = {};
                for (const [key, address] of Object.entries(coils)) {
                    keys[ key ] = result.get(address);
                }
                resolve(keys);
            }
            else {
                resolve(result);
            }
        });
    }
})
module.exports.readCoils = readCoils;

const writeCoil = (client, address, state, timeout = null) => new Promise((resolve, reject) => {
    client.writeCoil(address, state, (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data);
        if (state && timeout) {
            setTimeout(async () => await writeCoil(client, address, 0), timeout);
        }
    });
})
module.exports.writeCoil = writeCoil;

const waitCoil = async (client, address, state, { interval = 500, timeout = 3600000 } = {}) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            const current = await readCoil(client, address);
            if (!!current === !!state) {
                return current;
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

const waitCoils = async (client, map, { interval = 500, timeout = 3600000 } = {}) => {
    const addresses = Array.from(map.keys());
    if (!addresses.length) {
        return false;
    }
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            let isReached = true;
            const states = await readCoils(client, addresses);
            for (const [address, state] of map) {
                if (!!states.get(address) !== !!state) {
                    isReached = false;
                }
            }
            if (isReached) {
                return true;
            }
        }
        catch (err) {
            throw new Error(`Ошибка чтения coils`);
        }
        await new Promise(res => setTimeout(res, interval));
    }
    throw new Error(`Timeout: состояния не достигнуто за ${timeout}ms`);
}
module.exports.waitCoils = waitCoils;


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
