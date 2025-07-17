const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase設定（New Roster Projectの実際の設定値）
const firebaseConfig = {
  apiKey: "AIzaSyCM7frdZRzNXxDOtqalWYtdG-EIZyoL5Qc",
  authDomain: "new-roster-project.firebaseapp.com",
  projectId: "new-roster-project",
  storageBucket: "new-roster-project.firebasestorage.app",
  messagingSenderId: "364640737580",
  appId: "1:364640737580:web:66b7b2840ec557ba79b489"
};

async function checkUsers() {
  try {
    console.log('🔍 Firestoreのユーザー情報を確認中...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const usersCollection = collection(db, 'userProfiles');
    const snapshot = await getDocs(usersCollection);
    
    console.log(`📊 総ユーザー数: ${snapshot.size}`);
    console.log('👥 登録ユーザー一覧:');
    console.log('='.repeat(80));
    
    if (snapshot.empty) {
      console.log('❌ userProfilesコレクションにユーザーが存在しません');
      return;
    }
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   DisplayName: ${data.displayName || 'N/A'}`);
      console.log(`   Role: ${data.role || 'N/A'}`);
      console.log(`   Department: ${data.department || 'N/A'}`);
      console.log(`   IsActive: ${data.isActive !== false ? 'true' : 'false'}`);
      console.log(`   CreatedAt: ${data.createdAt ? data.createdAt.toDate() : 'N/A'}`);
      console.log(`   UpdatedAt: ${data.updatedAt ? data.updatedAt.toDate() : 'N/A'}`);
      console.log('-'.repeat(40));
    });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    console.error('詳細:', error.message);
  }
}

checkUsers();
