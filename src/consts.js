exports.WEB_FILEPATH = __dirname + "/";

exports.MAIN_MENU_WIDTH = 800;
exports.MAIN_MENU_HEIGHT = 600;

exports.LOCALHOST_ADDRESS = "localhost";
exports.HTTP_PREFIX = "http://";
exports.DEFAULT_PORT = 4690;
exports.GOOGLE_MAPS_API_URL = "https://maps.googleapis.com/maps/api/js?key=";
exports.GOOGLE_MAPS_API_LIBS = "&libraries=places"; // Extra libraries tagged onto the url+key

exports.IPC_EVENTS = {
    // RTM: renderer to main
    // MTR: main to renderer
    GAME_START_LOAD_RTM: "GAME_START_LOAD_RTM",
    GAME_START_LOAD_MTR: "GAME_START_LOAD_MTR"
};

exports.IO_EVENTS = {
    // STC: server to client
    // CTS: client to server
    HERES_GAME_DATA_STC: "HERES_GAME_DATA_STC"
};

exports.GLOBAL_NAMES = {
    SERVER: "MAPOCALYPSE_SERVER",
    GAME_LOAD_INFO: "MAPOCALYPSE_GAME_LOAD_INFO",
    CLEAR_GAME_LOAD_INFO: "MAPOCALYPSE_CLEAR_GAME_LOAD_INFO"
};