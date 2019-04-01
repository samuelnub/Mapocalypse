const helpers = require("./helpers");
const consts = require("./consts.js");
const fs = require("fs");
const path = require("path");

exports.Wallpapers = Wallpapers;
function Wallpapers(blur) {
    // A silly little extra class for displaying cool google earth wallpapers
    // taken from https://github.com/limhenry/earthview
    
    this.data = [];
    this.intervalDelay = 10000;

    this.aImg = document.createElement("img");
    this.bImg = document.createElement("img");
    
    this.init(blur);
}

Wallpapers.prototype.init = function(blur) {
    this.aImg.style.position = "fixed";
    this.aImg.style.display = "block";
    this.aImg.style.marginLeft = "auto";
    this.aImg.style.marginRight = "auto";
    this.aImg.style.width = "100%";
    this.aImg.style.height = "100%";
    this.aImg.style.left = "0%";
    this.aImg.style.right = "0%";
    this.aImg.style.top = "0%";
    this.aImg.style.bottom = "0%";
    this.aImg.style.overflow = "hidden";
    this.aImg.style.objectFit = "cover";
    this.aImg.style.backgroundRepeat = "no-repeat";
    this.aImg.style.backgroundPosition = "50% 50%";
    this.aImg.style.zIndex = "-1000";

    this.bImg = this.aImg.cloneNode();
    this.bImg.style.zIndex = "-999";
    this.bImg.style.opacity = "1";
    this.bImg.style.transition = "all " + this.intervalDelay * 0.00025 + "s ease"; // a quarter of the time in s

    if(blur != null) {
        this.setBlur(blur);
    }

    // requiring the wallpapers.json would just be hefty, so do it async
    fs.readFile(path.resolve(__dirname, "../data/wallpapers.json"), "utf8", (err, data) => {
        if(err) {
            console.log("Something went wrong with loading the cool wallpapers");
            console.log(err);
            return;
        }
        this.data = JSON.parse(data);
        document.body.appendChild(this.aImg);
        document.body.appendChild(this.bImg);
        
        this.transition(true);
    });
}

Wallpapers.prototype.transition = function(repeat) {
    const curBOpacity = Number(this.bImg.style.opacity);

    const imgIndex = helpers.randInt(0, this.data.length-1);

    let date = new Date();

    if(curBOpacity == 1) {
        if(date.getMonth() === 3 && date.getDay() === 1) {
            this.aImg.src = "../../data/wallpaperA.jpg";
        }
        else {
            this.aImg.src = consts.HTTP_PREFIX + this.data[imgIndex].imageURL;
        }
        setTimeout(() => {
            this.bImg.style.opacity = "0";
        }, this.intervalDelay * 0.25);
    }
    if(curBOpacity == 0) {
        if(date.getMonth() === 3 && date.getDay() === 1) {
            this.bImg.src = "../../data/wallpaperB.jpg";
        }
        else {
            this.bImg.src = consts.HTTP_PREFIX + this.data[imgIndex].imageURL;
        }
        setTimeout(() => {
            this.bImg.style.opacity = "1";
        }, this.intervalDelay * 0.25);
    }

    if(repeat) {
        setTimeout(() => {
            this.transition(true);
        }, this.intervalDelay)
    }
}

Wallpapers.prototype.setBlur = function(pixels) {
    this.aImg.style.filter = "blur(" + pixels + "px)";
    this.bImg.style.filter = "blur(" + pixels + "px)";
}