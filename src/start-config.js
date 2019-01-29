(() => {
    const consts = require("./consts");
    const remote = require("electron").remote;
    const ipc = require("electron").ipcRenderer;
    const GameLoadInfo = require("./game-load-info").GameLoadInfo;

    // "Load" code
    let loadWorldsSelect = document.getElementById("load-worlds-select");
    let availableWorldNames = remote.getGlobal(consts.GLOBAL_NAMES.SERVER).getAllWorldNames();
    for(name of availableWorldNames) {
        let optionDiv = document.createElement("option");
        optionDiv.innerHTML = name;
        loadWorldsSelect.appendChild(optionDiv);
    }

    // "New" code
    let newBtn = document.getElementById("new-btn");
    newBtn.addEventListener("click", (e) => {
        // TODO: sanitize
        let port = document.getElementById("new-port-input").value;
        ipc.send(consts.IPC_EVENTS.GAME_START_LOAD_RTM, new GameLoadInfo("localhost:" + port, "wobble"))
        
    }, false);
})();