const consts = require("./consts");
const helpers = require("./helpers.js");
const remote = require("electron").remote;
const io = require("socket.io-client");
const locale = require("../data/localisation.js").locale;

const GameGUI = require("./game-gui.js");
const GameMap = require("./game-map.js");
global.gameClient = null;

(() => { // This IIFE doesn't need to be here, but it's just nice to segment the code
    const gameLoadInfo = remote.getGlobal(consts.GLOBAL_NAMES.GAME_LOAD_INFO);
    console.log(JSON.stringify(gameLoadInfo) + " is the game load info");
    remote.getGlobal(consts.GLOBAL_NAMES.CLEAR_GAME_LOAD_INFO)();

    if (gameLoadInfo.isLocal) {
        remote.getGlobal(consts.GLOBAL_NAMES.SERVER).listen(gameLoadInfo.port);
        window.addEventListener("beforeunload", (e) => {
            remote.getGlobal(consts.GLOBAL_NAMES.SERVER).close();
        });
    }
    global.gameClient = new GameClient(gameLoadInfo);
})();

exports.GameClient = GameClient;
function GameClient(gameLoadInfo) {
    // This class will only contain the aspects that control the clien't window and help
    // to communicate between this client page and the server
    // Params:
    //  gameLoadInfo: gameLoadInfo instance passed from the main thread
    this.ioClient = null;
    this.mainDiv = document.getElementById("main-div");
    this.data = null; // world data
    this.playerInfos = {} // key: socket.id, value: playerInfo

    this.gui = new GameGUI.GameGUI(this);
    this.map = new GameMap.GameMap(this);

    setTimeout(() => { this.setupIoConnection(gameLoadInfo); }, 1); // for some dumb reason, the constructor cant call prototype functions until it's fully initialised
}

GameClient.prototype.setupIoConnection = function (gameLoadInfo) {
    // Just a separate function to setup connecting this.ioClient and
    // initialising all the transfers and listeners
    // Params:
    //  gameLoadInfo: gameLoadInfo instance passed on from our constructor
    this.ioClient = io.connect(consts.HTTP_PREFIX + gameLoadInfo.address);

    this.ioClient.emit(consts.IO_EVENTS.HERES_MY_PLAYER_INFO_CTS, helpers.getActivePlayerInfo());

    this.ioClient.on(consts.IO_EVENTS.HERES_CONNECTED_PLAYER_INFOS_STC, (data) => {
        this.playerInfos = data;
    });

    this.ioClient.on(consts.IO_EVENTS.HERES_GAME_DATA_STC, (data) => {
        this.data = data;
        console.log("Upon loading, this game data was received: " + JSON.stringify(this.data));
    });

    this.ioClient.on(consts.IO_EVENTS.NEW_CONNECTED_PLAYER_INFO_STC, (data) => {
        Object.assign(this.playerInfos, data);
        console.log("Player connected:");
        console.log(data);
    });

    this.ioClient.on(consts.IO_EVENTS.NEW_DISCONNECTED_PLAYER_STC, (data) => {
        delete this.playerInfos[Object.keys(data)[0]]; // just some way to get rid of an object member
        console.log("Player disconnected. Remaining players:");
        console.log(this.playerInfos);
    });
}

GameClient.prototype.ioEmit = function (type, data) {
    // Sending your data from here to the server, via ioClient
    // Params:
    //  type: string, const.IO_EVENTS type
    //  data: object you wanna send

    this.ioClient.emit(type, data);
}

GameClient.prototype.ioOn = function (type, callback) {
    // Listen for the ioClient event that you've subscribed to
    // Params:
    //  type: string, const.IO_EVENTS type
    //  callback: function(data), with data being the data that the server's given you
    this.ioClient.on(type, (data) => {
        if (typeof callback == "function") {
            callback(data);
        }
    });
}

GameClient.prototype.ioRemoveOn = function (type, callback) {
    // Unsubscribing from the callback (just to prevent memory pollution)
    // Params:
    //  type: string, const.IO_EVENTS type
    //  callback: the specific callback function you used when subscribing
    this.ioClient.removeListener(type, callback);
}