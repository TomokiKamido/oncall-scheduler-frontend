import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Firebase Admin SDKを初期化
admin.initializeApp();

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  disabled: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

interface SyncUsersResponse {
  success: boolean;
  message: string;
  authUsers: AuthUser[];
  syncedProfiles: number;
  errors?: string[];
}

/**
 * Firebase AuthenticationとFirestoreユーザープロファイルを同期する関数
 */
export const syncAuthUsers = onCall({
  cors: true,
}, async (request) => {
  try {
    logger.info("Starting Auth users sync", {structuredData: true});

    // 管理者権限チェック（呼び出し元の認証が必要）
    if (!request.auth) {
      throw new Error("認証が必要です");
    }

    // Firebase Authenticationからすべてのユーザーを取得
    const listUsersResult = await admin.auth().listUsers();
    const authUsers: AuthUser[] = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      disabled: user.disabled,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      },
    }));

    logger.info(`Found ${authUsers.length} users in Firebase Auth`, {
      structuredData: true,
    });

    // Firestoreプロファイルの同期
    const firestore = admin.firestore();
    const syncedProfiles: string[] = [];
    const errors: string[] = [];

    for (const authUser of authUsers) {
      try {
        const userProfileRef = firestore.collection("userProfiles")
          .doc(authUser.uid);
        const userProfileDoc = await userProfileRef.get();

        if (!userProfileDoc.exists) {
          // プロファイルが存在しない場合は作成
          const defaultProfile = {
            uid: authUser.uid,
            email: authUser.email || "",
            displayName: authUser.displayName ||
              authUser.email?.split("@")[0] || "未設定",
            role: "staff" as const,
            department: "",
            position: "",
            skills: [],
            phone: "",
            emergencyContact: "",
            notes: "",
            isActive: !authUser.disabled,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            autoCreated: true,
            syncedFromAuth: true,
          };

          await userProfileRef.set(defaultProfile);
          syncedProfiles.push(authUser.uid);
          logger.info(`Created profile for user: ${authUser.uid}`, {
            structuredData: true,
          });
        } else {
          // 既存のプロファイルを更新（Auth情報を反映）
          const updates: Record<string, unknown> = {
            email: authUser.email || "",
            displayName: authUser.displayName ||
              authUser.email?.split("@")[0] || "未設定",
            isActive: !authUser.disabled,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            syncedFromAuth: true,
          };

          await userProfileRef.update(updates);
          logger.info(`Updated profile for user: ${authUser.uid}`, {
            structuredData: true,
          });
        }
      } catch (error) {
        logger.error(`Error syncing user ${authUser.uid}:`, error);
        errors.push(`${authUser.uid}: ${error}`);
      }
    }

    const response: SyncUsersResponse = {
      success: true,
      message: `同期完了: ${authUsers.length}人のAuthユーザー、` +
        `${syncedProfiles.length}個のプロファイルを作成/更新`,
      authUsers,
      syncedProfiles: syncedProfiles.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    logger.info("Auth users sync completed", {
      authUsersCount: authUsers.length,
      syncedProfiles: syncedProfiles.length,
      errorsCount: errors.length,
    });

    return response;
  } catch (error) {
    logger.error("Error in syncAuthUsers:", error);
    throw new Error(`ユーザー同期に失敗しました: ${error}`);
  }
});

/**
 * Firebase Authenticationのすべてのユーザーを取得する関数（同期なし）
 */
export const getAllAuthUsers = onCall({
  cors: true,
}, async (request) => {
  try {
    logger.info("Getting all Auth users", {structuredData: true});

    // 管理者権限チェック
    if (!request.auth) {
      throw new Error("認証が必要です");
    }

    // Firebase Authenticationからすべてのユーザーを取得
    const listUsersResult = await admin.auth().listUsers();
    const authUsers: AuthUser[] = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      disabled: user.disabled,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      },
    }));

    logger.info(`Retrieved ${authUsers.length} users from Firebase Auth`, {
      structuredData: true,
    });

    return {
      success: true,
      authUsers,
      count: authUsers.length,
    };
  } catch (error) {
    logger.error("Error in getAllAuthUsers:", error);
    throw new Error(`Authユーザー取得に失敗しました: ${error}`);
  }
});
