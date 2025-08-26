const Gpio = require('pigpio').Gpio;

const PINS = new Map();
const ALIASES = new Map();

const initGpio = async (params) => {
    if (params?.INPUT?.size) {
        params.INPUT.forEach((alias, pin) => {
            const PIN = new Gpio(pin, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP });
            PINS.set(pin, PIN);
            ALIASES.set(alias, pin);
        });
    }
    if (params?.OUTPUT?.size) {
        params.OUTPUT.forEach((alias, pin) => {
            const PIN = new Gpio(pin, { mode: Gpio.OUTPUT });
            PIN.digitalWrite(1);
            PINS.set(pin, PIN);
            ALIASES.set(alias, pin);
        });
    }
}

const resetGpio = async () => {
    for (const [pin, PIN] of PINS) {
        PIN.digitalWrite(1);
        PIN.mode(Gpio.INPUT);
    }
}


let prevState = null;
let prevTime = 0;

const pollingGpio = async (pins, callback) => {
    try {
        const state = await readPins(pins);
        const time = new Date().valueOf();
        if (JSON.stringify(state) !== JSON.stringify(prevState) || (time - prevTime) >= 300000) {
            prevState = state;
            prevTime = time;
            callback(state);
        }
    }
    catch (error) {
        console.error('Polling gpio error:', error);
    }
    finally {
        setTimeout(() => pollingGpio(pins, callback), 5000);
    }
}

const getPin = (pin) => {
    if (typeof pin === 'string') {
        pin = ALIASES.get(pin);
    }
    return PINS.get(pin);
}

const readPin = (pin) => {
    const PIN = getPin(pin);
    if (PIN) {
        return PIN.digitalRead() === 1 ? 0 : 1;
    }
}

const readPins = (pins) => {
    const result = {};
    for (const pin of pins) {
        result[pin] = readPin(pin);
    }
    return result;
}

const waitPins = async (data, { interval = 1000, timeout = 3600000 } = {}) => {
    const pins = Object.keys(data);
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            const state = await readPins(pins);
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

const writePin = (pin, value, duration) => {
    const PIN = getPin(pin);
    if (PIN) {
        PIN.digitalWrite(value === 1 ? 0 : 1);
        if (duration) {
            setTimeout(() => {
                PIN.digitalWrite(value === 1 ? 0 : 1);
            }, duration);
        }
    }
}

module.exports = {
    initGpio,
    resetGpio,
    pollingGpio,
    getPin,
    readPin,
    readPins,
    waitPins,
    writePin,
};