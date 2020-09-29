const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

const { init_ipc_listeners } = require("./modules/ipc-events");
const { load: load_config } = require("./modules/config-loader");

app.on("ready", () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  init_ipc_listeners();

  const window = new BrowserWindow({
    width: width,
    height: height,
    show: false,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.resolve(__dirname, "preloader.js"),
    },
  });
  window.loadFile(path.resolve(__dirname, "..", "build", "index.html"));
  window.once("ready-to-show", async () => {
    window.maximize();
    window.show();

    const creds = await load_config();
    window.webContents.send("set_twilio_credentials", creds);
  });

  const modalWidth = 600;
  const modalHeight = 1180;
  const modalChildWindow = new BrowserWindow({
    parent: window,
    modal: false,
    closable: false,
    x: window.getBounds().width - modalWidth,
    y: 70,
    show: false,
    width: modalWidth,
    height: modalHeight,
  });
  modalChildWindow.loadURL("chrome://webrtc-internals");
});
