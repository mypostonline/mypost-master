const fs = require('fs');
const path = require('path');

function logger(message, level = 'INFO') {
    const now     = new Date();
    const year    = now.getFullYear().toString();
    const month   = String(now.getMonth() + 1).padStart(2, '0');
    const day     = String(now.getDate()).padStart(2, '0');

    // Путь к директории logs/<year>/<month>
    const logDir  = path.resolve(process.cwd(), 'logs', year, month);
    // Имя файла <day>.log
    const logFile = path.join(logDir, `${day}.log`);

    // Создаём папки, если их ещё нет
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }


    // Формируем запись с временной меткой
    const timestamp = now.toISOString();
    const entry     = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    // Дозапись в файл
    fs.appendFile(logFile, entry, err => {
        if (err) {
            console.error('Не удалось записать лог:', err);
        }
    });
}
module.exports.logger = logger;
