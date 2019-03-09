const consts = require("./consts");
const helpers = require("./helpers.js");
const remote = require("electron").remote;
const io = require("socket.io-client");
const locale = require("../data/localisation.js").locale;

const GameGUI = require("./game-gui.js");
const GameMap = require("./game-map.js");

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
    const gameClient = new GameClient(gameLoadInfo);
    window.gameClient = gameClient;
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
    this.ourPlayerInfo = helpers.getActivePlayerInfo(); // just caching it here cuz it's not gonna modify anyway
    this.playerInfos = {} // key: socket.id, value: playerInfo

    this.gui = null;
    this.map = null;

    setTimeout(() => {
        this.stinkyConstructor(gameLoadInfo);
    }, 1);
}

GameClient.prototype.stinkyConstructor = function (gameLoadInfo) {
    // because this particular class is a big DUMB and can't have prototype functions called in the constructor
    // Setting up ioClient and its initial data transfers with the server
    this.ioClient = io.connect(consts.HTTP_PREFIX + gameLoadInfo.address);

    this.ioClient.emit(consts.IO_EVENTS.HERES_MY_PLAYER_INFO_CTS, helpers.getActivePlayerInfo());

    this.ioClient.on(consts.IO_EVENTS.HERES_GAME_DATA_STC, (data) => {
        console.log(remote.getGlobal(consts.GLOBAL_NAMES.SERVER).players);
        this.data = data;
        console.log("Upon loading, this game data was received: " + JSON.stringify(this.data));
    });

    this.ioClient.on(consts.IO_EVENTS.HERES_CONNECTED_PLAYER_INFOS_STC, (playerInfos) => {
        this.playerInfos = playerInfos;
    });

    this.ioClient.on(consts.IO_EVENTS.NEW_CONNECTED_PLAYER_INFO_STC, (playerPacket) => {
        if (helpers.getFirstKey(playerPacket) == this.ioClient.id) {
            return;
        }
        // cool way to do object.assign:
        this.playerInfos = {...this.playerInfos, ...playerPacket};
        console.log("Player connected:");
        console.log(playerPacket);
    });

    this.ioClient.on(consts.IO_EVENTS.NEW_DISCONNECTED_PLAYER_INFO_STC, (playerPacket) => {
        delete this.playerInfos[helpers.getFirstKey(playerPacket)]; // just some way to get rid of an object member
        console.log("Player disconnected. Remaining players:");
        console.log(this.playerInfos);
    });


    this.gui = new GameGUI.GameGUI(this);
    this.map = new GameMap.GameMap(this);
}

GameClient.prototype.getOurPlayerInfo = function () {
    return this.ourPlayerInfo;
}

GameClient.prototype.getOurSocketId = function () {
    return this.ioClient.id;
}

GameClient.prototype.getPlayerInfoFromSocketId = function (id) {
    try {
        return this.playerInfos[id];
    }
    catch {
        console.log("That id " + id + " doesn't exist as far as I know...");
        return null;
    }
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