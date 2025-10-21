// 360MVP-functions/functions/index.js
const admin = require('firebase-admin');
try { admin.initializeApp(); } catch (e) { console.error(e); }
const functions = require('firebase-functions');

const authFunctions = require('./src/auth/onCreate');
const profileFunctions = require('./src/auth/getUserProfile');

// Email functions
const sendInvitations = require('./src/email/sendInvitations');
const sendReminders = require('./src/email/sendReminders');
const sendThanks = require('./src/email/sendThanks');
const send360Invitations = require('./src/email/send360Invitations');
const send360Reminders = require('./src/email/send360Reminders');

// Report functions
const reportFunctions = require('./src/reports/generateReport');

// Aggregation functions
const process360Aggregations = require('./src/aggregation/process360Aggregations');

exports.onUserCreate = authFunctions.onUserCreate;
exports.getUserProfile = profileFunctions.getUserProfile;

// Email exports
exports.sendInvitations = sendInvitations.sendInvitations;
exports.sendReminders = sendReminders.sendReminders;
exports.sendThanks = sendThanks.sendThanks;
exports.onEvaluationCompleted = sendThanks.onEvaluationCompleted;
exports.send360Invitations = send360Invitations.send360Invitations;
exports.send360Reminders = send360Reminders.send360Reminders;

// Report exports
exports.generateReport = reportFunctions.generateReport;
exports.getReport = reportFunctions.getReport;
exports.listReports = reportFunctions.listReports;

// Aggregation exports
exports.process360Aggregations = process360Aggregations.process360Aggregations;
