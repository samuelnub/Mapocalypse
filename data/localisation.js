const locale = {
    /*
    Strings for every string that appears in the game/webpage (except the warning lmao)
    structure:
    locales: object
        language: object
            class (camelCase): object
                stringName: string (if it's a Documentation, prefix it with doc
                and suffix with Cmd/Args (array of strings)/Desc)
                ...
            ...
        ...
    */
    entities: {
        player: "Player",
        enemy: "Enemy",
        unknown: "Unknown"
    },
    icons: { // svg files
        player: "player",
        enemy: "enemy",
        unknown: "unknown",
        waypoint: "waypoint",
        goal: "goal",
        trophy: "trophy"
    },
    waypoint: {
        placeholder: "Click anywhere on the map to begin!",
        selectionAt: "Selection @",
        actions: {
            general: {
                spawnOurPlayer: "Spawn our player"
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
        noThatsTooFar: "Nope, that's too far!"
    },
    styling: {
        brTag: "<br>",
        specialClass: "special",
    }
};
exports.locale = locale;