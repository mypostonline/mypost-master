import ModbusRTU from "modbus-serial";
import logger from "../../utils/logger.js";

export class ModbusTransport {
    constructor (opts = {}) {
        this.opts = {
            mode: opts.mode ?? "rtu", // "rtu" | "tcp"
            // RTU
            rtuPort: opts.rtuPort ?? "/dev/ttyUSB0",
            baudRate: opts.baudRate ?? 9600,
            dataBits: opts.dataBits ?? 8,
            parity: opts.parity ?? "none",
            stopBits: opts.stopBits ?? 1,
            // TCP
            tcpHost: opts.tcpHost ?? "127.0.0.1",
            tcpPort: opts.tcpPort ?? 502,
            // Common
            id: opts.id ?? 1,
            timeout: opts.timeout ?? 2000,
            // reconnect / heartbeat
            reconnect: {min: 500, max: 10_000, factor: 1.8, ...(opts.reconnect || {})},

            hbInterval: opts.hbInterval ?? 5000,
            hbFn: opts.hbFn ?? (async (c) => c.readHoldingRegisters(0, 1)),
            // simple logging hooks (опционально)
            onLog: opts.onLog || ((..._args) => logger.log(..._args)),
            onWarn: opts.onWarn || ((...args) => logger.warn(...args)),
            onError: opts.onError || ((...args) => logger.error(...args)),
        };

        this.client = new ModbusRTU();
        this.connected = false;
        this._connecting = false;

        this._hbTimer = null;
        this._rcTimer = null;
        this._backoff = this.opts.reconnect.min;

        this._lock = Promise.resolve();
    }

    async open () {
        if (this.connected || this._connecting) return;
        this._connecting = true;
        try {
            if (this.opts.mode === "rtu") {
                await this.client.connectRTUBuffered(this.opts.rtuPort, {
                    baudRate: this.opts.baudRate,
                    dataBits: this.opts.dataBits,
                    parity: this.opts.parity,
                    stopBits: this.opts.stopBits,
                });
            } else {
                await this.client.connectTCP(this.opts.tcpHost, {port: this.opts.tcpPort});
            }
            this.client.setID(this.opts.id);
            this.client.setTimeout(this.opts.timeout);
            this.connected = true;
            this._backoff = this.opts.reconnect.min;
            try {
                const sock = this.client?._port?._client;
                sock.setKeepAlive(true, 10_000);
                sock.setNoDelay(true);
                sock.setTimeout(60_000);
            }
            catch (e) {
                this.opts.onWarn("Не удалось настроить socket options:", e?.message || e);
            }
            this.opts.onLog("[Modbus] connected");
            //this._startHeartbeat();
        }
        catch (e) {
            this.opts.onWarn("[Modbus] connect failed:", e.message);
            this._scheduleReconnect();
        }
        finally {
            this._connecting = false;
        }
    }

    async close () {
        this._stopHeartbeat();
        await this._close();
        this.connected = false;
        this.opts.onLog("[Modbus] closed");
    }

    _startHeartbeat () {
        this._stopHeartbeat();
        if (!this.opts.hbInterval) return;
        this._hbTimer = setInterval(async () => {
            if (!this.connected) return;
            try {
                await this.opts.hbFn(this.client);
            }
            catch (e) {
                this.opts.onWarn("[Modbus] heartbeat failed:", e.message);
                await this._close();
                this.connected = false;
                this._scheduleReconnect();
            }
        }, this.opts.hbInterval);
    }

    _stopHeartbeat () {
        if (this._hbTimer) {
            clearInterval(this._hbTimer);
            this._hbTimer = null;
        }
    }

    _scheduleReconnect () {
        if (this._rcTimer) return;
        const delay = Math.min(this._backoff, this.opts.reconnect.max);
        this.opts.onLog("[Modbus] reconnect in", delay, "ms");
        this._rcTimer = setTimeout(async () => {
            this._rcTimer = null;
            await this.open();
            if (!this.connected) {
                this._backoff = Math.ceil(this._backoff * this.opts.reconnect.factor);
                this._scheduleReconnect();
            }
        }, delay);
    }

    async _close () {
        try {
            const isOpen = this.client?.isOpen === true || this.client?._port?.isOpen === true;
            if (isOpen) await this.client.close();
            else {
                try {
                    await this.client.close();
                }
                catch {
                }
            }
        }
        catch {
        }
    }

    async _ensureConnected () {
        if (this.connected) return;
        await this.open();
        if (!this.connected) {
            await new Promise(r => setTimeout(r, this._backoff));
        }
    }

    async _withLock(fn) {
        // ждём завершения предыдущей операции
        const prev = this._lock;
        let release;
        this._lock = new Promise((resolve) => (release = resolve));
        await prev;

        try {
            // выполняем переданную функцию “внутри замка”
            return await fn();
        } finally {
            // освобождаем замок
            release();
        }
    }

    async _exec (op, retries = 2) {
        return this._withLock(async () => {
            for (let i = 0; i <= retries; i++) {
                try {
                    await this._ensureConnected();
                    const res = await op(this.client);
                    return { ok: true, data: res };
                }
                catch (e) {
                    const m = String(e?.message || "").toLowerCase();
                    const transient = m.includes("timeout") || m.includes("port is not open") ||
                        m.includes("econn") || m.includes("socket") ||
                        m.includes("eio") || m.includes("ebusy");
                    if (!transient || i === retries) {
                        return { ok: false, error: e };
                    }
                    await this._close();
                    this.connected = false;
                    this._scheduleReconnect();
                    await new Promise(r => setTimeout(r, Math.min(this._backoff, 1000)));
                }
            }
            await new Promise(r => setTimeout(r, 10));
            return { ok: false, error: new Error("unknown") };
        });
    }

    async readDiscreteInputs (addr, qty) {
        return await this._exec(async (c) => (await c.readDiscreteInputs(addr, qty)).data);
    }

    async readHoldingRegisters (addr, qty) {
        return await this._exec(async (c) => (await c.readHoldingRegisters(addr, qty)).data);
    }

    async writeRegister (addr, val) {
        return await this._exec(async (c) => (await c.writeRegister(addr, val)));
    }

    async writeRegisters (addr, vals) {
        return await this._exec(async (c) => (await c.writeRegisters(addr, vals)));
    }

    async readCoils (addr, qty) {
        return await this._exec(async (c) => (await c.readCoils(addr, qty)).data);
    }

    async writeCoil (addr, val) {
        return await this._exec(async (c) => (await c.writeCoil(addr, !!val)));
    }

}
