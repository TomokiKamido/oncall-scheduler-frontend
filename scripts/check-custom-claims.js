const admin = require('firebase-admin');

// Firebase Admin SDK の初期化 (プロジェクトIDを明示)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'new-roster-project'
  });
}

const db = admin.firestore();

async function checkCustomClaims() {
  const uid = 'BkXQZem6puZciblcvjHt674aTtT2';
  
  try {
    console.log(`\n🔍 Checking custom claims for user: ${uid}`);
    
    // 1. Custom Claims を確認
    const userRecord = await admin.auth().getUser(uid);
    console.log('\n📋 Current Custom Claims:');
    console.log(JSON.stringify(userRecord.customClaims || {}, null, 2));
    
    // 2. roleRequests ドキュメントを確認
    const roleRequestDoc = await db.collection('roleRequests').doc(uid).get();
    if (roleRequestDoc.exists) {
      console.log('\n📄 Role Request Document:');
      console.log(JSON.stringify(roleRequestDoc.data(), null, 2));
    } else {
      console.log('\n❌ No role request document found');
    }
    
    // 3. ID Token の Claims を確認（簡易版）
    console.log('\n🎯 User Record Summary:');
    console.log(`- UID: ${userRecord.uid}`);
    console.log(`- Email: ${userRecord.email}`);
    console.log(`- Display Name: ${userRecord.displayName || 'N/A'}`);
    console.log(`- Custom Claims: ${JSON.stringify(userRecord.customClaims || {})}`);
    
  } catch (error) {
    console.error('❌ Error checking custom claims:', error);
  }
}

checkCustomClaims().then(() => {
  console.log('\n✅ Check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
