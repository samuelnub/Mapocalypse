const app = require("express")();
const server = require("http").Server(app);
const consts = require("./consts.js");
const game = require("./game.js");
const worldData = require("./world-data.js");

// Here, the server object acts as a god object for the game logic
// There may be a lot of second-hand abstracted functions
exports.Server = Server;
function Server() {
    this.io = require("socket.io")(server);
    this.players = {}; // Key: socket.id, value: { socket: socket, playerInfo: {name,id}}
    this.game = new game.Game(this);
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

        socket.on(consts.IO_EVENTS.HERES_MY_PLAYER_INFO_CTS, (data) => {
            this.players[socket.id].playerInfo = data;
            console.log("Socket " + socket.id + " has player info of " + JSON.stringify(data));

            let playerInfos = {};
            for (let key of Object.keys(this.players)) {
                playerInfos[key] = this.players[key].playerInfo;
            }
            socket.emit(consts.IO_EVENTS.HERES_CONNECTED_PLAYER_INFOS_STC, playerInfos);

            // Let everyone else connected know that he's connected
            for (let key of Object.keys(this.players)) {
                if (key == socket.id) {
                    continue;
                }
                this.players[key].socket.emit(consts.IO_EVENTS.NEW_CONNECTED_PLAYER_INFO_STC, {
                    [socket.id]: this.player[socket.id].playerInfo
                });
            }
        });

        socket.on("disconnect", () => {
            for (let key of Object.keys(this.players)) {
                if (key == socket.id) {
                    continue;
                }
                this.players[key].socket.emit(consts.IO_EVENTS.NEW_DISCONNECTED_PLAYER_STC, {
                    [socket.id]: this.player[socket.id].playerInfo
                });
            }

            delete this.players[socket.id]
            console.log("user disconnected with id " + socket.id);
        });
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

Server.prototype.ioOnSpecific = function (type, socket, callback) {
    // Subscribe to a specific event from a specific socket
    // Params:
    //  type: string, consts.IO_EVENTS type
    //  socket: io-based socket object
    //  callback: function(data) with data being the object they sent
    if (!this.players.hasOwnProperty(socket.id)) {
        throw "Your socket doesn't exist in our list of sockets connected...";
        return;
    }
    socket.on(type, (data) => {
        if (typeof callback == "function") {
            callback(data);
        }
    });
}

Server.prototype.ioRemoveOnSpecific = function (type, socket, callback) {
    // Unsubscribe from a specific socket's event
    // Params:
    //  type: string, consts.IO_EVENTS type
    //  socket: io-based socket object
    //  callback: the callback function you specifically want to unsubscribe from
    if (!this.players.hasOwnProperty(socket.id)) {
        throw "Your socket doesn't exist in our list of sockets connected...";
        return;
    }
    socket.removeListener(type, callback);
}


Server.prototype.ioEmitAll = function (type, data) {
    for (let socket of this.sockets) {
        this.ioEmitSpecific(type, socket, data);
    }
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
        world = this.worldsManager.create(new worldData.WorldData({
            name: worldName
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