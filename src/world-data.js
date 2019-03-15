const fs = require("fs");
const helpers = require("./helpers.js");
const app = require("electron").app;
const path = require("path");

const worldDataFormat = {
    name: "name",
    id: "id",
    seed: "seed",
    entities: "entities",
    places: "places"
};
exports.worldDataFormat = worldDataFormat;

exports.WorldData = WorldData;
function WorldData(params) {
    // a struct to instantiate your individual world's info
    // Must be JSON'able (so no functions)
    this.name = (params.hasOwnProperty(worldDataFormat.name) ? params.name : helpers.uuid());
    this.id = (params.hasOwnProperty(worldDataFormat.id) ? params.id : helpers.uuid());
    this.seed = (params.hasOwnProperty(worldDataFormat.seed) ? params.seed : 5318008);
    this.entities = (params.hasOwnProperty(worldDataFormat.entities) ? params.entities : {});
    this.places = (params.hasOwnProperty(worldDataFormat.places) ? params.places : {});
}

exports.WorldsManager = WorldsManager;
// A manager for loading/saving/removing world data
function WorldsManager(server) {
    // Params:
    //  server: server instance
    this.worldsFilepath = "../data/worlds.json";
    this.worlds = require(this.worldsFilepath) || {};
    
}

WorldsManager.prototype.create = function(params)
{
    // Follow the params of the WorldData structure
    if(this.worlds.hasOwnProperty(params[worldDataFormat.name])) {
        console.log("World " + params[worldDataFormat.name] + " already exists!");
        params[worldDataFormat.name] += "0";
    }
    this.worlds[params[worldDataFormat.name]] = new WorldData(params);
    return this.worlds[params[worldDataFormat.name]]; // key: worldName, value: worldData (with name too)
};

WorldsManager.prototype.get = function(worldName) {
    // Params:
    //  worldName: string of the worldname world you want. Will throw error if can't find it
    if(this.worlds.hasOwnProperty(worldName)) {
        return this.worlds[worldName];
    }
    throw "World doesn't exist!";
};

WorldsManager.prototype.list = function() {
    // Just lists the keys (worldnames) in this.worlds, as an array
    return Object.keys(this.worlds);
}

WorldsManager.prototype.set = function(worldData) {
    // Used for saving before writing to file
    // Params:
    //  worldData: WorldData instance that you want to save
    if(this.worlds.hasOwnProperty(worldData.name)) {
        this.worlds[worldData.name] = worldData;
        return;
    }
    throw "World doesn't exist!";
}

WorldsManager.prototype.delete = function(worldName) {
    // Params:
    //  worldName: string of the world you want to delete
    delete this.worlds[worldName];
};

WorldsManager.prototype.writeToFile = function() {
    helpers.writeToFile(this.worldsFilepath, this.worlds);
};