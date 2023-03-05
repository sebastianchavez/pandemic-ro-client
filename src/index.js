const { app, BrowserWindow, Menu, ipcMain, shell, remote, dialog } = require('electron')
const url = require('url')
const path = require('path')
const api = require('./services/api')
const { download } = require("electron-dl");
const DecompressZip = require('decompress-zip');
const fs = require('fs')
const address = require('address');
const dialogApp = dialog 

const constants = require('./config/constants')
const { alert } = require('./services/alert')
const { getLocalProcesses, killProcess } = require('./services/process')

const socketService = require('./services/socket')


if (require('electron-squirrel-startup')) return;

let menu = null
let localPath = ''
let version = ''
let processes = []
let processLocks = []
let device = {
    mac: '',
    os: '',
    ip: ''
}

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

let mainWindow

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


ipcMain.on('exit', (e, res) => {
    app.hide()
})

ipcMain.on('closeWindow', function (event) {
    const current = BrowserWindow.getFocusedWindow()
    if (current) current.close()
})


ipcMain.on('getInfo', async (e, res) => {
    try {
        await getProcess()
        await getCurrentDevice()
        await getIpInfo()
        const response = await api.getInfo()
        const responseProcessLocks = await api.getProcessLocks()
        processLocks = responseProcessLocks.processLocks
        setInterval(async() => {
            await getProcess()
            let instances = processes.filter(p => p.name.toLowerCase().includes('pandemicro'))
            if(instances.length > 0){
                checkProcess()
            }
        }, 10000);
        mainWindow.webContents.send('getInfo:ok', { response, version, processLocks })
    } catch (error) {
        console.log('ERROR:', error);
        mainWindow.webContents.send('getInfo:ok', error)
    }
})

ipcMain.on('goToRegister', (e, res) => {
    e.preventDefault();
    shell.openPath(constants.REGISTER_URL);
})

ipcMain.on('goToDiscord', (e, res) => {
    e.preventDefault();
    shell.openPath(constants.DISCORD_URL);
})

ipcMain.on('goToFacebook', (e, res) => {
    e.preventDefault(); 
    shell.openPath(constants.FB_URL);
})

ipcMain.on('goToInstagram', (e, res) => {
    e.preventDefault();
    shell.openPath(constants.INSTAGRAM_URL);
})

ipcMain.on('checkVersion', (e, res) => {
    checkVersion()
})

ipcMain.on('openGame', (e, res) => {
    e.preventDefault()
    if(checkInstances(constants.MAX_INSTANCES)){
        mainWindow.webContents.send('loading', true)
        let filepathExe = path.resolve('.', 'PandemicRO.exe');
        let isExiste = false
        if (fs.existsSync(filepathExe)) {
            isExiste = true
            fs.renameSync(path.resolve('.', 'PandemicRO.exe'), path.resolve('.', 'pandemic.dat'))
        }
        if(isExiste){
            setTimeout(() => {
                openFile()
            }, 1000);
        } else {
            openFile()
        }
    } else {
        alert('Ha alcanzado el máximo de clientes abiertos')
    }
})

const openFile = () => {
    let filepath = path.resolve('.', 'pandemic.dat');
    if (fs.existsSync(filepath)) {
        openExe(filepath)
    } else {
        let filepath = path.resolve('.', 'PandemicRO.exe');
        if (fs.existsSync(filepath)) {
            openExe(filepath, 2)
        } else {
            // TODO: validar archivos, descargar exe si no existe
        }
    }
}

const openExe = (filepath, caseOfUse = 1) => {
    fs.readFile(filepath, 'utf-8', async (err, res) => {
        if (err) {
            console.log('error:', error);
            return
        }
        if(caseOfUse = 2){
            fs.renameSync(path.resolve('.', 'pandemic.dat'), path.resolve('.', 'PandemicRO.exe'))
        }

        setTimeout(() => {
            const location = path.resolve('.', 'PandemicRO.exe');
            require('electron').shell.openPath(location);
         
            setTimeout(() => {
                fs.renameSync(path.resolve('.', 'PandemicRO.exe'), path.resolve('.', 'pandemic.dat'))
                app.hide()
            }, 1000);
        }, 1000);
    })
}

const checkProcess = async () => {

    let isKill = false
    const { NAME, SIZE, TYPE } = constants.TYPES_VALIDATION
    for await (let p of processLocks){
        let typeValidation = p.typeValidation.split(',')
        let value = p.value.split(',')
        if(typeValidation.find(x => x == NAME)){
            let index = 0
            for await(let t of typeValidation){
                if(t == NAME){
                        let processIsLock = processes.find(x => x.name.toLowerCase().includes(value[index].toLowerCase()))
                        if(processIsLock){
                            isKill = true
                        }
                    }
                    index++
                }
            } else {
                let indexSize
                let indexType
                typeValidation.forEach((x, i) => {
                    if(x == TYPE){
                        indexType = i
                    } else if(x == SIZE){
                        indexSize = i
                    }
                })

                await Promise.all(processes.map(x => {
                    if(x.type.toLowerCase() == value[indexType].toLowerCase() && validateRangeSize(parseFloat(x.size.split('.').join('')), parseFloat(value[indexSize]), p.range, x.name)){
                        isKill = true
                    }
                }))                
        }
    }
    
    if(!checkInstances(constants.MAX_INSTANCES + 1)){
        alert('Se ha detectado un comportamiento inapropiado')
        killProcess()
        return
    }

    setTimeout(() => {
        if(isKill){
                alert('Se ha detectado una aplicación no admitida...')
                killProcess()
                // TODO: registrar dispositivo, desconexion desde rathena y log de avisos
        }
    }, 1000);
}

const validateRangeSize = (size, sizeLock, range, name) => {
    // range 100% = 10000
    const newRange = Math.round((size*range)/10000)
    if((size + newRange) > sizeLock && (size - newRange) < sizeLock){
        console.log('validateRangeSize 1:', {size, sizeLock, newRange, name});
        return true
    } else {
        return false
    }
}

const getProcess = async () => {
    processes = []
    try {
        processes = await getLocalProcesses()
        console.log('processes:',processes);
        // generateFileProcess(processes)
    } catch (error) {
        console.log('getProcess - ERROR:', error)
    }
}

const getCurrentDevice = () => {
    const ipv4 = address.ip();   // '192.168.0.2'
    const ipv6 = address.ipv6(); // 'fe80::7aca:39ff:feb0:e67d'
    address.mac(function (err, addr) {
        const mac = addr; // 'fe80::7aca:39ff:feb0:e67d'
        const os = process.env.OS
        device.mac = mac
        device.os = os
        console.log('device:', device);
        console.log({ mac, ipv4, ipv6 }); // '78:ca:39:b0:e6:7d'
    });
}

const extractFile = (url) => {
    // var ZIP_FILE_PATH = path.resolve('../', 'cliente.zip');
    const destinationPath = path.resolve('.');
    const unzipper = new DecompressZip(url);

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
        path: destinationPath
        // You can filter the files that you want to unpack using the filter option
        //filter: function (file) {
        //console.log(file);
        //return file.type !== "SymbolicLink";
        //}
    });

}


const deleteFile = (filepath) => {
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

const checkVersion = () => {
    let filepath = path.resolve('.', 'version.txt');
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


const getIpInfo = async () => {
    try {
        const response = await api.getIp()
        device.ip = response.ip
        updateDevice()
    } catch (error) {
        console.log('ERROR:',error);
    }
}

const updateDevice = async () => {
    try {
        console.log('device:', device);
        socketService.sendDataIsConnected(device)
        // await api.updateDevice(device)
    } catch (error) {
        console.log('ERROR:', error);
    }
}

// funcion para desarrollo
const generateFileProcess = (process) => { 

    dialogApp.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, '../assets/sample.txt'),
        // defaultPath: path.join(__dirname, '../assets/'),
        buttonLabel: 'Save',
        // Restricting the user to only Text Files.
        filters: [
            {
                name: 'Text Files',
                extensions: ['txt', 'docx']
            }, ],
        properties: []
    }).then(file => {
        // Stating whether dialog operation was cancelled or not.
        console.log(file.canceled);
        if (!file.canceled) {
            console.log(file.filePath.toString());
              
            // Creating and Writing to the sample.txt file
            fs.writeFile(file.filePath.toString(), 
                         JSON.stringify(process), function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
        }
    }).catch(err => {
        console.log(err)
    });
}

const checkInstances = async (maxInstances) => {
    await getProcess()

    const instances = processes.filter(p => p.name.toLowerCase() == 'pandemicro.exe')
    if(instances.length >= maxInstances){
        return false
    }
    return true
}