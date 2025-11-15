import { ModbusTransport } from "./modbus-transport.js";
import { setAliases, getAddress } from "../helper.js";
import { Poller } from "../poller.js";
import { waiter } from "../waiter.js";
import logger from "../../utils/logger.js";
import CONFIG from "../../../config.js";


let client = null;

const CMD = {
    OPEN: 0x01,       // вкл
    CLOSE: 0x02,      // выкл
    TOGGLE: 0x03,     // переключить
    MOMENTARY: 0x05,  // импульс ~0.5c
    DELAY: 0x06       // вкл с авто-выкл через N сек (N в младшем байте)
};


const _val = (cmd, param = 0) => {
    return ((cmd & 0xFF) << 8) | (param & 0xFF);
}

export async function initClient (params = {}) {
    setAliases();
    client = new ModbusTransport({
        mode: CONFIG.MODE,
        rtuPort: CONFIG.RTU_PORT,
        ...params
    });
    return client.open();
}

export async function setOutput (address, value, duration = 0) {
    try {
        const val = duration ? _val(CMD.DELAY, Math.round(duration / 1000)) : _val(value ? CMD.OPEN : CMD.CLOSE);
        return client.writeRegister(getAddress(address), val);
    }
    catch (e) {
        logger.error('setOutput', e)
    }
    return null;
}

export async function getInputs (addresses = null) {
    try {
        const addressMap = new Map();
        for (const key of addresses) {
            if (!addressMap.has(key)) {
                addressMap.set(key, getAddress(key));
            }
        }
        const read = await client.readHoldingRegisters(0, 1);
        if (read?.data) {
            const [ mask ] = read.data;
            const inputs = Array.from({ length: 8 }, (_, i) => ((mask >> i) & 1) ? 1 : 0);
            const result = {};
            for (const [ key, address ] of addressMap) {
                result[key] = inputs[Number(address) - 1];
            }
            return result;
        }
    }
    catch (e) {
        logger.error('getInputs', e);
    }
    return null;
}

export async function waitStates (data, options = {}) {
    return waiter(data, getInputs, options);
}

export async function pollStates (addresses, callback) {
    const poller = new Poller({ addresses, callback, getInputs });
    return poller.start();
}
