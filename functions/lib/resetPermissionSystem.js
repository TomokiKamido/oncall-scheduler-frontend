"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPermissionSystem = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Firebase Admin SDK の初期化
if (!admin.apps.length) {
    admin.initializeApp();
}
// リージョン指定 (東京)
const region = 'asia-northeast1';
// 管理者にするユーザーのメールアドレスリスト
const ADMIN_EMAILS = ['llb5yyuihdx@gmail.com'];
const MANAGER_EMAILS = []; // マネージャーにするメールアドレスを追加
const STAFF_EMAILS = ['staff@oncall-scheduler.com']; // 明示的にスタッフにする
/**
 * 権限システムを完全にリセットする関数
 * 管理者のみが実行可能
 */
exports.resetPermissionSystem = functions
    .region(region)
    .https.onCall(async (data, context) => {
    var _a, _b;
    // 認証チェック
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // 管理者権限チェック（初回セットアップ時は管理者メールアドレスも許可）
    const currentRole = context.auth.token.role;
    const currentEmail = context.auth.token.email || '';
    if (currentRole !== 'admin' && !ADMIN_EMAILS.includes(currentEmail)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can reset permission system');
    }
    try {
        const auth = admin.auth();
        const db = admin.firestore();
        const results = [];
        functions.logger.info('Starting permission system reset');
        // 全ユーザーを取得
        const listUsersResult = await auth.listUsers();
        for (const user of listUsersResult.users) {
            let assignedRole = 'staff';
            // メールアドレスに基づいて役割を決定
            if (ADMIN_EMAILS.includes(user.email || '')) {
                assignedRole = 'admin';
            }
            else if (MANAGER_EMAILS.includes(user.email || '')) {
                assignedRole = 'manager';
            }
            else if (STAFF_EMAILS.includes(user.email || '')) {
                assignedRole = 'staff';
            }
            else {
                // デフォルトはstaff
                assignedRole = 'staff';
            }
            // カスタムクレームを設定
            await auth.setCustomUserClaims(user.uid, {
                role: assignedRole,
                department: '',
                updatedAt: new Date().toISOString()
            });
            // Firestoreのユーザードキュメントを更新または作成
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || ((_a = user.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'User',
                role: assignedRole,
                department: assignedRole === 'admin' ? 'システム管理部' : '',
                managedDepartments: assignedRole === 'admin' ? [] : [],
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            results.push({
                email: user.email,
                role: assignedRole,
                status: 'updated'
            });
            functions.logger.info(`Updated ${user.email} to role: ${assignedRole}`);
        }
        // トークンをリフレッシュさせるため、メタデータを更新
        for (const user of listUsersResult.users) {
            await auth.updateUser(user.uid, {
                displayName: user.displayName || ((_b = user.email) === null || _b === void 0 ? void 0 : _b.split('@')[0]) || 'User'
            });
        }
        const result = {
            success: true,
            message: `権限システムをリセットしました。${results.length}人のユーザーを更新しました。`,
            results,
            adminEmails: ADMIN_EMAILS,
            managerEmails: MANAGER_EMAILS,
            staffEmails: STAFF_EMAILS
        };
        functions.logger.info('Permission system reset completed', result);
        return result;
    }
    catch (error) {
        functions.logger.error('Error resetting permission system:', error);
        throw new functions.https.HttpsError('internal', 'Failed to reset permission system');
    }
});
//# sourceMappingURL=resetPermissionSystem.js.map