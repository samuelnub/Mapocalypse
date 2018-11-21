(() => {
    const ioClient = require("socket.io-client");
    const remote = require("electron").remote;
    const consts = require("./consts");

    let newBtn = document.getElementById("new-btn");
    newBtn.addEventListener("click", (e) => {
        remote.getGlobal(consts.GLOBAL_NAMES.SERVER).listen(3000);
    }, false);


})();