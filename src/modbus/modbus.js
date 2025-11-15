const ModbusRTU = require('modbus-serial');

let client = null;
let isConnected = false;
let reconnectTimer = null;
let pollingTimer = null;
//let polling = false;

// const ADDRESSES = new Map();
const ALIASES = new Map();



const initModbus = async (params) => {
    if (params?.INPUT?.size) {
        params.INPUT.forEach((alias, address) => {
            ALIASES.set(alias, address);
        });
    }
    if (params?.OUTPUT?.size) {
        params.OUTPUT.forEach((alias, address) => {
            ALIASES.set(alias, address);
        });
    }
}





function stopPolling() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
    }
}

const safeDestroy = (sock) => {
    try { sock.destroy(); } catch {}
}

const reconnectModbus = (ip, port) => {
    if (reconnectTimer) return;
    console.log(`Повторная попытка подключения через 10s...`);
    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        await connectModbus(ip, port);
    }, 10_000);
}

const connectModbusTCP = async (ip, port) => {
    client = new ModbusRTU();
    await new Promise((resolve, reject) => {
        client.connectTCP(ip, { port }, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
    isConnected = true;
    console.log(`connected ${ip}:${port}`);

    const sock = client?._port?._client;
    if (sock) {
        
        sock.removeAllListeners("close");
        sock.removeAllListeners("end");
        sock.removeAllListeners("error");
        sock.removeAllListeners("timeout");

        try {
            sock.setKeepAlive(true, 10_000);
            sock.setNoDelay(true);
            sock.setTimeout(60_000);
        }
        catch (e) {
            console.warn("Не удалось настроить socket options:", e?.message || e);
        }
        sock.on("end", () => {
            console.log("Сокет прислал 'end' (удалённый конец закрылся).");
        });
        sock.on("timeout", () => {
            console.log("Сокет 'timeout' — похоже, связь потеряна.");
            safeDestroy(sock);
        });
        sock.on("error", (err) => {
            console.error("Сокет 'error':", err?.message || err);
            isConnected = false;
            safeDestroy(sock);
        });
        sock.on("close", (hadErr) => {
            console.log("Соединение разорвано", hadErr ? "(после ошибки)" : "");
            reconnectModbus(ip, port);
        });
        return client;
    }
    else {
        console.warn("Не удалось получить нижний сокет (_port._client). Буду ловить разрыв по ошибкам опроса.");
    }
}

const connectModbusRTU = async (path) => {
    client = new ModbusRTU();
    client.setTimeout(10000);
    await client.connectRTUBuffered(path, {
        baudRate: 19200,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
    });
    client.setID(1);
    isConnected = true;
}

let prevState = null;
let prevTime = 0;

const pollingModbus = async (addresses, callback) => {
    try {
        const state = await readCoils(addresses);
        const time = new Date().valueOf();
        if (JSON.stringify(state) !== JSON.stringify(prevState) || (time - prevTime) >= 300000) {
            prevState = state;
            prevTime = time;
            callback(state);
        }
    }
    catch (error) {
        console.error('Polling modbus error:', error);
    }
    finally {
        setTimeout(() => pollingModbus(addresses, callback), 1000);
    }
}

const getClient = async () => {
    if (isConnected) {
        return client;
    }
    else {
        throw new Error("Modbus client не подключён");
    }
}

const getAddress = (address) => {
    if (typeof address === 'string') {
        return ALIASES.get(address);
    }
    return address;
}

const writeCoil = async (address, state, timeout = null) => {
    try {
        console.log( 'writeCoil' );
        const client = await getClient();
        await client.writeCoil(getAddress(address), state);
        console.log( 'writeCoil complete' );

        if (state && timeout) {
            setTimeout(async () => {
                try {
                    await writeCoil(address, 0);
                }
                catch (timeoutError) {
                    console.error(`Ошибка при сбросе по таймауту ${address}:`, timeoutError.message);
                }
            }, timeout);
        }
    }
    catch (error) {
        console.error(`Ошибка при записи ${address}:`, error);
    }
}

const readCoils = async (addresses) => {
    const addressMap = new Map();
    for (const originalAddress of addresses) {
        if (!addressMap.has(originalAddress)) {
            addressMap.set(originalAddress, getAddress(originalAddress));
        }
    }
    const uniqueAddresses = [...new Set(addressMap.values())].sort((a, b) => a - b);
    const sortedAddresses = [...uniqueAddresses].sort((a, b) => a - b);
    const first = sortedAddresses[0];
    const last = sortedAddresses[sortedAddresses.length - 1];
    const count = last - first + 1;
    try {
        const coils = await client.readCoils(first, count);
        const result = {};
        if (coils?.data) {
            const coilDataMap = new Map(coils.data.map((value, index) => [first + index, value ? 1 : 0]));
            for (const [originalAddress, transformedAddress] of addressMap) {
                const value = coilDataMap.get(transformedAddress);
                if (value !== undefined) {
                    result[originalAddress] = value;
                }
            }
        }
        return result;
    }
    catch (error) {
        console.error('Ошибка при чтении катушек:', error);
        throw error;
    }
};

const waitCoils = async (data, { interval = 1000, timeout = 3600000 } = {}) => {
    const addresses = Object.keys(data);
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            const state = await readCoils(addresses);
            if (JSON.stringify(data) === JSON.stringify(state)) {
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


module.exports = {
    initModbus,
    connectModbusTCP,
    connectModbusRTU,
    pollingModbus,
    getClient,
    getAddress,
    writeCoil,
    readCoils,
    waitCoils,
};