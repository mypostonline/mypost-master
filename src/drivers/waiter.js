import logger from "../utils/logger.js";

const stateToString = (state) => Object.entries(state).map(([ key, value ]) => key + ':' + value).join('|');

export async function waiter (data, getInputs, {
        interval = 1000,
        timeout = 3_600_000,
        duration = null
    } = {}) {

    const deadline = Date.now() + timeout;
    const addresses = Object.keys(data);
    const dataString = stateToString(data);
    let lastStateString = null;
    let lastChangeTs = Date.now();

    while (Date.now() < deadline) {
        try {
            const state = await getInputs(addresses);
            const stateString = stateToString(state);
            if (stateString !== lastStateString) {
                lastStateString = stateString;
                lastChangeTs = Date.now();
            }
            if (dataString === stateString) {
                if (duration) {
                    if ((Date.now() - lastChangeTs) >= duration) {
                        return true;
                    }
                }
                else {
                    return true;
                }
            }
        }
        catch (err) {
            logger.warn('Ошибка чтения');
        }
        await new Promise(res => setTimeout(res, interval));
    }
    throw new Error(`Timeout: состояния не достигнуто за ${timeout}ms`);
}