const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

const logFile = path.join(LOG_DIR, `system_${new Date().toISOString().split('T')[0]}.log`);

function info(message, data = {}) {
    const logEntry = `[INFO] [${new Date().toISOString()}] ${message} ${JSON.stringify(data)}\n`;
    console.log(logEntry.trim());
    fs.appendFileSync(logFile, logEntry);
}

function error(message, err = {}) {
    const logEntry = `[ERROR] [${new Date().toISOString()}] ${message} - ${err.message || err} ${err.stack || ''}\n`;
    console.error(logEntry.trim());
    fs.appendFileSync(logFile, logEntry);
}

function audit(user, action, details = {}) {
    const logEntry = `[AUDIT] [${new Date().toISOString()}] User: ${user} | Action: ${action} | Details: ${JSON.stringify(details)}\n`;
    fs.appendFileSync(logFile, logEntry);
}

module.exports = { info, error, audit };
