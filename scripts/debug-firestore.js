const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, connectFirestoreEmulator } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

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

async function debugFirestore() {
  console.log('🔥 Firebase Debug Script 開始');
  
  try {
    // Firebase初期化
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase初期化完了');
    console.log('📁 Project ID:', firebaseConfig.projectId);
    
    // 管理者でログイン（テスト用）
    console.log('\n🔐 管理者ログイン試行...');
    try {
      await signInWithEmailAndPassword(auth, 'llb5yyuihdx@gmail.com', 'password123');
      console.log('✅ ログイン成功:', auth.currentUser.email);
    } catch (loginError) {
      console.log('ℹ️ ログインなしで続行（認証なしでのデータ確認）');
    }
    
    // userProfilesコレクションを確認
    console.log('\n📋 userProfilesコレクション確認中...');
    const usersCollection = collection(db, 'userProfiles');
    
    const snapshot = await getDocs(usersCollection);
    console.log('📊 ドキュメント数:', snapshot.size);
    console.log('📊 Empty:', snapshot.empty);
    
    if (!snapshot.empty) {
      console.log('\n👥 取得したユーザー:');
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ID: ${doc.id}`);
        console.log(`     Email: ${data.email || 'なし'}`);
        console.log(`     名前: ${data.displayName || 'なし'}`);
        console.log(`     権限: ${data.role || 'なし'}`);
        console.log(`     アクティブ: ${data.isActive !== false ? 'はい' : 'いいえ'}`);
        console.log('');
      });
    } else {
      console.log('❌ userProfilesコレクションにデータが見つかりません');
      
      // 他のコレクションも確認
      console.log('\n🔍 他のコレクションを確認...');
      try {
        const collections = ['users', 'profiles', 'userProfile', 'user_profiles'];
        for (const collectionName of collections) {
          console.log(`📂 ${collectionName} コレクション確認中...`);
          const testCollection = collection(db, collectionName);
          const testSnapshot = await getDocs(testCollection);
          if (!testSnapshot.empty) {
            console.log(`✅ ${collectionName} に ${testSnapshot.size} 件のドキュメントが見つかりました`);
          }
        }
      } catch (error) {
        console.log('❌ 他のコレクション確認エラー:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
    if (error.code === 'permission-denied') {
      console.error('🚫 アクセス権限が拒否されました。Firestoreルールを確認してください。');
    }
  }
}

debugFirestore();
