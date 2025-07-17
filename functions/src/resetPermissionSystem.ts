import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin SDK の初期化
if (!admin.apps.length) {
  admin.initializeApp();
}

// リージョン指定 (東京)
const region = 'asia-northeast1';

// 管理者にするユーザーのメールアドレスリスト
const ADMIN_EMAILS = ['llb5yyuihdx@gmail.com'];

/**
 * 新しい権限システムを使用した権限リセット関数
 * Firestoreのpermissionsコレクションを直接操作
 */
export const resetPermissionSystem = functions
  .region(region)
  .https.onCall(async (data, context) => {
    // 認証チェック
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      const db = admin.firestore();
      const auth = admin.auth();
      const results: any[] = [];

      functions.logger.info('Starting new permission system reset');

      // 現在のユーザーが管理者かチェック（permissionsコレクションから）
      const callerPermission = await db.collection('permissions').doc(context.auth.uid).get();
      const callerRole = callerPermission.exists ? callerPermission.data()?.role : null;
      const callerEmail = context.auth.token.email || '';
      
      // 管理者権限チェック（permissionsコレクションの管理者 OR 初回セットアップ時は管理者メール）
      if (callerRole !== 'admin' && !ADMIN_EMAILS.includes(callerEmail)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can reset permission system'
        );
      }

      // 全ユーザーを取得
      const listUsersResult = await auth.listUsers();
      const batch = db.batch();
      
      for (const user of listUsersResult.users) {
        let assignedRole: 'admin' | 'manager' | 'staff' = 'staff';
        
        // メールアドレスに基づいて役割を決定
        if (ADMIN_EMAILS.includes(user.email || '')) {
          assignedRole = 'admin';
        } else {
          // デフォルトはstaff（他のユーザーはすべてstaff）
          assignedRole = 'staff';
        }

        // permissionsコレクションを更新
        const permissionRef = db.collection('permissions').doc(user.uid);
        batch.set(permissionRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: assignedRole,
          department: assignedRole === 'admin' ? 'システム管理部' : '',
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // カスタムクレームをクリア（新しいシステムでは使用しない）
        await auth.setCustomUserClaims(user.uid, {});

        results.push({
          email: user.email,
          role: assignedRole,
          status: 'updated'
        });

        functions.logger.info(`Updated ${user.email} to role: ${assignedRole} in permissions collection`);
      }

      // バッチコミット
      await batch.commit();

      const result = {
        success: true,
        message: `新しい権限システムで${results.length}人のユーザーを更新しました。`,
        results,
        adminEmails: ADMIN_EMAILS,
        note: '新しいシステムではFirestoreのpermissionsコレクションが権限の唯一の情報源です。'
      };

      functions.logger.info('New permission system reset completed', result);
      return result;
      
    } catch (error) {
      functions.logger.error('Error resetting permission system:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to reset permission system'
      );
    }
  });

/**
 * ユーザーの権限を更新する関数
 */
export const updateUserPermission = functions
  .region(region)
  .https.onCall(async (data, context) => {
    // 認証チェック
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { uid, role } = data;
    
    if (!uid || !role || !['admin', 'manager', 'staff'].includes(role)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid uid or role'
      );
    }

    try {
      const db = admin.firestore();

      // 現在のユーザーが管理者かチェック
      const callerPermission = await db.collection('permissions').doc(context.auth.uid).get();
      const callerRole = callerPermission.exists ? callerPermission.data()?.role : null;
      
      if (callerRole !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can update user permissions'
        );
      }

      // 権限を更新
      await db.collection('permissions').doc(uid).update({
        role: role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      functions.logger.info(`Updated user ${uid} to role: ${role}`);
      
      return {
        success: true,
        message: `権限を${role}に更新しました。`,
        uid,
        role
      };
      
    } catch (error) {
      functions.logger.error('Error updating user permission:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to update user permission'
      );
    }
  });
