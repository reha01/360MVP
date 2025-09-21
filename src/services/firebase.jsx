// src/services/firebase.jsx
import { initializeApp } from "firebase/app";
import { 
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence 
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDOSjNqkO0KnW1QlyGYMwuL03FqYAVtX4w",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "discipulado-mvp-dev.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "discipulado-mvp-dev",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "discipulado-mvp-dev.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "87665033208",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:87665033208:web:abc123",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configurar persistencia
setPersistence(auth, browserLocalPersistence);

// Conectar emuladores solo si se especifica explícitamente
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

if (useEmulators && (location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
  try {
    // Auth Emulator
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    console.log('[360MVP] Firebase: Auth emulator conectado en puerto 9099');
  } catch (e) {
    console.warn('[360MVP] Firebase: Auth emulator ya estaba conectado');
  }
  
  try {
    // Firestore Emulator (preparado para futuro uso)
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    console.log('[360MVP] Firebase: Firestore emulator conectado en puerto 8080');
  } catch (e) {
    console.warn('[360MVP] Firebase: Firestore emulator ya estaba conectado');
  }
} else {
  console.log('[360MVP] Firebase: Usando servicios reales de Firebase');
}

const googleProvider = new GoogleAuthProvider();

// Funciones de conveniencia (mantenemos compatibilidad)
export const signUpWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => signOut(auth);

// Exportaciones adicionales para compatibilidad
export { googleProvider };

export { app, auth, db };
