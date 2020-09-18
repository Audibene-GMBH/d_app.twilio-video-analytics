const { app, BrowserWindow } = require('electron');
const path = require("path");

const { init_ipc_listeners } = require('./modules/ipc-events')

app.on("ready", () => {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            devTools: true,
            nodeIntegration: true,
            preload: path.resolve(__dirname, "preloader.js")
        }
    });

    init_ipc_listeners();
    window.loadFile(path.resolve(__dirname, "..", "build", "index.html"));
    window.maximize();
});