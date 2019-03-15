const locale = require("../data/localisation").locale;
const consts = require("./consts");
const fs = require("fs");
const path = require("path");

exports.draggableElement = draggableElement;
function draggableElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "-header")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(elmnt.id + "-header").onmousedown = dragMouseDown;
    } else {
        /* otherwise, move the DIV from anywhere inside the DIV:*/
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

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
        return require("../data/keys.json").googleMapsAPI;
    }
    catch {
        console.log("Unable to get the Google Maps API key");
        return null;
    }
}

exports.createGameLoadInfo = createGameLoadInfo;
function createGameLoadInfo(address, worldName) {
    // This class helps store game initialisation info in the global setting so that
    // the game window can read it from the start-config screen
    // Do not change variables - only get() them
    // params:
    //      address: string (The address you want to connect to)
    //      worldName: string (leave to an empty string if its either a new world or external)

    let tempAddress = address; // includes the port
    let tempPort = address.split(":")[address.split(":").length-1];
    let tempIsLocal = address.indexOf(consts.LOCALHOST_ADDRESS) !== -1;
    let tempWorldName = (tempIsLocal ? worldName : "");

    return {
        address: tempAddress,
        port: tempPort,
        isLocal: tempIsLocal,
        worldName: tempWorldName
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
    // Taken from https://stackoverflow.com/questions/23483855/javascript-regex-to-validate-ipv4-and-ipv6-address-no-hostnames
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
    // From https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula

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
    // v4, from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
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

exports.copyToClipboard = copyToClipboard;
function copyToClipboard(text) {
    var textArea = document.createElement("textarea");
    // Obtained from https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //
  
    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
  
    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';
  
    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;
  
    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
  
    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';
  
  
    textArea.value = text;
  
    document.body.appendChild(textArea);
  
    textArea.select();
  
    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      console.log('Copying text command was ' + msg);
    } catch (err) {
      console.log('Oops, unable to copy');
    }
  
    document.body.removeChild(textArea);
  }