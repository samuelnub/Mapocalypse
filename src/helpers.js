const locale = require("../data/localisation").locale;
const consts = require("./consts");
const fs = require("fs");
const path = require("path");

exports.createPlayerInfo = createPlayerInfo;
function createPlayerInfo(name, uuid) {
    return {
        name: name,
        uuid: uuid || uuid()
    };
}

exports.getActivePlayerInfo = getActivePlayerInfo;
function getActivePlayerInfo() {
    try {
        // not very efficient but hey
        return require("electron").remote.getGlobal(consts.GLOBAL_NAMES.ACTIVE_PLAYER_INFO);
    }
    catch {
        console.log("Unable to get the active player info");
        return null;
    }
}

exports.getGoogleMapsAPIKey = getGoogleMapsAPIKey;
function getGoogleMapsAPIKey() {
    try {
        return require("../data/keys.json").googleMapsAPI[0];
    }
    catch {
        console.log("Unable to get the Google Maps API key");
        return null;
    }
}

exports.getGoogleMapsAPIKeysArchived = getGoogleMapsAPIKeysArchived;
function getGoogleMapsAPIKeysArchived() {
    // gets the array of older keys ([0] is the current key)
    try {
        return require("../data/keys.json").googleMapsAPI;
    }
    catch {
        console.log("Unable to get the Google Maps API keys archive");
        return null;
    }
}

exports.writeNewGoogleMapsAPIKey =writeNewGoogleMapsAPIKey;
function writeNewGoogleMapsAPIKey(newKey) {
    // Will save the old ones to a limit just in case
    if(newKey === getGoogleMapsAPIKey()) {
        return; // don't make redundant copies
    }
    let keysPath = "../data/keys.json";
    let keys = require(keysPath);
    let keyTitle = "googleMapsAPI";
    keys[keyTitle].unshift(newKey);
    if(keys[keyTitle].length > 10) {
        delete keys[keyTitle][keys[keyTitle].length-1];
    }

    const path = require("path");
    writeToFile(path.resolve(__dirname, keysPath), keys, (err) => {
        if(err) {
            console.log(err);
        }
    });
}

exports.createGameLoadInfo = createGameLoadInfo;
function createGameLoadInfo(address, worldName, seed) {
    // This class helps store game initialisation info in the global setting so that
    // the game window can read it from the start-config screen
    // Do not change variables - only get() them
    // params:
    //  address: string (The address you want to connect to)
    //  worldName: string (leave to an empty string if its either a new world or external)
    //  seed: optional number to provide

    let tempAddress = address; // includes the port
    let tempPort = address.split(":")[address.split(":").length-1];
    let tempIsLocal = address.indexOf(consts.LOCALHOST_ADDRESS) !== -1;
    let tempWorldName = (tempIsLocal ? worldName : "");
    let tempSeed = (typeof seed == "number" ? seed : consts.DEFAULT_SEED);

    return {
        address: tempAddress,
        port: tempPort,
        isLocal: tempIsLocal,
        worldName: tempWorldName,
        seed: tempSeed
    };
}

exports.createChatPacket = createChatPacket;
function createChatPacket(idFrom, text, idTo) {
    // A wrapped up factory for chat messages
    // Params:
    //  idFrom: string socket.id that's the sender
    //  text: string message
    //  idTo: optional string socket.id that's the receiver (optional if it was a global public chat)
    return {
        idFrom: idFrom,
        text: text,
        idTo: idTo
    };
}

exports.createWaypointInfo = createWaypointInfo;
function createWaypointInfo(clickEvent, actions, entity) {
    // A wrapped up factory for the details that they waypoint class emits
    // when a selection's been made, usually for the GUI class to pick up and render
    // Params:
    //  clickEvent: the click event that was emitted that the waypoint class picked up
    //  actions: an array of waypointActions that can be executed (or that the gui will render as buttons)
    //  entity: the optional entity that was clicked (not given if the waypoint is on the map itself)
    return {
        clickEvent: clickEvent || null,
        actions: (Array.isArray(actions) ? actions : []),
        entity: entity || null
    }
}

exports.createWaypointAction = createWaypointAction;
function createWaypointAction(title, action) {
    // An action used by entities/waypoint/gui to... do things
    // Params:
    //  title: string name of the action
    //  action: function(entity), with entity being optional - the entity it's acting upon

    return {
        title: title,
        action: (typeof action == "function" ? action : () => {
            console.log("Undefined waypoint action");
        })
    };
}

exports.getFirstKey = getFirstKey;
function getFirstKey(obj) {
    return Object.keys(obj)[0];
}

exports.getFirstKeysValue = getFirstKeysValue;
function getFirstKeysValue(obj) {
    return obj[getFirstKey(obj)];
}

exports.sanitizeInput = sanitizeInput;
function sanitizeInput(message, charLimit) {
    if (typeof message == "object") {
        message = JSON.stringify(message);
    }
    if (typeof message != "object" && typeof message != "string") {
        return "Hey, someone tried to sanitize some hogwash.";
    }
    if (message.length == 0 || message == "undefined") {
        message = locale.general.unavailable;
    }
    if (charLimit) {
        message.slice(0, charLimit);
    }
    return message.replace(/</g, "&lt;"); // TODO: either whitelist acceptable formatting tags, or blacklist bad ones
    // (?!b|\/b|em|\/em|i|\/i|small|\/small|strong|\/strong|sub|\/sub|sup|\/sup|ins|\/ins|del|\/del|mark|\/mark|a|\/a|img|\/img|li|\/li|h|\/h|p|\/p|tt|\/tt|code|\/code|br|\/br|video|\/video|source|\/source)
}

exports.sanitizeAddress = sanitizeAddress;
function sanitizeAddress(address) {
    // ipv4 and ipv6 compatible!
    var ipRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
    if(!ipRegex.test(address)) {
        return consts.LOCALHOST_ADDRESS;
    }
    return address;
}

exports.sanitizePort = sanitizePort;
function sanitizePort(port) {
    if(port != parseInt(port, 10)) {
        port = consts.DEFAULT_PORT;
    }
    else if(port < 0 || port > 65535) {
        port = consts.DEFAULT_PORT;
    }
    return port;
}

exports.writeToFile = writeToFile;
function writeToFile(relativePath, obj, callback) {
    // Params:
    //  relativePath: string to the relative data path (usually json), eg ../data/players.json
    //  obj: object to stringify and then write to file
    //  callback: Optional callback with the error (will not pass anything if there was no error)
    fs.writeFile(path.resolve(__dirname, relativePath), JSON.stringify(obj), (err) => {
        if(typeof callback == "function") {
            if(err) {
                console.log(err + "Occurred whilst trying to write to file " + relativePath);
                if(typeof callback == "function") {
                    callback(err);
                }
            }
            else {
                console.log("Successfully wrote to file " + relativePath);
                if(typeof callback == "function") {
                    callback();
                }
            }
        }
    });
}

exports.createButton = createButton;
function createButton(text, callback) {
    /*
    Mostly for use within the console (make sure you disable
    sanitization when you writeline())
    text = string
    callback function:
        button element that was clicked
    returns a butt-on lol
    */
    let butt = document.createElement("button");
    butt.innerHTML = text;
    butt.addEventListener("click", function(e) {
        if(typeof callback === "function") {
            callback(butt);
        }
    });
    return butt;
}

exports.distBetweenLatLngKm = distBetweenLatLngKm;
function distBetweenLatLngKm(pos1, pos2) {
    let lat1 = pos1.lat;
    let lon1 = pos1.lng;
    let lat2 = pos2.lat;
    let lon2 = pos2.lng;

    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km

    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }
    return d;
}

exports.uuid = uuid;
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

exports.randInt = randInt;
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}