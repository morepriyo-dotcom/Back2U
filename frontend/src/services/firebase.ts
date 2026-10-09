import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.authDomain
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    console.info('[Firebase] Successfully initialized Firebase Authentication client.');
  } catch (err) {
    console.warn('[Firebase] Failed to initialize Firebase:', err);
  }
} else {
  console.info(
    '[Firebase] External Firebase configuration is not supplied in .env. Falling back to local backend JWT authentication.'
  );
}

export { auth };

export const firebaseAuthService = {
  isConfigured: isFirebaseConfigured,

  signIn: async (email: string, password: string): Promise<string> => {
    if (!auth) throw new Error('Firebase Auth is not configured. Supply VITE_FIREBASE_* in frontend/.env.');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await userCredential.user.getIdToken();
  },

  signUp: async (email: string, password: string): Promise<string> => {
    if (!auth) throw new Error('Firebase Auth is not configured. Supply VITE_FIREBASE_* in frontend/.env.');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return await userCredential.user.getIdToken();
  },

  signOut: async (): Promise<void> => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  },

  getIdToken: async (): Promise<string | null> => {
    if (!auth || !auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  }
};
