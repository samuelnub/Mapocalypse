const consts = require("./consts.js");
const helpers = require("./helpers.js");

exports.GameGUI = GameGUI;
function GameGUI(gameClient) {
    // A class to render and manage the controls on-screen
    // Refer to ui.css for layout
    // Params:
    //  gameClient: GameClient instance
    this.gameClient = gameClient;

    this.mainGUIDiv = document.createElement("div");
    this.mainGUIDiv.id = "main-gui-div";
    this.gameClient.mainDiv.appendChild(this.mainGUIDiv);

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
        this.sendChat(helpers.sanitizeInput(this.chatInput.value, chatMsgCharLimit));
        this.chatInput.value = "";
        this.chatLinesDiv.scrollTop = this.chatLinesDiv.scrollHeight;
    }.bind(this);
    this.chatInput.addEventListener("keyup", (e) => {
        if (e.keyCode == 13) {
            ourSendChat();
        }
    },false);
    this.chatEnterBtn = helpers.createButton("Enter", (e) => {
        ourSendChat();
    });
    this.chatEnterBtn.id = "chat-enter-btn";
    this.chatDiv.appendChild(this.chatEnterBtn);

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

    console.log("GameGUI initialised!");
}

GameGUI.prototype.logChat = function(title, text) {
    // A general function to put a message in the chat list
    // good for logging.
    // returns the div
    // Params:
    //  title: string of the header of the message (usually the sender name)
    //  text: string message.
    let chatMsgDiv = document.createElement("div");
    chatMsgDiv.classList.add("chat-msg-div");

    chatMsgDiv.innerHTML = "<p>" + helpers.sanitizeInput(title) + "</p><p>" + helpers.sanitizeInput(text) + "</p>";
    this.chatLinesDiv.appendChild(chatMsgDiv);

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