export async function api (url, options = {}) {
    const API_URL = process.env.API_URL;
    if (options.method === undefined) {
        options.method = 'GET';
    }
    let init = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        method: options.method.toUpperCase(),
    };
    try {
        const response = await fetch(API_URL + url, init);
        if (response.ok) {
            return response.json();
        }
        throw new Error(`HTTP ${response.status} — ${response.statusText}`);
    }
    catch (error) {
        throw error;
    }
}