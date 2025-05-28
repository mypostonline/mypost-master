const readline = require('readline');
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const port = new SerialPort({ path: "COM3", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

port.on("open", () => {
    console.log("Порт открыт");
    // Включаем LED
    /*
    port.write("1", err => {
        if (err) return console.error("Ошибка записи:", err);
        console.log("Отправили 1 — LED ON");

        // Через секунду выключаем
        setTimeout(() => {
            port.write("0", err => {
                if (err) return console.error("Ошибка записи:", err);
                console.log("Отправили 0 — LED OFF");
            });
        }, 5000);
    });
    */
});

parser.on("data", line => {
    console.log(`data`, line);
});

port.on("error", err => console.error("Serial Error:", err));

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}
process.stdin.on('keypress', (str, key) => {
    //const value = parseInt(str, 16);
    const value = str;
    //console.log(value);
    port.write(value, err => {
        if (err) return console.error("Ошибка записи:", err);
        console.log("Отправили", value);
    });
    if (key.sequence === '\u0003') {
        process.exit();
    }
});