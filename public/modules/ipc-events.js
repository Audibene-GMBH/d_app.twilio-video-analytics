const { ipcMain } = require("electron");
const { getAccessToken, setCredentials } = require("./twilio-video");
const { get_token } = require("./api");
const config = require("../../config/index");

function init_ipc_listeners() {
  ipcMain.on("get_access_token", (event, user_name, room_name) => {
    event.sender.send("get_access_token", getAccessToken(user_name, room_name));
  });

  ipcMain.on("set_twilio_credentials", (event, credentials) => {
    setCredentials(credentials);
  });

  init_config_events();
  init_auth_events();
}

function init_auth_events() {
  ipcMain.on("get_auth_token", async (event, credentials) => {
    if (!credentials) {
      event.sender.send("get_auth_token", await get_token());
    }
    else {
      const { username, password } = credentials;
      event.sender.send("get_auth_token", await get_token(username, password));
    }
  });
}

function init_config_events() {
  ipcMain.on("get_config_object", (event, arg) => {
    event.returnValue = config;
  })
}

module.exports = {
  init_ipc_listeners,
};
