"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRoleRequest = exports.processRoleRequest = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Firebase Admin SDK の初期化
if (!admin.apps.length) {
    admin.initializeApp();
}
// リージョン指定 (東京)
const region = 'asia-northeast1';
/**
 * Firestore roleRequests/{uid} ドキュメントの作成・更新時に
 * Custom User Claims を設定する Cloud Function
 */
exports.processRoleRequest = functions
    .region(region)
    .firestore
    .document('roleRequests/{uid}')
    .onWrite(async (change, context) => {
    const uid = context.params.uid;
    try {
        // ドキュメントが削除された場合は処理をスキップ
        if (!change.after.exists) {
            functions.logger.info(`Role request for ${uid} was deleted, skipping claims update`);
            return;
        }
        const data = change.after.data();
        // status が approved でない場合は処理をスキップ
        if (data.status !== 'approved') {
            functions.logger.info(`Role request for ${uid} is ${data.status}, skipping claims update`);
            return;
        }
        functions.logger.info(`Processing role request for user ${uid}:`, data);
        // Custom Claims 用のデータを準備
        const customClaims = {
            role: data.role,
            updatedAt: Date.now()
        };
        // manager ロールの場合は管理部署を設定
        if (data.role === 'manager' && data.chiefOf && data.chiefOf.length > 0) {
            customClaims.chiefOf = data.chiefOf;
        }
        // 病院情報がある場合は設定
        if (data.hosp) {
            customClaims.hosp = data.hosp;
        }
        // Custom User Claims を設定
        await admin.auth().setCustomUserClaims(uid, customClaims);
        functions.logger.info(`Successfully updated custom claims for user ${uid}:`, customClaims);
        // 処理完了を roleRequests ドキュメントに記録
        await change.after.ref.update({
            claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            claimsData: customClaims
        });
    }
    catch (error) {
        functions.logger.error(`Failed to update custom claims for user ${uid}:`, error);
        // エラーを roleRequests ドキュメントに記録
        if (change.after.exists) {
            await change.after.ref.update({
                claimsError: error instanceof Error ? error.message : 'Unknown error',
                claimsErrorAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        throw error;
    }
});
/**
 * HTTP トリガーでテスト用のロール申請を作成
 * 動作確認用
 */
exports.testRoleRequest = functions
    .region(region)
    .https
    .onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    try {
        const { uid, role, chiefOf, hosp } = req.body;
        if (!uid || !role) {
            res.status(400).send('uid and role are required');
            return;
        }
        const roleRequestData = {
            role: role,
            chiefOf: chiefOf || [],
            hosp: hosp || '',
            requestedBy: 'test-system',
            requestedAt: admin.firestore.Timestamp.now(),
            status: 'approved' // テスト用なので即座に承認
        };
        await admin.firestore()
            .collection('roleRequests')
            .doc(uid)
            .set(roleRequestData);
        res.status(200).json({
            success: true,
            message: `Role request created for ${uid}`,
            data: roleRequestData
        });
    }
    catch (error) {
        functions.logger.error('Test role request failed:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=roleRequests.js.map