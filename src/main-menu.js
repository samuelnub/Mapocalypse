const remote = require("electron").remote;
const consts = require("./consts.js");

(() => {
    document.getElementById("btn-start").addEventListener("click", (e) => {
        remote.getCurrentWindow().loadFile(consts.WEB_FILEPATH + "gui/start-config.html");
    }, false);

        
})();