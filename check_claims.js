const admin = require('firebase-admin');

// サービスアカウントキーで初期化
admin.initializeApp({
    credential: admin.credential.cert('./secure_keys/serviceAccountKey.json'),
    projectId: 'new-roster-project'
});

const uid = 'XYoLPR9Q9zPWJdyw0sjQA2qcg8q2';

admin.auth().getUser(uid)
    .then(userRecord => {
        console.log('✅ ユーザー確認成功');
        console.log('Email:', userRecord.email);
        console.log('UID:', userRecord.uid);
        console.log('Custom Claims:', JSON.stringify(userRecord.customClaims, null, 2));
        
        if (userRecord.customClaims && userRecord.customClaims.role === 'admin') {
            console.log('🎉 管理者権限付与が確認できました！');
        } else {
            console.log('⚠️  管理者権限が設定されていません');
        }
    })
    .catch(error => {
        console.log('❌ エラー:', error.message);
    });
