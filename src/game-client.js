const consts = require("./consts");
const helpers = require("./helpers.js");
const remote = require("electron").remote;
const ipc = require("electron").ipcRenderer;
const io = require("socket.io-client");
const locale = require("../data/localisation.js").locale;
const fs = require("fs");
const path = require("path");
const GameMap = require("./game-map.js");

(() => { // This IIFE doesn't need to be here, but it's just nice to segment the code
    const gameLoadInfo = remote.getGlobal(consts.GLOBAL_NAMES.GAME_LOAD_INFO);
    console.log(JSON.stringify(gameLoadInfo) + " is the game load info");
    remote.getGlobal(consts.GLOBAL_NAMES.CLEAR_GAME_LOAD_INFO)();

    if(gameLoadInfo.isLocal) {
        remote.getGlobal(consts.GLOBAL_NAMES.SERVER).listen(gameLoadInfo.port);
        window.addEventListener("beforeunload", (e) => {
            remote.getGlobal(consts.GLOBAL_NAMES.SERVER).close();
        });
    }
    let gameClient = new GameClient(gameLoadInfo);
    window.mapocalypseGameClient = gameClient; // For debugging
})();

exports.GameClient = GameClient;
function GameClient(gameLoadInfo) {
    // This class will only contain the aspects that control the clien't window and help
    // to communicate between this client page and the server
    // Params:
    //  gameLoadInfo: gameLoadInfo instance passed from the main thread
    this.ioClient = io.connect(consts.HTTP_PREFIX + gameLoadInfo.address); 
    this.mainDiv = document.getElementById("main-div");
    this.data = null; // world data

    this.ioClient.on(consts.IO_EVENTS.HERES_GAME_DATA_STC, (data) => {
        gameData = data;
        console.log("Upon loading, this game data was received: " + JSON.stringify(gameData));
    });

    // Injecting the google maps api into the document body
    /*
    function injectGoogleMapsAPI() {
        let googleMapsAPIKey = helpers.getGoogleMapsAPIKey();
        let googleMapsScript = document.getElementById("google-maps-api-script");
        googleMapsScript.src = consts.GOOGLE_MAPS_API_URL + googleMapsAPIKey + consts.GOOGLE_MAPS_API_LIBS;
        console.log("Injected google maps script into the page");
    }
    injectGoogleMapsAPI();

    let mapErrorTimeout = 5000;
    let mapErrorEnterNewKey = function() {
        let newKeyInput = document.createElement("input");
        let keyErrorMsgP = document.createElement("p");
        let getNewKeyURL = "https://developers.google.com/maps/documentation/embed/get-api-key"
        keyErrorMsgP.innerText = "If you're seeing this, Google Maps may not have initialised properly It may be an issue with an invalid key." + "\nPlease go to " + getNewKeyURL + " and insert your own fresh key here:"
        this.mainDiv.appendChild(keyErrorMsgP);
        this.mainDiv.appendChild(newKeyInput);
        this.mainDiv.appendChild(helpers.createButton("Try again", (e) => {
            helpers.writeToFile("../data/keys.js", {
                googleMapsAPI: helpers.sanitizeInput(newKeyInput.value)
            }, (err) => {
                this.mainDiv.innerHTML = "";
                injectGoogleMapsAPI();
                setTimeout(mapErrorEnterNewKey(), mapErrorTimeout);
            });
        }));
    }.bind(this);
    setTimeout(mapErrorEnterNewKey(), mapErrorTimeout);
    */

    // Other main classes
    this.map = new GameMap.GameMap(this);
}

