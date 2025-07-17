#!/usr/bin/env node

// Firebase認証を使用したFirestoreデバッグスクリプト
console.log('🚀 Firebase認証付きFirestoreデバッグスクリプト開始...');

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase設定（フロントエンドと同じ設定）
const firebaseConfig = {
  apiKey: "AIzaSyCM7frdZRzNXxDOtqalWYtdG-EIZyoL5Qc",
  authDomain: "new-roster-project.firebaseapp.com",
  projectId: "new-roster-project",
  storageBucket: "new-roster-project.firebasestorage.app",
  messagingSenderId: "364640737580",
  appId: "1:364640737580:web:66b7b2840ec557ba79b489",
  measurementId: "G-BDFBZGTJ5J"
};

async function debugFirestore() {
  try {
    console.log('🔥 Firebase初期化中...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('📋 プロジェクトID:', firebaseConfig.projectId);
    
    // 管理者アカウントでログイン
    console.log('🔐 管理者認証中...');
    const email = 'llb5yyuihdx@gmail.com';
    const password = process.argv[2] || prompt('パスワードを入力してください: ');
    
    if (!password) {
      console.error('❌ パスワードが提供されていません');
      console.log('使用方法: node scripts/firestore-debug.js [パスワード]');
      process.exit(1);
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ 認証成功:', userCredential.user.email);
    console.log('👤 UID:', userCredential.user.uid);
    
    // IDトークンを取得
    const idToken = await userCredential.user.getIdToken();
    console.log('🎫 IDトークン取得成功');
    
    // Firestoreからユーザープロファイル取得
    console.log('\n📂 userProfilesコレクションを取得中...');
    const usersCollection = collection(db, 'userProfiles');
    const snapshot = await getDocs(usersCollection);
    
    console.log('📊 取得結果:');
    console.log('  - ドキュメント数:', snapshot.size);
    console.log('  - 空かどうか:', snapshot.empty);
    
    if (!snapshot.empty) {
      console.log('\n👥 全ユーザー一覧:');
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. ドキュメントID: ${doc.id}`);
        console.log(`   メール: ${data.email || 'なし'}`);
        console.log(`   表示名: ${data.displayName || 'なし'}`);
        console.log(`   権限: ${data.role || 'なし'}`);
        console.log(`   部署: ${data.department || 'なし'}`);
        console.log(`   アクティブ: ${data.isActive !== false ? 'はい' : 'いいえ'}`);
        console.log(`   作成日: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : 'なし'}`);
        console.log(`   データ全体:`, JSON.stringify(data, null, 2));
      });
      
      // 統計情報
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('\n📈 統計情報:');
      console.log(`  - 総ユーザー数: ${users.length}`);
      console.log(`  - 管理者: ${users.filter(u => u.role === 'admin').length}人`);
      console.log(`  - 所属長: ${users.filter(u => u.role === 'manager').length}人`);
      console.log(`  - スタッフ: ${users.filter(u => u.role === 'staff').length}人`);
      console.log(`  - アクティブ: ${users.filter(u => u.isActive !== false).length}人`);
      console.log(`  - 非アクティブ: ${users.filter(u => u.isActive === false).length}人`);
      
    } else {
      console.log('⚠️ userProfilesコレクションは空です');
    }
    
  } catch (error) {
    console.error('❌ エラー発生:', error);
    console.error('❌ エラーコード:', error.code);
    console.error('❌ エラーメッセージ:', error.message);
    
    if (error.code === 'auth/invalid-credential') {
      console.error('🚫 認証情報が無効です。メールアドレスとパスワードを確認してください。');
    } else if (error.code === 'permission-denied') {
      console.error('🚫 Firestoreアクセス権限がありません。ルールを確認してください。');
    }
  }
}

// スクリプト実行
debugFirestore()
  .then(() => {
    console.log('\n🏁 デバッグ完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 致命的エラー:', error);
    process.exit(1);
  });
