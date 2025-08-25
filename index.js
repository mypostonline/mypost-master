require('dotenv').config();

const { runApp } = require('./run');

void runApp();

process.on('SIGINT', () => {
    process.exit(0);
});