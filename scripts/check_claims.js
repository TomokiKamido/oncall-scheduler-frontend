#!/usr/bin/env node

/**
 * Firebase Admin SDK - Custom Claims 確認スクリプト
 * 目的: 指定されたUIDのCustom Claimsを確認
 * 作成日: 2025年6月23日
 */

const admin = require('firebase-admin');

async function checkUserClaims(uid) {
    try {
        console.log('🔍 Firebase Admin SDK - Custom Claims 確認');
        console.log('==========================================');
        
        // Admin SDK初期化
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'new-roster-project'
            });
        }

        const auth = admin.auth();
        
        console.log(`📋 ユーザー情報取得中: ${uid}`);
        
        const userRecord = await auth.getUser(uid);
        
        console.log('✅ ユーザー情報:');
        console.log(`   UID: ${userRecord.uid}`);
        console.log(`   Email: ${userRecord.email || 'なし'}`);
        console.log(`   作成日: ${new Date(userRecord.metadata.creationTime).toLocaleString('ja-JP')}`);
        console.log(`   最終ログイン: ${userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toLocaleString('ja-JP') : 'なし'}`);
        
        console.log('');
        console.log('🔐 Custom Claims:');
        const customClaims = userRecord.customClaims || {};
        
        if (Object.keys(customClaims).length === 0) {
            console.log('   Custom Claims は設定されていません');
        } else {
            Object.entries(customClaims).forEach(([key, value]) => {
                console.log(`   ${key}: ${value}`);
            });
        }
        
        console.log('');
        console.log('👑 管理者権限チェック:');
        if (customClaims.role === 'admin') {
            console.log('   ✅ 管理者権限あり');
        } else {
            console.log(`   ❌ 管理者権限なし (現在: ${customClaims.role || 'なし'})`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
        return false;
    }
}

// メイン実行
async function main() {
    const uid = process.argv[2];
    
    if (!uid) {
        console.error('❌ UIDが指定されていません');
        console.error('使用方法: node check_claims.js <UID>');
        process.exit(1);
    }

    await checkUserClaims(uid);
}

main().catch(error => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
});
