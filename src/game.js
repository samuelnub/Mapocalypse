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

Game.prototype.removeEntity = function(entityInfo) {
    delete this.data.entities[entityInfo.uuid];
}

Game.prototype.setupIoSpecificTransfers = function (socket) {
    const maxMoveDistKM = 10;
    const maxInteractDistKM = 1;
    const expMult = (experience) => {
        return 500 - (500 - 1) * Math.pow(Math.E, -0.000001 * experience);
    };

    const logicLoopDelay = 2000;
    setInterval(() => {
        if(this.data === null) {
            return; // because this Game class only initialises once, we gotta let it be on standby when not hosting
        }
        // TODO: this loop should do stuff like replenish all entity's health by a certain amount
        // and/or move NPC's (in the faar future)
    }, logicLoopDelay);

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
        const ourMaxMoveDistKM = maxMoveDistKM * expMult(this.getEntityByUUID(entityNewPos.uuid).experience); // a cool multiplier
        if(helpers.distBetweenLatLngKm(this.getEntityByUUID(entityNewPos.uuid).position, entityNewPos.position) <= ourMaxMoveDistKM) {
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

    this.server.ioOnSpecific(consts.IO_EVENTS.ENTITY_HEALTH_CHANGE_CTS, socket, (entityHealthChange) => {
        const ourMaxInteractDistKM = maxInteractDistKM * expMult(this.getEntityByUUID(entityHealthChange.uuidAffector).experience);
        if(helpers.distBetweenLatLngKm(this.getEntityByUUID(entityHealthChange.uuidAffector).position, this.getEntityByUUID(entityHealthChange.uuidAffectee).position) <= ourMaxInteractDistKM) {
            let ourHealth = Math.round(entityHealthChange.healthChange * expMult(this.getEntityByUUID(entityHealthChange.uuidAffector).experience));
            this.getEntityByUUID(entityHealthChange.uuidAffectee).health += ourHealth;
            if(this.getEntityByUUID(entityHealthChange.uuidAffectee).health > 0) {
                this.server.ioEmitAll(consts.IO_EVENTS.ENTITY_HEALTH_SET_STC, {
                    uuid: entityHealthChange.uuidAffectee,
                    health: this.getEntityByUUID(entityHealthChange.uuidAffectee).health,
                    err: null
                });
            }
            else {
                this.server.ioEmitAll(consts.IO_EVENTS.DEAD_ENTITY_INFO_STC, this.getEntityByUUID(entityHealthChange.uuidAffectee));
                this.removeEntity(this.getEntityByUUID(entityHealthChange.uuidAffectee));
            }
            return;
        }
        else {
            this.server.ioEmitSpecific(consts.IO_EVENTS.ENTITY_HEALTH_CHANGE_STC, socket, {
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