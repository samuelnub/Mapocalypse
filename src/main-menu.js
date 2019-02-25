(() => {
    const remote = require("electron").remote;
    const consts = require("./consts.js");
    const helpers = require("./helpers.js");
    const fs = require("fs");
    const path = require("path");

    const maxPlayerNameLength = 32;
    const playersFilepath = "../data/players.json";

    document.getElementById("btn-start").addEventListener("click", (e) => {
        let playerName = document.getElementById("playername-input").value;
        playerName = helpers.sanitizeInput(playerName, maxPlayerNameLength);

        let players = require(playersFilepath) || {
            active: null, // the active PlayerInfo object
            all: {} // Key: playername, Value: PlayerInfo object
        };
        if(!players.all.hasOwnProperty(playerName)) {
            players.all[playerName] = helpers.createPlayerInfo(playerName, helpers.uuid()); // The entity ID that will be used
        }
        players.active = players.all[playerName];

        fs.writeFile(path.resolve(__dirname, playersFilepath), JSON.stringify(players), (err) => {
            if(err) {
                throw err;
                return;
            }
            console.log("Wrote the worlds back to the file @ " + playersFilepath);
        });

        remote.getCurrentWindow().loadFile(consts.WEB_FILEPATH + "gui/start-config.html");
    }, false);

    
})();