const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK の初期化
const serviceAccountPath = path.join(__dirname, 'secure_keys', 'new-roster-project-firebase-adminsdk.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://new-roster-project-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
} catch (error) {
  console.error('❌ Firebase Admin SDK の初期化に失敗しました:', error.message);
  console.log('🔍 サービスアカウントキーが正しい場所にあることを確認してください:');
  console.log('   Expected path:', serviceAccountPath);
  process.exit(1);
}

async function migratePermissions() {
  console.log('🚀 権限システムの移行を開始します...\n');
  
  const db = admin.firestore();
  const auth = admin.auth();
  
  try {
    const batch = db.batch();
    
    // 1. 既存のusersコレクションからデータを取得
    console.log('📂 既存のusersコレクションからデータを取得中...');
    const usersSnapshot = await db.collection('users').get();
    const userMap = new Map();
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      userMap.set(doc.id, data);
      console.log(`   Found user: ${data.email} with role: ${data.role}`);
    });
    
    // 2. Firebase Authのすべてのユーザーを取得
    console.log('\\n🔐 Firebase Authからユーザーを取得中...');
    const listUsersResult = await auth.listUsers();
    console.log(`   Total users in Auth: ${listUsersResult.users.length}`);
    
    // 3. 新しいpermissionsコレクションにデータを移行
    console.log('\\n🔄 新しいpermissionsコレクションにデータを移行中...');
    
    for (const user of listUsersResult.users) {
      const existingData = userMap.get(user.uid);
      let role = 'staff'; // デフォルト
      
      // 管理者の設定（確実に設定）
      if (user.email === 'llb5yyuihdx@gmail.com') {
        role = 'admin';
        console.log(`   👑 管理者を設定: ${user.email}`);
      } else if (existingData?.role && ['admin', 'manager', 'staff'].includes(existingData.role)) {
        // 既存の有効な役割を保持
        role = existingData.role;
        console.log(`   📋 既存の役割を保持: ${user.email} -> ${role}`);
      } else {
        // デフォルトでstaffに設定
        role = 'staff';
        console.log(`   👤 デフォルトでstaffに設定: ${user.email}`);
      }
      
      const permissionData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || existingData?.displayName || user.email?.split('@')[0] || 'User',
        role: role,
        department: role === 'admin' ? 'システム管理部' : (existingData?.department || ''),
        isActive: existingData?.isActive !== false,
        createdAt: existingData?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      batch.set(db.collection('permissions').doc(user.uid), permissionData);
    }
    
    // 4. バッチコミット
    console.log('\\n💾 データをFirestoreにコミット中...');
    await batch.commit();
    console.log('✅ バッチコミット完了');
    
    // 5. カスタムクレームをクリア（オプション）
    console.log('\\n🧹 Firebase Authのカスタムクレームをクリア中...');
    for (const user of listUsersResult.users) {
      try {
        await auth.setCustomUserClaims(user.uid, {});
        console.log(`   ✅ ${user.email} のカスタムクレームをクリア`);
      } catch (error) {
        console.log(`   ⚠️ ${user.email} のカスタムクレームクリアに失敗:`, error.message);
      }
    }
    
    // 6. 移行結果の確認
    console.log('\\n📊 移行結果を確認中...');
    const permissionsSnapshot = await db.collection('permissions').get();
    const adminUsers = [];
    const managerUsers = [];
    const staffUsers = [];
    
    permissionsSnapshot.forEach((doc) => {
      const data = doc.data();
      switch (data.role) {
        case 'admin':
          adminUsers.push(data.email);
          break;
        case 'manager':
          managerUsers.push(data.email);
          break;
        case 'staff':
          staffUsers.push(data.email);
          break;
        default:
          staffUsers.push(data.email);
          break;
      }
    });
    
    console.log('\\n🎉 移行が正常に完了しました！');
    console.log('\\n📈 移行結果サマリー:');
    console.log(`   総ユーザー数: ${permissionsSnapshot.size}`);
    console.log(`   管理者: ${adminUsers.length}名`);
    adminUsers.forEach(email => console.log(`     👑 ${email}`));
    console.log(`   マネージャー: ${managerUsers.length}名`);
    managerUsers.forEach(email => console.log(`     💼 ${email}`));
    console.log(`   スタッフ: ${staffUsers.length}名`);
    
    console.log('\\n🔄 次のステップ:');
    console.log('1. Firestore Security Rulesをデプロイしてください:');
    console.log('   npx firebase deploy --only firestore:rules');
    console.log('2. フロントエンドをデプロイしてください:');
    console.log('   npm run build && npx firebase deploy --only hosting');
    
  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error);
    throw error;
  }
}

// 移行の確認
async function confirmMigration() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('権限システムの移行を実行しますか？この操作は既存のデータを変更します。(yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// メイン実行
async function main() {
  try {
    const confirmed = await confirmMigration();
    if (!confirmed) {
      console.log('移行がキャンセルされました。');
      return;
    }
    
    await migratePermissions();
  } catch (error) {
    console.error('❌ スクリプト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

main();
