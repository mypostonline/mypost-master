import { ModbusTransport } from "./modbus-transport.js";
import { setAliases, getAddress } from "../helper.js";
import { waiter } from "../waiter.js";
import { Poller } from "../poller.js";
import logger from "../../utils/logger.js";
import CONFIG from "../../../config.js";

let client = null;

export async function initClient (params = {}) {
    setAliases();
    client = new ModbusTransport({
        mode: CONFIG.MODE,
        rtuPort: CONFIG.RTU_PORT,
        id: 0xFF,
        ...params
    });
    return client.open();
}

export async function setOutput (address, value, duration = 0) {
    try {
        await client.writeCoil(getAddress(address), !!value);
        if (value && duration) {
            setTimeout(async () => setOutput(address, 0), duration);
        }
        return true;
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
        const read = await client.readDiscreteInputs(0, 8);
        if (read?.data) {
            const result = {};
            for (const [ key, address ] of addressMap) {
                result[key] = Number(read.data[Number(address)]);
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
