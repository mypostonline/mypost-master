const { readCoil, writeCoil, waitCoil } = require('./src/modbus/modbus.functions');

module.exports.getPostState = async (post) => {
    if (post?.client) {
        const client = post.client;
        try {
            const state = {
                SENSOR_1: await readCoil(client, '0x0C0A'),
                SENSOR_2: await readCoil(client, '0x0C06'),
                is_busy: false,
            };
            if (state.SENSOR_1 || state.SENSOR_2) {
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
            await waitCoil(client, '0x0C0A', 0, { timeout: (30 * 60 * 1000) });
            await waitCoil(client, '0x0C06', 0, { timeout: (30 * 60 * 1000) });

            await writeCoil(client, address, 1);
            setTimeout(async () => {
                await writeCoil(client, address, 0);
            }, 2000);

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
            await new Promise(res => setTimeout(res, 5000));

            await waitCoil(client, '0x0C0A', 0, { timeout: (60 * 60 * 1000) });
            await waitCoil(client, '0x0C06', 0, { timeout: (60 * 60 * 1000) });

            return true;
        }
        catch (err) {
            throw err;
        }
    }
}
