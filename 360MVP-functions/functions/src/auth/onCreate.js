// 360MVP-functions/functions/src/auth/onCreate.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
try { admin.initializeApp(); } catch (e) { console.error(e); }

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
