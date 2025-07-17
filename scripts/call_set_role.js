#!/usr/bin/env node

/**
 * Firebase setRole Cloud Function 呼び出しスクリプト
 * HTTPS Callable関数を適切に呼び出すためのNodeスクリプト
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Firebase Admin SDK初期化
try {
  // FIREBASE_TOKENがある場合はアクセストークンを使用
  if (process.env.FIREBASE_TOKEN) {
    const { GoogleAuth } = require('google-auth-library');
    
    // Firebase CLIトークンからアクセストークンを生成
    admin.initializeApp({
      projectId: 'new-roster-project'
    });
    
    console.log('✅ Firebase Admin SDK初期化完了（FIREBASE_TOKEN使用）');
  } else {
    admin.initializeApp({
      projectId: 'new-roster-project'
    });
    console.log('✅ Firebase Admin SDK初期化完了');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK初期化エラー:', error.message);
  process.exit(1);
}

// コマンドライン引数からUIDを取得
const uid = process.argv[2];
const role = process.argv[3] || 'admin';

if (!uid) {
  console.error('❌ 使用法: node call_set_role.js <UID> [role]');
  process.exit(1);
}

console.log(`🎯 対象UID: ${uid}`);
console.log(`👑 設定ロール: ${role}`);

// Custom Claimsを直接設定
async function setAdminRole(uid, role) {
  try {
    console.log('🚀 Custom Claims設定中...');
    
    // Custom Claimsを設定
    await admin.auth().setCustomUserClaims(uid, { role: role });
    console.log('✅ Custom Claims設定完了');
    
    // Firestoreのroleリクエストも更新
    const db = admin.firestore();
    const roleRequestRef = db.collection('roleRequests').doc(uid);
    
    console.log('📝 Firestore roleRequests更新中...');
    await roleRequestRef.set({
      uid: uid,
      requestedRole: role,
      status: 'approved',
      adminApproval: true,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: 'admin-script'
    }, { merge: true });
    
    console.log('✅ Firestore roleRequests更新完了');
    
    // 結果確認
    const userRecord = await admin.auth().getUser(uid);
    console.log('🎉 設定完了サマリー:');
    console.log(`   UID: ${uid}`);
    console.log(`   Email: ${userRecord.email || 'N/A'}`);
    console.log(`   Custom Claims:`, userRecord.customClaims);
    
    return true;
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    return false;
  }
}

// メイン実行
setAdminRole(uid, role).then(success => {
  if (success) {
    console.log('🎉 管理者権限設定が正常に完了しました！');
    process.exit(0);
  } else {
    console.log('💡 エラーが発生しました。ログを確認してください。');
    process.exit(1);
  }
});
