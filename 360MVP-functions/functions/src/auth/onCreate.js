// 360MVP-functions/functions/src/auth/onCreate.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
// Firebase Admin ya está inicializado en index.js, no inicializar de nuevo

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);

  const doc = await userRef.get();
  if (doc.exists) {
    // Idempotency: if doc exists, check if credits are missing
    if (doc.data().credits === undefined) {
      return userRef.update({ credits: 1 });
    }
    return null;
  }

  return userRef.set({
    email,
    displayName: displayName || email.split('@')[0],
    credits: 1,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});
