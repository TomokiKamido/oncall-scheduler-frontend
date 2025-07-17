const admin = require('firebase-admin');

async function setAdminRole() {
    try {
        console.log('🚀 Firebase Admin SDK 管理者権限付与スクリプト開始');
        
        // Admin SDK初期化
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: 'new-roster-project'
        });
        
        const uid = 'XYoLPR9Q9zPWJdyw0sjQA2qcg8q2';
        
        console.log('📋 ユーザー確認中:', uid);
        const userRecord = await admin.auth().getUser(uid);
        console.log('✅ ユーザー確認完了:', userRecord.email);
        
        console.log('🛠️ Custom Claims設定中...');
        await admin.auth().setCustomUserClaims(uid, { 
            role: 'admin',
            updatedAt: new Date().toISOString()
        });
        
        console.log('🎉 管理者権限付与完了！');
        console.log('UID:', uid);
        console.log('Email:', userRecord.email);
        console.log('Role: admin');
        
        // 確認
        const updatedUser = await admin.auth().getUser(uid);
        console.log('📋 設定確認:', updatedUser.customClaims);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
        process.exit(1);
    }
}

setAdminRole();
