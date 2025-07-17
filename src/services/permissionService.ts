import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';

export interface UserPermission {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class PermissionService {
  private static instance: PermissionService;
  private listeners: Map<string, () => void> = new Map();

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * ユーザーの権限を取得（リアルタイム監視付き）
   */
  subscribeToUserPermission(
    uid: string,
    callback: (permission: UserPermission | null) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      doc(db, 'permissions', uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          callback({
            uid: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as UserPermission);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to permission:', error);
        callback(null);
      }
    );

    this.listeners.set(uid, unsubscribe);
    return unsubscribe;
  }

  /**
   * ユーザーの権限を取得（1回のみ）
   */
  async getUserPermission(uid: string): Promise<UserPermission | null> {
    try {
      const snapshot = await getDoc(doc(db, 'permissions', uid));
      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          uid: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserPermission;
      }
      return null;
    } catch (error) {
      console.error('Error getting user permission:', error);
      return null;
    }
  }

  /**
   * ユーザーの権限を作成または更新
   */
  async setUserPermission(uid: string, permissionData: Partial<UserPermission>): Promise<void> {
    try {
      await setDoc(
        doc(db, 'permissions', uid),
        {
          ...permissionData,
          uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error setting user permission:', error);
      throw error;
    }
  }

  /**
   * ユーザーの権限を更新
   */
  async updateUserPermission(uid: string, role: UserRole): Promise<void> {
    try {
      await setDoc(
        doc(db, 'permissions', uid),
        {
          role,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating user permission:', error);
      throw error;
    }
  }

  /**
   * すべてのユーザーの権限を取得
   */
  async getAllPermissions(): Promise<UserPermission[]> {
    try {
      const snapshot = await getDocs(collection(db, 'permissions'));
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserPermission;
      });
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * 権限システムを完全にリセット
   */
  async resetPermissionSystem(adminEmail: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // 既存の権限をすべて取得
      const existingPermissions = await this.getAllPermissions();
      
      // 管理者以外をstaffに設定
      existingPermissions.forEach((perm) => {
        if (perm.email !== adminEmail) {
          batch.update(doc(db, 'permissions', perm.uid), {
            role: 'staff',
            updatedAt: serverTimestamp(),
          });
        } else {
          // 管理者の権限を確実に設定
          batch.update(doc(db, 'permissions', perm.uid), {
            role: 'admin',
            updatedAt: serverTimestamp(),
          });
        }
      });

      await batch.commit();
      console.log('Permission system reset completed');
    } catch (error) {
      console.error('Error resetting permission system:', error);
      throw error;
    }
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }
}

export const permissionService = PermissionService.getInstance();
