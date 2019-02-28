

exports.GameMap = GameMap;
function GameMap(gameClient) {
    // This class will manage the rendering of the map onto the client's screen
    // Plus all entity renderings and other bits and bobs
    // Params:
    //  gameClient: GameClient instance
    this.gameClient = gameClient

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
}