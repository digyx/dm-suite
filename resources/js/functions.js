/*  eslint-disable no-unused-vars */

const fs = require('fs');
const { remote } = require('electron');
const { app } = remote;
const configDir = app.getPath('appData') + '/DMS';
const resourceDir = determineResourceDir();

// If app is packaged, the resource folder is in a different location
function determineResourceDir() {
    if (app.isPackaged) {
        return './resources/app/resources/';
    } else {
        return './resources/';
    }
}

// Changes the HTML file in the #content div
function openHtmlFile(newWindow) {
    let htmlDir = resourceDir + newWindow;
 
    fs.readFile(htmlDir, function (err, data) {
        if (err) {
            alert('Error, page not found!');
            throw err;
        }

        document.getElementById('content').innerHTML = data;

        // Determines which function to call
        switch (newWindow) {
        case 'events.html':
            loadEvents();
            break;
        case 'locations.html':
            loadLocations();
            break;
        case 'story.html':
            loadStory();
            break;
        case 'npc.html':
            loadNPCs();
            break;
        case 'players.html':
            loadPlayers();
            break;
        }
    });
}

// Sets the right click menu (context menu)
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

    // Adds the stuff to the context menu
    for (let i = 0; i < contextMenu.length; i++) {
        menu.append(new MenuItem(contextMenu[i]));
    }

    // Adds a listener for the right click
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        menu.popup({window: remote.getCurrentWindow()}, false);
    });
}

// When users types in the Story textarea, saves it to a file
function saveStory() {
    const storyText = document.getElementById('story-text').value;
    const storyDir = configDir + '/story.txt';
    fs.writeFile(storyDir, storyText, function(err) {if (err) throw err;});
}

// Does what you think it does
function loadStory() {
    const storyDir = configDir + '/story.txt';
    fs.readFile(storyDir, function(err, data) {
        if (err) throw err;
        document.getElementById('story-text').value = data;
    });
}

// Pulls up interface to edit a specific event
function editEvent(element) {
    const body = document.getElementById('body');
    const container = document.createElement('div');
    const htmlDir = resourceDir + 'event-editor.html';

    // Create the editing container and inject HTML in it
    container.id = 'event-editor-container';
    fs.readFile(htmlDir, function(err, data) {
        if (err) throw err;
        container.innerHTML = data;
    });

    // Add it to the main window
    body.appendChild(container);

    // If you call this on an existing event, it pulls the data from that event instead of initializing a new event
    if (element.id !== 'new-event') {
        const eventName = element.parentNode.parentNode.childNodes[1].innerText;
        const eventSetting = element.parentNode.childNodes[1].innerText;
        const eventDetails = element.parentNode.childNodes[3].innerText;

        // Give it some time to make the nodes before injecting the HTML values
        setTimeout(function() {
            document.getElementById('event-name-input').value = eventName;
            document.getElementById('event-setting-input').value = eventSetting;
            document.getElementById('event-details-input').value = eventDetails;
        }, 100);
    }
}

// Grabs the data and saves it as HTML in a .txt file
function saveEvent(element) {
    const eventName = document.getElementById('event-name-input').value;
    const eventSetting = document.getElementById('event-setting-input').value;
    const eventDetails = document.getElementById('event-details-input').value;
    
    // Format the data as HTML
    const eventData = `
    <h3>${eventName}</h3>
    <div class="event-detail">
        <p>${eventSetting}</p>
        <p>${eventDetails}</p>
        <button onclick="editEvent(this);">Edit Event</button>
        <button onclick="deleteEvent(this);">Delete Event</button>
    </div>`;
    const saveDir = configDir + `/events/${eventName}.txt`;

    // Save the Event
    fs.writeFile(saveDir, eventData, function (err) {if (err) throw err;});

    // Removes the Event editor and releads the Events page
    const body = document.getElementById('body');
    const eventEditor = document.getElementById('event-editor-container');
    body.removeChild(eventEditor);
    openHtmlFile('events.html');
}

// Asks the user for confirmation, deletes the .txt file for that event, then releads the page
function deleteEvent(element) {
    if (!confirm('Are you sure you would like to delete this event?')) {
        return;
    }
    const eventName = element.parentNode.parentNode.childNodes[1].innerText;
    const fileName = eventName + '.txt';
    const eventDir = configDir + '/events/' + fileName;
    fs.unlink(eventDir, function(err) {if (err) throw err;});
    openHtmlFile('events.html');
    return;
}

// Pulls all the .txt files and injects the HTML in them into the page
function loadEvents() {
    const events = fs.readdirSync(configDir + '/events');
    var eventDir;

    // Iterates through every file, injecting the HTML
    for (var i = 0; i < events.length; i++) {
        eventDir = configDir + '/events/' + events[i];
        fs.readFile(eventDir, function (err, data) {
            if (err) {
                return;
            }
            // Create the container for the event in #event-container
            const eventContainer = document.getElementById('event-container');
            const newEvent = document.createElement('div');

            // Add it to the DOM
            eventContainer.appendChild(newEvent);
            newEvent.classList.add('event');
                
            // Adds a listener to detect if the event is clicked
            newEvent.setAttribute('onclick','showEvent(this);');
            newEvent.innerHTML = data;
        });
    }
}

// Changes the event display to block and then changes the onclick event to hideEvent
function showEvent(element) {
    const locationDetail = element.lastChild;
    locationDetail.style = 'display: block;';
    element.setAttribute('onclick','hideEvent(this);');
}

// Changes the event display to none and then changes the onclick event to showEvent
function hideEvent(element) {
    const eventDetail = element.lastChild;
    eventDetail.style = 'display: none;';
    element.setAttribute('onclick','showEvent(this);');
}

// Loads the names of the locations
function loadLocations() {
    const locations = fs.readdirSync(configDir + '/locations');

    // Iterates through every file in the Locations dir and formats the names to have spaces instead of dashes
    for (var i = 0; i < locations.length; i++) {
        // Grab the container to hold the location listings
        const locationContainer = document.getElementById('location-list');

        // Add the name to the location listings
        var newLocation = document.createElement('h3');
        locationContainer.appendChild(newLocation);
        newLocation.classList.add('hover');

        // Adds an onclick listener to load the location
        newLocation.setAttribute('onclick','showLocation(this);');

        // Make the name look normal
        newLocation.innerText = locations[i].replace('.txt', '').replace('-', ' ');
    }
}

// Grabs the HTML in the .txt for the location and injects it
function showLocation(element) {
    // Determine what the name is and grab the txt file
    const locationName = element.innerText;
    const locationDir = configDir + `/locations/${locationName}.txt`;

    // This is where we're gonna inject the HTML
    const locationInfo = document.getElementById('location-info');

    // Read the file and inject the HTML
    fs.readFile(locationDir, function(err, data) {
        locationInfo.innerHTML = data;
    });
}

// Open the location editor where the locaiton viewer is
function editLocation(element) {
    const id = element.id;
    const editorPane = document.getElementById('location-info');

    // If you clicked "New Location", initializes a new location
    if (element.id === 'new-location') {
        fs.readFile(resourceDir + 'location-editor.html', function(err, data) {
            editorPane.innerHTML = data;
        });
        return;
    }
    // Grabs the fields we're gonna throw the existing values in
    const locationName = document.getElementById('location-name').innerText;
    const locationDetails = document.getElementById('location-details').innerText;

    // Read the editor HTML and inject it
    fs.readFile(resourceDir + 'location-editor.html', function(err, data) {
        editorPane.innerHTML = data;
    });

    // Give the HTML some time to settle in and get cozy, then put the exsting values in the fields
    setTimeout(function() {
        document.getElementById('location-name-input').value = locationName;
        document.getElementById('location-details-input').value = locationDetails;
    }, 100);
}

// Formats the location data as HTML and saves it to a txt file
function saveLocation(element) {
    // Grab the data from the fields
    const locationName = document.getElementById('location-name-input').value;
    const locationDetails = document.getElementById('location-details-input').value;

    // Determine the name of the txt file
    const saveLocation = configDir + `/locations/${locationName}.txt`;

    // Format the data as HTML
    const locationData = `
    <h3 id="location-name">${locationName}</h3>
    <p id="location-details">${locationDetails}</p>
    <button onclick="editLocation(this);">Edit Location</button>
    <button onclick="deleteLocation(this);">Delete Location</button>`;

    // Save that HTML to the file
    fs.writeFile(saveLocation, locationData, function (err) {
        if (err) throw err;
    });

    // Reload the page
    openHtmlFile('locations.html');
}

// Asks the user for confirmation, deletes the .txt file for that location, then releads the page
function deleteLocation(element) {
    if (!confirm('Are you sure you would like to delete this location?')) {
        return;
    }
    // Determine which Location to delete
    const locationName = element.parentNode.childNodes[1].innerText;
    const fileName = locationName;
    const locationDir = configDir + `/locations/${fileName}.txt`;

    // Delete the file
    fs.unlink(locationDir, function(err) {if (err) throw err;});

    // Reload the page
    openHtmlFile('locations.html');
}

// Determines which dice to roll and then rolls that dive, using the given amount and modifier
function rollDice(dieSize) {
    const amount = Number(document.getElementById(`d${dieSize}-amt`).value);
    const modifier = Number(document.getElementById(`d${dieSize}-mod`).value);
    const number = Math.floor(Math.random() * dieSize) + 1;

    // Tell the user what the dice rolled
    alert(amount * number + modifier);
}

// Rolls the dice for the Context Menu die rolls
function quickRoll(dieSize) {
    alert(Math.floor(Math.random() * dieSize) + 1);
}

// Grabs the data for the NPN and 
function editNPC(element) {
    const body = document.getElementById('body');
    const container = document.createElement('div');
    const htmlDir = resourceDir + 'npc-editor.html';

    // This is where the editor is loading
    container.id = 'npc-editor-container';

    // Load the HTML for the editor
    fs.readFile(htmlDir, function(err, data) {
        if (err) throw err;
        container.innerHTML = data;
    });

    // Add the HTML to the container
    body.appendChild(container);

    if (element.id === 'new-npc') {
        return;
    }
    // Grab the NPC data
    const npcName = element.parentNode.parentNode.childNodes[1].innerText;
    const npcDetails = element.parentNode.childNodes[1].innerText;

    // Throw that data into the fields
    setTimeout(function() {
        document.getElementById('npc-name-input').value = npcName;
        document.getElementById('npc-details-input').value = npcDetails;
    }, 100);
}

// Grabs the values from the editor and saves it as HTML in a .txt file
function saveNPC(element) {
    // Grab the data from the fields
    const npcName = document.getElementById('npc-name-input').value;
    const npcDetails = document.getElementById('npc-details-input').value;

    // Format it as HTML
    const npcData = `
    <h3>${npcName}</h3>
    <div class="npc-detail">
        <p>${npcDetails}</p>
        <button onclick="editNPC(this);">Edit NPC</button>
        <button onclick="deleteNPC(this);">Delete NPC</button>
    </div>`;

    // Determine where to save the NPC
    const saveDir = configDir + `/npcs/${npcName}.txt`;

    // Save the NPC
    fs.writeFile(saveDir, npcData, function (err) {
        if (err) throw err;
    });

    // Remove the editor from the page
    const body = document.getElementById('body');
    const npcEditor = document.getElementById('npc-editor-container');
    body.removeChild(npcEditor);

    // Reload the page
    openHtmlFile('npc.html');
}

// Deletes the .txt file for the NPC
function deleteNPC(element) {
    if (!confirm('Are you sure you would like to delete this npc?')) {
        return;
    }
    // Determine which NPC to kill off
    const npcName = element.parentNode.parentNode.childNodes[1].innerText;
    const fileName = npcName + '.txt';
    const npcDir = configDir + '/npcs/' + fileName;

    // Kill the NPC (may they rest in peace)
    fs.unlink(npcDir, function(err) {if (err) throw err;});

    // Reload the page
    openHtmlFile('npc.html');
}

// Loads the data for each NPC
function loadNPCs() {
    // Find the folder they're located in 
    const npcs = fs.readdirSync(configDir + '/npcs');

    for (var i = 0; i < npcs.length; i++) {
        // This is the NPC we're iteraitng through
        let npcDir = configDir + '/npcs/' + npcs[i];

        // Read the file and inject the HTML
        fs.readFile(npcDir, function (err, data) {
            if (err) {
                return;
            }
            // Make a place for the NPC to live
            const npcContainer = document.getElementById('npc-container');
            const newNPC = document.createElement('div');
            
            // Add it to the Dom and give is a class
            npcContainer.appendChild(newNPC);
            newNPC.classList.add('npc');

            // Add the onclick listener
            newNPC.setAttribute('onclick','showNPC(this);');
            newNPC.innerHTML = data;
        });
    }
}

// Sets the display to block and the onclick to hideNPC
function showNPC(element) {
    const npcDetail = element.lastChild;
    npcDetail.style = 'display: block;';
    element.setAttribute('onclick','hideNPC(this);');
}

// Sets the display to none and the onclick to showNPC
function hideNPC(element) {
    const npcDetail = element.lastChild;
    npcDetail.style = 'display: none;';
    element.setAttribute('onclick','showNPC(this);');
}

// Load the players to the bottom of the window
function loadPlayers() {
    const playerPath = configDir + '/players.json';

    // Read the JSON file and inject the data in the right places
    fs.readFile(playerPath, (err, data) => {
        if (err) alert(err);

        // Convert the JSON to an Object
        const playerData = JSON.parse(data);

        // Iterate through every object and set the values for each
        for (let key in playerData) {
            let player = playerData[key];
            let playerHTML = `
            ${player.charName}<br>
            HP:${player.hp} AC:${player.ac}<br>
            S:${player.str} D:${player.dex} C:${player.con}<br>
            I:${player.int} W:${player.wis} C:${player.cha}`;
            
            // Inject the HTML to the DOM
            document.getElementById(key).innerHTML = playerHTML;
        }
    });
}

// Save the players to their JSON file
function savePlayers() {
    const playerPath = configDir + '/players.json';

    // Set the Object
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

    // Save that object to the players.json file in the user's App Config directory
    fs.writeFile(playerPath, JSON.stringify(playerData), (err) => {if (err) throw err;});

    // Proceed to load the characters back in
    for (let key in playerData) {
        let player = playerData[key];
        let playerHTML = `
        ${player.charName}<br>
        HP:${player.hp} AC:${player.ac}<br>
        S:${player.str} D:${player.dex} C:${player.con}<br>
        I:${player.int} W:${player.wis} C:${player.cha}`;
        
        // Inject the HTML to the DOM
        document.getElementById(key).innerHTML = playerHTML;
    }
}