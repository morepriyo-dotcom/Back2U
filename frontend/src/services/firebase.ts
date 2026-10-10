import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import {
  getDatabase,
  Database,
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
  push as rtdbPush,
  onValue as rtdbOnValue
} from 'firebase/database';

export interface FirebaseConfigOptions {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  databaseURL?: string;
}

const firebaseConfig: FirebaseConfigOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    
    if (firebaseConfig.databaseURL) {
      try {
        rtdb = getDatabase(app);
      } catch (rtdbErr) {
        console.warn('[Firebase Realtime DB] Optional Realtime DB init deferred:', rtdbErr);
      }
    }
    
    console.info(`[Firebase] Successfully connected to Firebase Project: "${firebaseConfig.projectId}" (Firestore & Auth active)`);
  } catch (err) {
    console.warn('[Firebase] Failed to initialize Firebase client:', err);
  }
} else {
  console.info(
    '[Firebase] External Firebase configuration is not set in frontend/.env. Operating in local mode with backend API fallback.'
  );
}

export { app, auth, db, rtdb };

// ---------------------------------------------------------
// Firebase Authentication Service
// ---------------------------------------------------------
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
  },

  /**
   * Dispatches a real physical SMS verification code to the user's phone via Firebase/Google
   */
  sendPhoneOTP: async (phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<ConfirmationResult> => {
    if (!auth) throw new Error('Firebase Auth is not configured. Supply VITE_FIREBASE_* in frontend/.env.');
    
    let formatted = phoneNumber.trim().replace(/[^\d+]/g, '');
    if (!formatted.startsWith('+')) {
      if (formatted.length === 10) {
        formatted = `+91${formatted}`;
      } else {
        formatted = `+${formatted}`;
      }
    }

    // Clean up previous recaptcha verifier if exists
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch {}
    }

    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('[Firebase Phone Auth] Invisible reCAPTCHA verification passed.');
      }
    });

    const confirmationResult = await signInWithPhoneNumber(auth, formatted, (window as any).recaptchaVerifier);
    return confirmationResult;
  },

  /**
   * Verifies the real 6-digit SMS code received on the user's mobile phone
   */
  confirmPhoneOTP: async (confirmationResult: ConfirmationResult, code: string): Promise<string> => {
    const userCredential = await confirmationResult.confirm(code);
    return await userCredential.user.getIdToken();
  }
};

// ---------------------------------------------------------
// Firebase Cloud Firestore & Realtime Database Service
// ---------------------------------------------------------
export const firebaseDbService = {
  isConfigured: isFirebaseConfigured && db !== null,
  projectId: firebaseConfig.projectId || null,

  /**
   * Diagnostic method to test Firestore read/write latency and connectivity.
   */
  testConnection: async (): Promise<{ success: boolean; message: string; latencyMs?: number; projectId?: string }> => {
    if (!db) {
      return {
        success: false,
        message: 'Firestore is not initialized. Please configure VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY in frontend/.env.',
        projectId: firebaseConfig.projectId || undefined
      };
    }

    const startTime = performance.now();
    try {
      const pingRef = doc(db, '_back2u_system', 'connectivity_check');
      const testTimestamp = new Date().toISOString();
      await setDoc(pingRef, {
        client: 'Back2U Web App',
        status: 'ONLINE',
        last_ping: testTimestamp,
        updated_at: serverTimestamp()
      }, { merge: true });

      const snap = await getDoc(pingRef);
      const latencyMs = Math.round(performance.now() - startTime);

      if (snap.exists()) {
        return {
          success: true,
          message: `Connected to Cloud Firestore successfully (${latencyMs}ms)`,
          latencyMs,
          projectId: firebaseConfig.projectId
        };
      } else {
        return {
          success: false,
          message: 'Document write acknowledged but snapshot read failed.',
          latencyMs,
          projectId: firebaseConfig.projectId
        };
      }
    } catch (err: any) {
      console.error('[Firebase DB] Connection test failed:', err);
      return {
        success: false,
        message: err.message || 'Firebase Firestore connection test failed.',
        projectId: firebaseConfig.projectId
      };
    }
  },

  /**
   * Mirror/Synchronize an item to Firestore
   */
  syncItem: async (item: {
    id: number | string;
    report_type: string;
    title: string;
    category: string;
    description: string;
    location_name: string;
    incident_date?: string;
    image_url?: string;
    custody_status?: string;
    status: string;
    reporter_id?: number;
    lr_number?: string;
    [key: string]: any;
  }): Promise<void> => {
    if (!db) return;
    try {
      const itemDocRef = doc(db, 'items', String(item.id));
      await setDoc(itemDocRef, {
        ...item,
        id: String(item.id),
        synced_at: serverTimestamp()
      }, { merge: true });
      console.info(`[Firebase DB] Item #${item.id} synchronized to Firestore.`);
    } catch (err) {
      console.warn(`[Firebase DB] Failed to sync item #${item.id} to Firestore:`, err);
    }
  },

  /**
   * Query items from Firestore with optional filtering
   */
  getItems: async (options: {
    reportType?: string;
    category?: string;
    limitCount?: number;
  } = {}): Promise<any[]> => {
    if (!db) return [];
    try {
      const itemsCol = collection(db, 'items');
      const constraints: any[] = [];

      if (options.reportType && options.reportType !== 'ALL') {
        constraints.push(where('report_type', '==', options.reportType.toUpperCase()));
      }
      if (options.category && options.category !== 'All') {
        constraints.push(where('category', '==', options.category));
      }
      if (options.limitCount) {
        constraints.push(limit(options.limitCount));
      }

      const q = query(itemsCol, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('[Firebase DB] Error fetching items from Firestore:', err);
      return [];
    }
  },

  /**
   * Realtime Listener for items: triggers whenever an item is added or updated in Firestore.
   */
  subscribeItems: (
    callback: (items: any[]) => void,
    options: { reportType?: string; limitCount?: number } = {}
  ): Unsubscribe => {
    if (!db) {
      callback([]);
      return () => {};
    }

    const itemsCol = collection(db, 'items');
    const constraints: any[] = [];

    if (options.reportType && options.reportType !== 'ALL') {
      constraints.push(where('report_type', '==', options.reportType.toUpperCase()));
    }
    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(itemsCol, ...constraints);
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
      },
      (error) => {
        console.warn('[Firebase DB] Item subscription error:', error);
      }
    );
  },

  /**
   * Submit a claim record to Firestore
   */
  createClaim: async (claimData: {
    item_id: number | string;
    claimant_id: number | string;
    status: string;
    challenge_answer?: string;
    serial_number?: string;
    receipt_url?: string;
    notes?: string;
    [key: string]: any;
  }): Promise<string | null> => {
    if (!db) return null;
    try {
      const claimsCol = collection(db, 'claims');
      const docRef = await addDoc(claimsCol, {
        ...claimData,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.warn('[Firebase DB] Failed to record claim in Firestore:', err);
      return null;
    }
  },

  /**
   * Realtime Listener for claims related to an item
   */
  subscribeItemClaims: (
    itemId: number | string,
    callback: (claims: any[]) => void
  ): Unsubscribe => {
    if (!db) {
      callback([]);
      return () => {};
    }

    const claimsCol = collection(db, 'claims');
    const q = query(claimsCol, where('item_id', '==', Number(itemId)));
    return onSnapshot(
      q,
      (snapshot) => {
        const claims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(claims);
      },
      (error) => {
        console.warn('[Firebase DB] Claim subscription error:', error);
      }
    );
  },

  /**
   * Realtime Live Chat / Inquiry Messages for an item (between finder and claimant)
   */
  sendItemMessage: async (
    itemId: number | string,
    message: {
      sender_id: number | string;
      sender_name: string;
      text: string;
      is_finder?: boolean;
    }
  ): Promise<string | null> => {
    if (!db) return null;
    try {
      const msgsCol = collection(db, 'items', String(itemId), 'messages');
      const docRef = await addDoc(msgsCol, {
        ...message,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.warn('[Firebase DB] Failed to send message to Firestore:', err);
      return null;
    }
  },

  /**
   * Subscribe to live real-time chat messages for an item
   */
  subscribeItemMessages: (
    itemId: number | string,
    callback: (messages: any[]) => void
  ): Unsubscribe => {
    if (!db) {
      callback([]);
      return () => {};
    }

    const msgsCol = collection(db, 'items', String(itemId), 'messages');
    const q = query(msgsCol, orderBy('created_at', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(msgs);
      },
      (error) => {
        console.warn('[Firebase DB] Message subscription error:', error);
      }
    );
  },

  /**
   * Send a real-time notification to a user's Firestore inbox
   */
  sendNotification: async (
    userId: number | string,
    notification: {
      title: string;
      message: string;
      type: string;
      link_url?: string;
    }
  ): Promise<string | null> => {
    if (!db) return null;
    try {
      const userNotifsCol = collection(db, 'users', String(userId), 'notifications');
      const docRef = await addDoc(userNotifsCol, {
        ...notification,
        is_read: false,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      console.warn('[Firebase DB] Failed to send notification to Firestore:', err);
      return null;
    }
  },

  /**
   * Realtime Listener for user notifications
   */
  subscribeUserNotifications: (
    userId: number | string,
    callback: (notifications: any[]) => void
  ): Unsubscribe => {
    if (!db) {
      callback([]);
      return () => {};
    }

    const userNotifsCol = collection(db, 'users', String(userId), 'notifications');
    const q = query(userNotifsCol, orderBy('created_at', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(notifs);
      },
      (error) => {
        console.warn('[Firebase DB] User notifications subscription error:', error);
      }
    );
  },

  // ------------------------------------------------------------------
  // Direct Frontend Input Auto-Persistence & Mirroring
  // ------------------------------------------------------------------

  /**
   * Universal recorder for ANY input submitted through the frontend UI.
   * Directly persists into the target Firestore collection with fallback queue.
   */
  recordFrontendInput: async (
    collectionName: string,
    docId: string | number | undefined,
    data: Record<string, any>
  ): Promise<string | null> => {
    const sanitize = (val: any): any => {
      if (val === undefined) return null;
      if (val === null || typeof val !== 'object') return val;
      if (val instanceof Date) return val.toISOString();
      if (Array.isArray(val)) return val.map(sanitize);
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) {
          out[k] = sanitize(v);
        }
      }
      return out;
    };

    const cleanData = sanitize({
      ...data,
      _source: 'FRONTEND_INPUT',
      _client_recorded_at: new Date().toISOString()
    });

    if (db) {
      try {
        if (docId !== undefined && docId !== null && String(docId).trim() !== '') {
          const docRef = doc(db, collectionName, String(docId));
          await setDoc(docRef, cleanData, { merge: true });
          console.info(`[Firebase DB] Directly recorded frontend input in ${collectionName}/${docId}`);
          return String(docId);
        } else {
          const colRef = collection(db, collectionName);
          const docRef = await addDoc(colRef, cleanData);
          console.info(`[Firebase DB] Directly recorded frontend input in ${collectionName}/${docRef.id}`);
          return docRef.id;
        }
      } catch (err) {
        console.warn(`[Firebase DB] Direct write to ${collectionName} deferred:`, err);
      }
    }

    // Queue locally if Firestore is disconnected or offline so it syncs when connected
    try {
      const queueKey = 'back2u_firebase_pending_queue';
      const raw = localStorage.getItem(queueKey);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({
        collectionName,
        docId: docId ? String(docId) : undefined,
        data: cleanData,
        queuedAt: new Date().toISOString()
      });
      localStorage.setItem(queueKey, JSON.stringify(queue.slice(-100)));
    } catch {
      // localStorage error fallback
    }
    return null;
  },

  /**
   * Save user registration / login / profile data inputted from frontend
   */
  saveUserInput: async (userData: any) => {
    const id = userData.id || userData.email || userData.phone_number;
    return await firebaseDbService.recordFrontendInput('users', id, userData);
  },

  /**
   * Save item report (Lost or Found) inputted from frontend
   */
  saveItemInput: async (itemData: any) => {
    return await firebaseDbService.recordFrontendInput('items', itemData.id, itemData);
  },

  /**
   * Save ownership claim inputted from frontend
   */
  saveClaimInput: async (claimData: any) => {
    return await firebaseDbService.recordFrontendInput('claims', claimData.id, claimData);
  },

  /**
   * Save purchase request or marketplace offer inputted from frontend
   */
  saveMarketplaceInput: async (requestData: any) => {
    return await firebaseDbService.recordFrontendInput('marketplace_requests', requestData.id, requestData);
  },

  /**
   * Save auction bid inputted from frontend
   */
  saveBidInput: async (bidData: any) => {
    return await firebaseDbService.recordFrontendInput('bids', bidData.id, bidData);
  },

  /**
   * Save physical handover / recovery confirmation inputted from frontend
   */
  saveRecoveryInput: async (recoveryData: any) => {
    const id = recoveryData.id || recoveryData.claim_id;
    return await firebaseDbService.recordFrontendInput('recoveries', id, recoveryData);
  },

  /**
   * Save file upload metadata inputted from frontend
   */
  saveUploadInput: async (uploadData: any) => {
    const id = uploadData.filename || String(Date.now());
    return await firebaseDbService.recordFrontendInput('uploads', id, uploadData);
  },

  /**
   * Save general feedback or contact message inputted from frontend
   */
  saveFeedbackInput: async (feedbackData: any) => {
    return await firebaseDbService.recordFrontendInput('feedback', undefined, feedbackData);
  },

  /**
   * Flush all locally queued frontend inputs into Cloud Firestore
   */
  flushPendingQueue: async (): Promise<number> => {
    if (!db) return 0;
    try {
      const queueKey = 'back2u_firebase_pending_queue';
      const raw = localStorage.getItem(queueKey);
      if (!raw) return 0;
      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return 0;

      let flushed = 0;
      for (const item of queue) {
        try {
          if (item.docId) {
            await setDoc(doc(db, item.collectionName, String(item.docId)), item.data, { merge: true });
          } else {
            await addDoc(collection(db, item.collectionName), item.data);
          }
          flushed++;
        } catch {
          // ignore individual failed writes
        }
      }
      localStorage.removeItem(queueKey);
      console.info(`[Firebase DB] Flushed ${flushed} queued frontend inputs into Firestore.`);
      return flushed;
    } catch {
      return 0;
    }
  }
};

// Automatically attempt to flush queue on module load if Firestore is available
if (db) {
  setTimeout(() => {
    firebaseDbService.flushPendingQueue();
  }, 1000);
}

