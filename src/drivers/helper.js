import CONFIG from "../../config.js";

export const ALIASES = new Map();

export function setAliases () {
    if (CONFIG.INPUT) {
        Object.entries(CONFIG.INPUT).forEach(([ key, value ]) => ALIASES.set(key, value));
    }
    if (CONFIG.OUTPUT) {
        Object.entries(CONFIG.OUTPUT).forEach(([ key, value ]) => ALIASES.set(key, value));
    }
}

export function getAddress (address) {
    if (typeof address === 'string') {
        return ALIASES.get(address);
    }
    return address;
}
