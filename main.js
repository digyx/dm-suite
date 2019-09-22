/*  eslint-disable no-unused-vars */
const electron = require('electron');
const {app, BrowserWindow} = electron;
const fs = require('fs');
const configDir = app.getPath('appData') + '/DMS';

if (!app.isPackaged) {
    require('electron-reload')(__dirname);
} else {
    const {autoUpdater} = require('electron-updater');
    autoUpdater.checkForUpdatesAndNotify();
}

let mainWindow;

function createWindow () {
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(`${configDir}`);
        fs.mkdirSync(`${configDir}/npcs`);
        fs.mkdirSync(`${configDir}/events`);
        fs.mkdirSync(`${configDir}/locations`);
        fs.copyFileSync('./resources/app/players.json', `${configDir}/players.json`, (err) => {
            if(err) throw err;
        });
    }
    
    // Create the browser window.
    mainWindow = new BrowserWindow(
        {
            width: 1600, 
            height: 900,
            webPreferences: {
                nodeIntegration: true,
            }
        });

    // and load the index.html of the app.
    mainWindow.loadFile('resources/index.html');

    mainWindow.setMenu(null);

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', function(){
    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
