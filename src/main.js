const electron = require("electron");
const consts = require("./consts");
const app = electron.app;
const Server = require("./server").Server;
const ipc = electron.ipcMain;

global.MAPOCALYPSE_SERVER = new Server();
global.MAPOCALYPSE_MENU_WINDOW = null;
global.MAPOCALYPSE_GAME_WINDOW = null;
global.MAPOCALYPSE_GAME_LOAD_INFO = null;
global.MAPOCALYPSE_CLEAR_GAME_LOAD_INFO = function() {
    global.MAPOCALYPSE_GAME_LOAD_INFO = null;
};
exports.MAIN_GLOBAL = global;

ipc.on(consts.IPC_EVENTS.GAME_START_LOAD_RTM, (e, gameLoadInfo) => {
    global.MAPOCALYPSE_GAME_LOAD_INFO = gameLoadInfo;
    if(gameLoadInfo.isLocal) {
        global.MAPOCALYPSE_SERVER.setCurrentWorld(gameLoadInfo.worldName);
        console.log("A game is initialising with worldname " + global.MAPOCALYPSE_GAME_LOAD_INFO.worldName);
    }
    createWindow("MAPOCALYPSE_GAME_WINDOW", "game-client.html");
});

function createWindow(windowVarName, htmlPage) {
    // Params:
    //      windowVarName: string (stored in global, you can see em up there)
    //      htmlPage: string (name of the gui file, just the file name)
    if(global[windowVarName] !== null) {
        return; // that particular window variable's already being used
    }
    global[windowVarName] = new electron.BrowserWindow({
        width: consts.MAIN_MENU_WIDTH,
        height: consts.MAIN_MENU_HEIGHT
    });
    global[windowVarName].loadFile(consts.WEB_FILEPATH + "gui/" + htmlPage);
    global[windowVarName].webContents.openDevTools();
    global[windowVarName].on("closed", () => {
        global[windowVarName] = null; 
    });

    console.log("Created new window with var name " + windowVarName);
};

app.on("ready", () => {
    createWindow("MAPOCALYPSE_MENU_WINDOW", "main-menu.html")
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if(global.MAPOCALYPSE_MENU_WINDOW === null) {
        createWindow("MAPOCALYPSE_MENU_WINDOW", "main-menu.html");
    }
});