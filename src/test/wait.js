const ModbusRTU = require("modbus-serial");
const { waitCoil, waitCoils } = require('../modbus/modbus.functions');
const { addresses } = require('../../addresses');

// const ip = '192.168.1.111';
// const port = 502;
const ip = '127.0.0.1';
const port = 8502;

const client = new ModbusRTU();
client.setID(1);
client.connectTCP(ip, { port: port }, async () => {
    try {
        // const state =  await waitCoil(client, 0x0C00, 1);
        // console.log(`Дождались состояния`, state);

        const map = new Map([
            [addresses.PROGRAM_0, 1],
            [addresses.PROGRAM_1, 1],
        ]);
        await waitCoils(client, map);
        console.log(`Дождались состояний`, map);
    }
    catch (err) {
        console.error('Ошибка:', err.message);
    }
});
