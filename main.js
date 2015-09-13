"use strict"

var c = $("#main-canvas")[0];
var ctx = c.getContext("2d");

var territories = [];
var civilizations = [];
var colors = ["#a2b4ee", "#a2e0da", "#e0e7cd", "#f1daf5", "#d8bcf0", "#BB998B", "#9dc6a6",
    "#f3afd2", "#cacfdf", "#ddf7ad", "#fbf79d", "#a7ae95", "#f5b9ac", "#d9d5a3", "#fba6b2",
    "#8cd8f5", "#d992d3", "#93d79c", "#8ce5d4", "#e788d9", "#f3a2d2", "#c8dba7", "#868ad8",
    "#9bbada", "#b87feb"
];

var focused = true;

var year = 1;

var selectedCiv = -1;
var selectedTerr = -1;

var lastEvent = 0;

var worldName = getRandomTerrName();

var running = true;

const FPS = 20;

/*--------------Helper Functions----------------*/

//Converts RGB to Hex
//If parameters are empty, generate random color
function color(r, g, b) {
    r = r || (Math.floor(Math.random() * 127) + 127);
    g = g || (Math.floor(Math.random() * 127) + 127);
    b = b || (Math.floor(Math.random() * 127) + 127);
    return "#" + r.toString(16) + g.toString(16) + b.toString(16);
}

//Converts a number to a string with commas
function numberWithCommas(x) {
    var parts = x.toString().split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
}

var countryPrefixes = ["United States of", "Federal States of", "Confederate States of", "New", "The People's Republic of", "Democratic Republic of", "The Republic of", "North", "South", "East", "West"];
var countryNamesPart1 = ["Ang", "Alg", "Alb", "Am", "Arg", "Berm", "Cam", "Can", "Den", "Eth", "Est", "Fr", "Ger", "Hon"];
var countryNamesPart2 = ["ola", "istan", "eria", "erica", "ia", "land", "ea", "uda", "ada", "odia"];

function getRandomCivName() {
    var prefix = countryPrefixes[Math.floor(Math.random() * countryPrefixes.length)];
    var name = countryNamesPart1[Math.floor(Math.random() * countryNamesPart1.length)] + countryNamesPart2[Math.floor(Math.random() * countryNamesPart2.length)];
    var r = Math.random();

    if (r > .7) {
        return prefix + " " + name;
    } else {
        return name;
    }
}

function getRandomTerrName() {
    return "Territory " + Math.floor(Math.random() * 10);
}

var leaderPrefixes = ["King", "Prince", "President", "Glorious Leader", "Doge"];

var leaderFirstNames = ["Peter", "Catherine", "Jarod", "Jared", "Alexander", "George", "Bob", "Robert", "Jack", "Rodney", "Steve", "Steven", "Dexter"];

var leaderLastNames = ["Washington", "Smith", "Wilson", "Miller", "Lewis", "Chavez",
    "Johnson", "Obama", "Clinton", "Bush", "Holland", "Armstrong"
];

var leaderSuffixes = ["the Great", "the Circle", "the Terrible", "the Rectangle", "the Glorious", "the Wise"];

function getRandomLeaderName(trait) {
    trait = trait || "";
    var r = Math.random();
    var prefix;
    if (trait === "") {
        prefix = leaderPrefixes[Math.floor(Math.random() * leaderPrefixes.length)];
    } else {
        switch (trait) {
            case "Capitalist":
                if (Math.random() > .5) {
                    prefix = "President";
                } else {
                    prefix = "Prime Minister";
                }
                break;
            case "Communist":
                prefix = "Chairman";
                break;
            case "Dictatorship":
                prefix = "Glorious Leader";
                break;
            default:
                prefix = leaderPrefixes[Math.floor(Math.random() * leaderPrefixes.length)];
                break;
        }
    }

    var firstName = leaderFirstNames[Math.floor(Math.random() * leaderFirstNames.length)];
    var lastName = leaderLastNames[Math.floor(Math.random() * leaderLastNames.length)];
    var suffix = leaderSuffixes[Math.floor(Math.random() * leaderSuffixes.length)];
    if (r > .8) {
        return prefix + " " + firstName + " " + suffix;
    } else if (r > .5) {
        return prefix + " " + firstName + " " + lastName;
    } else if (r > .2) {
        return firstName + " " + suffix;
    } else {
        return prefix + " " + lastName;
    }
    return "Leader " + Math.floor(Math.random() * 10);
}

function getWorldPopulation() {
    var totalPopulation = 0;
    for (var i = 0; i < territories.length; i++) {
        totalPopulation += territories[i].population;
    }
    return numberWithCommas(totalPopulation);
}

function getTerrOwner(terr) {
    for (var i = 0; i < civilizations.length; i++) {
        if (civilizations[i].id === terr.owner) {
            return civilizations[i];
        }
    }
}

function getTerrsByOwner(id){
    var terrsByOwner = [];
    for(var i = 0; i < territories.length; i++){
        if(territories[i].owner === id){
            terrsByOwner.push(territories[i]);
        }
    }
    return terrsByOwner;
}

function getCivilizationById(id) {
    for (var i = 0; i < civilizations.length; i++) {
        if (civilizations[i].id === id) {
            return civilizations[i];
        }
    }
    return false;
}

function getTerritoryById(id) {
    for (var i = 0; i < territories.length; i++) {
        if (territories[i].id === id) {
            return territories[i];
        }
    }
    return false;
}

function getCivNeighbors(id) {
    var civNeighbors = [];
    for (var i = 0; i < territories.length; i++) {
        if (territories[i].owner === id && territories[i].neighbors.length) {
            for (var j = 0; j < territories[i].neighbors.length; j++) {
                if (getTerrOwner(getTerritoryById(territories[i].neighbors[j])) !== id) {
                    civNeighbors.push(territories[i].neighbors[j]);
                }
            }
        }
    }
    $.unique(civNeighbors);
    return civNeighbors;
}

function updateCivPopulations(){
    for(var i = 0; i < civilizations.length; i++){
        civilizations[i].population = 0;
        for (var j = 0; j < territories.length; j++) {
            
            if (civilizations[i].id === territories[j].owner) {
                civilizations[i].population += territories[j].population;
            }
        }
    }
}

function calculateMilitary(){
    for(var i = 0; i < civilizations.length; i++){
        civilizations[i].military = Math.floor(civilizations[i].population/10);
    }
}

function territory(id, x, y, radius, owner) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.owner = owner;
    this.name = getRandomTerrName();
    this.fertility = Math.ceil(320 * Math.pow(.5 * Math.random() - .25, 3) + 5);
    if ((this.y > 450 || this.y < 150) && this.fertility > 4) {
        this.fertility -= 4;
    }
    this.population = (radius + (radius * 100)) * 10000 + Math.floor(Math.random() * 99999);

    var biome;
    if (this.fertility < 5) {
        if (this.y > 275 && this.y < 325) {
            biome = "Desert";
        } else if (this.y > 450 || this.y < 150) {
            biome = "Tundra";
        } else {
            biome = "Mountain";
        }
    } else if (this.fertility > 6) {
        if (this.y > 250 && this.y < 350) {
            biome = "Rain Forest";
        } else {
            biome = "Flood Plains";
        }
    } else {
        if (Math.random() > .5) {
            biome = "Forest";
        } else {
            biome = "Plains";
        }

    }

    this.biome = biome;
    this.neighbors = [];
}

var traits = ["Party Demon", "Aggressive", "Pacifist", "Agricultural", "Lucky", "Unlucky", "Capitalist", "Communist", "Dictatorship"];

function civilization(id, clr) {
    clr = clr || colors[id] || color();
    this.id = id;
    this.color = clr;
    this.name = getRandomCivName();

    //Get trait
    this.trait = traits[Math.floor(Math.random() * 9)];

    var strengthRange, weaknessRange;

    var strengths = [];

    if (this.trait != "Communist") {
        strengths.push("Wealth");
    }
    if (this.trait != "Dictatorship") {
        strengths.push("Happiness");
    }
    strengths.push("Production");
    strengths.push("Culture");
    strengths.push("Science");

    for (var i = 0; i < strengths.length; i++) {
        var newIndex = Math.floor(Math.random() * strengths.length);
        var temp = strengths[i];
        strengths[i] = strengths[newIndex];
        strengths[newIndex] = temp;
    }

    this.strength = strengths[0];
    this.weakness = strengths[1];

    this.population = 0;
    

    //Initial Stats
    this.leader = getRandomLeaderName(this.trait);
    this.baseScience = 80;
    this.baseProduction = 80;
    this.baseCulture = 80;
    this.baseWealth = 80;
    this.baseHappiness = 80;

    this.science = this.baseScience;
    this.production = this.baseProduction;
    this.culture = this.baseCulture;
    this.wealth = this.baseWealth;
    this.happiness = this.baseHappiness;

    //Apply Strengths and Weaknesses
    this[this.strength.toLowerCase()] += 20;
    this[this.weakness.toLowerCase()] -= 20;

    this.happiness /= 4;

    //Apply Traits
    switch (this.trait) {
        case "Party Demon":
            this.culture += 40;
            this.wealth -= 40;
            break;

        case "Capitalist":
            this.wealth += 20;
            break;

        case "Communist":
            this.wealth = 0;
            break;
    }
    this.military = Math.floor(this.population / 1000);
}

function findNeighbors() {
    for (var i = 0; i < territories.length; i++) {
        territories[i].neighbors = [];
        for (var j = 0; j < territories.length; j++) {
            if (i !== j) {
                if (Math.pow(territories[i].radius + territories[j].radius, 2) >= Math.pow(territories[i].x - territories[j].x, 2) + Math.pow(territories[i].y - territories[j].y, 2)) {
                    territories[i].neighbors.push(territories[j].id);
                }
            }
        }
    }
}

function message(m, type) {
    m = m || "test";
    if (type === -1) {
        m = "<div class='negative-message'>" + m + "</div>";
        m = "<strong class='negative-message'>Year " + year + ":</strong> " + m
    } else if (type === 1) {
        m = "<div class='positive-message'>" + m + "</div>";
        m = "<strong class='positive-message'>Year " + year + ":</strong> " + m
    } else {
        m = "<strong>Year " + year + ":</strong> " + m
    }



    if ($("#message-log-messages").html() != "") {
        $("#message-log-messages").html(m + "<hr />" + $("#message-log-messages").html());
    } else {
        $("#message-log-messages").html(m + "<br />" + $("#message-log-messages").html());
    }
}

function createTerritories() {
    for (var i = 0; i < 13; i++) {
        territories.push(new territory(
            i,
            Math.floor(Math.random() * (c.width / 4) + 105),
            Math.floor(Math.random() * (c.height - 240)) + 120,
            Math.floor(Math.random() * 50) + 50,
            i
        ))
    }

    for (var i = 13; i < 25; i++) {
        territories.push(new territory(
            i,
            Math.floor(Math.random() * (c.width / 4)) + c.width / 2 + 105,
            Math.floor(Math.random() * (c.height - 240)) + 120,
            Math.floor(Math.random() * 50) + 50,
            i
        ))
    }
    territories = territories.sort(function(a, b) {
        return b.radius - a.radius;
    });

    findNeighbors();
}

function createCivilizations() {
    for (var i = 0; i < territories.length; i++) {
        civilizations.push(new civilization(i));
    }
}

setInterval(function() {
    if (!focused) {
        mainLoop();
    }
}, 1000);


setInterval(function() {
    if (focused) {
        mainLoop();
    }
}, 1000 / FPS);


function mainLoop() {
    update();
    draw();
}

var yearCounter = 0;
var nextEvent = Math.random() * 200;

function update() {
    if (running) {
        updateInfoScreen();

        //Increment the year
        if (focused) {
            lastEvent++;
            if (yearCounter >= FPS) {
                year++;
                yearCounter = 0;
            } else {
                yearCounter++;
            }
        } else {
            year++;
            lastEvent += FPS;
        }

        //Increment the population
        if(focused){
            for (var i = 0; i < territories.length; i++) {
                territories[i].population = Math.floor(
                    territories[i].population*Math.pow(Math.E, ((territories[i].fertility/10))/(FPS*2)/100)
                );
            }
        }else{
            for (var i = 0; i < territories.length; i++) {
                territories[i].population = Math.floor(
                    territories[i].population*Math.pow(Math.E, ((territories[i].fertility/40))/(2)/100)
                );            
            }
        }

        updateCivPopulations();
        calculateMilitary();

        //Deal with wars
        for(var i = 0; i < wars.length; i++){
            if(wars[i].aggressor.military > (wars[i].defender.military + wars[i].defender.culture*10000) ||
                wars[i].defender.military > (wars[i].aggressor.military + wars[i].aggressor.culture*10000)){

                var def;
                var off;

                if(wars[i].aggressor.military > wars[i].defender.military){
                    def = wars[i].defender;
                    off = wars[i].aggressor;
                }else{
                    off = wars[i].defender;
                    def = wars[i].aggressor;
                }

                var defenderTerrs = getTerrsByOwner(def.id);
                var tradedTerr = Math.floor(Math.random()*defenderTerrs.length);
                defenderTerrs[tradedTerr].owner = off.id;
                defenderTerrs[tradedTerr].negativeAlert = 1;
                message(off.name + " has taken over " + defenderTerrs[tradedTerr].name, -1);
                if(defenderTerrs.length - 1 <= 0){
                    wars.splice(i);

                }
            }
        }

        //Run an event
        if (lastEvent >= nextEvent) {
            var eventSelector = Math.random();
            if (eventSelector > .2) {
                createDisaster();
            } else {
                startWar();
            }

            lastEvent = 0;
            nextEvent = Math.random() * 200 + 40;
        }
        $("#message-log").css("height", $("#main-canvas").height());
    }

}

function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "black";

    $("#year").html(year);

    for (var i = territories.length - 1; i >= 0; i--) {
        var t = territories[i];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();

        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(t.x + 2, t.y + 2, t.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    }

    for (var i = 0; i < territories.length; i++) {
        if ($("#mapLayerTerrain").prop("checked")) {
            switch (territories[i].biome) {
                case "Desert":
                    ctx.fillStyle = "#D0AA04";
                    break;
                case "Mountain":
                    ctx.fillStyle = "grey";
                    break;
                case "Tundra":
                    ctx.fillStyle = "white";
                    break;
                case "Rain Forest":
                    ctx.fillStyle = "darkgreen";
                    break;
                case "Forest":
                default:
                    ctx.fillStyle = "green";
                    break;
                case "Flood Plains":
                    ctx.fillStyle = "#229822";
                    break;
                case "Plains":
                    ctx.fillStyle = "#C7DA2D";
                    break;
            }

        } else if ($("#mapLayerCivilizations").prop("checked")) {
            ctx.fillStyle = civilizations.filter(function(obj) {
                return obj.id === territories[i].owner;
            })[0].color;
        } else {
            ctx.fillStyle = "Green";
        }

        var t = territories[i];
        ctx.strokeStyle = "#999999";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, 2 * Math.PI);
        ctx.fill();
        if ($("#mapLayerCivilizations").prop("checked")) {
            ctx.stroke();
        }
        if (territories[i].owner == selectedCiv) {
            ctx.fillStyle = "rgba(0, 0, 0, .5)";
            ctx.arc(t.x, t.y, t.radius, 0, 2 * Math.PI);
            ctx.fill();
        }

        if (territories[i].negativeAlert && territories[i].negativeAlert < 120) {

            ctx.strokeStyle = "rgba(200, 0, 0," + (120 - territories[i].negativeAlert) / 120 + ")";
            ctx.fillStyle = "rgba(230, 0, 0," + (120 - territories[i].negativeAlert) / 120 + ")";

            ctx.lineWidth = 6;
            if ($("#optionsEvents").prop("checked")) {
                if ($("#mapLayerCivilizations").prop("checked")) {
                    ctx.stroke();
                } else {
                    ctx.fill();
                }
            }

            if (focused) {
                territories[i].negativeAlert++;
            } else {
                territories[i].negativeAlert += FPS;
            }
        }

        ctx.closePath();
    }
}

var fertilityLevels = ["Barren", "Very Degraded", "Degraded", "Unsuitable", "Stable", "Fertile", "Very Fertile", "Near Perfect", "Perfect"];

function updateInfoScreen() {
    var currCiv = getCivilizationById(selectedCiv);
    var currTerr = getTerritoryById(selectedTerr);

    $("#info-table-world").hide();
    $("#info-table-civ").hide();
    $("#info-table-overview").hide();
    $("#info-table-terr").hide();

    if ($("#civ-tab:checked")[0]) {
        if (currCiv) {
            $("#info-table-civ").show();
        } else {
            $("#info-table-overview").show();
        }
    }

    if ($("#terr-tab:checked")[0]) {
        if (currTerr) {
            $("#info-table-terr").show();
        } else {
            $("#info-table-world").show();
        }
    }
    $(".info-world-population").html(getWorldPopulation());
    $(".info-world-name").html(worldName);
    $(".info-overview-civs").html(civilizations.length);


    if (currCiv) {
        $(".info-civ-name").html(currCiv.name);
        $(".info-civ-leader").html(currCiv.leader);
        $(".info-civ-military").html(numberWithCommas(currCiv.military));
        $(".info-civ-population").html(numberWithCommas(currCiv.population));
        $(".info-civ-culture").html(currCiv.culture);
        $(".info-civ-science").html(currCiv.science);
        $(".info-civ-happiness").html(currCiv.happiness);
        $(".info-civ-production").html(currCiv.production);
        $(".info-civ-wealth").html(currCiv.wealth);
        $(".info-civ-trait").html(currCiv.trait);
        $(".info-civ-strength").html(currCiv.strength);
        $(".info-civ-weakness").html(currCiv.weakness);
    }

    if (currTerr) {
        $(".info-terr-name").html(currTerr.name);
        $(".info-terr-owner").html(getTerrOwner(currTerr).name);
        $(".info-terr-population").html(numberWithCommas(currTerr.population));
        $(".info-terr-growthrate").html(numberWithCommas(Math.floor(currTerr.population*Math.pow(Math.E, ((currTerr.fertility/40))/(2)/100))- currTerr.population) + "/yr");
        $(".info-terr-fertility").html(fertilityLevels[currTerr.fertility - 1]);
        $(".info-terr-biome").html(currTerr.biome);
    }

}

$("#main-canvas").click(function() {
    selectedCiv = -1;
    selectedTerr = -1;

    try {
        var mouseX = event.pageX - c.offsetLeft;
        var mouseY = event.pageY - c.offsetTop;
    } catch (e) {
        var mouseX = 0;
        var mouseY = 0;
    }

    var adjustedX = (mouseX / $("#main-canvas").width()) * 800;
    var adjustedY = (mouseY / $("#main-canvas").height()) * 600;

    for (var i = 0; i < territories.length; i++) {
        if (Math.pow(adjustedX - territories[i].x, 2) + Math.pow(adjustedY - territories[i].y, 2) < Math.pow(territories[i].radius, 2)) {
            selectedCiv = territories[i].owner;
            selectedTerr = territories[i].id;
        }
    }
});

$("#game-title").click(function() {
    selectedCiv = -1;
    selectedTerr = -1;
});

$("#message-log").click(function() {
    selectedCiv = -1;
    selectedTerr = -1;
});

$(window).focus(function() {
    focused = true;
})

$(window).blur(function() {
    focused = false;
})

createTerritories();
createCivilizations();

$("#main-canvas").trigger("click");


/*--------------Events----------------*/


var disasters = [];

function disaster(id, name, action) {
    this.id = id;
    this.name = name;
    this.action = action;
}

disasters.push(new disaster(1, "Fire", function(terr) {
    var kills = Math.ceil(Math.random() * 250);

    if (kills > terr.population) {
        kills = terr.population - 10;
    }

    if (kills > 0) {
        terr.population -= kills;
        terr.negativeAlert = 1;
        message("A fire has broken out in " + terr.name + " killing " + kills + ".", -1);
    }
}));

disasters.push(new disaster(2, "Flood", function(terr) {
    var kills = Math.ceil(Math.random() * 1000);

    if (kills > terr.population) {
        kills = terr.population - 10;
    }

    if (kills > 0) {
        terr.population -= kills;
        terr.negativeAlert = 1;
        message("Widespread flooding as occured in " + terr.name + " killing " + kills + ".", -1);
    }
}));

disasters.push(new disaster(3, "Hurricane", function(terr) {
    var kills = Math.ceil(Math.random() * 8000);

    if (kills > terr.population) {
        kills = terr.population - 10;
    }

    if (kills > 0) {
        terr.population -= kills;
        terr.negativeAlert = 1;
        message("A hurricane has hit " + terr.name + " killing " + kills + ".", -1);
    }
}));

disasters.push(new disaster(4, "Volcano", function(terr) {
    var kills = Math.ceil(Math.random() * 2500);

    if (kills > terr.population) {
        kills = terr.population - 10;
    }

    if (kills > 0) {
        terr.population -= kills;
        terr.negativeAlert = 1;
        message("A volcano has erupted in " + terr.name + " killing " + kills + ".", -1);
    }
}));

function createDisaster() {
    var targetTerr = territories[Math.floor(Math.random() * territories.length)];
    var chosenDisaster = disasters[Math.floor(Math.random() * disasters.length)];
    chosenDisaster.action(targetTerr);
}

var wars = [];

function war(aggressor, defender, startDate) {
    this.aggressor = aggressor;
    this.defender = defender;
    this.startDate = startDate;
}

function startWar() {
    var aggressor, defender;
    var priorities = [];

    /*---------Arbitrarily select an aggressor----------*/
    for (var i = 0; i < civilizations.length; i++) {
        if (civilizations[i].trait === "Aggressive") {
            priorities.push(2);
        } else if (civilizations[i].trait === "Pacifist") {
            priorities.push(.3);
        } else {
            priorities.push(1);
        }
    }
    var addedPriorities = [];
    var prioritiesCounter = 0;
    for (var i = 0; i < priorities.length; i++) {
        prioritiesCounter += priorities[i];
        prioritiesCounter = parseFloat(parseFloat(prioritiesCounter).toFixed(1));
        addedPriorities.push(prioritiesCounter);
    }

    var index = Math.random() * prioritiesCounter;
    for (var i = 0; i < addedPriorities.length; i++) {
        if (index > addedPriorities[i]) {
            aggressor = civilizations[i - 1];
        }
    }
    /*---------Select a defender----------*/
    var possibleDefenders = getCivNeighbors(aggressor.id);
    if (possibleDefenders !== []) {
        defender = getCivilizationById(possibleDefenders[Math.floor(Math.random() * possibleDefenders.length)]);
    }

    var duplicateWar = false;
    for (var i = 0; i < wars.length; i++) {
        if (wars[i].aggressor.id === aggressor.id && wars[i].defender.id === defender.id) {
            if (Math.random() > .5) {
                message(aggressor.name + " has assassinated an official from " + defender.name + ", reigniting their war!", -1);
            } else {
                message(defender.name + " has assassinated an official from " + aggressor.name + ", reigniting their war!", -1);
            }
            duplicateWar = true;
            wars.year = year;
        }
    }

    if (!duplicateWar) {
        wars.push(new war(aggressor, defender, year));
        message(aggressor.name + " has declared war on " + defender.name, -1);
    }



}