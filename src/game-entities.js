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

    this.setupIoTransfers();

    console.log("GameEntities initialised!");
}

GameEntities.prototype.setupIoTransfers = function() {
    this.gameClient.ioEmit(consts.IO_EVENTS.REQUEST_ENTITY_INFOS_CTS);
    this.gameClient.ioOn(consts.IO_EVENTS.HERES_ENTITY_INFOS_STC, (entityInfos) => {
        for(let uuid of Object.keys(entityInfos)) {
            this.createEntity(entityInfos[uuid], false);
        }
        console.log("Received the initial entities and set them up.");
        console.log(this.entities);
    });

    // The result of entity action verifications

    this.gameClient.ioOn(consts.IO_EVENTS.NEW_ENTITY_INFO_STC, (entityInfo) => {
        if(this.entities.hasOwnProperty(entityInfo.uuid)) {
            return; // We already have that entity UUID (assume we made it then)
        }
        this.createEntity(entityInfo, false);
    });

    this.gameClient.ioOn(consts.IO_EVENTS.NEW_CONNECTED_PLAYER_INFO_STC, (playerPacket) => {
        try {
            this.entities[helpers.getFirstKeysValue(playerPacket).uuid].setVisible(true);
        }
        catch {
            // that player that just connected hasn't spawned in
        }
    });
    this.gameClient.ioOn(consts.IO_EVENTS.NEW_DISCONNECTED_PLAYER_INFO_STC, (playerPacket) => {
        try {
            this.entities[helpers.getFirstKeysValue(playerPacket).uuid].setVisible(false);
        }
        catch {
            // that player that just disconnected hasn't spawned in
        }
    });

    this.gameClient.ioOn(consts.IO_EVENTS.ENTITY_MOVE_STC, (entityNewPos) => {
        if(entityNewPos.err) {
            this.gameClient.gui.logChat(locale.general.programName, entityNewPos.err, true);
            return;
        }
        let ourNewPosition = new google.maps.LatLng(entityNewPos.position.lat, entityNewPos.position.lng)
        this.entities[entityNewPos.uuid].move(ourNewPosition, false);
    });
}

GameEntities.prototype.createEntity = function (params, sendToServer) {
    // Use this to create entities. Don't use new Entity().
    // Params:
    //  refer to Entity definition
    //  sendToServer: optional boolean to say whether you want to export this newly created entity to the server to log (yes in most cases), default true
    let ourParams = {
        gameClient: this.gameClient,
        type: params.type || consts.ENTITY_TYPES.UNKNOWN,
        uuid: params.uuid || helpers.uuid(),
        position: params.position || new google.maps.LatLng(0, 0),
        inventory: params.inventory || [],
        health: params.health || 100,
        stamina: params.stamina || 100,
        experience: params.experience || 0
    };
    let entity = null;
    switch (ourParams.type) {
        case consts.ENTITY_TYPES.PLAYER:
            entity = new Player(ourParams);
            break;
        default:
            console.log("Uh, entity wasn't specified when creating an entity");
            return null;
    }

    this.entities[entity.uuid] = entity;
    if(sendToServer == null || sendToServer === true) {
        this.gameClient.ioEmit(consts.IO_EVENTS.NEW_ENTITY_INFO_CTS, entity.export());
    }
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
    let ourUuid = this.gameClient.getOurPlayerInfo().uuid;
    if (this.entities.hasOwnProperty(ourUuid)) {
        return this.entities[ourUuid];
    }
    else {
        return false;
    }
}

// #endregion
// #region Entity and inherited entities

exports.Entity = Entity;
function Entity(params) {
    // external classes likely won't be constructing this, hence no validation happens here
    // Params:
    //  gameClient: GameClient instance that's tagged in here
    //  type: string in locale specifying the child class type when constructed
    //  uuid: (optional) the uuid you want to set, for players, it'll be their playerInfo uuid
    //  position: LatLng spawnpoint
    //  inventory: array of items (TBD)
    //  health: number 0 to 100
    //  stamina: number 0 to 100
    //  experience: 0 to whatever
    this.gameClient = gameClient;

    this.type = params.type;
    this.uuid = params.uuid;
    this.position = params.position;
    this.inventory = params.inventory;
    
    this.health = params.health;
    this.stamina = params.stamina;
    this.experience = params.experience;

    this.marker = null;
    this.genericMarkerParams = {
        position: this.position,
        id: this.uuid,
        title: this.type + " " + this.uuid
    };
}

Entity.prototype.export = function () {
    // Returns a savable object
    return {
        type: this.type,
        uuid: this.uuid,
        position: this.position.toJSON(),
        inventory: this.inventory,
        health: this.health,
        stamina: this.stamina,
        experience: this.experience
    }
}

Entity.prototype.move = function(position, sendToServer) {
    // Params:
    //  position: google.maps.LatLng position you want to move to
    //  sendToServer: (optional) bool whether you want it to be a local or server-wide move, default true
    if(sendToServer == null || sendToServer === true) {
        this.gameClient.ioEmit(consts.IO_EVENTS.ENTITY_MOVE_CTS, {
            uuid: this.uuid,
            position: position.toJSON()
        });
        // Now we wait for the server's response
        return;
    }
    this.marker.setPosition(position);
    this.position = position;
}

Entity.prototype.setVisible = function(bool) {
    this.marker.setVisible(bool);
}

exports.Player = Player;
function Player(params) {
    // Inherits Entity
    // Params:
    //  refer to base Entity
    Entity.call(this, params);
    
    this.marker = this.gameClient.map.createMarker({
        ...this.genericMarkerParams,
        ...{
            icon: consts.ICON_NAMES.PLAYER,
            onClickCallback: (e) => {
                this.gameClient.gui.logChat(this.gameClient.getPlayerInfoFromUUID(this.uuid).name + " says", "Hello!", true);
            }
        }
    });
    this.isThisPlayerConnected = (this.gameClient.getPlayerInfoFromUUID(this.uuid) ? true : false);
    this.setVisible(this.isThisPlayerConnected);
}
Player.prototype = Object.create(Entity.prototype); // Remember this and .call(this)!

// #endregion