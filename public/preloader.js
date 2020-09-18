const { ipcRenderer, desktopCapturer } = require("electron")

window.__electron = {
    desktopCapturer: desktopCapturer,
    ipcRenderer: ipcRenderer
}