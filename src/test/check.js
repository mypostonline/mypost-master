const ModbusRTU = require('modbus-serial');
const { initModbus } = require('../modbus/modbus.service');
const { readInput, readCoil, writeCoil, checkState, sendCommands } = require('../modbus/modbus.functions');

// const ip = '192.168.1.111';
// const port = 502;
const ip = '127.0.0.1';
const port = 8502;
const dataAddress = 0x0C00;

//void check();


const client = new ModbusRTU();
client.connectTCP(ip, { port: port }, async () => {
    //sendModbusCommand();
    try {
        /*
        const aa = await sendCommands(client, [
            {
                "post_id": 1,
                "address": "0x0C00",
                "state": 1,
                "check": { "0x0C0A": 1 },
                "start": 1000,
                "duration": 2000
            },
            {
                "post_id": 1,
                "address": "0x0C01",
                "state": 1,
                "start": 1500,
                "duration": 2000
            }
        ]);
        console.log( 'sendCommands', aa );
        */

        //const сheck = await checkState(client, { "0x0C0A": 1 });
        //console.log( 'сheck', сheck );
        console.log('readCoil', await readCoil(client, dataAddress));

        //const read = await readInput(client, "0x0C0A");
        //console.log('readState', read);

        //console.log('readCoil', await readCoil(client, "0x0C00"));

        /*
        await client.readInputRegisters("0x0C0A", 1, (err, data) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log('readInputRegisters', data?.data[0] ? 1 : 0);
            }
        });
        */

        /*
        setInterval(async () => {
            //const read = await readInput(client, "0x0C0A");
            //console.log('readState', read);
            console.log('readCoil', await readCoil(client, "0x0C0A"));
        }, 1000);
        */

        // const write = await writeCoil(client, "0x0C00", 1);
        // console.log('writeState', write);

    }
    catch (err) {
        console.error("Ошибка:", err);
    }
});
client.setID(1);
