#!/usr/bin/env node

// Firestoreの全ユーザーを直接確認するスクリプト
console.log('🔍 Firestore全ユーザー検証スクリプト開始...');

// Firebase Web SDKを使用（フロントエンドと同じ設定）
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, connectFirestoreEmulator } = require('firebase/firestore');

// Firebase設定（フロントエンドと同じ）
const firebaseConfig = {
  apiKey: "AIzaSyCM7frdZRzNXxDOtqalWYtdG-EIZyoL5Qc",
  authDomain: "new-roster-project.firebaseapp.com",
  projectId: "new-roster-project",
  storageBucket: "new-roster-project.firebasestorage.app",
  messagingSenderId: "364640737580",
  appId: "1:364640737580:web:66b7b2840ec557ba79b489",
  measurementId: "G-BDFBZGTJ5J"
};

async function checkFirestoreUsers() {
  try {
    console.log('🔥 Firebase初期化中...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('📂 userProfilesコレクション取得中...');
    const usersCollection = collection(db, 'userProfiles');
    const snapshot = await getDocs(usersCollection);
    
    console.log('\n📊 Firestore検証結果:');
    console.log('  - ドキュメント数:', snapshot.size);
    console.log('  - 空かどうか:', snapshot.empty);
    
    if (!snapshot.empty) {
      console.log('\n👥 全ユーザー詳細:');
      let userCount = 0;
      snapshot.forEach((doc) => {
        userCount++;
        const data = doc.data();
        console.log(`\n${userCount}. ドキュメントID: ${doc.id}`);
        console.log(`   メール: ${data.email || 'なし'}`);
        console.log(`   表示名: ${data.displayName || 'なし'}`);
        console.log(`   権限: ${data.role || 'なし'}`);
        console.log(`   部署: ${data.department || 'なし'}`);
        console.log(`   アクティブ: ${data.isActive !== false ? 'はい' : 'いいえ'}`);
        console.log(`   作成日: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString('ja-JP') : 'なし'}`);
        console.log(`   更新日: ${data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleString('ja-JP') : 'なし'}`);
        console.log(`   データ全体:`, JSON.stringify(data, null, 2));
      });
      
      console.log(`\n✅ 合計 ${userCount} 人のユーザーが存在します`);
    } else {
      console.log('⚠️ userProfilesコレクションは空です');
    }
    
    console.log('\n🏁 検証完了');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ エラー発生:', error);
    console.error('❌ エラー詳細:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
}

checkFirestoreUsers();
