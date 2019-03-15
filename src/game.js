const consts = require("./consts.js");
const helpers = require("./helpers.js");
const getPixels = require("get-pixels");
const locale = require("../data/localisation.js").locale;

exports.Game = Game;
function Game(server) {
    // Params: 
    //  Server: server instance that it's linked to
    this.server = server;
    this.data = null; // Game data, the entities here are the exported values

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

Game.prototype.getEntities = function() {
    return this.data.entities || null;
}

Game.prototype.getEntityByUUID = function(uuid) {
    return this.data.entities[uuid] || null;
}

Game.prototype.addEntity = function(entityInfo) {
    // Provide the exported data for an entity
    // Params:
    //  entity: object that's returned by GameEntities' Entity.export() (entity info)
    this.data.entities[entityInfo.uuid] = entityInfo;
}

Game.prototype.setupIoSpecificTransfers = function (socket) {
    this.server.ioOnSpecific(consts.IO_EVENTS.REQUEST_ENTITY_INFOS_CTS, socket, () => {
        this.server.ioEmitSpecific(consts.IO_EVENTS.HERES_ENTITY_INFOS_STC, socket, this.data.entities);
    }, true);

    this.server.ioOnSpecific(consts.IO_EVENTS.NEW_ENTITY_INFO_CTS, socket, (entityInfo) => {
        this.addEntity(entityInfo);

        this.server.ioEmitAll(consts.IO_EVENTS.NEW_ENTITY_INFO_STC, entityInfo);
    });

    this.server.ioOnSpecific(consts.IO_EVENTS.IS_POS_WATER_CTS, socket, (position) => {
        this.isPosWater(position, (isWater) => {
            this.server.ioEmitSpecific(consts.IO_EVENTS.IS_POS_WATER_STC, socket, isWater);
        })
    });

    // Entity events
    // Remember:
    //  1. If the action is approved, emit to all with the result and save the result to this.entities[uuid]
    //  2. If the action is disapproved, emit back to the sender with an error message

    this.server.ioOnSpecific(consts.IO_EVENTS.ENTITY_MOVE_CTS, socket, (entityNewPos) => {
        const maxMoveDist = 5 + this.getEntityByUUID(entityNewPos.uuid).experience * 0.00001; // a cool multiplier
        if(helpers.distBetweenLatLngKm(this.getEntityByUUID(entityNewPos.uuid).position, entityNewPos.position) <= maxMoveDist) {
            this.isPosWater(entityNewPos.position, (isWater) => {
                if(!isWater) {
                    this.getEntityByUUID(entityNewPos.uuid).position = entityNewPos.position;

                    this.server.ioEmitAll(consts.IO_EVENTS.ENTITY_MOVE_STC, {
                        ...entityNewPos,
                        ...{
                            err: null // success! you can move mr requester!
                        }
                    });
                    return;
                }
                this.server.ioEmitSpecific(consts.IO_EVENTS.ENTITY_MOVE_STC, socket, {
                    err: locale.general.noThatsWater
                });
            });
        }
        else {
            this.server.ioEmitSpecific(consts.IO_EVENTS.ENTITY_MOVE_STC, socket, {
                err: locale.general.noThatsTooFar
            });
        }
    });
}

Game.prototype.isPosWater = function(position, callback) {
    // To verify if a lat and lng are on water or land
    try {
        let mapUrl = "https://maps.googleapis.com/maps/api/staticmap?center=" + position.lat + "," + position.lng + "&zoom=18&size=1x1&maptype=roadmap" + "&key=" + helpers.getGoogleMapsAPIKey();

        getPixels(mapUrl, (err, pixels) => {
            if(err) {
                throw err;
            }

            let pixelData = pixels["data"];
            if (pixelData[0] > 160 && pixelData[0] < 181 && pixelData[1] > 190 && pixelData[1] < 220) { // Gotta tweak these ranges
                callback(true);
            } else {
                callback(false);
            }
        });
    } catch(err) {
        console.log("Verifying whether a position was water was met with an error.\n" + err);
    }
}