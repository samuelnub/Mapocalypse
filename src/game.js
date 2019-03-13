const consts = require("./consts.js");
const helpers = require("./helpers.js");
const getPixels = require("get-pixels");

exports.Game = Game;
function Game(server) {
    // Params: 
    //  Server: server instance that it's linked to
    this.server = server;
    this.data = null; // Game data

}

Game.prototype.setGameData = function (worldData) {
    // This is the distinction between world data and game data - the game version is the current live one.
    // Will throw error if this.data isn't null
    // Params:
    //  worldData: WorldData instance to load in
    if (this.data == null) {
        this.data = worldData;
        return;
    }
    throw "Don't override game data!";
}

Game.prototype.getGameData = function () {
    // Will return null if not set yet
    return this.data;
}

Game.prototype.unsetGameData = function () {
    // Resets game data (when no game is being hosted anymore)
    this.data = null;
}

Game.prototype.setupIoSpecificListeners = function (socket) {
    this.server.ioOnSpecific(consts.IO_EVENTS.IS_POS_WATER_CTS, socket, (position) => {
        try {
            let mapUrl = "https://maps.googleapis.com/maps/api/staticmap?center=" + position.lat + "," + position.lng + "&zoom=18&size=1x1&maptype=roadmap" + "&key=" + helpers.getGoogleMapsAPIKey();

            getPixels(mapUrl, (err, pixels) => {
                if(err) {
                    throw err;
                }
                console.log("Static maps pixel data:\n" + JSON.stringify(pixels));

                let pixelData = pixels["data"];
                if (pixelData[0] > 160 && pixelData[0] < 181 && pixelData[1] > 190 && pixelData[1] < 220) { // Gotta tweak these ranges
                    this.server.ioEmitSpecific(consts.IO_EVENTS.IS_POS_WATER_STC, socket, true);
                } else {
                    this.server.ioEmitSpecific(consts.IO_EVENTS.IS_POS_WATER_STC, socket, false);
                }
            });
        } catch(err) {
            console.log("Verifying whether a position was water was met with an error.\n" + err);
        }
    })
}