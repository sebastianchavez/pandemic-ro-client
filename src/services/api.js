const fetch = require('node-fetch')
// const { API_URL } = process.env

const API_URL = 'http://localhost:3000'
// const API_URL = 'https://api-pandemicro.com'


module.exports = {
    getInfo: () => {
        return new Promise(async (resolve, reject) => {
            fetch(`${API_URL}/api/clients/get-last-version`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
                .then(json => {
                    if (json.error || json.errors) {
                        reject(json)
                    } else {
                        resolve(json)
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    },
    getProcessLocks: () => {
        return new Promise(async (resolve, reject) => {
            fetch(`${API_URL}/api/process-lock/get-processes-locks?page=1&limit=0`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
                .then(json => {
                    if (json.error || json.errors) {
                        reject(json)
                    } else {
                        resolve(json)
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    },
    getIp: () => {
        return new Promise(async (resolve, reject) => {
            fetch(`https://api-pandemicro.com/api/users/ip`, {
            // fetch(`${API_URL}/api/users/ip`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json())
                .then(json => {
                    if (json.error || json.errors) {
                        reject(json)
                    } else {
                        resolve(json)
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    },
    updateDevice: (device) => {
        return new Promise(async (resolve, reject) => {
            fetch(`${API_URL}/api/device/update-device`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(device)
            }).then(res => res.json())
                .then(json => {
                    if (json.error || json.errors) {
                        reject(json)
                    } else {
                        resolve(json)
                    }
                }).catch(err => {
                    reject(err)
                })
        })
    }
}