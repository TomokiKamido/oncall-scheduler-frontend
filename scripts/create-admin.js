const admin = require('firebase-admin');

// Firebase Admin SDK の初期化
// 本来はサービスアカウントキーが必要ですが、開発環境では環境変数で認証
const serviceAccount = {
  "type": "service_account",
  "project_id": "new-roster-project",
  "private_key_id": "dummy",
  "private_key": "-----BEGIN PRIVATE KEY-----\ndummy\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@new-roster-project.iam.gserviceaccount.com",
  "client_id": "dummy",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
};

// Firestoreのエミュレーターまたは本番環境に接続
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'new-roster-project'
  });
} catch (error) {
  console.log('Firebase Admin already initialized');
}

const db = admin.firestore();

async function createInitialAdmin() {
  try {
    // 管理者ユーザーの情報
    const adminEmail = 'admin@oncall-scheduler.com';
    const adminPassword = 'AdminPass123!';
    
    console.log('🔧 初期管理者アカウントを作成中...');
    
    // Firebase Authに管理者ユーザーを作成
    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: 'システム管理者',
      emailVerified: true
    });
    
    console.log(`✅ 管理者アカウント作成完了: ${userRecord.uid}`);
    
    // Firestoreにユーザープロファイルを作成
    const adminProfile = {
      uid: userRecord.uid,
      email: adminEmail,
      displayName: 'システム管理者',
      role: 'admin',
      department: 'システム管理部',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('userProfiles').doc(userRecord.uid).set(adminProfile);
    console.log('✅ 管理者プロファイル作成完了');
    
    // 所属長テストアカウントを作成
    const managerEmail = 'manager@oncall-scheduler.com';
    const managerPassword = 'ManagerPass123!';
    
    const managerRecord = await admin.auth().createUser({
      email: managerEmail,
      password: managerPassword,
      displayName: '田中所属長',
      emailVerified: true
    });
    
    const managerProfile = {
      uid: managerRecord.uid,
      email: managerEmail,
      displayName: '田中所属長',
      role: 'manager',
      department: '医療部',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('userProfiles').doc(managerRecord.uid).set(managerProfile);
    console.log('✅ 所属長テストアカウント作成完了');
    
    // スタッフテストアカウントを作成
    const staffEmail = 'staff@oncall-scheduler.com';
    const staffPassword = 'StaffPass123!';
    
    const staffRecord = await admin.auth().createUser({
      email: staffEmail,
      password: staffPassword,
      displayName: '佐藤スタッフ',
      emailVerified: true
    });
    
    const staffProfile = {
      uid: staffRecord.uid,
      email: staffEmail,
      displayName: '佐藤スタッフ',
      role: 'staff',
      department: '医療部',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('userProfiles').doc(staffRecord.uid).set(staffProfile);
    console.log('✅ スタッフテストアカウント作成完了');
    
    console.log('\n🎉 全てのテストアカウントが作成されました！');
    console.log('');
    console.log('📋 ログイン情報:');
    console.log('');
    console.log('🔧 管理者アカウント:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('👨‍💼 所属長アカウント:');
    console.log(`   Email: ${managerEmail}`);
    console.log(`   Password: ${managerPassword}`);
    console.log('');
    console.log('👨‍💻 スタッフアカウント:');
    console.log(`   Email: ${staffEmail}`);
    console.log(`   Password: ${staffPassword}`);
    console.log('');
    console.log('🌐 アプリURL: https://new-roster-project.web.app');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

// 簡易版：Firebase Consoleで手動作成用のガイド表示
function showManualCreationGuide() {
  console.log('\n📋 Firebase Consoleでの手動アカウント作成ガイド:');
  console.log('');
  console.log('1. Firebase Console > Authentication > Users に移動');
  console.log('   URL: https://console.firebase.google.com/project/new-roster-project/authentication/users');
  console.log('');
  console.log('2. 以下のアカウントを手動で作成:');
  console.log('');
  console.log('🔧 管理者アカウント:');
  console.log('   Email: admin@oncall-scheduler.com');
  console.log('   Password: AdminPass123!');
  console.log('');
  console.log('👨‍💼 所属長テストアカウント:');
  console.log('   Email: manager@oncall-scheduler.com');
  console.log('   Password: ManagerPass123!');
  console.log('');
  console.log('👨‍💻 スタッフテストアカウント:');
  console.log('   Email: staff@oncall-scheduler.com');
  console.log('   Password: StaffPass123!');
  console.log('');
  console.log('3. アカウント作成後、アプリにログインすると自動的にプロファイルが作成されます');
  console.log('');
  console.log('4. 管理者権限の設定:');
  console.log('   - Firebase Console > Firestore Database に移動');
  console.log('   - userProfiles コレクションから admin@oncall-scheduler.com のユーザーを見つける');
  console.log('   - role フィールドを "admin" に変更');
  console.log('');
  console.log('🌐 アプリURL: https://new-roster-project.web.app');
}

// 引数によって実行モードを切り替え
const args = process.argv.slice(2);
if (args.includes('--manual')) {
  showManualCreationGuide();
} else {
  createInitialAdmin();
}

module.exports = { createInitialAdmin, showManualCreationGuide };
