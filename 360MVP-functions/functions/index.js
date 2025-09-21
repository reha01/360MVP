// 360MVP-functions/functions/index.js
const admin = require('firebase-admin');
try { admin.initializeApp(); } catch (e) { console.error(e); }
const functions = require('firebase-functions');

const authFunctions = require('./src/auth/onCreate');
const profileFunctions = require('./src/auth/getUserProfile');

exports.onUserCreate = authFunctions.onUserCreate;
exports.getUserProfile = profileFunctions.getUserProfile;
