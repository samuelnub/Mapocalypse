const consts = require("./consts");

exports.GameLoadInfo = GameLoadInfo;
function GameLoadInfo(address, worldName) {
    // This class helps store game initialisation info in the global setting so that
    // the game window can read it from the start-config screen
    // Do not change variables - only get() them
    // params:
    //      address: string (The address you want to connect to)
    //      worldName: string (leave to an empty string if its either a new world or external)

    this.address = address; // includes the port
    this.port = this.address.split(":")[this.address.split(":").length-1];
    this.isLocal = address.indexOf(consts.LOCALHOST_ADDRESS) !== -1;
    this.worldName = (this.isLocal ? worldName : "");
}