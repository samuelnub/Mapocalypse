const locale = {
    /*
    Strings for every string that appears in the game/webpage (except the warning lmao)
    structure:
    locales: object
        class (camelCase): object
            stringName: string (if it's a Documentation, prefix it with doc
            and suffix with Cmd/Args (array of strings)/Desc)
            ...
        ...
    */
    waypoint: {
        placeholder: "Click anywhere on the map to begin!",
        entity: "Entity",
        selectionAt: "Selection @",
        healthTitle: "Health:",
        staminaTitle: "Stamina:",
        experienceTitle: "Experience:",
        actions: {
            general: {
                spawnOurPlayer: "Spawn our player",
                movePlayer: "Move here",
                hurt: "Hurt"
            }
        }
    },
    general: {
        programName: "Mapocalypse",
        console: "Console",
        enter: "Enter",
        copy: "Copy",
        close: "Close",
        placeholder: "Unimplemented",
        unavailable: "[n/a]",
        nothing: "",
        select: "Select",
        selection: "Selection",
        at: "@",
        noThatsWater: "Nope, that's water!",
        noThatsTooFar: "Nope, that's too far!",
        get googleMapsAPIKeyInvalidP() {
            return [
                "An error occurred when loading Google Maps...",
                "Either your device isn't connected to the internet",
                "or Google Map's API isn't working for you.",
                "You could try using a new API key. Go to:",
                "https://developers.google.com/maps/documentation/javascript/get-api-key",
                "to get a new key, and then paste it in the text box below, then",
                "override the current key, and close this window and try reconnecting."
            ].join("\n");
        }
    },
    gui: {
        chatInputPlaceholder: "Enter chat message...",
        playerHasConnected: " has connected!",
        playerHasDisconnected: " has disconnected!"
    },
    mainMenu: {
        get titleH1() {
            return locale.general.programName;
        },
        playernameP: "Player name:",
        startBtn: "Start",
        quitBtn: "Quit"
    },
    styling: {
        brTag: "<br>",
        specialClass: "special",
    },
    startConfig: {
        configureH1: "Configure game",
        loadH2: "Load",
        loadDeleteBtn: "Delete",
        loadLoadBtn: "Load",
        newH2: "New",
        newWorldnameP: "World name:",
        newSeedP: "Seed:",
        newDisclaimerP: "If a world with the same name exists already, the existing world will be loaded instead.",
        newBtn: "Start",
        connectH2: "Connect",
        connectAddressP: "Address:",
        connectPortP: "Port:",
        connectBtn: "Connect",
        settingsH2: "Settings",
        settingsPortHostP: "Port when hosting:",
        settingsGoogleMapsAPIKeyP: "Google Maps API Key:",
        settingsGoogleMapsAPIKeyBtn: "Save"
    }
};
exports.locale = locale;