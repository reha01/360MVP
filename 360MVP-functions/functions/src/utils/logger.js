// 360MVP-functions/functions/src/utils/logger.js
const functions = require('firebase-functions');

const log = (message, data) => {
  functions.logger.info(message, data);
};

const error = (message, err) => {
  functions.logger.error(message, err);
};

module.exports = { log, error };
