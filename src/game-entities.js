const consts = require("./consts.js");
const helpers = require("./helpers.js");
const locale = require("../data/localisation.js").locale;


// #region GameEntities manager

exports.GameEntities = GameEntities;
function GameEntities(gameClient) {
    // A manager for all entities on the map
    // Params:
    //  gameClient: GameClient instance
    this.gameClient = gameClient;

    this.entities = {}; // key: uuid, value: Entity object

    console.log("GameEntities initialised!");
}

GameEntities.prototype.createEntity = function (params) {
    // Use this to create entities. Don't use new Entity().
    // Params:
    //  refer to Entity definition
    let ourParams = {
        type: params.type || locale.entities.unknown,
        uuid: params.uuid || helpers.uuid(),
        position: params.position || new google.maps.LatLng(0, 0),
        inventory: params.inventory || [],
        marker: params.marker || null
    };
    let type = params.type;
    let entity = null;
    let markerParams = { // we'll insert the icon type and title down in the switch-case
        position: ourParams.position,
        id: ourParams.uuid,
        // icon: null,
        // title: null,
        // onClickCallback: null
    };
    switch (type) {
        case locale.entities.player:
            entity = new Player({
                ...params,
                ...{
                    marker: this.gameClient.map.createMarker({
                        ...markerParams,
                        ...{
                            icon: locale.icons.player,
                            title: locale.entities.player,
                            onClickCallback: (e) => {
                                console.log(this.type + " " + this.uuid); // testing the this context
                            }
                        }
                    })
                }
            });
            break;
        default:
            console.log("Uh, entity wasn't specified when creating an entity");
            return null;
    }
    this.entities[entity.uuid] = entity;
    return entity;
}

GameEntities.prototype.removeEntity = function (identifier) {
    // Params:
    //  identifier: either string or entity object
    if (typeof identifier == "string") {
        delete this.entities[identifier];
    }
    else if (typeof identifier != "string" && identifier != null) {
        delete this.entities[identifier];
    }
}

GameEntities.prototype.getOurPlayer = function () {
    // Will return false if our player doesn't exist as an entity yet
    let ourUuid = this.gameClient.getOurPlayerInfo();
    if (this.entities.hasOwnProperty(ourUuid)) {
        return this.entities[ourUuid];
    }
    else {
        return false;
    }
}

// VVV all the things that entities can do will be validated here
// VVV the callback is hence optional - if you don't give it, it's just a local move, but
// VVV but if you specify the callback, it will be sent to the server and to everyone else

GameEntities.prototype.move = function (entity, position, callback) {
    // Params:
    //  entity: Entity instance you want to move
    //  position: LatLng you want to move to
    //  callback: (optional), if specified, this will be verified by the server
    if (typeof callback == "function") {
        this.gameClient.ioEmit(consts.IO_EVENTS.IS_POS_WATER_CTS, {
            lat: position.lat(),
            lng: position.lng()
        });

    }
}

// #endregion
// #region Entity and inherited entities

exports.Entity = Entity;
function Entity(params) {
    // external classes likely won't be constructing this, hence no validation happens here
    // Params:
    //  type: string in locale specifying the child class type when constructed
    //  uuid: (optional) the uuid you want to set, for players, it'll be their playerInfo uuid
    //  position: LatLng spawnpoint
    //  inventory: array of items (TBD)
    //  marker: google.maps.Marker instance (slidingMarker) given from the factory manager

    this.type = params.type;
    this.uuid = params.uuid;
    this.position = params.position;
    this.inventory = params.inventory;
    this.marker = params.marker;
}

Entity.prototype.export = function () {
    // Returns a savable object
    return {
        type: this.type,
        uuid: this.uuid,
        position: { lat: this.position.Lat(), lng: this.position.Lng() },
        inventory: this.inventory
    }
}

exports.Player = Player;
function Player(params) {
    // Inherits Entity
    // Params:
    //  refer to base Entity
    Entity.call(this, params);
}

// #endregion