const { app, BrowserWindow, Menu, ipcMain, shell, remote } = require('electron')
const url = require('url')
const path = require('path')
const api = require('./services/api')
const { download } = require("electron-dl");
const DecompressZip = require('decompress-zip');
const fs = require('fs')

if (require('electron-squirrel-startup')) return;

let savePath = path.join(__dirname, '../../../../')
let menu = null
let localPath = ''
let version = ''
// DEV
// require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, '../node_modules', '.bin', 'electron')
// })
// menu = [{
//     label: 'DevTools',
//     submenu: [
//         {
//             label: 'Show/Hide Dev Tools',
//             accelerator: 'Ctrl+D',
//             click(item, focusedWindow) {
//                 focusedWindow.toggleDevTools()
//             },
//         },
//         {
//             role: 'reload'
//         }
//     ]
// }]

let mainWindow

app.on('ready', () => {

    mainWindow = new BrowserWindow({
        width: 520,
        height: 720,
        resizable: menu ? true : false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/index.html'),
        protocol: 'file',
        slashes: true
    }))

    let mainMenu = null
    if (menu) {
        mainMenu = Menu.buildFromTemplate(menu)
    }
    Menu.setApplicationMenu(mainMenu)

    mainWindow.on('closed', () => {
        app.quit()
    })



})

ipcMain.on("download", (event, info) => {

    mainWindow.webContents.send('path', savePath)
    download(BrowserWindow.getFocusedWindow(), info.url, {
        directory: path.resolve('../'), onProgress: (progress) => {
            mainWindow.webContents.send("progress", progress)
        }
    })
        .then(dl => {
            localPath = dl.getSavePath()
            if (info.url.substring(info.url.length - 4) == '.zip') {
                extractFile(localPath)
            }
            return mainWindow.webContents.send("download complete", localPath)
        });
});


ipcMain.on('exit', (e, res) => {
    app.quit()
})

ipcMain.on('getInfo', async (e, res) => {
    try {
        const response = await api.getInfo()
        mainWindow.webContents.send('getInfo:ok', { response, version })
    } catch (error) {
        mainWindow.webContents.send('getInfo:ok', error)
    }
})

ipcMain.on('goToRegister', (e, res) => {
    e.preventDefault();
    require('electron').shell.openPath(`https://www.pandemic-ro.com/#/registro`);
})

ipcMain.on('checkVersion', (e, res) => {
    checkVersion()
})

ipcMain.on('openGame', (e, res) => {
    e.preventDefault();

    const location = path.resolve('../', 'PandemicRO.exe');
    require('electron').shell.openPath(location);
    app.exit()

})

function extractFile(url) {
    // var ZIP_FILE_PATH = path.resolve('../', 'cliente.zip');
    var DESTINATION_PATH = path.resolve('../', '.');
    var unzipper = new DecompressZip(url);

    // Add the error event listener
    unzipper.on('error', function (err) {
        mainWindow.webContents.send("error progress", err)
    });

    // Notify when everything is extracted
    unzipper.on('extract', function (log) {
        mainWindow.webContents.send("extract", log)
        deleteFile(localPath)
    });

    // Notify "progress" of the decompressed files
    unzipper.on('extract progress', function (fileIndex, fileCount) {
        let progress = (fileIndex + 1) + ' of ' + fileCount
        mainWindow.webContents.send("extractprogress", progress)
    });

    // Start extraction of the content
    unzipper.extract({
        path: DESTINATION_PATH
        // You can filter the files that you want to unpack using the filter option
        //filter: function (file) {
        //console.log(file);
        //return file.type !== "SymbolicLink";
        //}
    });

}


function deleteFile(filepath) {
    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
            if (err) {
                console.log("An error ocurred updating the file" + err.message);
                console.log(err);
                return;
            }
            console.log("File succesfully deleted");
        });
    } else {
        console.log("This file doesn't exist, cannot delete");
    }
}

function checkVersion() {
    let filepath = savePath + 'version.txt'
    if (fs.existsSync(filepath)) {
        fs.readFile(filepath, 'utf-8', (err, res) => {
            if (err) {
                mainWindow.webContents.send("error check", err)
                return
            }
            version = res;
            mainWindow.webContents.send("check", res)
        })
    } else {
        mainWindow.webContents.send("check", 'no existe! ' + filepath)
    }
}