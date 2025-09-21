// 360MVP-functions/functions/src/payments/updateCredits.js
const admin = require('firebase-admin');

exports.updateCredits = async (userId, amount) => {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw "User document does not exist!";
    }
    const newCredits = (userDoc.data().creditosEvaluacion || 0) + amount;
    transaction.update(userRef, { creditosEvaluacion: newCredits });
  });
};
