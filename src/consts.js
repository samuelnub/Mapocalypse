exports.WEB_FILEPATH = __dirname + "/";

exports.MAIN_MENU_WIDTH = 800;
exports.MAIN_MENU_HEIGHT = 600;

exports.LOCALHOST_ADDRESS = "localhost";
exports.HTTP_PREFIX = "http://";
exports.DEFAULT_PORT = 4690;
exports.DEFAULT_SEED = 8008135;
exports.GOOGLE_MAPS_API_URL = "https://maps.googleapis.com/maps/api/js?key=";
exports.GOOGLE_MAPS_API_LIBS = "&libraries=places"; // Extra libraries tagged onto the url+key

exports.IPC_EVENTS = {
    // RTM: renderer to main
    // MTR: main to renderer
    HERES_ACTIVE_PLAYER_INFO_RTM: "HERES_ACTIVE_PLAYER_INFO_RTM",
    GAME_START_LOAD_RTM: "GAME_START_LOAD_RTM",
    GAME_START_LOAD_MTR: "GAME_START_LOAD_MTR"
};

exports.IO_EVENTS = {
    // STC: server to client
    // CTS: client to server
    HERES_GAME_DATA_STC: "HERES_GAME_DATA_STC",
    HERES_CONNECTED_PLAYER_INFOS_STC: "HERES_CONNECTED_PLAYER_INFOS_STC",
    HERES_MY_PLAYER_INFO_CTS: "HERES_MY_PLAYER_INFO_CTS",
    NEW_CONNECTED_PLAYER_INFO_STC: "NEW_CONNECTED_PLAYER_INFO_STC",
    NEW_DISCONNECTED_PLAYER_INFO_STC: "NEW_DISCONNECTED_PLAYER_INFO_STC",
    SEND_PUBLIC_CHAT_CTS: "SEND_PUBLIC_CHAT_CTS",
    INCOMING_PUBLIC_CHAT_STC: "INCOMING_CHAT_STC",
    REQUEST_ENTITY_INFOS_CTS: "REQUEST_ENTITY_INFOS_CTS",
    HERES_ENTITY_INFOS_STC: "HERES_ENTITY_INFOS_STC",
    NEW_ENTITY_INFO_CTS: "NEW_ENTITY_INFO_CTS",
    NEW_ENTITY_INFO_STC: "NEW_ENTITY_INFO_STC",
    DEAD_ENTITY_INFO_CTS: "DEAD_ENTITY_INFO_CTS",
    DEAD_ENTITY_INFO_STC: "DEAD_ENTITY_INFO_STC",
    IS_POS_WATER_CTS: "IS_POS_WATER_CTS",                   // data given: position: { lat:num, lng:num }
    IS_POS_WATER_STC: "IS_POS_WATER_STC",                   // data given: true/false
    ENTITY_MOVE_CTS: "ENTITY_MOVE_CTS",                     // data given: entityNewPos: { uuid: entity uuid, position: { lat:num, lng:num }}
    ENTITY_MOVE_STC: "ENTITY_MOVE_STC",                     // data given: entityNewPos: { uuid: entity uuid, position: { lat:num, lng:num }, err: string/null }
    ENTITY_HEALTH_CHANGE_CTS: "ENTITY_HEALTH_CHANGE_CTS",   // data given: entityHealthChange { uuidAffector: entity uuid, uuidAffectee: entity uuid, healthChange: num }
    ENTITY_HEALTH_CHANGE_STC: "ENTITY_HEALTH_CHANGE_STC"    // data given: entityHealthChange { uuid: entity uuid, healthChange: num, err: string/null }
};

exports.CLIENT_EVENTS = {
    // Prefix with emitter's class name
    ENTITY_CREATED: "ENTITY_CREATED", // passes entity uuid
    WAYPOINT_SELECTION_INFO: "WAYPOINT_SELECTION_INFO"
};

exports.ENTITY_TYPES = {
    PLAYER: "PLAYER",
    ENEMY: "ENEMY",
    UNKNOWN: "UNKNOWN"
};

exports.ICON_NAMES = {
    PLAYER: "player",
    ENEMY: "enemy",
    UNKNOWN: "unknown",
    WAYPOINT: "waypoint",
    GOAL: "goal",
    TROPHY: "trophy"
};

exports.GLOBAL_NAMES = {
    ACTIVE_PLAYER_INFO: "MAPOCALYPSE_ACTIVE_PLAYER_INFO",
    SERVER: "MAPOCALYPSE_SERVER",
    GAME_LOAD_INFO: "MAPOCALYPSE_GAME_LOAD_INFO",
    CLEAR_GAME_LOAD_INFO: "MAPOCALYPSE_CLEAR_GAME_LOAD_INFO"
};