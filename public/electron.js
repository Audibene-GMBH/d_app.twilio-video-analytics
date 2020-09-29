const { app, BrowserWindow } = require("electron");
const path = require("path");

const { init_ipc_listeners } = require("./modules/ipc-events");
const { load: load_config } = require("./modules/config-loader");

app.on("ready", () => {
  init_ipc_listeners();

  const window = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      preload: path.resolve(__dirname, "preloader.js"),
    },
  });
  window.loadFile(path.resolve(__dirname, "..", "build", "index.html"));
  window.once("ready-to-show", async () => {
    window.maximize();
    window.show();
    window.webContents.openDevTools();

    const creds = await load_config();
    window.webContents.send("set_twilio_credentials", creds);
  });

  const modalChildWindow = new BrowserWindow({
    parent: window,
    modal: false,
    show: false,
    width: 600,
    height: 1180,
  });
  modalChildWindow.loadURL("chrome://webrtc-internals");
  modalChildWindow.once("ready-to-show", () => {
    modalChildWindow.show();
  });
});
