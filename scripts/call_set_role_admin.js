#!/usr/bin/env node

/**
 * Firebase Admin SDK を使った管理者権限設定スクリプト
 * 目的: Custom Claims に role:"admin" を安全に設定
 * 使用方法: node scripts/call_set_role_admin.js <UID> <ROLE>
 */

const admin = require('firebase-admin');

// コマンドライン引数を取得
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('❌ 使用方法: node scripts/call_set_role_admin.js <UID> <ROLE>');
    process.exit(1);
}

const [targetUID, targetRole] = args;

// Firebase Admin SDK の初期化
try {
    // Firebase プロジェクトIDを取得
    const { execSync } = require('child_process');
    const projectId = execSync('npx firebase use', { encoding: 'utf8' }).trim();
    
    console.log(`🔧 Firebase Admin SDK初期化中...`);
    console.log(`📋 プロジェクトID: ${projectId}`);
    
    // FIREBASE_TOKENが設定されているかチェック
    if (!process.env.FIREBASE_TOKEN) {
        console.error('❌ FIREBASE_TOKEN環境変数が設定されていません');
        console.error('💡 Firebase CLI で `firebase login:ci` を実行してトークンを取得してください');
        process.exit(1);
    }
    
    // Admin SDKを初期化（プロジェクトIDのみで初期化、認証はFIREBASE_TOKENを利用）
    admin.initializeApp({
        projectId: projectId.replace(/^new-roster-project$/, 'new-roster-project'),
        credential: admin.credential.refreshToken({
            clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            refreshToken: process.env.FIREBASE_TOKEN
        })
    });
    
    console.log('✅ Firebase Admin SDK初期化完了');
    
} catch (error) {
    console.error('❌ Firebase Admin SDK初期化エラー:', error.message);
    
    // 代替手段として Application Default Credentials を試す
    console.log('🔄 Application Default Credentials で再試行...');
    try {
        admin.initializeApp();
        console.log('✅ Application Default Credentials で初期化成功');
    } catch (fallbackError) {
        console.error('❌ 全ての認証方法が失敗しました');
        console.error('💡 以下のいずれかを実行してください:');
        console.error('   1. firebase login');
        console.error('   2. gcloud auth application-default login');
        console.error('   3. サービスアカウントキーファイルを設定');
        process.exit(1);
    }
}

// メイン処理
async function setAdminRole() {
    try {
        console.log(`🎯 管理者権限設定開始...`);
        console.log(`👤 対象UID: ${targetUID}`);
        console.log(`👑 設定ロール: ${targetRole}`);
        
        // 1. ユーザーの存在確認
        console.log('📋 ユーザー存在確認...');
        const userRecord = await admin.auth().getUser(targetUID);
        console.log(`✅ ユーザー確認: ${userRecord.email || 'メールなし'}`);
        
        // 2. 現在のCustom Claimsを確認
        console.log('📋 現在のCustom Claims確認...');
        const currentClaims = userRecord.customClaims || {};
        console.log('現在のClaims:', JSON.stringify(currentClaims, null, 2));
        
        // 3. Custom Claims に role を設定
        console.log('🔧 Custom Claims更新中...');
        const newClaims = {
            ...currentClaims,
            role: targetRole
        };
        
        await admin.auth().setCustomUserClaims(targetUID, newClaims);
        console.log('✅ Custom Claims更新完了');
        
        // 4. Firestore にもログを記録（roleRequests コレクション）
        console.log('📝 Firestore記録中...');
        const firestore = admin.firestore();
        
        const logData = {
            uid: targetUID,
            email: userRecord.email || null,
            role: targetRole,
            status: 'approved',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: 'admin-script',
            method: 'direct-admin-sdk'
        };
        
        await firestore.collection('roleRequests').add(logData);
        console.log('✅ Firestore記録完了');
        
        // 5. 結果確認
        console.log('🧪 設定結果確認...');
        const updatedUser = await admin.auth().getUser(targetUID);
        const finalClaims = updatedUser.customClaims || {};
        
        console.log('');
        console.log('🎉 管理者権限設定完了！');
        console.log('======================================');
        console.log(`👤 UID: ${targetUID}`);
        console.log(`📧 Email: ${userRecord.email || 'なし'}`);
        console.log(`👑 新しいロール: ${finalClaims.role || 'なし'}`);
        console.log(`⏰ 設定時刻: ${new Date().toLocaleString('ja-JP')}`);
        console.log('======================================');
        console.log('');
        console.log('💡 次のステップ:');
        console.log('   1. 該当ユーザーに一度ログアウト→再ログインしてもらう');
        console.log('   2. Custom Claims が反映されるまで最大60秒待つ');
        console.log('   3. アプリ内で管理者権限が有効になることを確認');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 管理者権限設定エラー:', error.message);
        
        if (error.code === 'auth/user-not-found') {
            console.error('💡 指定されたUIDのユーザーが見つかりません');
            console.error('   Firebase Console > Authentication で確認してください');
        } else if (error.code === 'auth/insufficient-permission') {
            console.error('💡 権限が不足しています');
            console.error('   Firebase プロジェクトの管理者権限を確認してください');
        } else {
            console.error('💡 詳細エラー:', error);
        }
        
        process.exit(1);
    }
}

// 実行
setAdminRole();
