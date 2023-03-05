const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron')
const url = require('url')
const { download } = require("electron-dl");
const { alert } = require('./services/alert')
const dialogApp = dialog 

let mainWindow
let localPath = ''
// DEV
// require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, '../node_modules', '.bin', 'electron')
// })
menu = [{
    label: 'DevTools',
    submenu: [
        {
            label: 'Show/Hide Dev Tools',
            accelerator: 'Ctrl+D',
            click(item, focusedWindow) {
                focusedWindow.toggleDevTools()
            },
        },
        {
            role: 'reload'
        }
    ]
}]
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
    })
      
    app.on('ready', () => {
        mainWindow = new BrowserWindow({
            width: 1000,
            height: 625,
            resizable: menu ? true : false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            icon: path.join(__dirname, '/assets/icons/icon.ico'),
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
            // app.quit()
            app.hide()
        })
    })
}

ipcMain.on("download", (event, info) => {
    if(checkInstances(1)){
        download(BrowserWindow.getFocusedWindow(), info.url, {
            directory: path.resolve('.'), onProgress: (progress) => {
                mainWindow.webContents.send("progress", progress)
            }
        })
            .then(dl => {
                localPath = dl.getSavePath()
                if (info.url.substring(info.url.length - 4) == '.zip') {
                    extractFile(localPath)
                }
                return mainWindow.webContents.send("download complete", localPath)
            })
    } else {
        alert('Debe cerrar Cliente para actualizar');
    }
})

ipcMain.on('getInfo', async (e, res) => {
    try {
    //     await getProcess()
    //     await getCurrentDevice()
    //     await getIpInfo()
        const response = await api.getInfo()
        processLocks = await api.getProcessLocks()
        setInterval(async() => {
            await getProcess()
            let instances = processes.filter(p => p.name.toLowerCase().includes('pandemicro'))
            if(instances.length > 0){
                checkProcess()
            }
        }, 10000);
        mainWindow.webContents.send('getInfo:ok', { response, version, processLocks })
    } catch (error) {
        mainWindow.webContents.send('getInfo:ok', error)
    }
})

ipcMain.on('goToRegister', (e, res) => {
    e.preventDefault();
    shell.openPath(constants.REGISTER_URL);
})

ipcMain.on('goToDiscord', (e, res) => {
    e.preventDefault();
    require('electron').shell.openPath(constants.DISCORD_URL);
})

ipcMain.on('goToFacebook', (e, res) => {
    e.preventDefault(); 
    require('electron').shell.openPath(constants.FB_URL);
})

ipcMain.on('goToInstagram', (e, res) => {
    e.preventDefault();
    require('electron').shell.openPath(constants.INSTAGRAM_URL);
})

ipcMain.on('exit', (e, res) => {
    app.hide()
})

ipcMain.on('closeWindow', function (event) {
    const current = BrowserWindow.getFocusedWindow()
    if (current) current.close()
})
