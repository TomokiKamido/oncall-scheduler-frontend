import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin SDK の初期化
if (!admin.apps.length) {
  admin.initializeApp();
}

// リージョン指定 (東京)
const region = 'asia-northeast1';

interface SetCustomUserClaimsRequest {
  uid: string;
  customClaims: Record<string, any>;
}

interface SetCustomUserClaimsResponse {
  success: boolean;
  message: string;
  uid: string;
  customClaims: Record<string, any>;
  timestamp: string;
}

/**
 * HTTPS Function: ユーザーのCustom Claimsを設定
 * 管理者権限でユーザーの権限を柔軟に設定できるHTTPエンドポイント
 */
export const setCustomUserClaims = functions
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
      const { uid, customClaims }: SetCustomUserClaimsRequest = req.body;
      
      // 入力値検証
      if (!uid) {
        res.status(400).json({
          success: false,
          message: 'UID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      if (!customClaims || typeof customClaims !== 'object') {
        res.status(400).json({
          success: false,
          message: 'Valid customClaims object is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      functions.logger.info('setCustomUserClaims called', { uid, customClaims });
      
      // 1. ユーザーの存在確認
      let userRecord;
      try {
        userRecord = await admin.auth().getUser(uid);
      } catch (error) {
        functions.logger.error('User not found', { uid, error });
        res.status(404).json({
          success: false,
          message: 'User not found',
          uid,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // 2. Custom Claimsを設定
      await admin.auth().setCustomUserClaims(uid, customClaims);
      
      // 3. Firestoreに記録
      const firestore = admin.firestore();
      const logData = {
        uid: uid,
        email: userRecord.email || null,
        customClaims: customClaims,
        status: 'approved',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: 'setCustomUserClaims',
        method: 'HTTP'
      };
      
      // ログをFirestoreに保存
      await firestore.collection('roleRequests').add(logData);
      
      // 4. 成功レスポンス
      const response: SetCustomUserClaimsResponse = {
        success: true,
        message: 'Custom claims updated successfully',
        uid: uid,
        customClaims: customClaims,
        timestamp: new Date().toISOString()
      };
      
      functions.logger.info('setCustomUserClaims completed', response);
      res.status(200).json(response);
      
    } catch (error) {
      functions.logger.error('Error in setCustomUserClaims', { error });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

/**
 * Callable Function: setCustomUserClaims
 * Firebase Functions SDKから呼び出し可能なバージョン
 */
export const setCustomUserClaimsCallable = functions
  .region(region)
  .https
  .onCall(async (data, context) => {
    // 認証チェック
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required.'
      );
    }
    
    // 管理者権限チェック（必要に応じて）
    const { uid, customClaims } = data;
    
    if (!uid || !customClaims) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'UID and customClaims are required.'
      );
    }
    
    try {
      // 1. ユーザーの存在確認
      const userRecord = await admin.auth().getUser(uid);
      
      // 2. Custom Claimsを設定
      await admin.auth().setCustomUserClaims(uid, customClaims);
      
      // 3. Firestoreに記録
      const firestore = admin.firestore();
      const logData = {
        uid: uid,
        email: userRecord.email || null,
        customClaims: customClaims,
        status: 'approved',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: context.auth.uid,
        method: 'Callable'
      };
      
      await firestore.collection('roleRequests').add(logData);
      
      functions.logger.info('setCustomUserClaimsCallable completed', { uid, customClaims });
      
      return {
        success: true,
        message: 'Custom claims updated successfully',
        uid: uid,
        customClaims: customClaims,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      functions.logger.error('Error in setCustomUserClaimsCallable', { error });
      
      throw new functions.https.HttpsError(
        'internal',
        'Failed to update custom claims',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });
