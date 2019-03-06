(() => {
    const remote = require("electron").remote;
    const consts = require("./consts.js");
    const helpers = require("./helpers.js");
    const ipc = require("electron").ipcRenderer;

    const maxPlayerNameLength = 32;
    const playersFilepath = "../data/players.json";

    document.getElementById("start-btn").addEventListener("click", (e) => {
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
        
        ipc.send(consts.IPC_EVENTS.HERES_ACTIVE_PLAYER_INFO_RTM, players.active);
        helpers.writeToFile(playersFilepath, players);

        remote.getCurrentWindow().loadFile(consts.WEB_FILEPATH + "gui/start-config.html");
    }, false);

    document.getElementById("quit-btn").addEventListener("click", (e) => {
        console.log("Quitting...");
        remote.app.quit();
    }, false);
})();