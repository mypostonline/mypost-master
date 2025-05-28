const { readCoil, writeCoil, waitCoil, waitCoils} = require('./src/modbus/modbus.functions');
const { addresses } = require('./addresses');


module.exports.getPostState = async (post) => {
    if (post?.client) {
        const client = post.client;
        try {
            const state = {
                SENSOR_0: await readCoil(client, addresses.SENSOR_0),
                SENSOR_1: await readCoil(client, addresses.SENSOR_1),
                is_busy: false,
            };
            if (state.SENSOR_0 || state.SENSOR_1) {
                state.is_busy = true;
            }
            return state;
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports.startOrder = async (post, data) => {
    if (post?.client && data?.program_address) {
        const client = post.client;
        const address = data.program_address;
        try {
            // await waitCoil(client, addresses.SENSOR_0, 0);
            // await waitCoil(client, addresses.SENSOR_1, 0);

            await waitCoils(client, new Map([
                [addresses.SENSOR_0, 0],
                [addresses.SENSOR_1, 0],
            ]));

            await writeCoil(client, address, 1, 6000);
            await writeCoil(client, addresses.GATE_0_UP, 1, 6000);

            return true;
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports.endOrder = async (post, data) => {
    if (post?.client && data?.program_address) {
        const client = post.client;
        try {
            await new Promise(res => setTimeout(res, 1000));

            //await waitCoil(client, addresses.FINISHED, 1);
            await waitCoils(client, new Map([
                [addresses.FINISHED, 1]
            ]));

            await writeCoil(client, addresses.GATE_0_UP, 1, 6000);

            // await waitCoil(client, addresses.SENSOR_0, 0);
            // await waitCoil(client, addresses.SENSOR_1, 0);
            await waitCoils(client, new Map([
                [addresses.SENSOR_0, 0],
                [addresses.SENSOR_1, 0],
            ]));

            return true;
        }
        catch (err) {
            throw err;
        }
    }
}
