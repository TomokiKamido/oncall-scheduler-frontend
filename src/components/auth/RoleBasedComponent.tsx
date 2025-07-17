import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole, RolePermissions } from '../../types';

interface RoleBasedComponentProps {
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: keyof RolePermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  requiredRole,
  requiredPermission,
  children,
  fallback = null
}) => {
  const { profile, hasPermission } = useAuth();

  // プロファイルが読み込まれていない場合は何も表示しない
  if (!profile) {
    return <>{fallback}</>;
  }

  // ロールチェック
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(profile.role)) {
      return <>{fallback}</>;
    }
  }

  // 権限チェック
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default RoleBasedComponent;
