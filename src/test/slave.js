const ModbusRTU = require('modbus-serial');
const readline = require('readline');
const { addresses } = require('../../addresses');

const host = '127.0.0.1';
const port = process.argv[2] !=undefined  ? process.argv[2] : 8502;
const unitID = process.argv[3] !=undefined  ? +process.argv[3] : 1;
const myCoils = new Map();

for (const [command, address] of Object.entries(addresses)) {
    myCoils.set(address, 0);
}


const toggleCoil = (addr) => {
    myCoils.set(addr, myCoils.get(addr) ? 0 : 1);
}

const vector = {
    getInputRegister: function(addr, unitID) {
        // Synchronous handling
        console.log(`Запрос входящего регистра: addr=${addr}, unitID=${unitID}`);
        // Здесь можно реализовать любую логику – например, возвращать фиксированное значение
    },
    getHoldingRegister: function(addr, unitID, callback) {
        // Asynchronous handling (with callback)
        console.log(`Запрос регистра хранения: addr=${addr}, unitID=${unitID}`);
        setTimeout(function() {
            // callback = function(err, value)
            callback(null, addr + unitID*1000);
        }, 10);
    },
    getCoil: function(addr, unitID) {
        return new Promise(function(resolve) {
            setTimeout(function() {
                const coilState = myCoils.get(addr);
                console.log(`Состояние регистра ${addr} = ${coilState}`);
                resolve(coilState);
            }, 10);
        });
    },
    setRegister: function(addr, value, unitID) {
        // Asynchronous handling supported also here
        console.log("set register", addr, value, unitID);
    },
    setCoil: function(addr, value, unitID) {
        // Asynchronous handling supported also here
        console.log("set coil", addr, value, unitID);
        myCoils.set(addr, value?1:0);
    },
    readDeviceIdentification: function(addr) {
        return {
            0x00: "MyVendorName",
            0x01: "MyProductCode",
            0x02: "MyMajorMinorRevision",
            0x05: "MyModelName",
            0x97: "MyExtendedObject1",
            0xAB: "MyExtendedObject2"
        };
    }
};

const serverTCP = new ModbusRTU.ServerTCP(vector, { host: host, port: port, debug: true, unitID: unitID });
console.log(`ModbusTCP ID=${unitID} listening on modbus://${host}:${port}`);

serverTCP.on('socketError', err => {
    console.error('socketError', err);
});


readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}
process.stdin.on('keypress', (str, key) => {
    const index = parseInt(str, 16);
    if (!isNaN(index)) {
        let idx = 0;
        for (const [command, address] of Object.entries(addresses)) {
            if (index === idx) {
                toggleCoil(address);
                console.log(address, command, myCoils.get(address));
            }
            idx++;
        }
    }
    if (key.sequence === '\u0003') {
        process.exit();
    }
});