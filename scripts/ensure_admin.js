const admin = require('firebase-admin');

// 設定
const PROJECT_ID = 'new-roster-project';
const TARGET_UID = 'XYoLPR9Q9zPWJdyw0sjQA2qcg8q2';

// 複数の方法で管理者権限を設定する確実なスクリプト
async function ensureAdminRole() {
    try {
        console.log('🔧 Firebase Admin SDK 初期化...');
        
        // サービスアカウントキーを使用せず、プロジェクトのデフォルト認証を使用
        if (!admin.apps.length) {
            admin.initializeApp({
                projectId: PROJECT_ID,
                // 認証情報は自動的に検出される
            });
        }

        const auth = admin.auth();
        const firestore = admin.firestore();
        console.log('✅ Admin SDK 初期化完了');

        console.log(`📋 UID: ${TARGET_UID} を管理者に設定中...`);

        // 1. Firebase Auth Custom Claims設定
        try {
            const userRecord = await auth.getUser(TARGET_UID);
            console.log(`✅ ユーザー確認: ${userRecord.email || 'Email不明'}`);
            
            await auth.setCustomUserClaims(TARGET_UID, {
                role: 'admin',
                isAdmin: true,
                updatedAt: new Date().toISOString()
            });
            console.log('✅ Firebase Auth Custom Claims設定完了');
        } catch (authError) {
            console.log('⚠️ Firebase Auth設定スキップ:', authError.message);
        }

        // 2. Firestore userProfiles コレクション設定
        try {
            const userProfileRef = firestore.collection('userProfiles').doc(TARGET_UID);
            const profileData = {
                uid: TARGET_UID,
                email: 'llb5yyuihdx@gmail.com',
                displayName: 'Admin User',
                role: 'admin',
                department: 'システム管理部',
                managedDepartments: [], // 管理者は全部署管理可能
                isActive: true,
                permissions: {
                    canCreateSchedule: true,
                    canEditSchedule: true,
                    canDeleteSchedule: true,
                    canManageUsers: true,
                    canViewAllDepartments: true
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await userProfileRef.set(profileData, { merge: true });
            console.log('✅ Firestore userProfile設定完了');
        } catch (firestoreError) {
            console.log('⚠️ Firestore設定エラー:', firestoreError.message);
        }

        // 3. 設定確認
        try {
            const updatedUser = await auth.getUser(TARGET_UID);
            console.log('🔍 設定後のCustom Claims:', JSON.stringify(updatedUser.customClaims, null, 2));
            
            const profileDoc = await firestore.collection('userProfiles').doc(TARGET_UID).get();
            if (profileDoc.exists) {
                console.log('🔍 設定後のFirestore Profile:', JSON.stringify(profileDoc.data(), null, 2));
            }
        } catch (checkError) {
            console.log('⚠️ 確認処理エラー:', checkError.message);
        }

        console.log('🎉 管理者権限設定処理完了！');
        console.log('💡 ユーザーは次回ログイン時に新しい権限が適用されます');

    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error('詳細:', error);
    }
}

ensureAdminRole();
