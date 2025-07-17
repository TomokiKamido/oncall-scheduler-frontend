import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin SDK の初期化
if (!admin.apps.length) {
  admin.initializeApp();
}

// リージョン指定 (東京)
const region = 'asia-northeast1';

/**
 * 実際のカスタムクレームから権限を取得するCallable関数
 */
export const getActualUserRoles = functions
  .region(region)
  .https.onCall(async (data, context) => {
    // 認証チェック
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // 管理者権限チェック
    const callerRole = context.auth.token.role || 'staff';
    if (callerRole !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can view all user roles'
      );
    }

    try {
      // 全ユーザーのカスタムクレームを取得
      const listUsersResult = await admin.auth().listUsers();
      const users = await Promise.all(
        listUsersResult.users.map(async (user) => {
          const customClaims = user.customClaims || {};
          let role = customClaims.role || 'staff';
          
          // viewerまたはeditorはstaffに変換して返す
          if (role === 'viewer' || role === 'editor') {
            role = 'staff';
          }
          
          return {
            uid: user.uid,
            email: user.email,
            role: role,
            department: customClaims.department || '',
            chiefOf: customClaims.chiefOf || '',
            hosp: customClaims.hosp || ''
          };
        })
      );

      functions.logger.info('getActualUserRoles completed', { userCount: users.length });
      return { users };
    } catch (error) {
      functions.logger.error('Error fetching user roles:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch user roles'
      );
    }
  });

/**
 * 権限を同期するCallable関数
 */
export const syncUserRoles = functions
  .region(region)
  .https.onCall(async (data, context) => {
    // 認証チェック
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // 管理者権限チェック
    const callerRole = context.auth.token.role || 'staff';
    if (callerRole !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can sync user roles'
      );
    }

    try {
      const db = admin.firestore();
      const usersSnapshot = await db.collection('users').get();
      let syncCount = 0;
      let errorCount = 0;
      const details: string[] = [];

      // 全ユーザーのカスタムクレームもチェック
      const allUsers = await admin.auth().listUsers();
      
      // viewerとeditorをstaffに変換するマップ
      const roleMapping: { [key: string]: string } = {
        'viewer': 'staff',
        'editor': 'staff'
      };

      // まず、Firebase Authのカスタムクレームを修正
      for (const user of allUsers.users) {
        try {
          const currentClaims = user.customClaims || {};
          const currentRole = currentClaims.role || 'staff';
          
          // viewerまたはeditorの場合はstaffに変換
          if (roleMapping[currentRole]) {
            const newRole = roleMapping[currentRole];
            await admin.auth().setCustomUserClaims(user.uid, {
              ...currentClaims,
              role: newRole,
              updatedAt: new Date().toISOString()
            });
            
            details.push(`Auth: ${user.email} - ${currentRole} → ${newRole}`);
            functions.logger.info(`Updated auth claims for ${user.uid} (${user.email}): ${currentRole} -> ${newRole}`);
            syncCount++;
          }
        } catch (error) {
          functions.logger.error(`Error updating auth claims for ${user.uid}:`, error);
          errorCount++;
        }
      }

      // 次に、Firestoreのデータを同期
      for (const doc of usersSnapshot.docs) {
        try {
          const userData = doc.data();
          const uid = doc.id;
          const firestoreRole = userData.role || 'staff';

          // Firestoreのroleがviewerまたはeditorの場合はstaffに更新
          if (roleMapping[firestoreRole]) {
            await doc.ref.update({
              role: 'staff',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            details.push(`Firestore: ${userData.email} - ${firestoreRole} → staff`);
            syncCount++;
          }

          // 現在のカスタムクレームを取得
          const user = await admin.auth().getUser(uid);
          const currentRole = user.customClaims?.role || 'staff';
          
          // viewerまたはeditorをstaffに変換
          const targetRole = roleMapping[currentRole] || currentRole;
          const targetFirestoreRole = roleMapping[firestoreRole] || firestoreRole;

          // 不一致の場合のみ更新
          if (targetRole !== targetFirestoreRole) {
            await admin.auth().setCustomUserClaims(uid, {
              ...user.customClaims,
              role: targetFirestoreRole,
              department: userData.department || '',
              updatedAt: new Date().toISOString()
            });
            
            details.push(`Sync: ${userData.email} - ${targetRole} → ${targetFirestoreRole}`);
            functions.logger.info(`Synced role for ${uid}: ${targetRole} -> ${targetFirestoreRole}`);
            syncCount++;
          }
        } catch (error) {
          functions.logger.error(`Error syncing user ${doc.id}:`, error);
          errorCount++;
        }
      }

      const result = {
        success: true,
        syncCount,
        errorCount,
        message: `同期完了: ${syncCount}件の権限を更新、${errorCount}件のエラー`,
        details: details.length > 0 ? details : undefined
      };

      functions.logger.info('syncUserRoles completed', result);
      return result;
    } catch (error) {
      functions.logger.error('Error syncing roles:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to sync user roles'
      );
    }
  });
