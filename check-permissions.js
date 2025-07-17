// 権限確認用のスクリプト
// Firebase Admin SDK を使用してユーザーの権限を確認
const admin = require('firebase-admin');

// Firebase Admin SDK の初期化
const serviceAccount = require('./secure_keys/new-roster-project-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://new-roster-project-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function checkAllUserPermissions() {
  console.log('🔍 全ユーザーの権限状況を確認中...\n');
  
  try {
    const auth = admin.auth();
    const db = admin.firestore();
    
    // 全ユーザーを取得
    const listUsersResult = await auth.listUsers();
    console.log(`📊 総ユーザー数: ${listUsersResult.users.length}\n`);
    
    for (const user of listUsersResult.users) {
      console.log(`👤 ユーザー: ${user.email} (${user.uid})`);
      
      // Firebase Auth のカスタムクレームを確認
      const customClaims = user.customClaims || {};
      console.log(`   🔐 カスタムクレーム:`, customClaims);
      
      // Firestore のユーザードキュメントを確認
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`   📄 Firestore データ:`, {
          role: userData.role,
          department: userData.department,
          isActive: userData.isActive,
          updatedAt: userData.updatedAt?.toDate?.() || userData.updatedAt
        });
        
        // 権限の不一致をチェック
        if (customClaims.role !== userData.role) {
          console.log(`   ⚠️  権限不一致: Auth(${customClaims.role}) vs Firestore(${userData.role})`);
        } else {
          console.log(`   ✅ 権限一致: ${customClaims.role}`);
        }
      } else {
        console.log(`   ❌ Firestore ドキュメントが存在しません`);
      }
      
      console.log(''); // 空行
    }
    
    // 管理者の確認
    console.log('\n🏆 管理者権限を持つユーザー:');
    const adminUsers = listUsersResult.users.filter(user => 
      user.customClaims?.role === 'admin'
    );
    
    if (adminUsers.length === 0) {
      console.log('   ❌ 管理者が見つかりません！');
    } else {
      adminUsers.forEach(user => {
        console.log(`   👑 ${user.email} (${user.uid})`);
      });
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    process.exit(0);
  }
}

// 特定のユーザーの権限を確認
async function checkSpecificUser(email) {
  console.log(`🔍 ${email} の権限を確認中...\n`);
  
  try {
    const auth = admin.auth();
    const db = admin.firestore();
    
    // メールアドレスからユーザーを取得
    const user = await auth.getUserByEmail(email);
    
    console.log(`👤 ユーザー情報:`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   メール: ${user.email}`);
    console.log(`   表示名: ${user.displayName || 'なし'}`);
    console.log(`   無効化: ${user.disabled ? 'はい' : 'いいえ'}`);
    console.log(`   作成日: ${user.metadata.creationTime}`);
    console.log(`   最終ログイン: ${user.metadata.lastSignInTime || 'なし'}`);
    
    // カスタムクレームを確認
    const customClaims = user.customClaims || {};
    console.log(`\n🔐 カスタムクレーム:`, customClaims);
    
    // Firestore ドキュメントを確認
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`\n📄 Firestore データ:`, userData);
      
      // 権限の不一致をチェック
      if (customClaims.role !== userData.role) {
        console.log(`\n⚠️  権限不一致が検出されました:`);
        console.log(`   Firebase Auth: ${customClaims.role}`);
        console.log(`   Firestore: ${userData.role}`);
      } else {
        console.log(`\n✅ 権限は一致しています: ${customClaims.role}`);
      }
    } else {
      console.log(`\n❌ Firestore ドキュメントが存在しません`);
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    process.exit(0);
  }
}

// コマンドライン引数を処理
const args = process.argv.slice(2);
if (args.length > 0) {
  checkSpecificUser(args[0]);
} else {
  checkAllUserPermissions();
}
