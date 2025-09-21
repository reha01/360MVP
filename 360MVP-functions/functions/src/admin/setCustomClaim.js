// 360MVP-functions/functions/src/admin/setCustomClaim.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.setCustomClaim = functions.https.onCall(async (data, context) => {
  // Manual super-admin check for demo purposes
  // In a real app, this should check for an existing admin custom claim
  const superAdminEmail = 'superadmin@example.com';
  if (context.auth.token.email !== superAdminEmail) {
    throw new functions.https.HttpsError('permission-denied', 'Only a super-admin can set custom claims.');
  }

  const { uid, role } = data;
  await admin.auth().setCustomUserClaims(uid, { role });

  return { message: `Success! ${uid} has been made a(n) ${role}.` };
});
