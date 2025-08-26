const mqtt = require('mqtt');

let client;
let isConnected = false;
const topics = new Map();

const connectMqtt = () => new Promise((resolve, reject) => {
    if (client !== undefined) {
        return resolve(client);
    }
    const MQTT_URL = process.env.MQTT_URL;
    client = mqtt.connect(MQTT_URL, {
        reconnectPeriod: 10000,
    });
    client.on('connect', () => {
        isConnected = true;
        resolve(client);
        client.on('message', (topic, payload) => {
            const data = JSON.parse(payload.toString());
            console.log('mqtt message', data);
            if (topics.has(topic)) {
                topics.get(topic)(data);
            }
        });
    });
    client.on('error', (error) => {
        isConnected = false;
        reject(error);
    });
    client.on('close', () => {
        isConnected = false;
    });
});

const subscribeMqtt = (topic, callback, { qos = 0 } = {}) => new Promise((resolve, reject) => {
    connectMqtt().then(client => {
        client.subscribe(topic, { qos }, (err, granted) => {
            if (err) {
                reject();
            }
            else {
                resolve();
                topics.set(topic, callback);
            }
        });
    });
});

const publishMqtt = (topic, message, { qos = 0 } = {}) => new Promise((resolve, reject) => {
    connectMqtt().then(client => {
        if (!isConnected) { return reject(); }
        client.publish(topic, JSON.stringify(message), { qos }, (err, packet) => {
            console.log('mqtt publish', topic, message);
            resolve();
        });
    });
});

module.exports = {
    connectMqtt,
    subscribeMqtt,
    publishMqtt,
};