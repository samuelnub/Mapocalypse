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
            this.createEntity({
                ...entityInfos[uuid],
                ...{
                    position: new google.maps.LatLng(entityInfos[uuid].position.lat, entityInfos[uuid].position.lng)
                }
            }, false);
        }
        console.log("Received the initial entities and set them up.");
        console.log(this.entities);
    });

    // The result of entity action verifications

    this.gameClient.ioOn(consts.IO_EVENTS.NEW_ENTITY_INFO_STC, (entityInfo) => {
        if(this.entities.hasOwnProperty(entityInfo.uuid)) {
            return; // We already have that entity UUID (assume we made it then)
        }
        this.createEntity({
            ...entityInfo,
            ...{
                position: new google.maps.LatLng(entityInfo.position.lat, entityInfo.position.lng)
            }
        }, false);
        console.log("New entity created emitted by the server:");
        console.log(this.entities[entityInfo.uuid]);
    });
    this.gameClient.ioOn(consts.IO_EVENTS.DEAD_ENTITY_INFO_STC, (entityInfo) => {
        if(this.entities.hasOwnProperty(entityInfo.uuid)) {
            this.removeEntity(entityInfo.uuid, false);
        }
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

    this.gameClient.ioOn(consts.IO_EVENTS.ENTITY_HEALTH_SET_STC, (entityHealthSet) => {
        if(entityHealthSet.err) {
            this.gameClient.gui.logChat(locale.general.programName, entityHealthSet.err, true);
            return;
        }
        this.entities[entityHealthSet.uuid].setHealth(entityHealthSet.health);
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
    this.gameClient.emit(consts.CLIENT_EVENTS.ENTITY_CREATED, entity.uuid);
    return entity;
}

GameEntities.prototype.removeEntity = function (identifier, sendToServer) {
    // Params:
    //  identifier: either string or entity object
    //  sendToServer: (optional) bool on whether you want to broadcast it to everyone too
    if (typeof identifier == "string") {
        if(sendToServer == null || sendToServer === true) {
            this.gameClient.ioEmit(consts.IO_EVENTS.DEAD_ENTITY_INFO_CTS, this.entities[identifier].export());
        }
        this.gameClient.map.removeMarker(this.entities[identifier].marker);
        delete this.entities[identifier];
    }
    else if (typeof identifier != "string" && identifier != null) {
        if(sendToServer == null || sendToServer === true) {
            this.gameClient.ioEmit(consts.IO_EVENTS.DEAD_ENTITY_INFO_CTS, identifier.export());
        }
        this.gameClient.map.removeMarker(this.entities[identifier.uuid].marker);
        delete this.entities[identifier.uuid];
    }
}

GameEntities.prototype.getEntityByUUID = function(uuid) {
    return this.entities[uuid] || null;
}

GameEntities.prototype.getOurPlayer = function () {
    // Will return null if our player doesn't exist as an entity yet
    let ourUuid = this.gameClient.getOurPlayerInfo().uuid;
    if (this.entities.hasOwnProperty(ourUuid)) {
        return this.entities[ourUuid];
    }
    else {
        return null;
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

    // Do not modify these externally, as verification/multiple steps are needed to modify these values
    this.type = params.type;
    this.uuid = params.uuid;
    this.position = params.position;
    this.inventory = params.inventory;
    
    this.health = params.health;
    this.stamina = params.stamina;
    this.experience = params.experience;

    this.positionEle = document.createElement("span");
    this.positionEle.style.color = "var(--solid-blue)";
    this.positionEle.innerText = params.position.lat().toFixed(4) + " " + params.position.lng().toFixed(4);
    this.healthEle = document.createElement("span");
    this.healthEle.style.color = "var(--solid-red)";
    this.healthEle.innerText = params.health;
    this.staminaEle = document.createElement("span");
    this.staminaEle.style.color = "var(--solid-orange)";
    this.staminaEle.innerText = params.stamina;
    this.experienceEle = document.createElement("span");
    this.experienceEle.style.color = "var(--solid-yellow)";
    this.experienceEle.innerText = params.experience;

    // Derivatives will populate these potential waypoint actions
    // The affector will be the client's perspective's player
    // The waypoint class will list these actions whenever this entity is clicked
    this.actions = [];
    this.actions.push(helpers.createWaypointAction(locale.waypoint.actions.general.hurt, () => {
        if(this.gameClient.entities.getOurPlayer() === null) {
            return;
        }
        else {
            const hurtHealthChangeBase = -10;
            this.healthChange(hurtHealthChangeBase, this.gameClient.entities.getOurPlayer().uuid, true);
        }
    }))

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

Entity.prototype.getActions = function() {
    return this.actions;
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
    this.positionEle.innerText = this.position.lat().toFixed(4) + "," + this.position.lng().toFixed(4);
}

Entity.prototype.healthChange = function(amount, uuidAffector, sendToServer) {
    // Params:
    //  amount: integer number that will be added on to this entity's health
    //  uuidAffector: (optional) string uuid of the entity who illicited this health change (set to false if not specifying)
    //  sendToServer: (optional) bool whether you want it to be a local or server-wide move, default true
    if(sendToServer == null || sendToServer === true) {
        this.gameClient.ioEmit(consts.IO_EVENTS.ENTITY_HEALTH_CHANGE_CTS, {
            uuidAffectee: this.uuid,
            uuidAffector: uuidAffector,
            healthChange: amount
        })
        // Now we wait for the server's response
        return;
    }
    this.health += amount;
    this.healthEle.innerText = this.health;
}

Entity.prototype.setHealth = function(newHealth) {
    // A local function to just set our health, usually given by the server making a change
    // Params:
    //  newHealth: number
    this.healthChange(newHealth-this.health,false,false);
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

            }
        }
    });
    this.isThisPlayerConnected = (this.gameClient.getPlayerInfoFromUUID(this.uuid) ? true : false);
    this.setVisible(this.isThisPlayerConnected);
}
Player.prototype = Object.create(Entity.prototype); // Remember this and .call(this)!

// #endregion