const { AccessToken } = require('twilio').jwt;

let credentials = null;

function getAccessToken(user_name) {
    if (!credentials) return null;

    let accessToken = new AccessToken(credentials.acc_sid, credentials.api_key, credentials.api_sec);
    accessToken.identity = user_name;

    let grant = new AccessToken.VideoGrant();
    grant.room = "Teleaudiology Lab Room";
    accessToken.addGrant(grant);

    let jwt = accessToken.toJwt();
    return { access_token : jwt, room_name : grant.room };
}

function setCredentials(cred) {
    credentials = cred;
}

module.exports = {
    getAccessToken,
    setCredentials
};