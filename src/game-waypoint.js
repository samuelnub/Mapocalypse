const consts = require("./consts.js");
const helpers = require("./helpers.js");
const locale = require("../data/localisation.js").locale;

exports.GameWaypoint = GameWaypoint;
function GameWaypoint(gameClient) {
    // The waypoint class helps gives you context options wherever/whatever
    // you click on on the map.
    // It is not an entity, however, it displays its own marker when needed
    // It listens for entity/map clicks
    // Params:
    //  gameClient: GameClient instance
    this.gameClient = gameClient;
    this.ourMarker = this.gameClient.map.createMarker({
        position: new google.maps.LatLng(0, 0),
        id: helpers.uuid(),
        icon: consts.ICON_NAMES.WAYPOINT,
        duration: 500,
        clickable: false,
        opacity: 0.5
    });
    this.ourMarker.setVisible(false);

    this.gameClient.map.onClick((e) => {
        this.ourMarker.setVisible(true);
        this.ourMarker.setPosition(new google.maps.LatLng(e.latLng.lat(), e.latLng.lng()));

        if(this.gameClient.entities.getOurPlayer() === false) {
            this.gameClient.emit(consts.CLIENT_EVENTS.WAYPOINT_SELECTION_INFO, helpers.createWaypointInfo(
                e,
                [
                    helpers.createWaypointAction(locale.waypoint.actions.general.spawnOurPlayer, () => {
                        this.gameClient.ioEmit(consts.IO_EVENTS.IS_POS_WATER_CTS, {
                            lat: e.latLng.lat(),
                            lng: e.latLng.lng()
                        });
                        this.gameClient.ioOn(consts.IO_EVENTS.IS_POS_WATER_STC, (isWater) => {
                            if(isWater) {
                                this.gameClient.gui.logChat(locale.general.programName, locale.general.noThatsWater, true);
                                return;
                            }
                            this.gameClient.entities.createEntity({
                                type: consts.ENTITY_TYPES.PLAYER,
                                uuid: this.gameClient.getOurPlayerInfo().uuid,
                                position: e.latLng
                            });
                        }, true);
                    })
                ]
            ))
        }
        else {
            // Our player exists, so let's let them do stuff
            this.gameClient.emit(consts.CLIENT_EVENTS.WAYPOINT_SELECTION_INFO, helpers.createWaypointInfo(
                e,
                [
                    helpers.createWaypointAction(locale.waypoint.actions.general.movePlayer, () => {
                        this.gameClient.entities.getOurPlayer().move(e.latLng, true);
                    })
                ]
            ));
        }
    });

    console.log("GameWaypoint initialised!");
}

