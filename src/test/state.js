const ModbusRTU = require("modbus-serial");

// const ip = '192.168.1.111';
// const port = 502;
const ip = '127.0.0.1';
const port = 8502;
const dataAddress = 0x0C00;
const state = parseInt(process.argv[2]) === 1 ? true : false;

const client = new ModbusRTU();
client.connectTCP(ip, { port: port }, function (){
    sendModbusCommand();
});
client.setID(1);

function sendModbusCommand() {
    //console.log( 'state', state );
    try {
        client.writeCoil(dataAddress, state, function(err, data) {
            //console.log(data);
            console.log(`Команда отправлена: записано значение ${data?.state} в регистр ${data?.address}`);
            client.close();
            process.exit(0);
        });
    }
    catch (err) {
        console.error("Ошибка:", err.message);
    }
}
