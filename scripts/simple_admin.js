const admin = require('firebase-admin');

// 設定
const PROJECT_ID = 'new-roster-project';
const TARGET_UID = 'XYoLPR9Q9zPWJdyw0sjQA2qcg8q2';

async function setAdminRole() {
    try {
        console.log('🔧 Firebase Admin SDK 初期化...');
        
        // 既に初期化済みかチェック
        if (!admin.apps.length) {
            // Firebase CLIの認証情報を使用
            admin.initializeApp({
                projectId: PROJECT_ID
            });
        }

        const auth = admin.auth();
        console.log('✅ Admin SDK 初期化完了');

        // ユーザー確認
        console.log(`📋 ユーザー確認: ${TARGET_UID}`);
        const userRecord = await auth.getUser(TARGET_UID);
        console.log(`✅ ユーザー存在確認: ${userRecord.email}`);

        // 現在のCustom Claims確認
        const currentClaims = userRecord.customClaims || {};
        console.log('現在のClaims:', JSON.stringify(currentClaims, null, 2));

        // Custom Claims設定
        console.log('🛠️  管理者権限設定中...');
        const newClaims = {
            ...currentClaims,
            role: 'admin',
            updatedAt: new Date().toISOString()
        };

        await auth.setCustomUserClaims(TARGET_UID, newClaims);
        console.log('✅ Custom Claims 設定完了');

        // 確認
        const updatedUser = await auth.getUser(TARGET_UID);
        console.log('更新後のClaims:', JSON.stringify(updatedUser.customClaims, null, 2));

        console.log('🎉 管理者権限付与完了！');
        process.exit(0);

    } catch (error) {
        console.error('❌ エラー:', error.message);
        process.exit(1);
    }
}

setAdminRole();
