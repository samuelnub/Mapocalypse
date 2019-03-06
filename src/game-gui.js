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
    this.chatEnterBtn = helpers.createButton("Enter", (e) => {
        this.sendChat(helpers.sanitizeInput(this.chatInput.value, chatMsgCharLimit), true);
    });
    this.chatEnterBtn.id = "chat-enter-btn";
    this.chatDiv.appendChild(this.chatEnterBtn);

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

    let logChat = function() {
        chatMsgDiv.innerHTML = "<p>" + helpers.sanitizeInput(title) + "</p><p>" + helpers.sanitizeInput(text) + "</p>";
        this.chatLinesDiv.appendChild(chatMsgDiv);
    }.bind(this);

    return chatMsgDiv;
}

GameGUI.prototype.sendChat = function(text, to) {
    // Send a chat to the chat div and possibly to others.
    // Params:
    //  text: string you want to send to chat (will not sanitize here! sanitize it yourself.)
    //  to: var: false=to self (good for error logging), true=to everyone, string=id to an existing socket

    if (typeof to == "boolean" && to === true) {
        // TODO: send to others
        this.logChat();
    }
    else if (typeof to == "boolean" && to === false) {
        this.logChat();
    }
    else if (typeof to == "string") {
        this.logChat();
    }
}