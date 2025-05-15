require('dotenv').config();
const { api } = require('./src/functions/api');
const { logger } = require('./src/functions/logger');
const { initSocket } = require('./src/socket/socket.service');
const { initModbus, readModbus, pollingModbus } = require('./src/modbus/modbus.service');

const PROPERTY_ID = process.env.PROPERTY_ID;
global.PROPERTY = null;


const initApp = () => {
    api('/master/property/' + PROPERTY_ID)
        .then(async property => {
            console.log('Ready property', property.name);
            global.PROPERTY = property;
            await initSocket();
            await initModbus();
            await pollingModbus();
        })
        .catch(error => {
            setTimeout(initApp, 10000);
        });
}

void initApp();
