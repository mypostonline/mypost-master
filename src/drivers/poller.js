import logger from "../utils/logger.js";

export class Poller {
    constructor ({addresses, callback, getInputs, options = {}}) {
        logger.log('Poller constructor', addresses);
        this.addresses = addresses;
        this.callback = callback;
        this.read = getInputs;

        this.interval = 1_000;
        this.heartbeat = 60_000;

        /*
        this.options = {
            interval: 1000,
            heartbeatMs: 300_000,
            maxBackoff: 10_000,
            jitter: 0.15,
            ...options,
        };
        */

        this._prevState = null;
        this._lastEmitTs = 0;
    }

    start () {
        logger.log('Poller start');

        //if (this._running) return;
        //this._running = true;
        //this._backoff = 0;
        return this._tick();
    }

    _emit (state, meta) {
        try {
            return this.callback(state, meta);
        }
        catch (error) {
            logger.error('Modbus emit error:', error);
        }
    }

    async _tick () {
        const now = Date.now();
        try {
            const state = await this.read(this.addresses);
            if (state !== null) {
                const changed = JSON.stringify(state) !== JSON.stringify(this._prevState);
                const heartbeat = (now - this._lastEmitTs) >= this.heartbeat;
                if (changed || heartbeat) {
                    this._prevState = state;
                    this._lastEmitTs = now;
                    this._emit(state, {ts: now, reason: changed ? 'change' : 'heartbeat'});
                }
            }
        }
        catch (error) {
            logger.error('Polling modbus error:', error);
        }
        finally {
            setTimeout(() => this._tick(), this.interval);
        }
    }

}