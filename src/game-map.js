const helpers = require("./helpers.js");
const consts = require("./consts.js");
const locale = require("../data/localisation.js").locale;
const SlidingMarker = require("marker-animate-unobtrusive");

exports.GameMap = GameMap;
function GameMap(gameClient) {
    // This class will manage the rendering of the map onto the client's screen
    // Plus all entity renderings and other bits and bobs
    // Params:
    //  gameClient: GameClient instance
    this.gameClient = gameClient;

    this.markers = {};

    this.mapDiv = document.createElement("div");
    this.mapDiv.id = "map-div";
    const mapocalypseMapStyleDay = new google.maps.StyledMapType(
        require("../data/map-styles.js").mapStyleDay, { name: "Mapocalypse Style Day" });
    const mapocalypseMapStyleNight = new google.maps.StyledMapType(
        require("../data/map-styles.js").mapStyleNight, { name: "Mapocalypse Style Night" });

        this.map = new google.maps.Map(this.mapDiv, {
        center: new google.maps.LatLng(0/*53.551458*/, 0/*-1.923063*/),
        zoom: 2,
        minZoom: 2,
        disableDefaultUI: true,
        mapTypeControlOptions: {
            mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain", "mapocalypse_style_day", "mapocalypse_style_night"]
        }
    });
    this.map.mapTypes.set("mapocalypse_style_day", mapocalypseMapStyleDay);
    this.map.mapTypes.set("mapocalypse_style_night", mapocalypseMapStyleNight);
    this.map.setMapTypeId("mapocalypse_style_day");

    this.placesService = new google.maps.places.PlacesService(this.map);

    this.gameClient.mainDiv.appendChild(this.mapDiv);

    console.log("GameMap initialised!");
}

GameMap.prototype.createMarker = function(params) {
    // Create a marker and put it in this.marker pool
    // returns the marker
    // Params object:
    //  position: {lat:num,lng:num} or google.maps.LatLng() position
    //  id: string (entity uuid most likely)
    //  icon: string (just the icon name from ./data/icons/)
    //  title: string tooltip, entity/playername
    //  onClickCallback: function(event), with event containing click event info (+latLng!)
    //  animDuration: (optional) purely visual - how long the animation duration should be

    // having ourParams lets us copy any other custom marker parameters
    let ourParams = params;
    ourParams.position = params.position || new google.maps.LatLng(0,0);
    ourParams.icon = {
        url: "../../data/icons/" + (params.icon ? params.icon : consts.ICON_NAMES.UNKNOWN) + ".svg"
    };
    ourParams.title = params.title || locale.general.nothing;
    ourParams.duration = params.duration || 1000;
    ourParams.map = this.map;
    let marker = new SlidingMarker(ourParams);
    marker.id = params.id || helpers.uuid();
    if(typeof params.onClickCallback == "function") {
        marker.addListener("click", (e) => {
            params.onClickCallback(e);
        });
    }
    this.markers[marker.id] = marker;
    return marker;
}

GameMap.prototype.removeMarker = function(identifier) {
    // Params:
    //  identifier: string or object, either just the id or the marker object itself
    if(typeof identifier == "string") {
        this.markers[identifier].setMap(null);
        delete this.markers[identifier];
    }
    else if(typeof identifier != "string" && identifier != null) {
        this.markers[identifier.id].setMap(null);
        delete this.markers[identifier];
    }
}

GameMap.prototype.onClick = function(callback) {
    // returns google eventListener for you to keep track of, if you want to remove it
    // you probably won't use this externally, as you'll just listen to the printMapContextMenu event
    // Params:
    //   callback: function(event) where event = object (has .latLng properties)
    
    let eventListener;
    const callCallback = function(e) {
        if(typeof callback === "function") {
            callback(e);
        }
    };
    const callCallbackBound = callCallback.bind(this);
    
    eventListener = google.maps.event.addListener(this.map, "click", callCallbackBound);
    return eventListener;
}

GameMap.prototype.removeOnClick = function(eventListener) {
    // Params:
    //  eventListener: google.maps.event EventListener

    google.maps.event.removeListener(eventListener);
}