import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.jsx';

/**
 * Firestore Service - Abstrae las operaciones de base de datos
 */

// ========== USERS ==========
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userProfile = {
      uid,
      email: userData.email,
      displayName: userData.displayName || null,
      photoURL: userData.photoURL || null,
      emailVerified: userData.emailVerified || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      preferences: {
        language: 'es',
        notifications: true
      },
      credits: 3, // Créditos iniciales
      evaluationsCompleted: 0,
      plan: 'free'
    };
    
    await setDoc(userRef, userProfile);
    console.log('[360MVP] Firestore: User profile created for:', uid);
    return userProfile;
  } catch (error) {
    console.error('[360MVP] Firestore: Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      console.log('[360MVP] Firestore: No user profile found for:', uid);
      return null;
    }
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('[360MVP] Firestore: User profile updated for:', uid);
  } catch (error) {
    console.error('[360MVP] Firestore: Error updating user profile:', error);
    throw error;
  }
};

// ========== EVALUATIONS ==========
export const createEvaluation = async (userId, evaluationData) => {
  try {
    const evaluationRef = collection(db, 'evaluations');
    const evaluation = {
      userId,
      title: evaluationData.title || 'Evaluación 360°',
      status: 'draft', // draft, in_progress, completed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      progress: 0,
      totalQuestions: evaluationData.totalQuestions || 0,
      answeredQuestions: 0,
      category: evaluationData.category || 'leadership',
      ...evaluationData
    };
    
    const docRef = await addDoc(evaluationRef, evaluation);
    console.log('[360MVP] Firestore: Evaluation created with ID:', docRef.id);
    return { id: docRef.id, ...evaluation };
  } catch (error) {
    console.error('[360MVP] Firestore: Error creating evaluation:', error);
    throw error;
  }
};

export const getUserEvaluations = async (userId) => {
  try {
    const evaluationsRef = collection(db, 'evaluations');
    const q = query(
      evaluationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const evaluations = [];
    
    querySnapshot.forEach((doc) => {
      evaluations.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[360MVP] Firestore: Retrieved', evaluations.length, 'evaluations for user:', userId);
    return evaluations;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting user evaluations:', error);
    throw error;
  }
};

export const updateEvaluation = async (evaluationId, updates) => {
  try {
    const evaluationRef = doc(db, 'evaluations', evaluationId);
    await updateDoc(evaluationRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('[360MVP] Firestore: Evaluation updated:', evaluationId);
  } catch (error) {
    console.error('[360MVP] Firestore: Error updating evaluation:', error);
    throw error;
  }
};

// ========== RESPONSES ==========
export const saveResponse = async (evaluationId, questionId, responseData) => {
  try {
    const responseRef = doc(db, 'evaluations', evaluationId, 'responses', questionId);
    const response = {
      evaluationId,
      questionId,
      answer: responseData.answer,
      value: responseData.value || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(responseRef, response);
    console.log('[360MVP] Firestore: Response saved for question:', questionId);
    return response;
  } catch (error) {
    console.error('[360MVP] Firestore: Error saving response:', error);
    throw error;
  }
};

export const getEvaluationResponses = async (evaluationId) => {
  try {
    const responsesRef = collection(db, 'evaluations', evaluationId, 'responses');
    const querySnapshot = await getDocs(responsesRef);
    const responses = [];
    
    querySnapshot.forEach((doc) => {
      responses.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('[360MVP] Firestore: Retrieved', responses.length, 'responses for evaluation:', evaluationId);
    return responses;
  } catch (error) {
    console.error('[360MVP] Firestore: Error getting evaluation responses:', error);
    throw error;
  }
};

// ========== UTILITY FUNCTIONS ==========
export const initializeUserOnFirstLogin = async (user) => {
  try {
    const existingProfile = await getUserProfile(user.uid);
    
    if (!existingProfile) {
      console.log('[360MVP] Firestore: First login detected, creating user profile...');
      return await createUserProfile(user.uid, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      });
    }
    
    console.log('[360MVP] Firestore: User profile exists, returning existing profile');
    return existingProfile;
  } catch (error) {
    console.error('[360MVP] Firestore: Error initializing user:', error);
    throw error;
  }
};
