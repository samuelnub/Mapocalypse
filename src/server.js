exports.Server = Server;
// The server will only be instantiated if you're hosting it
function Server() {
    // requiring them here as to prevent duplicates when requiring this file itself
    this.app = require("express")();
    this.server = require("http").Server(this.app);
    this.io = require("socket.io")(this.server);

    this.io.on("connect", (socket) => {
        console.log("a user connected to the server");

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });
}

Server.prototype.listen = function(port) {
    this.server.listen(port);
    console.log("Server listening on port " + port);
};

Server.prototype.close = function() {
    this.server.close();
    console.log("Server closed");
};