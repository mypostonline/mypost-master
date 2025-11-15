const LEVELS = { error: 0, warn: 1, log: 2, debug: 3 };

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

let state = {
    level: 'log',
};

let min = LEVELS[state.level] ?? LEVELS.log;

function ts () {
    return new Date().toISOString();
}

function write (line) {
    process.stdout.write(line + '\n');
}

function logAt (lvl, ...args) {
    if ((LEVELS[lvl] ?? 99) > min) return;
    const message = args.length === 1 ? args[0] :
        args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    const type = lvl.toUpperCase();
    const head = `${ts()} [${type}]`;
    let text = undefined;
    if (message instanceof Error) text = `${head} ${message.message}\n${message.stack ?? ''}`;
    else text = `${head} ${message}`;
    if (min === 3) {
        if (type === 'ERROR') text = `${RED}${text}${RESET}`;
        else if (type === 'WARN') text = `${YELLOW}${text}${RESET}`;
        else if (type === 'DEBUG') text = `${BLUE}${text}${RESET}`;
    }
    write(text);
}

function logger (...args) {
    logger.log(...args);
}

logger.log = (...a) => logAt('log', ...a);
logger.warn = (...a) => logAt('warn', ...a);
logger.error = (...a) => logAt('error', ...a);
logger.debug = (...a) => logAt('debug', ...a);

logger.setLevel = (level) => {
    state.level = level;
    min = LEVELS[level] ?? LEVELS.log;
};

export default logger;