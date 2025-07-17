const admin = require('firebase-admin');

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'new-roster-project',
  });
}

const db = admin.firestore();

async function checkFirestoreStatus() {
  console.log('🔍 Firestoreの状態を確認中...');
  
  try {
    // userProfilesコレクションの確認
    console.log('\n📋 userProfilesコレクション:');
    const userProfilesSnapshot = await db.collection('userProfiles').get();
    
    if (userProfilesSnapshot.empty) {
      console.log('   ❌ userProfilesコレクションは空です');
    } else {
      console.log(`   ✅ ${userProfilesSnapshot.size}件のプロファイルが存在します`);
      
      userProfilesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.email} (${data.role || 'role未設定'})`);
      });
    }
    
    // Authenticationユーザーリストの確認
    console.log('\n🔐 Authenticationユーザー:');
    const listUsersResult = await admin.auth().listUsers();
    
    if (listUsersResult.users.length === 0) {
      console.log('   ❌ 登録されたユーザーがいません');
    } else {
      console.log(`   ✅ ${listUsersResult.users.length}人のユーザーが登録されています`);
      
      for (const user of listUsersResult.users) {
        console.log(`   - ${user.uid}: ${user.email} (${user.emailVerified ? '認証済み' : '未認証'})`);
        
        // 対応するプロファイルが存在するかチェック
        try {
          const profileDoc = await db.collection('userProfiles').doc(user.uid).get();
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            console.log(`     📄 プロファイル: ${profileData.role} - ${profileData.department || '部署未設定'}`);
          } else {
            console.log('     ❌ プロファイルが存在しません');
          }
        } catch (error) {
          console.log(`     ❌ プロファイル取得エラー: ${error.message}`);
        }
      }
    }
    
    // セキュリティルールの確認（参考）
    console.log('\n🛡️  セキュリティルール:');
    console.log('   現在のルール: userProfiles/{userId}に対して認証済みユーザーが自分のドキュメントを読み書き可能');
    console.log('   初回ログイン時の自動プロファイル作成が正常に動作するはずです');
    
  } catch (error) {
    console.error('❌ Firestoreチェック中にエラーが発生:', error);
  }
}

async function createTestProfile(email, role = 'staff', department = '') {
  try {
    console.log(`\n📝 テストプロファイル作成: ${email}`);
    
    // まずAuthenticationのユーザーを取得
    const user = await admin.auth().getUserByEmail(email);
    
    // プロファイルを作成
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      role: role,
      department: department,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await db.collection('userProfiles').doc(user.uid).set(profileData);
    console.log(`✅ プロファイル作成完了: ${email} (${role})`);
    
  } catch (error) {
    console.error(`❌ プロファイル作成エラー: ${error.message}`);
  }
}

// メイン実行
async function main() {
  await checkFirestoreStatus();
  
  // 必要に応じて手動でプロファイルを作成
  const args = process.argv.slice(2);
  if (args.length >= 2 && args[0] === 'create') {
    const email = args[1];
    const role = args[2] || 'staff';
    const department = args[3] || '';
    
    await createTestProfile(email, role, department);
    
    // 作成後の状態を再確認
    console.log('\n🔄 プロファイル作成後の状態:');
    await checkFirestoreStatus();
  }
}

main().catch(console.error);
