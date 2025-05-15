const api = async (url, options = {}) => {
    const API_URL = process.env.API_URL;
    if(options.method === undefined){
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
        console.error('Ошибка api:', error);
        throw error;
    }
}
module.exports.api = api;

/*
const api1 = (url, options = {}) => new Promise((resolve, reject) => {
    const API_URL = process.env.API_URL;
    if(options.method === undefined){
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
        fetch(API_URL + url, init)
            .then(response => response.json())
            .then(json => resolve(json))
            .catch(error => {
                console.error(error);
                reject(error);
            });
    }
    catch (error) {
        console.error('Ошибка api', error);
        reject(error);
    }
});
*/