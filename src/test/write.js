const ModbusRTU = require("modbus-serial");
const { writeCoil } = require('../modbus/modbus.functions');

// const ip = '192.168.1.111';
// const port = 502;
const ip = '127.0.0.1';
const port = 8502;
const address = 0x0C00;
const state = parseInt(process.argv[2]) === 1 ? 1 : 0;

const client = new ModbusRTU();
client.setID(1);
client.connectTCP(ip, { port: port }, async () => {
    try {
        const write = await writeCoil(client, address, state, 2000);
        console.log(`Команда отправлена: записано значение ${write?.state} в регистр ${write?.address}`);
        setTimeout(() => { client.close() }, 2500);
    }
    catch (err) {
        console.error('Ошибка:', err.message);
    }
});
