// 360MVP-functions/functions/src/utils/constants.js
const functions = require('firebase-functions');

module.exports = {
  ENABLE_ADVANCED_INSIGHTS: functions.config().features?.enable_advanced_insights || 'false',
};
