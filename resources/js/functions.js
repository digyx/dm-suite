/*  eslint-disable no-unused-vars */
const fs = require('fs');
const { remote } = require('electron');
const { app } = remote;
const configDir = app.getPath('appData') + '/DMS';
const resourceDir = determineResourceDir();

function determineResourceDir() {
    if (app.isPackaged) {
        return './resources/app/resources/';
    } else {
        return './resources/';
    }
}

function openHtmlFile(newWindow) {
    let htmlDir;
    if (app.isPackaged) {
        htmlDir = './resources/app/resources/' + newWindow;
    } else {
        htmlDir = './resources/' + newWindow;
    }    

    fs.readFile(htmlDir, function (err, data) {
        if (err) {
            alert('Error, page not found!');
            throw err;
        }
        document.getElementById('content').innerHTML = data;
        if (newWindow === 'events.html') {
            loadEvents();
        } else if (newWindow === 'locations.html') {
            loadLocations();
        } else if (newWindow === 'story.html') {
            loadStory();
        } else if (newWindow === 'npc.html') {
            loadNPCs();
        } else if (newWindow === 'players.html') {
            loadPlayers();
        }
    });
}

function contextMenu() {
    const {Menu, MenuItem} = remote;

    const menu = new Menu();
    const contextMenu = [
        {label: 'Quick Roll'},
        {type: 'separator'},
        {label: 'Roll D4', click() {quickRoll(4);}},
        {label: 'Roll D6', click() {quickRoll(6);}},
        {label: 'Roll D8', click() {quickRoll(8);}},
        {label: 'Roll D10', click() {quickRoll(10);}},
        {label: 'Roll D12', click() {quickRoll(12);}},
        {label: 'Roll D20', click() {quickRoll(20);}},
        {label: 'Roll D100', click() {quickRoll(100);}}
    ];

    for (let i = 0; i < contextMenu.length; i++) {
        menu.append(new MenuItem(contextMenu[i]));
    }

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        menu.popup({window: remote.getCurrentWindow()}, false);
    });
}

function saveStory() {
    const storyText = document.getElementById('story-text').value;
    const storyDir = configDir + '/story.txt';
    fs.writeFile(storyDir, storyText, function(err) {if (err) throw err;});
}

function loadStory() {
    const storyDir = configDir + '/story.txt';
    fs.readFile(storyDir, function(err, data) {
        if (err) throw err;
        document.getElementById('story-text').value = data;
    });
}

function editEvent(element) {
    const body = document.getElementById('body');
    const container = document.createElement('div');
    const htmlDir = resourceDir + 'event-editor.html';

    container.id = 'event-editor-container';
    fs.readFile(htmlDir, function(err, data) {
        if (err) throw err;
        container.innerHTML = data;
    });

    body.appendChild(container);

    if (element.id !== 'new-event') {
        const eventName = element.parentNode.parentNode.childNodes[1].innerText;
        const eventSetting = element.parentNode.childNodes[1].innerText;
        const eventDetails = element.parentNode.childNodes[3].innerText;
        setTimeout(function() {
            document.getElementById('event-name-input').value = eventName;
            document.getElementById('event-setting-input').value = eventSetting;
            document.getElementById('event-details-input').value = eventDetails;
        }, 100);
    }
}

function saveEvent(element) {
    const eventName = document.getElementById('event-name-input').value;
    const eventSetting = document.getElementById('event-setting-input').value;
    const eventDetails = document.getElementById('event-details-input').value;
    const eventData = `
    <h3>${eventName}</h3>
    <div class="event-detail">
        <p>${eventSetting}</p>
        <p>${eventDetails}</p>
        <button onclick="editEvent(this);">Edit Event</button>
        <button onclick="deleteEvent(this);">Delete Event</button>
    </div>`;
    const saveDir = configDir + `/events/${eventName}.txt`;

    fs.writeFile(saveDir, eventData, function (err) {if (err) throw err;});

    const body = document.getElementById('body');
    const eventEditor = document.getElementById('event-editor-container');
    body.removeChild(eventEditor);
    openHtmlFile('events.html');
}

function deleteEvent(element) {
    if (confirm('Are you sure you would like to delete this event?')) {
        const eventName = element.parentNode.parentNode.childNodes[1].innerText;
        const fileName = eventName + '.txt';
        const eventDir = configDir + '/events/' + fileName;
        fs.unlink(eventDir, function(err) {if (err) throw err;});
        openHtmlFile('events.html');
    } else {
        return;
    }
}

function loadEvents() {
    const events = fs.readdirSync(configDir + '/events');
    var eventDir;

    for (var i = 0; i < events.length; i++) {
        eventDir = configDir + '/events/' + events[i];
        fs.readFile(eventDir, function (err, data) {
            if (err) {
                return;
            } else {
                const eventContainer = document.getElementById('event-container');
                const newEvent = document.createElement('div');
                eventContainer.appendChild(newEvent);
                newEvent.classList.add('event');
                newEvent.setAttribute('onclick','showEvent(this);');
                newEvent.innerHTML = data;
            }
        });
    }
}

function showEvent(element) {
    const locationDetail = element.lastChild;
    locationDetail.style = 'display: block;';
    element.setAttribute('onclick','hideEvent(this);');
}

function hideEvent(element) {
    const eventDetail = element.lastChild;
    eventDetail.style = 'display: none;';
    element.setAttribute('onclick','showEvent(this);');
}

function loadLocations() {
    const locations = fs.readdirSync(configDir + '/locations');
    var locationDir;

    for (var i = 0; i < locations.length; i++) {
        locationDir = configDir + '/locations/' + locations[i];
        const locationContainer = document.getElementById('location-list');
        var newLocation = document.createElement('h3');
        locationContainer.appendChild(newLocation);
        newLocation.classList.add('hover');
        newLocation.setAttribute('onclick','showLocation(this);');
        newLocation.innerText = locations[i].replace('.txt', '').replace('-', ' ');
    }
}

function showLocation(element) {
    const locationName = element.innerText;
    const locationDir = configDir + `/locations/${locationName}.txt`;
    const locationInfo = document.getElementById('location-info');
    fs.readFile(locationDir, function(err, data) {
        locationInfo.innerHTML = data;
    });
}

function editLocation(element) {
    const id = element.id;
    const editorPane = document.getElementById('location-info');
    if (element.id !== 'new-location') {
        const locationName = document.getElementById('location-name').innerText;
        const locationDetails = document.getElementById('location-details').innerText;
        fs.readFile(resourceDir + 'location-editor.html', function(err, data) {
            editorPane.innerHTML = data;
        });
        setTimeout(function() {
            document.getElementById('location-name-input').value = locationName;
            document.getElementById('location-details-input').value = locationDetails;
        }, 100);
    } else {
        fs.readFile(resourceDir + 'location-editor.html', function(err, data) {
            editorPane.innerHTML = data;
        });
    }
}

function newLocation(element) {
    const id = element.id;
    const editor = document.getElementById('location-info');
    fs.readFile(resourceDir + 'location-creator.html', function(err, data) {
        editor.innerHTML = data;
    });
}

function saveLocation(element) {
    const locationName = document.getElementById('location-name-input').value;
    const locationDetails = document.getElementById('location-details-input').value;
    const saveLocation = configDir + `/locations/${locationName}.txt`;
    const locationData = `
    <h3 id="location-name">${locationName}</h3>
    <p id="location-details">${locationDetails}</p>
    <button onclick="editLocation(this);">Edit Location</button>
    <button onclick="deleteLocation(this);">Delete Location</button>`;
    fs.writeFile(saveLocation, locationData, function (err) {
        if (err) throw err;
    });
    openHtmlFile('locations.html');
}

function deleteLocation(element) {
    if (confirm('Are you sure you would like to delete this location?')) {
        const locationName = element.parentNode.childNodes[1].innerText;
        const fileName = locationName;
        const locationDir = configDir + `/locations/${fileName}.txt`;
        fs.unlink(locationDir, function(err) {if (err) throw err;});
        openHtmlFile('locations.html');
    } else {
        return;
    }
}

function rollDice(dieSize) {
    const amount = Number(document.getElementById(`d${dieSize}-amt`).value);
    const modifier = Number(document.getElementById(`d${dieSize}-mod`).value);
    const number = Math.floor(Math.random() * dieSize) + 1;
    alert(amount * number + modifier);
}


function quickRoll(dieSize) {
    alert(Math.floor(Math.random() * dieSize) + 1);
}

function editNPC(element) {
    const body = document.getElementById('body');
    const container = document.createElement('div');
    const htmlDir = resourceDir + 'npc-editor.html';

    container.id = 'npc-editor-container';
    fs.readFile(htmlDir, function(err, data) {
        if (err) throw err;
        container.innerHTML = data;
    });

    body.appendChild(container);

    if (element.id !== 'new-npc') {
        const npcName = element.parentNode.parentNode.childNodes[1].innerText;
        const npcDetails = element.parentNode.childNodes[1].innerText;
        setTimeout(function() {
            document.getElementById('npc-name-input').value = npcName;
            document.getElementById('npc-details-input').value = npcDetails;
        }, 100);
    }
}

function saveNPC(element) {
    const npcName = document.getElementById('npc-name-input').value;
    const npcDetails = document.getElementById('npc-details-input').value;
    const npcData = `
    <h3>${npcName}</h3>
    <div class="npc-detail">
        <p>${npcDetails}</p>
        <button onclick="editNPC(this);">Edit NPC</button>
        <button onclick="deleteNPC(this);">Delete NPC</button>
    </div>`;
    const saveDir = configDir + `/npcs/${npcName}.txt`;
    fs.writeFile(saveDir, npcData, function (err) {if (err) throw err;});
    const body = document.getElementById('body');
    const npcEditor = document.getElementById('npc-editor-container');
    body.removeChild(npcEditor);
    openHtmlFile('npc.html');
}

function deleteNPC(element) {
    if (confirm('Are you sure you would like to delete this npc?')) {
        const npcName = element.parentNode.parentNode.childNodes[1].innerText;
        const fileName = npcName + '.txt';
        const npcDir = configDir + '/npcs/' + fileName;
        fs.unlink(npcDir, function(err) {if (err) throw err;});
        openHtmlFile('npc.html');
    } else {
        return;
    }
}

function loadNPCs() {
    const npcs = fs.readdirSync(configDir + '/npcs');
    var npcDir;

    for (var i = 0; i < npcs.length; i++) {
        npcDir = configDir + '/npcs/' + npcs[i];
        fs.readFile(npcDir, function (err, data) {
            if (err) {
                return;
            } else {
                const npcContainer = document.getElementById('npc-container');
                const newNPC = document.createElement('div');
                npcContainer.appendChild(newNPC);
                newNPC.classList.add('npc');
                newNPC.setAttribute('onclick','showNPC(this);');
                newNPC.innerHTML = data;
            }
        });
    }
}

function showNPC(element) {
    const npcDetail = element.lastChild;
    npcDetail.style = 'display: block;';
    element.setAttribute('onclick','hideNPC(this);');
}

function hideNPC(element) {
    const npcDetail = element.lastChild;
    npcDetail.style = 'display: none;';
    element.setAttribute('onclick','showNPC(this);');
}

function loadPlayers() {
    const playerPath = configDir + '/players.json';
    fs.readFile(playerPath, (err, data) => {
        if (err) alert(err);

        const playerData = JSON.parse(data);

        for (let i = 1; i < 7; i++) {
            document.getElementById(`player${i}-name`).value = playerData[`player-${i}`].charName;
            document.getElementById(`player${i}-hp`).value = playerData[`player-${i}`].hp;
            document.getElementById(`player${i}-ac`).value = playerData[`player-${i}`].ac;
            document.getElementById(`player${i}-str`).value = playerData[`player-${i}`].str;
            document.getElementById(`player${i}-dex`).value = playerData[`player-${i}`].dex;
            document.getElementById(`player${i}-con`).value = playerData[`player-${i}`].con;
            document.getElementById(`player${i}-int`).value = playerData[`player-${i}`].int;
            document.getElementById(`player${i}-wis`).value = playerData[`player-${i}`].wis;
            document.getElementById(`player${i}-cha`).value = playerData[`player-${i}`].cha;
        }
    });
}

function updatePlayers() {
    const playerPath = configDir + '/players.json';
    fs.readFile(playerPath, (err, data) => {
        if (err) alert(err);

        const playerData = JSON.parse(data);
        let count = 0;

        for (let key in playerData) {
            let player = playerData[key];
            let playerHTML = `
            ${player.charName}<br>
            HP:${player.hp} AC:${player.ac}<br>
            S:${player.str} D:${player.dex} C:${player.con}<br>
            I:${player.int} W:${player.wis} C:${player.cha}`;

            document.getElementById(key).innerHTML = playerHTML;
        }
    });
}

function savePlayers() {
    const playerPath = configDir + '/players.json';
    let playerData = {
        'player-1': {
            'charName': document.getElementById('player1-name').value,
            'hp': document.getElementById('player1-hp').value,
            'ac': document.getElementById('player1-ac').value,
            'str': document.getElementById('player1-str').value,
            'dex': document.getElementById('player1-dex').value,
            'con': document.getElementById('player1-con').value,
            'int': document.getElementById('player1-int').value,
            'wis': document.getElementById('player1-wis').value,
            'cha': document.getElementById('player1-cha').value
        }, 'player-2': {
            'charName': document.getElementById('player2-name').value,
            'hp': document.getElementById('player2-hp').value,
            'ac': document.getElementById('player2-ac').value,
            'str': document.getElementById('player2-str').value,
            'dex': document.getElementById('player2-dex').value,
            'con': document.getElementById('player2-con').value,
            'int': document.getElementById('player2-int').value,
            'wis': document.getElementById('player2-wis').value,
            'cha': document.getElementById('player2-cha').value
        }, 'player-3': {
            'charName': document.getElementById('player3-name').value,
            'hp': document.getElementById('player3-hp').value,
            'ac': document.getElementById('player3-ac').value,
            'str': document.getElementById('player3-str').value,
            'dex': document.getElementById('player3-dex').value,
            'con': document.getElementById('player3-con').value,
            'int': document.getElementById('player3-int').value,
            'wis': document.getElementById('player3-wis').value,
            'cha': document.getElementById('player3-cha').value
        }, 'player-4': {
            'charName': document.getElementById('player4-name').value,
            'hp': document.getElementById('player4-hp').value,
            'ac': document.getElementById('player4-ac').value,
            'str': document.getElementById('player4-str').value,
            'dex': document.getElementById('player4-dex').value,
            'con': document.getElementById('player4-con').value,
            'int': document.getElementById('player4-int').value,
            'wis': document.getElementById('player4-wis').value,
            'cha': document.getElementById('player4-cha').value
        }, 'player-5': {
            'charName': document.getElementById('player5-name').value,
            'hp': document.getElementById('player5-hp').value,
            'ac': document.getElementById('player5-ac').value,
            'str': document.getElementById('player5-str').value,
            'dex': document.getElementById('player5-dex').value,
            'con': document.getElementById('player5-con').value,
            'int': document.getElementById('player5-int').value,
            'wis': document.getElementById('player5-wis').value,
            'cha': document.getElementById('player5-cha').value
        }, 'player-6': {
            'charName': document.getElementById('player6-name').value,
            'hp': document.getElementById('player6-hp').value,
            'ac': document.getElementById('player6-ac').value,
            'str': document.getElementById('player6-str').value,
            'dex': document.getElementById('player6-dex').value,
            'con': document.getElementById('player6-con').value,
            'int': document.getElementById('player6-int').value,
            'wis': document.getElementById('player6-wis').value,
            'cha': document.getElementById('player6-cha').value
        }
    };
    fs.writeFile(playerPath, JSON.stringify(playerData), (err) => {if (err) throw err;});

    for (let key in playerData) {
        let player = playerData[key];
        let playerHTML = `
        ${player.charName}<br>
        HP:${player.hp} AC:${player.ac}<br>
        S:${player.str} D:${player.dex} C:${player.con}<br>
        I:${player.int} W:${player.wis} C:${player.cha}`;
        
        document.getElementById(key).innerHTML = playerHTML;
    }
}