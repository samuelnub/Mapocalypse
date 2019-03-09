const helpers = require("./helpers.js");
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
        center: new google.maps.LatLng(53.551458, -1.923063),
        zoom: 8,
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
    // Params object:
    //  position: {lat:num,lng:num} or google.maps.LatLng() position
    //  id: string (entity most likely)
    //  icon: string (just the icon name from ./data/icons/)
    //  title: string tooltip, entity/playername
    //  onClickCallback: function(event), with event containing click event info (+latLng!)
    //  animDuration: (optional) purely visual - how long the animation duration should be

    let marker = new SlidingMarker({
        position: params.position || new google.maps.LatLng(0,0),
        icon: {
            url: locale.files.iconsPath + (params.icon ? params.icon : locale.files.icons.unknown) + locale.files.iconFiletype
        },
        title: params.title || locale.general.nothing,
        map: this.map
    });
    marker.id = params.id || helpers.uuid();
    if(typeof params.onClickCallback == "function") {
        marker.addListener("click", () => {
            params.onClickCallback(e);
        });
    }
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