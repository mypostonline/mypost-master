const ModbusRTU = require('modbus-serial');
const readline = require('readline');
const { readCoil, readCoils, writeCoil } = require('../modbus/modbus.functions');
const { addresses } = require('../../addresses');

// const ip = '192.168.1.111';
// const port = 502;
const ip = '127.0.0.1';
const port = 8502;


const client = new ModbusRTU();
client.setID(1);
client.connectTCP(ip, { port: port }, async () => {
    await pollingModbus();
    await runReadline();
});

let prevState = [];
const pollingModbus = async () => {
    try {
        const map = new Map();
        const addressesCoils = [];
        for (const [command, address] of Object.entries(addresses)) {
            map.set(address, command);
            addressesCoils.push(address);
        }
        const state = [];
        const states = await readCoils(client, addressesCoils);
        for (const [address, command] of map) {
            const value = states.get(address);
            if (value !== undefined) {
                state.push({ address, command, value });
            }
        }
        if (JSON.stringify(state) !== JSON.stringify(prevState)) {
            prevState = state;
            console.log(new Date(), 'Состояние изменилось');
            console.table(state);
        }
    }
    catch (err) {
        console.error('Ошибка:', err.message);
    }
    finally {
        setTimeout(pollingModbus, 1000);
    }
}

const runReadline = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });
    rl.prompt();
    rl.on('line', async (line) => {
        const number = parseInt(line);
        if (!isNaN(number)) {
            let index = 0;
            for (const [command, address] of Object.entries(addresses)) {
                if (number === index) {
                    const state = await readCoil(client, address);
                    const timeout = null;
                    await writeCoil(client, address, state ? 0 : 1, timeout);
                    console.log(address, command, state);
                }
                index++;
            }
        }
    });
}