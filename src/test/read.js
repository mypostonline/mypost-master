const ModbusRTU = require("modbus-serial");
const { readCoil, readCoils } = require('../modbus/modbus.functions');
const { addresses } = require('../../addresses');

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

        const { SENSOR_0, SENSOR_1 } = await readCoils(client, {
            SENSOR_0: addresses.SENSOR_0,
            SENSOR_1: addresses.SENSOR_1
        });
        //const states = await readCoils(client, [addresses.SENSOR_0, addresses.SENSOR_1]);
        console.log(`Значения`, SENSOR_0, SENSOR_1 );
        //const [ [,SENSOR_0], [,SENSOR_1] ] = await readCoils(client, [addresses.SENSOR_0, addresses.SENSOR_1], addresses);
        //console.log(`Значения`, SENSOR_0,SENSOR_1 );
        //console.log(`Значения`, JSON.stringify(states) );

        client.close();
    }
    catch (err) {
        console.error('Ошибка:', err.message);
    }
});
