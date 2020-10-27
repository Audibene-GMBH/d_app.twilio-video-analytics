const fetch = require('node-fetch');

let refresh_token = null;

async function get_token(username, password) {
    let has_credentials = username && password;

    if (refresh_token) {
        const refresh_token_url = `${get_config_object().rfs.api}oauth/refresh`;
        const response = await fetch(refresh_token_url, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                refreshToken: refresh_token
            })
        });
        
        let response_body = await response.json();
        refresh_token = response_body.refreshToken;
        return response_body.accessToken;
    }
    else {
        if (!has_credentials) {
            return null;
        }
        else {
            const new_token_url = `${get_config_object().rfs.api}oauth/token`;
            const response = await fetch(new_token_url, {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    grantType: 'password',
                    username,
                    password
                })
            });
            
            let response_body = await response.json();
            refresh_token = response_body.refreshToken;
            return response_body.accessToken;
        }
    }
}

function get_config_object() {
    return require(`../../config/index`);
}

module.exports = {
    get_token
};