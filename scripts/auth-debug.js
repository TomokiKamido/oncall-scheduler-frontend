#!/usr/bin/env node

// 簡易Firebase認証確認スクリプト
console.log('🚀 Firebase認証確認スクリプト開始...');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askPassword() {
  return new Promise((resolve) => {
    rl.question('管理者パスワード (llb5yyuihdx@gmail.com): ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

async function debugWithAuth() {
  try {
    const { initializeApp } = require('firebase/app');
    const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
    const { getFirestore, collection, getDocs } = require('firebase/firestore');

    // Firebase設定
    const firebaseConfig = {
      apiKey: "AIzaSyCM7frdZRzNXxDOtqalWYtdG-EIZyoL5Qc",
      authDomain: "new-roster-project.firebaseapp.com",
      projectId: "new-roster-project",
      storageBucket: "new-roster-project.firebasestorage.app",
      messagingSenderId: "364640737580",
      appId: "1:364640737580:web:66b7b2840ec557ba79b489",
      measurementId: "G-BDFBZGTJ5J"
    };

    console.log('🔥 Firebase初期化中...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // パスワード入力
    const password = await askPassword();
    
    if (!password) {
      console.error('❌ パスワードが入力されていません');
      process.exit(1);
    }

    // 認証
    console.log('🔐 認証中...');
    const userCredential = await signInWithEmailAndPassword(auth, 'llb5yyuihdx@gmail.com', password);
    console.log('✅ 認証成功:', userCredential.user.email);

    // Firestoreデータ取得
    console.log('📂 Firestoreデータ取得中...');
    const usersCollection = collection(db, 'userProfiles');
    const snapshot = await getDocs(usersCollection);

    console.log('\n📊 結果:');
    console.log('ドキュメント数:', snapshot.size);

    if (snapshot.size > 0) {
      console.log('\n👥 ユーザー一覧:');
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ID: ${doc.id}, Email: ${data.email}, Role: ${data.role}, Active: ${data.isActive !== false}`);
      });
    }

  } catch (error) {
    console.error('❌ エラー:', error.code, error.message);
  }
}

debugWithAuth();
