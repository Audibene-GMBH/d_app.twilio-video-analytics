const { ipcMain } = require('electron')
const { getAccessToken, setCredentials } = require('./twilio-video')

function init_ipc_listeners() {
    ipcMain.on("get_access_token", (event, user_name) => {
        event.sender.send("get_access_token", getAccessToken(user_name));
    })

    ipcMain.on("set_twilio_credentials", (event, credentials) => {
        setCredentials(credentials);
    })
}

module.exports = {
    init_ipc_listeners
};