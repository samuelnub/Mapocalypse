exports.Server = Server;
function Server() {
    // requiring them here as to prevent duplicates when requiring this file itself
    this.app = require("express")();
    this.server = require("http").Server(app);
    this.io = require("socket.io")(server);

    this.port = this.app.get("port") || 3000;

    io.on("connect", (socket) => {
        console.log("a user connected to the server");

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });
}

Server.prototype.host = function(port) {
    this.port = port;
    this.app.set("port", port);
};

Server.prototype.connect = function(address, port) {
    
};

Server.prototype.quit = function() {
    this.io.close();
};

