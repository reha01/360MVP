// 360MVP-functions/functions/src/auth/getUserProfile.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
// Firebase Admin ya está inicializado en index.js, usar la instancia existente
if (admin.apps.length === 0) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.error('[getUserProfile] Error initializing admin:', e);
  }
}

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
