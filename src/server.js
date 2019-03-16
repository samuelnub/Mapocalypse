const app = require("express")();
const server = require("http").Server(app);
const consts = require("./consts.js");
const Game = require("./game.js");
const worldData = require("./world-data.js");
const remote = require("electron").remote;

// Here, the server object acts as a god object for the game logic
// There may be a lot of second-hand abstracted functions
exports.Server = Server;
function Server() {
    this.io = require("socket.io")(server);
    this.players = {}; // Key: socket.id, value: { socket: socket, playerInfo: {name,id}}
    this.game = new Game.Game(this);
    this.worldsManager = new worldData.WorldsManager(this); // World data is all the stored worlds' data, but game data is the current loaded world's states

    this.setupIoTransfers();
}

Server.prototype.setupIoTransfers = function () {
    this.io.on("connection", (socket) => {
        this.players[socket.id] = {
            playerInfo: null,
            socket: null
        };
        this.players[socket.id].socket = socket;
        console.log("a user connected to the server with id " + socket.id);
        socket.emit(consts.IO_EVENTS.HERES_GAME_DATA_STC, this.game.getGameData());
        
        socket.on(consts.IO_EVENTS.HERES_MY_PLAYER_INFO_CTS, (playerInfo) => {
            this.players[socket.id].playerInfo = playerInfo;
            console.log("Socket " + socket.id + " has player info of " + JSON.stringify(playerInfo));

            let playerInfos = {};
            for (let key of Object.keys(this.players)) {
                playerInfos[key] = this.players[key].playerInfo;
            }
            socket.emit(consts.IO_EVENTS.HERES_CONNECTED_PLAYER_INFOS_STC, playerInfos);

            // Let everyone else connected know that he's connected
            let playerPacket = {};
            playerPacket[socket.id] = playerInfo
            this.io.emit(consts.IO_EVENTS.NEW_CONNECTED_PLAYER_INFO_STC, playerPacket);
        });

        socket.on("disconnect", () => {
            let playerPacket = {};
            playerPacket[socket.id] = this.players[socket.id].playerInfo;
            this.io.emit(consts.IO_EVENTS.NEW_DISCONNECTED_PLAYER_INFO_STC, playerPacket);
            delete this.players[socket.id];
            console.log("user disconnected with id " + socket.id);
        });

        // Other listeners which are socket-specific (so most of them...)
        socket.on(consts.IO_EVENTS.SEND_PUBLIC_CHAT_CTS, (chatPacket) => {
            this.io.emit(consts.IO_EVENTS.INCOMING_PUBLIC_CHAT_STC, chatPacket);
        });

        this.game.setupIoSpecificTransfers(socket);
    });
}

Server.prototype.ioEmitSpecific = function (type, socket, data) {
    // Send your data to the specific socket
    // Params:
    //  type: string, consts.IO_EVENTS type
    //  socket: io-based socket object that you want to send to
    //  data: object you wanna send
    if (this.players.hasOwnProperty(socket.id)) {
        socket.emit(type, data);
        return;
    }
    throw "The socket you want to send to doesn't exist in my list of sockets connected...";
}

Server.prototype.ioOnSpecific = function (type, socket, callback, once) {
    // Subscribe to a specific event from a specific socket
    // Params:
    //  type: string, consts.IO_EVENTS type
    //  socket: io-based socket object
    //  callback: function(data) with data being the object they sent
    //  once: (optional) bool
    const callCallback = function(data) {
        if(typeof callback == "function") {
            callback(data);
        }
        if(once) {
            socket.removeListener(type, callCallbackBound);
        }
    };
    const callCallbackBound = callCallback.bind(this);
    socket.on(type, callCallbackBound);
}

Server.prototype.ioEmitAll = function (type, data) {
    this.io.emit(type, data);
}

Server.prototype.getAllWorldNames = function () {
    // Used when listing all the available worlds in the start-config screen
    return this.worldsManager.list();
}

Server.prototype.deleteWorld = function (worldName) {
    this.worldsManager.delete(worldName);
}

Server.prototype.setCurrentWorld = function (worldName) {
    let world;
    try {
        world = this.worldsManager.get(worldName);
    }
    catch (err) {
        // World doesn't exist on file, so let's create one
        const curGameLoadInfo = global[consts.GLOBAL_NAMES.GAME_LOAD_INFO];
        world = this.worldsManager.create(new worldData.WorldData({
            name: curGameLoadInfo.worldName,
            seed: curGameLoadInfo.seed
        }));
    }
    this.game.setGameData(world);
};

Server.prototype.listen = function (port) {
    // I tried using helpers.sanitizePort() here but it just crashed...
    if (port != parseInt(port, 10)) {
        port = consts.DEFAULT_PORT;
    }
    try {
        server.listen(port);
    }
    catch (err) {
        port = consts.DEFAULT_PORT;
        server.listen(port);
    }
    console.log("Server listening on port " + port);
};

Server.prototype.close = function () {
    // closes the server and unsets game data and writes the worlds to file (just in case)
    server.close();
    console.log("Server closed");
    this.game.unsetGameData();
    this.worldsManager.writeToFile();
    console.log("Game data unset");
};