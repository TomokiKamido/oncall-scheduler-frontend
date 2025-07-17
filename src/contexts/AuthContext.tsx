import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { UserRole, ROLE_PERMISSIONS, RolePermissions } from '../types';
import { permissionService, UserPermission } from '../services/permissionService';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  permission: UserPermission | null;
  permissions: RolePermissions;
  refreshPermissions: () => Promise<void>;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isStaff: () => boolean;
}

const defaultPermissions = ROLE_PERMISSIONS.staff;

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'staff',
  loading: true,
  permission: null,
  permissions: defaultPermissions,
  refreshPermissions: async () => {},
  hasPermission: () => false,
  isAdmin: () => false,
  isManager: () => false,
  isStaff: () => true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('staff');
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<UserPermission | null>(null);
  const [permissions, setPermissions] = useState(defaultPermissions);

  const refreshPermissions = useCallback(async () => {
    if (user) {
      const perm = await permissionService.getUserPermission(user.uid);
      if (perm) {
        setPermission(perm);
        setRole(perm.role);
        setPermissions(ROLE_PERMISSIONS[perm.role]);
      }
    }
  }, [user]);

  const createDefaultPermission = async (authUser: User) => {
    try {
      // 管理者メールアドレスのチェック
      const adminEmails = ['llb5yyuihdx@gmail.com'];
      const isAdmin = adminEmails.includes(authUser.email || '');
      
      const permissionData: Partial<UserPermission> = {
        email: authUser.email || '',
        displayName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
        role: isAdmin ? 'admin' : 'staff',
        department: isAdmin ? 'システム管理部' : '',
        isActive: true,
        createdAt: new Date(),
      };

      await permissionService.setUserPermission(authUser.uid, permissionData);
      
      console.log(`✅ Created default permission for ${authUser.email} with role: ${permissionData.role}`);
      
      // 権限を再取得
      await refreshPermissions();
    } catch (error) {
      console.error('Error creating default permission:', error);
    }
  };

  const hasPermission = useCallback((permission: keyof RolePermissions): boolean => {
    return permissions[permission] || false;
  }, [permissions]);

  const isAdmin = useCallback((): boolean => {
    return role === 'admin';
  }, [role]);

  const isManager = useCallback((): boolean => {
    return role === 'manager';
  }, [role]);

  const isStaff = useCallback((): boolean => {
    return role === 'staff';
  }, [role]);

  useEffect(() => {
    let unsubscribePermission: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      console.log('🔐 [AuthContext] Auth state changed:', authUser?.email);
      setUser(authUser);

      // 既存の権限リスナーをクリーンアップ
      if (unsubscribePermission) {
        unsubscribePermission();
        unsubscribePermission = null;
      }

      if (authUser) {
        // Firestoreから権限をリアルタイムで監視
        unsubscribePermission = permissionService.subscribeToUserPermission(
          authUser.uid,
          async (perm) => {
            if (perm) {
              console.log('📋 [AuthContext] Permission updated:', perm);
              setPermission(perm);
              setRole(perm.role);
              setPermissions(ROLE_PERMISSIONS[perm.role]);
            } else {
              // 権限が存在しない場合は、デフォルトの権限を作成
              console.log('⚠️ [AuthContext] No permission found, creating default');
              await createDefaultPermission(authUser);
            }
            setLoading(false);
          }
        );
      } else {
        setRole('staff');
        setPermission(null);
        setPermissions(defaultPermissions);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribePermission) {
        unsubscribePermission();
      }
    };
  }, [refreshPermissions]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        permission,
        permissions,
        refreshPermissions,
        hasPermission,
        isAdmin,
        isManager,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
