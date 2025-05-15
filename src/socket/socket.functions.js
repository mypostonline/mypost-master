const io = require("socket.io-client");

let socket = undefined;

const getSocket = () => {
    return new Promise(function(resolve, reject) {
        if (socket === undefined) {
            console.log('socket start');
            //return;
            try {
                const PROPERTY_ID = process.env.PROPERTY_ID;
                const API_URL = process.env.API_URL;
                socket = io(API_URL, {
                    query: {
                        property_id: PROPERTY_ID
                    }
                });
                socket.on('connect', () => {
                    console.log('Socket id:', socket.id);
                    resolve(socket);
                });
                socket.on('connect-error', error => {
                    console.error('Socket connect error:', error);
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        }
        else {
            resolve(socket);
        }
    });
}
module.exports.getSocket = getSocket;