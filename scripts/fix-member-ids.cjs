
// scripts/fix-member-ids.js
// Migra documentos de members/{userId} a members/{orgId:userId}

const admin = require('firebase-admin');

const serviceAccount = {
  projectId: 'mvp-staging-3e1cd',
  storageBucket: 'mvp-staging-3e1cd.firebasestorage.app',
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...serviceAccount,
  });
}

const db = admin.firestore();

async function fixMemberIds(orgId) {
  console.log(`[FixMemberIds] Starting migration for org: ${orgId}`);
  
  const membersRef = db.collection('organizations').doc(orgId).collection('members');
  const snapshot = await membersRef.get();
  
  console.log(`[FixMemberIds] Found ${snapshot.size} member documents`);
  
  let fixed = 0;
  let skipped = 0;
  
  for (const doc of snapshot.docs) {
    const docId = doc.id;
    const data = doc.data();
    
    // Check if already in correct format (contains colon)
    if (docId.includes(':')) {
      console.log(`[FixMemberIds] ✓ Already correct: ${docId}`);
      skipped++;
      continue;
    }
    
    // Legacy format: just userId
    const userId = docId;
    const correctId = `${orgId}:${userId}`;
    
    console.log(`[FixMemberIds] Migrating: ${docId} → ${correctId}`);
    
    // Create new document with correct ID
    const newRef = membersRef.doc(correctId);
    await newRef.set({
      ...data,
      userId: userId,
      orgId: orgId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    // Delete old document
    await doc.ref.delete();
    
    fixed++;
    console.log(`[FixMemberIds] ✓ Migrated: ${correctId}`);
  }
  
  console.log(`[FixMemberIds] Migration complete!`);
  console.log(`[FixMemberIds] Fixed: ${fixed}, Skipped: ${skipped}`);
  
  // Verify
  const afterSnapshot = await membersRef.get();
  console.log(`[FixMemberIds] Final count: ${afterSnapshot.size} members`);
  
  afterSnapshot.docs.forEach(doc => {
    console.log(`  - ${doc.id} (${doc.data().email})`);
  });
}

const orgId = process.argv[2] || 'pilot-org-santiago';

console.log('[FixMemberIds] Target org:', orgId);
console.log('[FixMemberIds] Starting...\n');

fixMemberIds(orgId)
  .then(() => {
    console.log('\n[FixMemberIds] ✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n[FixMemberIds] ❌ Error:', err);
    process.exit(1);
  });


// scripts/fix-member-ids.js
// Migra documentos de members/{userId} a members/{orgId:userId}

const admin = require('firebase-admin');

const serviceAccount = {
  projectId: 'mvp-staging-3e1cd',
  storageBucket: 'mvp-staging-3e1cd.firebasestorage.app',
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...serviceAccount,
  });
}

const db = admin.firestore();

async function fixMemberIds(orgId) {
  console.log(`[FixMemberIds] Starting migration for org: ${orgId}`);
  
  const membersRef = db.collection('organizations').doc(orgId).collection('members');
  const snapshot = await membersRef.get();
  
  console.log(`[FixMemberIds] Found ${snapshot.size} member documents`);
  
  let fixed = 0;
  let skipped = 0;
  
  for (const doc of snapshot.docs) {
    const docId = doc.id;
    const data = doc.data();
    
    // Check if already in correct format (contains colon)
    if (docId.includes(':')) {
      console.log(`[FixMemberIds] ✓ Already correct: ${docId}`);
      skipped++;
      continue;
    }
    
    // Legacy format: just userId
    const userId = docId;
    const correctId = `${orgId}:${userId}`;
    
    console.log(`[FixMemberIds] Migrating: ${docId} → ${correctId}`);
    
    // Create new document with correct ID
    const newRef = membersRef.doc(correctId);
    await newRef.set({
      ...data,
      userId: userId,
      orgId: orgId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    // Delete old document
    await doc.ref.delete();
    
    fixed++;
    console.log(`[FixMemberIds] ✓ Migrated: ${correctId}`);
  }
  
  console.log(`[FixMemberIds] Migration complete!`);
  console.log(`[FixMemberIds] Fixed: ${fixed}, Skipped: ${skipped}`);
  
  // Verify
  const afterSnapshot = await membersRef.get();
  console.log(`[FixMemberIds] Final count: ${afterSnapshot.size} members`);
  
  afterSnapshot.docs.forEach(doc => {
    console.log(`  - ${doc.id} (${doc.data().email})`);
  });
}

const orgId = process.argv[2] || 'pilot-org-santiago';

console.log('[FixMemberIds] Target org:', orgId);
console.log('[FixMemberIds] Starting...\n');

fixMemberIds(orgId)
  .then(() => {
    console.log('\n[FixMemberIds] ✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n[FixMemberIds] ❌ Error:', err);
    process.exit(1);
  });

