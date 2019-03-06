exports.Game = Game;
function Game(server) {
    // Params: 
    //  Server: server instance that it's linked to
    this.server = server;
    this.data = null; // Game data

}

Game.prototype.setGameData = function(worldData) {
    // This is the distinction between world data and game data - the game version is the current live one.
    // Will throw error if this.data isn't null
    // Params:
    //  worldData: WorldData instance to load in
    if(this.data == null) {
        this.data = worldData;
        return;
    }
    throw "Don't override game data!";
}

Game.prototype.getGameData = function() {
    // Will return null if not set yet
    return this.data;
}

Game.prototype.unsetGameData = function() {
    // Resets game data (when no game is being hosted anymore)
    this.data = null;
}