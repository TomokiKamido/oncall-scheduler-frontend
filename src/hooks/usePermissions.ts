import { useState, useCallback, useEffect } from 'react';
import { UserRole, UserPermission } from '../types';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ストレージキー
  const STORAGE_KEY = 'user_permissions';

  // データの永続化
  const saveToStorage = useCallback((data: UserPermission[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Permission storage save error:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): UserPermission[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Date型フィールドを復元
      return parsed.map((perm: { grantedAt: string | number | Date; [key: string]: unknown }) => ({
        ...perm,
        grantedAt: new Date(perm.grantedAt)
      }));
    } catch (error) {
      console.error('Permission storage load error:', error);
      return [];
    }
  }, []);

  // 初期データの読み込み
  useEffect(() => {
    const loadInitialData = () => {
      setIsLoading(true);
      try {
        const storedPermissions = loadFromStorage();
        setPermissions(storedPermissions);
        console.log('📋 権限データを読み込みました:', storedPermissions.length);
      } catch (error) {
        console.error('Permission initialization error:', error);
        setError('権限データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [loadFromStorage]);

  // 権限の付与
  const grantPermission = useCallback(async (
    userId: string,
    departmentId: string,
    role: UserRole,
    canManageDepartment: boolean = false,
    grantedBy: string = 'admin'
  ): Promise<boolean> => {
    try {
      setError(null);
      
      // 既存の権限をチェック
      const existingPermission = permissions.find(p => 
        p.userId === userId && p.departmentId === departmentId
      );

      const newPermission: UserPermission = {
        userId,
        departmentId,
        role,
        canManageDepartment,
        grantedBy,
        grantedAt: new Date()
      };

      let updatedPermissions: UserPermission[];
      
      if (existingPermission) {
        // 既存の権限を更新
        updatedPermissions = permissions.map(p => 
          p.userId === userId && p.departmentId === departmentId 
            ? newPermission 
            : p
        );
        console.log('✅ 権限を更新しました:', newPermission);
      } else {
        // 新しい権限を追加
        updatedPermissions = [...permissions, newPermission];
        console.log('✅ 権限を付与しました:', newPermission);
      }

      setPermissions(updatedPermissions);
      saveToStorage(updatedPermissions);
      
      return true;
    } catch (error) {
      console.error('Permission grant error:', error);
      setError('権限の付与に失敗しました');
      return false;
    }
  }, [permissions, saveToStorage]);

  // 権限の取り消し
  const revokePermission = useCallback(async (
    userId: string,
    departmentId: string
  ): Promise<boolean> => {
    try {
      setError(null);
      
      const updatedPermissions = permissions.filter(p => 
        !(p.userId === userId && p.departmentId === departmentId)
      );
      
      setPermissions(updatedPermissions);
      saveToStorage(updatedPermissions);
      
      console.log('✅ 権限を取り消しました:', { userId, departmentId });
      return true;
    } catch (error) {
      console.error('Permission revoke error:', error);
      setError('権限の取り消しに失敗しました');
      return false;
    }
  }, [permissions, saveToStorage]);

  // ユーザーの権限取得
  const getUserPermissions = useCallback((userId: string): UserPermission[] => {
    return permissions.filter(p => p.userId === userId);
  }, [permissions]);

  // 部署の権限取得
  const getDepartmentPermissions = useCallback((departmentId: string): UserPermission[] => {
    return permissions.filter(p => p.departmentId === departmentId);
  }, [permissions]);

  // ユーザーが部署を管理できるかチェック
  const canUserManageDepartment = useCallback((
    userId: string,
    departmentId: string
  ): boolean => {
    const permission = permissions.find(p => 
      p.userId === userId && p.departmentId === departmentId
    );
    return permission?.canManageDepartment || false;
  }, [permissions]);

  // ユーザーの管理可能部署を取得
  const getUserManagedDepartments = useCallback((userId: string): string[] => {
    return permissions
      .filter(p => p.userId === userId && p.canManageDepartment)
      .map(p => p.departmentId);
  }, [permissions]);

  // 部署の管理者を取得
  const getDepartmentManagers = useCallback((departmentId: string): string[] => {
    return permissions
      .filter(p => p.departmentId === departmentId && p.canManageDepartment)
      .map(p => p.userId);
  }, [permissions]);

  // ユーザーのロールを取得
  const getUserRoleInDepartment = useCallback((
    userId: string,
    departmentId: string
  ): UserRole | null => {
    const permission = permissions.find(p => 
      p.userId === userId && p.departmentId === departmentId
    );
    return permission?.role || null;
  }, [permissions]);

  // 部署に所属するユーザー一覧を取得
  const getDepartmentUsers = useCallback((departmentId: string): {
    userId: string;
    role: UserRole;
    canManage: boolean;
  }[] => {
    return permissions
      .filter(p => p.departmentId === departmentId)
      .map(p => ({
        userId: p.userId,
        role: p.role,
        canManage: p.canManageDepartment
      }));
  }, [permissions]);

  // 権限の一括設定
  const setBulkPermissions = useCallback(async (
    newPermissions: UserPermission[]
  ): Promise<boolean> => {
    try {
      setError(null);
      setPermissions(newPermissions);
      saveToStorage(newPermissions);
      console.log('✅ 権限を一括設定しました:', newPermissions.length);
      return true;
    } catch (error) {
      console.error('Bulk permission set error:', error);
      setError('権限の一括設定に失敗しました');
      return false;
    }
  }, [saveToStorage]);

  return {
    permissions,
    isLoading,
    error,
    grantPermission,
    revokePermission,
    getUserPermissions,
    getDepartmentPermissions,
    canUserManageDepartment,
    getUserManagedDepartments,
    getDepartmentManagers,
    getUserRoleInDepartment,
    getDepartmentUsers,
    setBulkPermissions,
    setError
  };
};
