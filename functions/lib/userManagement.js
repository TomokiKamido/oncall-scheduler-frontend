"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAuthUsers = exports.listUsers = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Firebase Admin SDK の初期化
if (!admin.apps.length) {
    admin.initializeApp();
}
// リージョン指定 (東京)
const region = 'asia-northeast1';
/**
 * Firebase Auth の全ユーザーを取得 (Callable Function)
 */
exports.listUsers = functions
    .region(region)
    .https.onCall(async (data, context) => {
    // TODO: 将来的には呼び出し元の権限チェックを有効にする
    // if (!context.auth || !context.auth.token.admin) {
    //   throw new functions.https.HttpsError(
    //     'permission-denied',
    //     'This function must be called by an admin user.'
    //   );
    // }
    try {
        functions.logger.info('listUsers function called');
        const authUsers = [];
        let nextPageToken;
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            listUsersResult.users.forEach((userRecord) => {
                authUsers.push({
                    uid: userRecord.uid,
                    email: userRecord.email || null,
                    displayName: userRecord.displayName || null,
                    disabled: userRecord.disabled,
                    metadata: {
                        creationTime: userRecord.metadata.creationTime,
                        lastSignInTime: userRecord.metadata.lastSignInTime,
                    },
                });
            });
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        functions.logger.info(`Successfully retrieved ${authUsers.length} Auth users.`);
        return { users: authUsers };
    }
    catch (error) {
        functions.logger.error('Error in listUsers function:', error);
        throw new functions.https.HttpsError('internal', 'Failed to retrieve authentication users.', error);
    }
});
/**
 * Firebase Auth ユーザーと Firestore プロファイルを同期 (HTTP Function)
 * こちらは現状維持
 */
exports.syncAuthUsers = functions
    .region(region)
    .https
    .onRequest(async (req, res) => {
    var _a;
    // CORS設定
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        functions.logger.info('syncAuthUsers called');
        const authUsers = [];
        let nextPageToken;
        // 1. Firebase Auth から全ユーザーを取得
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            listUsersResult.users.forEach((userRecord) => {
                authUsers.push({
                    uid: userRecord.uid,
                    email: userRecord.email || null,
                    displayName: userRecord.displayName || null,
                    disabled: userRecord.disabled,
                    metadata: {
                        creationTime: userRecord.metadata.creationTime,
                        lastSignInTime: userRecord.metadata.lastSignInTime
                    }
                });
            });
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
        // 2. Firestore プロファイルを同期
        const firestore = admin.firestore();
        const userProfilesRef = firestore.collection('userProfiles');
        let syncedProfiles = 0;
        const errors = [];
        for (const authUser of authUsers) {
            try {
                // 既存のプロファイルを確認
                const profileDoc = await userProfilesRef.doc(authUser.uid).get();
                if (!profileDoc.exists) {
                    // プロファイルが存在しない場合は作成
                    const newProfile = {
                        uid: authUser.uid,
                        email: authUser.email || '',
                        displayName: authUser.displayName || ((_a = authUser.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || '未設定',
                        role: 'staff',
                        department: '',
                        managedDepartments: [],
                        isActive: !authUser.disabled,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    };
                    await userProfilesRef.doc(authUser.uid).set(newProfile);
                    syncedProfiles++;
                    functions.logger.info(`Created profile for ${authUser.email}`);
                }
                else {
                    // 既存のプロファイルを更新（アクティブ状態など）
                    await userProfilesRef.doc(authUser.uid).update({
                        isActive: !authUser.disabled,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    syncedProfiles++;
                }
            }
            catch (error) {
                const errorMessage = `Failed to sync profile for ${authUser.email}: ${error}`;
                errors.push(errorMessage);
                functions.logger.error(errorMessage);
            }
        }
        // 3. 孤立したプロファイルを削除（オプション）
        // auto- で始まるUID のプロファイルを削除
        const orphanedQuery = await userProfilesRef
            .where('uid', '>=', 'auto-')
            .where('uid', '<', 'auto-\uf8ff')
            .get();
        for (const doc of orphanedQuery.docs) {
            const uid = doc.id;
            const authUserExists = authUsers.find(u => u.uid === uid);
            if (!authUserExists) {
                await doc.ref.delete();
                functions.logger.info(`Deleted orphaned profile: ${uid}`);
            }
        }
        functions.logger.info(`Sync completed: ${authUsers.length} Auth users, ${syncedProfiles} profiles synced`);
        res.status(200).json({
            success: true,
            message: `${authUsers.length}人のAuthユーザーと${syncedProfiles}個のプロファイルを同期しました`,
            authUsers: authUsers,
            syncedProfiles: syncedProfiles,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        functions.logger.error('syncAuthUsers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync Auth users',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=userManagement.js.map