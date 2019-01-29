(() => {
    const consts = require("./consts");
    const remote = require("electron").remote;
    const ipc = require("electron").ipcRenderer;
    const io = require("socket.io-client");

    const gameLoadInfo = remote.getGlobal(consts.GLOBAL_NAMES.GAME_LOAD_INFO);
    remote.getGlobal(consts.GLOBAL_NAMES.CLEAR_GAME_LOAD_INFO)();

    console.log(JSON.stringify(gameLoadInfo));

    let gameData = null;
    if(gameLoadInfo.isLocal) {
        remote.getGlobal(consts.GLOBAL_NAMES.SERVER).listen(gameLoadInfo.port);
        window.addEventListener("beforeunload", (e) => {
            remote.getGlobal(consts.GLOBAL_NAMES.SERVER).close();
        });
    }
    let ioClient = io.connect(consts.HTTP_PREFIX + gameLoadInfo.address);
    
    ioClient.on(consts.IO_EVENTS.HERES_GAME_DATA_STC, (gameData) => {

    });
})();
