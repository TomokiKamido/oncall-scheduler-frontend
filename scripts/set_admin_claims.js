const admin = require('firebase-admin');

/**
 * Firebase Admin SDK を使用した管理者権限付与スクリプト
 * 目的: UID指定でrole:'admin'をCustom Claimsに安全に設定
 * 認証: GOOGLE_APPLICATION_CREDENTIALS環境変数を使用
 * 作成日: 2025年6月23日
 */

// コマンドライン引数の確認
if (process.argv.length < 3) {
    console.error('❌ 使用方法: node set_admin_claims.js <UID>');
    console.error('例: node set_admin_claims.js XYoLPR9Q9zPWJdyw0sjQA2qcg8q2');
    process.exit(1);
}

const targetUID = process.argv[2];

async function setAdminRole(uid) {
    try {
        console.log('🔐 Firebase Admin SDK 初期化中...');
        
        // 環境変数からの認証情報を使用
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'new-roster-project'
            });
        }
        
        const auth = admin.auth();
        const firestore = admin.firestore();
        
        console.log('✅ Firebase Admin SDK 初期化完了');
        
        // 1. ユーザーの存在確認
        console.log(`📋 ユーザー確認中: ${uid}`);
        
        let userRecord;
        try {
            userRecord = await auth.getUser(uid);
            console.log(`✅ ユーザーが見つかりました: ${userRecord.email || userRecord.uid}`);
        } catch (error) {
            console.error(`❌ ユーザーが見つかりません: ${uid}`);
            console.error(`エラー: ${error.message}`);
            process.exit(1);
        }
        
        // 2. 現在のCustom Claimsを確認
        console.log('📋 現在のCustom Claims確認中...');
        const currentClaims = userRecord.customClaims || {};
        console.log('現在のClaims:', JSON.stringify(currentClaims, null, 2));
        
        // 3. 既に管理者権限があるかチェック（冪等性）
        if (currentClaims.role === 'admin') {
            console.log('✅ 既に管理者権限が設定されています（変更不要）');
            return {
                success: true,
                message: '既に管理者権限が設定済み',
                uid: uid,
                previousRole: currentClaims.role
            };
        }
        
        // 4. 管理者権限を設定
        console.log('🛠️  管理者権限を設定中...');
        const newClaims = {
            ...currentClaims,
            role: 'admin',
            updatedAt: new Date().toISOString(),
            updatedBy: 'admin-script'
        };
        
        await auth.setCustomUserClaims(uid, newClaims);
        console.log('✅ Custom Claims更新完了');
        
        // 5. Firestoreにも記録（既存のroleRequestsコレクション活用）
        console.log('📝 Firestore記録中...');
        
        const roleRequestRef = firestore.collection('roleRequests').doc(uid);
        const roleRequestData = {
            uid: uid,
            email: userRecord.email || '',
            requestedRole: 'admin',
            status: 'approved',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedBy: 'admin-script',
            method: 'direct-admin-sdk',
            customClaimsUpdated: true
        };
        
        await roleRequestRef.set(roleRequestData, { merge: true });
        console.log('✅ Firestore記録完了');
        
        // 6. 結果確認
        console.log('🧪 設定結果確認中...');
        const updatedUser = await auth.getUser(uid);
        const finalClaims = updatedUser.customClaims || {};
        
        console.log('最終的なClaims:', JSON.stringify(finalClaims, null, 2));
        
        if (finalClaims.role === 'admin') {
            console.log('🎉 管理者権限設定完了！');
            return {
                success: true,
                message: '管理者権限設定完了',
                uid: uid,
                previousRole: currentClaims.role,
                newRole: finalClaims.role,
                email: userRecord.email
            };
        } else {
            throw new Error('Custom Claims設定後の確認で管理者権限が見つかりません');
        }
        
    } catch (error) {
        console.error('❌ 管理者権限設定エラー:', error.message);
        console.error('詳細:', error);
        
        return {
            success: false,
            message: error.message,
            uid: uid
        };
    }
}

// メイン実行
(async () => {
    console.log('👑 Firebase Admin SDK - 管理者権限付与スクリプト');
    console.log('================================================');
    console.log(`対象UID: ${targetUID}`);
    console.log('');
    
    const result = await setAdminRole(targetUID);
    
    console.log('================================================');
    if (result.success) {
        console.log('🎉 処理完了: 成功');
        console.log(`UID: ${result.uid}`);
        console.log(`メッセージ: ${result.message}`);
        if (result.email) {
            console.log(`メールアドレス: ${result.email}`);
        }
        if (result.previousRole) {
            console.log(`前の権限: ${result.previousRole}`);
        }
        if (result.newRole) {
            console.log(`新しい権限: ${result.newRole}`);
        }
        process.exit(0);
    } else {
        console.log('❌ 処理完了: 失敗');
        console.log(`UID: ${result.uid}`);
        console.log(`エラー: ${result.message}`);
        process.exit(1);
    }
})();
