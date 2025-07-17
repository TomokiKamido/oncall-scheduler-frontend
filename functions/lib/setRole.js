"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAdminBatch = exports.setRole = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Firebase Admin SDK の初期化
if (!admin.apps.length) {
    admin.initializeApp();
}
// リージョン指定 (東京)
const region = 'asia-northeast1';
/**
 * HTTPS Callable Cloud Function: ユーザーのロールを設定
 * 管理者権限設定用のセキュアなエンドポイント
 */
exports.setRole = functions
    .region(region)
    .https
    .onCall(async (data, context) => {
    var _a, _b, _c;
    const startTime = new Date();
    try {
        functions.logger.info('setRole 関数開始', {
            data,
            caller: ((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) || 'anonymous',
            timestamp: startTime.toISOString()
        });
        // 入力検証
        if (!data || typeof data !== 'object') {
            throw new functions.https.HttpsError('invalid-argument', 'リクエストデータが無効です');
        }
        const { uid, role, chiefOf, hosp } = data;
        // 必須パラメータの検証
        if (!uid || typeof uid !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'UID が必要です');
        }
        if (!role || !['admin', 'manager', 'staff'].includes(role)) {
            throw new functions.https.HttpsError('invalid-argument', 'role は admin, manager, staff のいずれかである必要があります');
        }
        // UID の基本的な形式チェック
        if (uid.length < 20 || uid.length > 128) {
            throw new functions.https.HttpsError('invalid-argument', 'UID の形式が正しくありません');
        }
        functions.logger.info('パラメータ検証完了', { uid, role });
        // 対象ユーザーの存在確認
        let userRecord;
        try {
            userRecord = await admin.auth().getUser(uid);
            functions.logger.info('対象ユーザー確認完了', {
                uid: userRecord.uid,
                email: userRecord.email,
                disabled: userRecord.disabled
            });
        }
        catch (error) {
            functions.logger.error('ユーザー取得エラー', { uid, error });
            throw new functions.https.HttpsError('not-found', `UID ${uid} のユーザーが見つかりません`);
        }
        // 無効化されたユーザーへの権限設定を防ぐ
        if (userRecord.disabled) {
            throw new functions.https.HttpsError('failed-precondition', 'アカウントが無効化されているユーザーには権限を設定できません');
        }
        // Custom Claims 用のデータを準備
        const customClaims = {
            role: role,
            updatedAt: Date.now(),
            updatedBy: ((_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid) || 'system'
        };
        // manager ロールの場合は管理部署を設定
        if (role === 'manager' && chiefOf && Array.isArray(chiefOf) && chiefOf.length > 0) {
            // 管理部署の検証
            const validDepartments = chiefOf.filter(dept => typeof dept === 'string' && dept.trim().length > 0);
            if (validDepartments.length > 0) {
                customClaims.chiefOf = validDepartments;
            }
        }
        // 病院情報がある場合は設定
        if (hosp && typeof hosp === 'string' && hosp.trim().length > 0) {
            customClaims.hosp = hosp.trim();
        }
        functions.logger.info('Custom Claims データ準備完了', { customClaims });
        // Custom User Claims を設定
        await admin.auth().setCustomUserClaims(uid, customClaims);
        functions.logger.info('Custom Claims 設定完了', {
            uid,
            role,
            claimsCount: Object.keys(customClaims).length
        });
        // Firestore の roleRequests コレクションにも記録を作成
        try {
            const roleRequestData = {
                role: role,
                chiefOf: customClaims.chiefOf || [],
                hosp: customClaims.hosp || '',
                requestedBy: ((_c = context.auth) === null || _c === void 0 ? void 0 : _c.uid) || 'system',
                requestedAt: admin.firestore.Timestamp.now(),
                status: 'approved',
                claimsUpdatedAt: admin.firestore.Timestamp.now(),
                claimsData: customClaims,
                processedBy: 'setRole-function'
            };
            await admin.firestore()
                .collection('roleRequests')
                .doc(uid)
                .set(roleRequestData, { merge: true });
            functions.logger.info('Firestore roleRequests 記録完了', { uid });
        }
        catch (firestoreError) {
            // Firestore への書き込みが失敗してもCustom Claimsは設定済みなので警告のみ
            functions.logger.warn('Firestore 記録エラー（Custom Claimsは正常設定済み）', {
                uid,
                error: firestoreError
            });
        }
        const endTime = new Date();
        const processingTime = endTime.getTime() - startTime.getTime();
        const response = {
            success: true,
            message: `ユーザー ${uid} のロールを ${role} に設定しました`,
            uid: uid,
            role: role,
            timestamp: endTime.toISOString()
        };
        functions.logger.info('setRole 関数完了', {
            response,
            processingTimeMs: processingTime,
            userEmail: userRecord.email
        });
        return response;
    }
    catch (error) {
        const endTime = new Date();
        const processingTime = endTime.getTime() - startTime.getTime();
        functions.logger.error('setRole 関数エラー', {
            error: error instanceof Error ? error.message : error,
            data,
            processingTimeMs: processingTime,
            stack: error instanceof Error ? error.stack : undefined
        });
        // functions.https.HttpsError の場合はそのまま再スロー
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // その他のエラーの場合は内部エラーとして処理
        throw new functions.https.HttpsError('internal', 'ロール設定中に内部エラーが発生しました', { originalError: error instanceof Error ? error.message : String(error) });
    }
});
/**
 * 管理者権限の一括設定用 (開発・デバッグ用)
 * 本番環境では使用を避けることを推奨
 */
exports.setAdminBatch = functions
    .region(region)
    .https
    .onCall(async (data, context) => {
    var _a, _b;
    const startTime = new Date();
    try {
        functions.logger.info('setAdminBatch 関数開始', {
            uidsCount: ((_a = data.uids) === null || _a === void 0 ? void 0 : _a.length) || 0,
            caller: ((_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid) || 'anonymous'
        });
        // セキュリティ: 認証済みユーザーのみ実行可能
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
        }
        // 入力検証
        if (!data.uids || !Array.isArray(data.uids) || data.uids.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'UIDs 配列が必要です');
        }
        // 一度に処理するUID数の制限
        if (data.uids.length > 10) {
            throw new functions.https.HttpsError('invalid-argument', '一度に処理できるUIDは10個までです');
        }
        const results = [];
        for (const uid of data.uids) {
            try {
                // setRole 関数を内部的に呼び出し
                const result = await global.setRole({ uid, role: 'admin' }, context);
                results.push({ uid, success: true, result });
            }
            catch (error) {
                results.push({
                    uid,
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        const endTime = new Date();
        const processingTime = endTime.getTime() - startTime.getTime();
        functions.logger.info('setAdminBatch 関数完了', {
            results,
            processingTimeMs: processingTime
        });
        return {
            success: true,
            results,
            summary: {
                total: data.uids.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            },
            timestamp: endTime.toISOString()
        };
    }
    catch (error) {
        functions.logger.error('setAdminBatch 関数エラー', { error });
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', '一括管理者設定中にエラーが発生しました');
    }
});
//# sourceMappingURL=setRole.js.map