const electron = require("electron");
const consts = require("./consts");
const app = electron.app;
const Server = require("./server").Server;

global.MAPOCALYPSE_SERVER = new Server();

function createWindow() {
    let window = new electron.BrowserWindow({
        width: consts.MAIN_MENU_WIDTH,
        height: consts.MAIN_MENU_HEIGHT
    });
    window.loadFile(consts.WEB_FILEPATH + "gui/main-menu.html");
    window.webContents.openDevTools();
    window.on("closed", () => {
        window = null; 
    });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if(window === null) {
        createWindow();
    }
});