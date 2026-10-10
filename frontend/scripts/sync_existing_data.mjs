import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyB_Ax-72jYmrPEqTrmiUxo9IWQBOQBHFkA",
  authDomain: "back2u-ee11b.firebaseapp.com",
  projectId: "back2u-ee11b",
  storageBucket: "back2u-ee11b.firebasestorage.app",
  messagingSenderId: "507982766996",
  appId: "1:507982766996:web:50fea7048499a105dbe581"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncAll() {
  const payloadPath = path.resolve('../backend/sync_payload.json');
  if (!fs.existsSync(payloadPath)) {
    console.error('Payload file not found at:', payloadPath);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));
  console.log(`Starting sync to Firestore project "${firebaseConfig.projectId}"...`);

  // 1. Sync Items
  console.log(`Syncing ${payload.items.length} items to collection 'items'...`);
  for (const item of payload.items) {
    const cleanItem = { ...item };
    delete cleanItem.text_embedding;
    delete cleanItem.image_embedding;
    delete cleanItem.private_clues; // Protect private clues
    
    // Replace undefined/null appropriately
    for (const [k, v] of Object.entries(cleanItem)) {
      if (v === undefined) cleanItem[k] = null;
    }

    cleanItem.synced_at = new Date().toISOString();
    await setDoc(doc(db, 'items', String(item.id)), cleanItem, { merge: true });
    console.log(`  ✓ Synced Item #${item.id}: "${item.title}"`);
  }

  // 2. Sync Users
  console.log(`Syncing ${payload.users.length} users to collection 'users'...`);
  for (const user of payload.users) {
    const cleanUser = { ...user };
    delete cleanUser.hashed_password; // Never push password hashes
    
    for (const [k, v] of Object.entries(cleanUser)) {
      if (v === undefined) cleanUser[k] = null;
    }

    cleanUser.synced_at = new Date().toISOString();
    await setDoc(doc(db, 'users', String(user.id)), cleanUser, { merge: true });
    console.log(`  ✓ Synced User #${user.id}: "${user.full_name}" (${user.email || user.phone_number})`);
  }

  // 3. Sync Uploads
  console.log(`Syncing ${payload.uploads.length} uploads to collection 'uploads'...`);
  for (const up of payload.uploads) {
    const cleanUp = { ...up, synced_at: new Date().toISOString() };
    await setDoc(doc(db, 'uploads', up.filename), cleanUp, { merge: true });
    console.log(`  ✓ Synced Upload: ${up.filename} (${up.size} bytes)`);
  }

  console.log('\nSUCCESS: All existing items, users, and upload files have been uploaded to Firebase Firestore!');
  process.exit(0);
}

syncAll().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
