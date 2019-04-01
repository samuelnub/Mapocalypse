const consts = require("./consts");
const helpers = require("./helpers.js");
const remote = require("electron").remote;
const io = require("socket.io-client");
const locale = require("../data/localisation.js").locale;

const GameGUI = require("./game-gui.js");
const GameMap = require("./game-map.js");
const GameEntities = require("./game-entities.js");
const GameWaypoint = require("./game-waypoint.js");

function displayGoogleMapsError() {
    if (typeof google == "object") {
        return;
    }
    let errDiv = document.createElement("div");
    errDiv.id = "err-div";
    document.body.prepend(errDiv);
    let errP = document.createElement("p");
    errP.innerText = locale.general.googleMapsAPIKeyInvalid;
    errDiv.appendChild(errP)
    let errInput = document.createElement("input");
    errDiv.appendChild(errInput);
    errDiv.appendChild(helpers.createButton(
        locale.general.enter,
        (e) => {
            helpers.writeNewGoogleMapsAPIKey(helpers.sanitizeInput(errInput.value, 100));
        }
    ));
}

(() => { // This IIFE doesn't need to be here, but it's just nice to segment the code
    document.title = locale.general.programName;

    let errDelay = 5000;
    setTimeout(displayGoogleMapsError(), errDelay);

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
    this.playerInfos = null; // key: socket.id, value: playerInfo
    this.eventsElement = document.createElement("div"); // internal element for event listening/emitting

    this.gui = null;
    this.map = null;
    this.waypoint = null;
    this.entities = null;

    setTimeout(() => {
        this.stinkyConstructor(gameLoadInfo);
    }, 1);
}

GameClient.prototype.stinkyConstructor = function (gameLoadInfo) {
    // because this particular class is a big DUMB and can't have prototype functions called in the constructor
    // Setting up ioClient and its initial data transfers with the server
    let setupManagersIfIoTransfersAreDone = () => {
        if (this.ioClient !== null && this.data !== null && this.playerInfos !== null) {
            this.gui = new GameGUI.GameGUI(this);
            this.map = new GameMap.GameMap(this);
            this.waypoint = new GameWaypoint.GameWaypoint(this);
            this.entities = new GameEntities.GameEntities(this);
        }
    };

    this.ioClient = io.connect(consts.HTTP_PREFIX + gameLoadInfo.address);

    this.ioClient.emit(consts.IO_EVENTS.HERES_MY_PLAYER_INFO_CTS, helpers.getActivePlayerInfo());

    this.ioClient.on(consts.IO_EVENTS.HERES_GAME_DATA_STC, (data) => {
        try {
            console.log(remote.getGlobal(consts.GLOBAL_NAMES.SERVER).players);
            this.data = data;
            console.log("Upon loading, this game data was received: " + JSON.stringify(this.data));

            setupManagersIfIoTransfersAreDone();
        }
        catch {
            console.log("Couldn't receive game data from the server!");
        }
    });

    this.ioClient.on(consts.IO_EVENTS.HERES_CONNECTED_PLAYER_INFOS_STC, (playerInfos) => {
        try {
            console.log(playerInfos);
            this.playerInfos = playerInfos;

            setupManagersIfIoTransfersAreDone();
        }
        catch {
            console.log("Couldn't receive connected player infos from the server!");
        }
    });

    this.ioClient.on(consts.IO_EVENTS.NEW_CONNECTED_PLAYER_INFO_STC, (playerPacket) => {
        try {
            if (helpers.getFirstKey(playerPacket) == this.ioClient.id) {
                return;
            }
            // cool way to do object.assign:
            this.playerInfos = { ...this.playerInfos, ...playerPacket };
            console.log("Player connected:");
            console.log(playerPacket);
        }
        catch {
            console.log("A new player connected, but we couldn't receive the player's info from the server!");
        }
    });

    this.ioClient.on(consts.IO_EVENTS.NEW_DISCONNECTED_PLAYER_INFO_STC, (playerPacket) => {
        try {
            delete this.playerInfos[helpers.getFirstKey(playerPacket)]; // just some way to get rid of an object member
            console.log("Player disconnected. Remaining players:");
            console.log(this.playerInfos);
        }
        catch {
            console.log("A player disconnected, but we couldn't receive the player's info from the server!");
        }
    });


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

GameClient.prototype.getPlayerInfoFromUUID = function (uuid) {
    try {
        let result = null;
        for (let key of Object.keys(this.playerInfos)) {
            if (this.playerInfos[key].uuid == uuid) {
                result = this.playerInfos[key];
                break;
            }
        }
        return result;
    } catch {
        console.log("Somehow something went wrong with trying to get player info from uuid " + uuid);
        return;
    }
}

GameClient.prototype.ioEmit = function (type, data) {
    // Sending your data from here to the server, via ioClient
    // Params:
    //  type: string, const.IO_EVENTS type
    //  data: object you wanna send

    try {
        this.ioClient.emit(type, data);
        console.log("IO event " + type + " was emitted!");
    }
    catch {
        console.log("Couldn't emit io event " + type);
    }
}

GameClient.prototype.ioOn = function (type, callback, once) {
    // Listen for the ioClient event that you've subscribed to
    // Params:
    //  type: string, consts.IO_EVENTS type
    //  callback: function(data), with data being the data that the server's given you
    //  once: (optional) bool, if true, will remove the listener once it's occurred
    try {
        const callCallback = function (data) {
            if (typeof callback == "function") {
                callback(data);
            }
            if (once) {
                this.ioClient.removeListener(type, callCallbackBound);
            }
        };
        const callCallbackBound = callCallback.bind(this);
        this.ioClient.on(type, callCallbackBound);
    }
    catch {
        console.log("Couldn't receive io event " + type);
    }
}

GameClient.prototype.emit = function (type, data) {
    // Emit an internal client-based event
    // Params:
    //  type: string, consts.CLIENT_EVENTS
    //  data: object you want to send

    const event = new CustomEvent(type, {
        detail: { data: data || null }
    });
    this.eventsElement.dispatchEvent(event);
    console.log("Client Event " + type + " was emitted!");
}

GameClient.prototype.on = function (type, callback, once) {
    // Listen for our client-based events
    // Params:
    //  type: string, consts.CLIENT_EVENTS
    //  callback: function(data)
    //  once: (optional) bool, it will remove the listener after the event occurs
    const callCallback = function (e) {
        if (typeof callback == "function") {
            callback(e.detail.data);
        }
        if (once) {
            this.eventsElement.removeEventListener(type, callCallbackBound);
        }
    };
    const callCallbackBound = callCallback.bind(this);
    this.eventsElement.addEventListener(type, callCallbackBound);
}