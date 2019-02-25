const consts = require("./consts");
const remote = require("electron").remote;
const ipc = require("electron").ipcRenderer;
const io = require("socket.io-client");
const locale = require("../data/localisation").locale;

(() => { // This IIFE doesn't need to be here, but it's just nice to segment the code
    const gameLoadInfo = remote.getGlobal(consts.GLOBAL_NAMES.GAME_LOAD_INFO);
    console.log(JSON.stringify(gameLoadInfo) + " is the game load info");
    remote.getGlobal(consts.GLOBAL_NAMES.CLEAR_GAME_LOAD_INFO)();

    if(gameLoadInfo.isLocal) {
        remote.getGlobal(consts.GLOBAL_NAMES.SERVER).listen(gameLoadInfo.port);
        window.addEventListener("beforeunload", (e) => {
            remote.getGlobal(consts.GLOBAL_NAMES.SERVER).close();
        });
    }
    let gameClient = new GameClient(gameLoadInfo);
    window.mapocalypseGameClient = gameClient; // For debugging
})();

exports.GameClient = GameClient;
function GameClient(gameLoadInfo) {
    // This class will only contain the aspects that control the clien't window and help
    // to communicate between this client page and the server
    // Params:
    //  gameLoadInfo: gameLoadInfo instance passed from the main thread
    this.ioClient = io.connect(consts.HTTP_PREFIX + gameLoadInfo.address); 
    this.mainDiv = document.getElementById("main-div");
    this.data = null;

    this.ioClient.on(consts.IO_EVENTS.HERES_GAME_DATA_STC, (data) => {
        gameData = data;
        console.log("Upon loading, this game data was received: " + JSON.stringify(gameData));
    });

    
}


