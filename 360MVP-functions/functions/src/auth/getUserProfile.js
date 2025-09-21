// 360MVP-functions/functions/src/auth/getUserProfile.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
try { admin.initializeApp(); } catch (e) { console.error(e); }

exports.getUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const uid = context.auth.uid;
  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User profile not found.');
  }

  return userDoc.data();
});
