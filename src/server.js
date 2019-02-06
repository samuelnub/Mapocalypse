const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const consts = require("./consts.js");
const game = require("./game.js");
const worldData = require("./world-data.js");

// Here, the server object acts as a god object for the game logic
exports.Server = Server;
function Server() {
    this.sockets = {};
    this.game = new game.Game(this);
    this.worldsManager = new worldData.WorldsManager(this); // World data is all the stored worlds' data, but game data is the current loaded world's states

    io.on("connection", (socket) => {
        this.sockets[socket.id] = socket;
        console.log("a user connected to the server with id " + socket.id);

        socket.emit(consts.IO_EVENTS.HERES_GAME_DATA_STC, this.game.getGameData());

        socket.on("disconnect", () => {
            delete this.sockets[socket.id]
            console.log("user disconnected with id " + socket.id);
        });
    });
}

Server.prototype.getAllWorldNames = function() {
    // Used when listing all the available worlds in the start-config screen
    return this.worldsManager.list();
}

Server.prototype.setCurrentWorld = function(worldName) {
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

Server.prototype.listen = function(port) {
    if(port != parseInt(port, 10)) {
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

Server.prototype.close = function() {
    // closes the server and unsets game data and writes the worlds to file (just in case)
    server.close();
    console.log("Server closed");
    this.game.unsetGameData();
    this.worldsManager.writeToFile();
    console.log("Game data unset");
};