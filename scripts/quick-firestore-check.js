#!/usr/bin/env node

// 高速Firestoreデータ確認スクリプト
console.log('🚀 高速Firestoreチェック開始...');

const admin = require('firebase-admin');
const path = require('path');

// サービスアカウントキーのパスを確認
const serviceAccountPath = path.join(__dirname, '..', 'oncall-scheduler-firebase-adminsdk-hpgex-8ea4c7e7f4.json');
console.log('🔑 サービスアカウントキーパス:', serviceAccountPath);

try {
  const fs = require('fs');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ サービスアカウントキーが見つかりません:', serviceAccountPath);
    process.exit(1);
  }
  
  const serviceAccount = require(serviceAccountPath);
  console.log('✅ サービスアカウントキー読み込み成功');
  console.log('📋 プロジェクトID:', serviceAccount.project_id);
  
  // Firebase Admin初期化
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  console.log('🔥 Firebase Admin初期化完了');
  
  // Firestoreインスタンス取得
  const db = admin.firestore();
  
  // userProfilesコレクションを直接チェック
  console.log('📂 userProfilesコレクションをチェック中...');
  
  db.collection('userProfiles').get()
    .then(snapshot => {
      console.log('📊 取得結果:');
      console.log('  - ドキュメント数:', snapshot.size);
      console.log('  - 空かどうか:', snapshot.empty);
      
      if (!snapshot.empty) {
        console.log('\n👥 ユーザー一覧:');
        snapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`\n${index + 1}. ドキュメントID: ${doc.id}`);
          console.log(`   メール: ${data.email || 'なし'}`);
          console.log(`   表示名: ${data.displayName || 'なし'}`);
          console.log(`   権限: ${data.role || 'なし'}`);
          console.log(`   アクティブ: ${data.isActive !== false ? 'はい' : 'いいえ'}`);
          console.log(`   作成日: ${data.createdAt ? data.createdAt.toDate() : 'なし'}`);
        });
      } else {
        console.log('⚠️ userProfilesコレクションは空です');
        
        // 他のコレクションもチェック
        console.log('\n🔍 他のコレクションをチェック中...');
        return db.listCollections();
      }
    })
    .then(collections => {
      if (collections) {
        console.log('\n📂 利用可能なコレクション:');
        collections.forEach(collection => {
          console.log(`  - ${collection.id}`);
        });
      }
    })
    .catch(error => {
      console.error('❌ エラー発生:', error);
      console.error('❌ エラーコード:', error.code);
      console.error('❌ エラーメッセージ:', error.message);
    })
    .finally(() => {
      console.log('\n🏁 チェック完了');
      process.exit(0);
    });
    
} catch (error) {
  console.error('❌ 初期化エラー:', error);
  process.exit(1);
}
