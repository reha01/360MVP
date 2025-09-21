// 360MVP-functions/functions/src/evaluation/getQuestions.js
const functions = require('firebase-functions');
// TODO: Implement logic to fetch questions from Firestore

exports.getQuestions = functions.https.onCall(async (data, context) => {
  // For now, return dummy data
  return [{ id: 'q1', text: 'Sample Question 1' }];
});
