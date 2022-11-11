const fetch = require('node-fetch')
// const { URL_UPDATE } = process.env

const URL_UPDATE = 'http://localhost:3000'
// const URL_UPDATE = 'https://api-pandemicro.com'


module.exports = {
    getInfo: () => {
        return new Promise(async (resolve, reject) => {
            fetch(`${URL_UPDATE}/api/clients/get-last-version`, {
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
    }

}