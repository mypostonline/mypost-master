const readline = require('readline');
const ModbusRTU = require("modbus-serial");
const host = '127.0.0.1';
const port = process.argv[2] !=undefined  ? process.argv[2] : 8502;
const unitID = process.argv[3] !=undefined  ? +process.argv[3] : 1;

let addressCoil;
const myCoils = new Map([
    [3072, 0], // PROGRAM0 0x0C00
    [3073, 0], // PROGRAM1 0x0C01
    [3074, 0], // PROGRAM2 0x0C02
    [3075, 0], // PROGRAM3 0x0C03
    [3076, 0], // BARRIER  0x0C04
    [3077, 0], // TRAFFIC_LIGHT 0x0C05
    [3078, 0], // GATE 0x0C06
    [3079, 0], // OPERATOR 0x0C07
    [3082, 0]  // ROBOT_STATUS 0x0C0A
]);

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
            }, 1000);
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

console.log(`ModbusTCP ID=${unitID} listening on modbus://${host}:${port}`);
const serverTCP = new ModbusRTU.ServerTCP(vector, { host: host, port: port, debug: true, unitID: unitID });

serverTCP.on("socketError", function(err){
    console.error('socketError', err);
});

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}
process.stdin.on('keypress', (str, key) => {
    if (str === '1') {
        toggleCoil(3082);
        console.log(`toggleCoil`, myCoils.get(3082));
    }
    if (key.sequence === '\u0003') {
        process.exit();
    }
});