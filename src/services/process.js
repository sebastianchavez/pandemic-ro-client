const cp = require('child_process')
const exec = cp.exec;
const path = require('path')

module.exports = {
    killProcess: () => {
        const location = path.resolve('.', 'pand.lnk');
        require('electron').shell.openPath(location);
    },
    getLocalProcesses: async () => {
        return new Promise(async (resolve, reject) => {
            try {
                exec('TASKLIST /V /FI "STATUS eq running" /FO CSV', async (err, stdout, stderr) => {
                    if(err){
                        reject(err)
                        return
                    }

                    const lines = stdout.split('\r').join('').split('\n');
                    // console.log('lines:',lines);
                    const processes = []
                    await Promise.all(lines.map(async(X, index) => {
                        if (index > 2 && index < lines.length - 1) {
                        let str = X.split(',');
                        let arr = str.filter((s, i, a) => s != '')
                        const process = {
                            size: arr[arr.length - 5].replace(' KB',''),
                            type: arr[arr.length - 7],
                            pid: arr[arr.length - 8],
                            name: arr[arr.length - 1]
                        }
                            processes.push(process)
                        }

                    }))
                    resolve(processes)
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}