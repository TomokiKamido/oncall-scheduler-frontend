const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ローカル開発環境用のFirebase設定
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

// Firebase Admin SDK の初期化
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'new-roster-project'
  });
} catch (error) {
  console.log('Firebase Admin already initialized');
}

const db = admin.firestore();

/**
 * 指定されたメールアドレスのユーザーを管理者にする
 * @param {string} email - 管理者にするユーザーのメールアドレス
 */
async function makeUserAdmin(email) {
  try {
    console.log(`🔧 ユーザー "${email}" を管理者に設定中...`);
    
    // Firebase Authからユーザーを検索
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`✅ ユーザーが見つかりました: ${userRecord.uid}`);
    } catch (error) {
      console.error(`❌ ユーザー "${email}" が見つかりません`);
      console.log('📝 ヒント: ユーザーが登録されているか確認してください');
      return;
    }
    
    // Firestoreのユーザープロファイルを更新
    const userProfileRef = db.collection('userProfiles').doc(userRecord.uid);
    const userProfileDoc = await userProfileRef.get();
    
    let profileData;
    if (userProfileDoc.exists) {
      // 既存のプロファイルを更新
      profileData = userProfileDoc.data();
      await userProfileRef.update({
        role: 'admin',
        department: profileData.department || 'システム管理部',
        managedDepartments: [], // 管理者は全部署管理可能なため空配列
        isActive: true,
        updatedAt: new Date()
      });
      console.log('✅ 既存プロファイルを管理者権限に更新しました');
    } else {
      // 新しいプロファイルを作成
      profileData = {
        uid: userRecord.uid,
        email: email,
        displayName: userRecord.displayName || email.split('@')[0],
        role: 'admin',
        department: 'システム管理部',
        managedDepartments: [], // 管理者は全部署管理可能
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await userProfileRef.set(profileData);
      console.log('✅ 新しい管理者プロファイルを作成しました');
    }
    
    // Firebase Authにカスタムクレームを設定（オプション）
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      isAdmin: true
    });
    console.log('✅ Firebase Auth カスタムクレームを設定しました');
    
    console.log('');
    console.log('🎉 管理者設定が完了しました！');
    console.log('');
    console.log('📋 管理者情報:');
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   名前: ${profileData.displayName}`);
    console.log(`   部署: ${profileData.department}`);
    console.log(`   権限: 管理者 (admin)`);
    console.log('');
    console.log('💡 注意: ユーザーは次回ログイン時に新しい権限が適用されます');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    console.log('');
    console.log('🔧 トラブルシューティング:');
    console.log('1. Firebase エミュレーターが起動していることを確認');
    console.log('2. ユーザーが正しく登録されていることを確認');
    console.log('3. ネットワーク接続を確認');
  }
}

/**
 * ローカル環境用のユーザー管理（Firebase エミュレーター不使用）
 */
async function makeUserAdminLocal(email) {
  try {
    console.log(`🔧 ローカル環境でユーザー "${email}" を管理者に設定中...`);
    
    // users.json ファイルを読み込み
    const usersFilePath = path.join(__dirname, '..', 'users.json');
    
    if (!fs.existsSync(usersFilePath)) {
      console.error('❌ users.json ファイルが見つかりません');
      return;
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const user = usersData.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ ユーザー "${email}" が見つかりません`);
      return;
    }
    
    console.log(`✅ ユーザーが見つかりました: ${user.localId}`);
    
    // プロファイルファイルのパスを作成
    const profilesDir = path.join(__dirname, '..', 'data', 'profiles');
    const profilePath = path.join(profilesDir, `${user.localId}.json`);
    
    // data/profiles ディレクトリを作成（存在しない場合）
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    
    // プロファイルデータを作成または更新
    const profileData = {
      uid: user.localId,
      email: email,
      displayName: email.split('@')[0] + '_admin',
      role: 'admin',
      department: 'システム管理部',
      managedDepartments: [], // 管理者は全部署管理可能
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // プロファイルファイルを保存
    fs.writeFileSync(profilePath, JSON.stringify(profileData, null, 2));
    
    console.log('✅ 管理者プロファイルを作成/更新しました');
    console.log('');
    console.log('🎉 ローカル環境での管理者設定が完了しました！');
    console.log('');
    console.log('📋 管理者情報:');
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${user.localId}`);
    console.log(`   名前: ${profileData.displayName}`);
    console.log(`   部署: ${profileData.department}`);
    console.log(`   権限: 管理者 (admin)`);
    console.log(`   プロファイルファイル: ${profilePath}`);
    console.log('');
    console.log('💡 注意: ユーザーは次回ログイン時に新しい権限が適用されます');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

// コマンドライン引数からメールアドレスを取得
const args = process.argv.slice(2);
const email = args[0];

if (!email) {
  console.log('使用方法: node make-user-admin.js <email>');
  console.log('例: node make-user-admin.js llb5yyuihdx@gmail.com');
  process.exit(1);
}

// メールアドレスの基本的な検証
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ 無効なメールアドレス形式です');
  process.exit(1);
}

// ローカル環境かクラウド環境かを判定
const isLocal = args.includes('--local') || process.env.NODE_ENV === 'development';

if (isLocal) {
  makeUserAdminLocal(email);
} else {
  makeUserAdmin(email);
}

module.exports = { makeUserAdmin, makeUserAdminLocal };
