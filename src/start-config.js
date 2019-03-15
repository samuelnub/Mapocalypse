(() => {
    const consts = require("./consts");
    const remote = require("electron").remote;
    const ipc = require("electron").ipcRenderer;
    const helpers = require("./helpers.js");

    const Wallpapers = require("./wallpapers.js");
    let wallpapers = new Wallpapers.Wallpapers(0);

    const locale = require("../data/localisation.js").locale;
    document.getElementById("configure-h1").innerText = locale.startConfig.configureH1;
    document.getElementById("load-h2").innerText = locale.startConfig.loadH2;
    document.getElementById("load-port-p").innerText = locale.startConfig.loadPortP;
    document.getElementById("load-delete-btn").innerText = locale.startConfig.loadDeleteBtn;
    document.getElementById("load-load-btn").innerText = locale.startConfig.loadLoadBtn;
    document.getElementById("new-h2").innerText = locale.startConfig.newH2;
    document.getElementById("new-worldname-p").innerText = locale.startConfig.newWorldnameP;
    document.getElementById("new-port-p").innerText = locale.startConfig.newPortP;
    document.getElementById("new-disclaimer-p").innerText = locale.startConfig.newDisclaimerP;
    document.getElementById("new-btn").innerText = locale.startConfig.newBtn;
    document.getElementById("connect-h2").innerText = locale.startConfig.connectH2;
    document.getElementById("connect-address-p").innerText = locale.startConfig.connectAddressP;
    document.getElementById("connect-port-p").innerText = locale.startConfig.connectPortP;
    document.getElementById("connect-btn").innerText = locale.startConfig.connectBtn;

    // "Load" code
    let loadWorldsSelect = document.getElementById("load-worlds-select");
    function updateLoadWorldsSelect() {
        loadWorldsSelect.innerHTML = "";
        let availableWorldNames = remote.getGlobal(consts.GLOBAL_NAMES.SERVER).getAllWorldNames();
        for (name of availableWorldNames) {
            let optionDiv = document.createElement("option");
            optionDiv.innerHTML = name;
            loadWorldsSelect.appendChild(optionDiv);
        }
    }
    updateLoadWorldsSelect();
    let loadDeleteBtn = document.getElementById("load-delete-btn");
    let loadLoadBtn = document.getElementById("load-load-btn");
    try {
        loadDeleteBtn.addEventListener("click", (e) => {
            let selectedWorldName = loadWorldsSelect.options[loadWorldsSelect.selectedIndex].value;
            remote.getGlobal(consts.GLOBAL_NAMES.SERVER).deleteWorld(selectedWorldName);
            updateLoadWorldsSelect();
        }, false);
        loadLoadBtn.addEventListener("click", (e) => {
            let port = document.getElementById("load-port-input").value;
            ipc.send(consts.IPC_EVENTS.GAME_START_LOAD_RTM, helpers.createGameLoadInfo(consts.LOCALHOST_ADDRESS + ":" + helpers.sanitizePort(port), loadWorldsSelect.options[loadWorldsSelect.selectedIndex].value));
        }, false);
    }
    catch {
        console.log("No world was selected to load/delete");
    }

    // "New" code
    const maxWorldNameLength = 64;
    let newBtn = document.getElementById("new-btn");
    newBtn.addEventListener("click", (e) => {
        let port = document.getElementById("new-port-input").value;
        let worldName = document.getElementById("new-worldname-input").value;
        ipc.send(consts.IPC_EVENTS.GAME_START_LOAD_RTM, helpers.createGameLoadInfo(consts.LOCALHOST_ADDRESS + ":" + helpers.sanitizePort(port), helpers.sanitizeInput(worldName, maxWorldNameLength)));

    }, false);

    // "Connect" code
    let connectBtn = document.getElementById("connect-btn");
    connectBtn.addEventListener("click", (e) => {
        let connectAddress = document.getElementById("connect-address-input").value;
        let connectPort = document.getElementById("connect-port-input").value;
        ipc.send(consts.IPC_EVENTS.GAME_START_LOAD_RTM, helpers.createGameLoadInfo(helpers.sanitizeAddress(connectAddress) + ":" + helpers.sanitizePort(connectPort))); // Don't need worldname obvs
    }, false);
})();