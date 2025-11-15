import { ModbusTransport } from "./modbus-transport.js";
import { Poller } from "../poller.js";
import { waiter } from "../waiter.js";
import { setAliases, getAddress } from "../helper.js";
import logger from "../../utils/logger.js";
import CONFIG from "../../../config.js";


let client = null;

export async function initClient (params = {}) {
    setAliases();
    client = new ModbusTransport({
        mode: CONFIG.MODE,
        tcpHost: CONFIG.TCP_HOST,
        tcpPort: CONFIG.TCP_PORT,
        ...params
    });
    return client.open();
}

export async function setOutput (address, value, timeout = 0) {
    try {
        await client.writeCoil(getAddress(address), value);
        if (value && timeout) {
            setTimeout(async () => {
                try {
                    await setOutput(address, 0);
                }
                catch (timeoutError) {
                    logger.error(`Ошибка при сбросе по таймауту ${address}:`, timeoutError.message);
                }
            }, timeout);
        }
        return true;
    }
    catch (e) {
        logger.error('setOutput', e)
    }
    return null;
}

export async function getInputs (addresses = null) {
    const addressMap = new Map();
    for (const originalAddress of addresses) {
        if (!addressMap.has(originalAddress)) {
            addressMap.set(originalAddress, getAddress(originalAddress));
        }
    }
    const uniqueAddresses = [ ...new Set(addressMap.values()) ].sort((a, b) => a - b);
    const sortedAddresses = [ ...uniqueAddresses ].sort((a, b) => a - b);
    const first = sortedAddresses[0];
    const last = sortedAddresses[sortedAddresses.length - 1];
    const count = last - first + 1;
    try {
        const coils = await client.readCoils(first, count);
        const result = {};
        if (coils?.data) {
            const coilDataMap = new Map(coils.data.map((value, index) => [ first + index, value ? 1 : 0 ]));
            for (const [ originalAddress, transformedAddress ] of addressMap) {
                const value = coilDataMap.get(transformedAddress);
                if (value !== undefined) {
                    result[originalAddress] = value;
                }
            }
        }
        return result;
    }
    catch (error) {
        logger.error('Ошибка при чтении катушек:', error);
        throw error;
    }
}

export async function waitStates (data, options = {}) {
    return waiter(data, getInputs, options);
    //return waiter({ data, getInputs });
}

/*
export async function waitStates (data, { interval = 1000, timeout = 3600000 } = {}) {
    const addresses = Object.keys(data);
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            const state = await getInputs(addresses);
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
*/

export async function pollStates (addresses, callback) {
    const poller = new Poller({ addresses, callback, getInputs });
    return poller.start();
}
