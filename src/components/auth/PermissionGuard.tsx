import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getRoleLabel } from '../RoleBadge';
import { RolePermissions } from '../../types';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: keyof RolePermissions;
  role?: 'admin' | 'manager' | 'staff';
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  role,
  fallback
}) => {
  const { hasPermission, profile } = useAuth();

  // 権限チェック
  if (permission && !hasPermission(permission)) {
    return (
      <>
        {fallback || (
          <div className="permission-denied">
            <div className="permission-icon">🚫</div>
            <h3>アクセス権限がありません</h3>
            <p>この機能を使用する権限がありません。</p>
          </div>
        )}
      </>
    );
  }

  // 役割チェック
  if (role && profile?.role !== role) {
    return (
      <>
        {fallback || (
          <div className="permission-denied">
            <div className="permission-icon">🚫</div>
            <h3>アクセス権限がありません</h3>
            <p>この機能は{getRoleLabel(role)}のみ使用できます。</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
