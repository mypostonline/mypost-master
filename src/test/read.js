const ModbusRTU = require("modbus-serial");
const { readCoil, readCoils } = require('../modbus/modbus.functions');

// const ip = '192.168.1.111';
// const port = 502;
const ip = '127.0.0.1';
const port = 8502;
const address = 0x0C00;


const client = new ModbusRTU();
client.setID(1);
client.connectTCP(ip, { port: port }, async () => {
    try {
        // const state =  await readCoil(client, address);
        // console.log(`Значение ${address}`, state);

        const states = await readCoils(client, [ 0x0C0A, 0x0C07, 0x0C0B, 0x0C0C, 0x0C0D, 0x0C0E, 0x0C0F, 0x0C10 ]);
        console.log(`Значения`, states );

        client.close();
    }
    catch (err) {
        console.error('Ошибка:', err.message);
    }
});
