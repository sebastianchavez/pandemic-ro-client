const Alert = require("electron-alert");
const alertElectron = new Alert();

module.exports = {
    alert: (title, icon = 'error') => {
        alertElectron.fire({title, icon})
    }
}