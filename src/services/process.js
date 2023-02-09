const cp = require('child_process')
const exec = cp.exec;
const path = require('path')

module.exports = {
    killProcess: () => {
        const location = path.resolve('.', 'pand.lnk');
        require('electron').shell.openPath(location);
    },
    getLocalProcesses: () => {
        return new Promise(async (resolve, reject) => {
            try {
                exec('tasklist', (err, stdout, stderr) => {
                    if(err){
                        reject(err)
                        return
                    }

                    const lines = stdout.toString().split('\n');
                    const processes = []
                    lines.forEach((X, index) => {
                        let str = X.split(' ');
                        let arr = str.filter((s, i, a) => s != '' && i != (a.length - 1))
                        const process = {
                            size: arr[arr.length - 1],
                            type: arr[arr.length - 3],
                            pid: arr[arr.length - 4],
                            name: arr.filter((v, i, a) => i < (a.length - 4)).join(' ')
                        }
                        if (index > 2 && index < lines.length - 1) {
                            processes.push(process)
                        }
                     })
                     setTimeout(() => {
                         resolve(processes)
                     }, 1000);
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}