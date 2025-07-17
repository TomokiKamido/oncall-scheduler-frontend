"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminBatchHTTP = exports.setRoleHTTP = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Firebase Admin SDK の初期化
if (!admin.apps.length) {
    admin.initializeApp();
}
// リージョン指定 (東京)
const region = 'asia-northeast1';
/**
 * HTTPS Function: ユーザーのロールを設定（HTTP POST）
 * 管理者権限設定用のシンプルなHTTPエンドポイント
 */
exports.setRoleHTTP = functions
    .region(region)
    .https
    .onRequest(async (req, res) => {
    // CORS設定
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // OPTIONS リクエスト（プリフライト）への対応
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // POST リクエストのみ許可
    if (req.method !== 'POST') {
        res.status(405).json({
            success: false,
            message: 'Method not allowed. Use POST.',
            timestamp: new Date().toISOString()
        });
        return;
    }
    try {
        // リクエストボディから必要なパラメータを取得
        const { uid, role, chiefOf, hosp } = req.body;
        // 入力値検証
        if (!uid) {
            res.status(400).json({
                success: false,
                message: 'UID is required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (!role || !['admin', 'manager', 'staff'].includes(role)) {
            res.status(400).json({
                success: false,
                message: 'Valid role is required (admin, manager, or staff)',
                timestamp: new Date().toISOString()
            });
            return;
        }
        functions.logger.info('setRoleHTTP called', { uid, role, chiefOf, hosp });
        // 1. ユーザーの存在確認
        let userRecord;
        try {
            userRecord = await admin.auth().getUser(uid);
        }
        catch (error) {
            functions.logger.error('User not found', { uid, error });
            res.status(404).json({
                success: false,
                message: 'User not found',
                uid,
                timestamp: new Date().toISOString()
            });
            return;
        }
        // 2. 現在のCustom Claimsを取得
        const currentClaims = userRecord.customClaims || {};
        // 3. 新しいClaimsを構築
        const newClaims = Object.assign(Object.assign(Object.assign(Object.assign({}, currentClaims), { role: role }), (chiefOf && { chiefOf })), (hosp && { hosp }));
        // 4. Custom Claimsを設定
        await admin.auth().setCustomUserClaims(uid, newClaims);
        // 5. Firestoreに記録
        const firestore = admin.firestore();
        const logData = {
            uid: uid,
            email: userRecord.email || null,
            role: role,
            chiefOf: chiefOf || null,
            hosp: hosp || null,
            status: 'approved',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: 'setRoleHTTP',
            method: 'http-function',
            previousClaims: currentClaims,
            newClaims: newClaims
        };
        await firestore.collection('roleRequests').add(logData);
        // 6. 成功レスポンス
        const response = {
            success: true,
            message: `Role '${role}' successfully set for user ${uid}`,
            uid: uid,
            role: role,
            timestamp: new Date().toISOString()
        };
        functions.logger.info('setRoleHTTP completed successfully', response);
        res.status(200).json(response);
    }
    catch (error) {
        functions.logger.error('setRoleHTTP error', { error });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * 複数ユーザーに管理者権限を一括設定
 */
exports.setAdminBatchHTTP = functions
    .region(region)
    .https
    .onRequest(async (req, res) => {
    // CORS設定
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({
            success: false,
            message: 'Method not allowed. Use POST.',
            timestamp: new Date().toISOString()
        });
        return;
    }
    try {
        const { uids } = req.body;
        if (!uids || !Array.isArray(uids) || uids.length === 0) {
            res.status(400).json({
                success: false,
                message: 'UIDs array is required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        functions.logger.info('setAdminBatchHTTP called', { uids });
        const results = [];
        for (const uid of uids) {
            try {
                // ユーザー確認
                const userRecord = await admin.auth().getUser(uid);
                // Custom Claims設定
                const currentClaims = userRecord.customClaims || {};
                const newClaims = Object.assign(Object.assign({}, currentClaims), { role: 'admin' });
                await admin.auth().setCustomUserClaims(uid, newClaims);
                // Firestore記録
                const firestore = admin.firestore();
                await firestore.collection('roleRequests').add({
                    uid: uid,
                    email: userRecord.email || null,
                    role: 'admin',
                    status: 'approved',
                    processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    processedBy: 'setAdminBatchHTTP',
                    method: 'batch-http-function'
                });
                results.push({
                    uid: uid,
                    success: true,
                    message: 'Admin role set successfully'
                });
            }
            catch (error) {
                functions.logger.error('Batch processing error for UID', { uid, error });
                results.push({
                    uid: uid,
                    success: false,
                    message: `Error: ${error}`
                });
            }
        }
        const successCount = results.filter(r => r.success).length;
        res.status(200).json({
            success: true,
            message: `Processed ${uids.length} users, ${successCount} successful`,
            results: results,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        functions.logger.error('setAdminBatchHTTP error', { error });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});
//# sourceMappingURL=setRoleHTTP.js.map