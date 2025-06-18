const fs = require('fs');
const config = require('../config/config');

exports.write = (message) => {
  const logEntry = `${new Date().toISOString()} — ${message}\n`;
  fs.appendFileSync(config.LOG_FILE, logEntry);
};
