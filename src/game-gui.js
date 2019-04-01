const consts = require("./consts.js");
const helpers = require("./helpers.js");
const locale = require("../data/localisation.js").locale;

exports.GameGUI = GameGUI;
function GameGUI(gameClient) {
    // A class to render and manage the controls on-screen
    // Refer to ui.css for layout
    // Params:
    //  gameClient: GameClient instance
    this.gameClient = gameClient;

    this.mainGUIBackgroundDiv = document.createElement("div");
    this.mainGUIBackgroundDiv.id = "main-gui-background-div";
    this.gameClient.mainDiv.appendChild(this.mainGUIBackgroundDiv);

    this.mainGUIDiv = document.createElement("div");
    this.mainGUIDiv.id = "main-gui-div";
    this.mainGUIBackgroundDiv.appendChild(this.mainGUIDiv);

    // setup chat window
    this.chatDiv = document.createElement("div");
    this.chatDiv.id = "chat-div";
    this.mainGUIDiv.appendChild(this.chatDiv);

    this.chatLinesDiv = document.createElement("div");
    this.chatLinesDiv.id = "chat-lines-div";
    this.chatDiv.appendChild(this.chatLinesDiv);

    this.chatInput = document.createElement("input");
    this.chatInput.id = "chat-input";
    this.chatDiv.appendChild(this.chatInput);
    const chatMsgCharLimit = 420;
    let ourSendChat = function() {
        if(this.chatInput.value == "") {
            return;
        }
        this.sendChat(helpers.sanitizeInput(this.chatInput.value, chatMsgCharLimit));
        this.chatInput.value = "";
    }.bind(this);
    this.chatInput.addEventListener("keyup", (e) => {
        if (e.keyCode == 13) {
            ourSendChat();
        }
    },false);
    this.chatEnterBtn = helpers.createButton(locale.general.enter, (e) => {
        ourSendChat();
    });
    this.chatEnterBtn.id = "chat-enter-btn";
    this.chatDiv.appendChild(this.chatEnterBtn);

    this.waypointInfoDiv = document.createElement("div");
    this.waypointInfoDiv.id = "waypoint-info-div";
    this.mainGUIDiv.appendChild(this.waypointInfoDiv);

    // Listening for our ioClient receiving a chat message event
    this.gameClient.ioOn(consts.IO_EVENTS.INCOMING_PUBLIC_CHAT_STC, (chatPacket) => {
        if(chatPacket.idFrom == this.gameClient.getOurSocketId()) {
            return;
        }
        this.logChat(
            this.gameClient.getPlayerInfoFromSocketId(chatPacket.idFrom).name,
            chatPacket.text
        );
    });

    this.gameClient.ioOn(consts.IO_EVENTS.NEW_CONNECTED_PLAYER_INFO_STC, (playerPacket) => {
        if(helpers.getFirstKey(playerPacket) == this.gameClient.getOurSocketId()) {
            return;
        }
        this.logChat(
            locale.general.programName,
            helpers.getFirstKeysValue(playerPacket).name + " has connected!",
            true
        );
    });

    this.gameClient.ioOn(consts.IO_EVENTS.NEW_DISCONNECTED_PLAYER_INFO_STC, (playerPacket) => {
        this.logChat(
            locale.general.programName,
            helpers.getFirstKeysValue(playerPacket).name + " has disconnected!",
            true
        );
    });

    // Client-events to listen for
    this.gameClient.on(consts.CLIENT_EVENTS.WAYPOINT_SELECTION_INFO, (waypointInfo) => {
        this.waypointInfoDiv.innerHTML = "";
        let titleP = document.createElement("p");
        if(waypointInfo.entity != null) {
            titleP.innerText = (waypointInfo.entity.type === consts.ENTITY_TYPES.PLAYER ? this.gameClient.getPlayerInfoFromUUID(waypointInfo.entity.uuid).name : locale.waypoint.entity) + locale.general.at;
            titleP.appendChild(waypointInfo.entity.positionEle);

            let healthTitleEle = document.createElement("span");
            healthTitleEle.innerText = "\n" + locale.waypoint.healthTitle;
            titleP.appendChild(healthTitleEle);
            titleP.appendChild(waypointInfo.entity.healthEle);

            let staminaTitleEle = document.createElement("span");
            staminaTitleEle.innerText = "\n" + locale.waypoint.staminaTitle;
            titleP.appendChild(staminaTitleEle);
            titleP.appendChild(waypointInfo.entity.staminaEle);

            let experienceTitleEle = document.createElement("span");
            experienceTitleEle.innerText = "\n" + locale.waypoint.experienceTitle;
            titleP.appendChild(experienceTitleEle);
            titleP.appendChild(waypointInfo.entity.experienceEle);
        }
        else {
            titleP.innerText = locale.waypoint.selectionAt + waypointInfo.clickEvent.latLng.lat().toFixed(4) + "," + waypointInfo.clickEvent.latLng.lng().toFixed(4);
        }
        this.waypointInfoDiv.appendChild(titleP);
        let actions = waypointInfo.actions;
        for(action of actions) {
            this.waypointInfoDiv.appendChild(helpers.createButton(
                action.title,
                action.action
            ))
        }
    })

    console.log("GameGUI initialised!");
}

GameGUI.prototype.logChat = function(title, text, isAdmin) {
    // A general function to put a message in the chat list
    // good for logging.
    // returns the div
    // Params:
    //  title: string of the header of the message (usually the sender name)
    //  text: string message.
    //  isAdmin: bool, if true, title will be red
    let chatMsgDiv = document.createElement("div");
    chatMsgDiv.classList.add("chat-msg-div");

    chatMsgDiv.innerHTML = "<p" + (isAdmin != null && isAdmin == true ? " style=\"color:var(--solid-red)\"" : "") + ">" + helpers.sanitizeInput(title) + "</p><p>" + helpers.sanitizeInput(text) + "</p>";
    this.chatLinesDiv.appendChild(chatMsgDiv);

    this.chatLinesDiv.scrollTop = this.chatLinesDiv.scrollHeight;

    return chatMsgDiv;
}

GameGUI.prototype.sendChat = function(text, to) {
    // Send a chat to the chat div and possibly to others.
    // Params:
    //  text: string you want to send to chat (will not sanitize here! sanitize it yourself.)
    //  to: var: optional. String: socket.id to private message to (TODO)
    if (to == null || typeof to != "string") {
        // TODO: send to others
        this.logChat(this.gameClient.getOurPlayerInfo().name, text);
        this.gameClient.ioEmit(consts.IO_EVENTS.SEND_PUBLIC_CHAT_CTS, helpers.createChatPacket(
            this.gameClient.getOurSocketId(),
            text,
            to // redundant really
        ));
    }
    else if (typeof to == "string") {
        this.logChat();
    }
}