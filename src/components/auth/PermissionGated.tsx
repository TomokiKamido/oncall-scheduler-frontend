import React from 'react';
import { UserProfile } from '../../types';

interface PermissionGatedProps {
  requiredRoles: ('admin' | 'manager' | 'staff')[];
  userProfile: UserProfile | null;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 権限に基づいてコンテンツの表示を制御するコンポーネント
 * 
 * @param requiredRoles - 必要な権限のリスト
 * @param userProfile - ユーザープロファイル
 * @param fallback - 権限がない場合に表示するコンテンツ
 * @param children - 権限がある場合に表示するコンテンツ
 */
const PermissionGated: React.FC<PermissionGatedProps> = ({
  requiredRoles,
  userProfile,
  fallback = null,
  children
}) => {
  // ユーザープロファイルがない場合は何も表示しない
  if (!userProfile) {
    return <>{fallback}</>;
  }

  // ユーザーの権限が必要な権限に含まれているかチェック
  const hasPermission = requiredRoles.includes(userProfile.role as 'admin' | 'manager' | 'staff');

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGated;

/**
 * 使用例:
 * 
 * // 管理者のみ表示
 * <PermissionGated 
 *   requiredRoles={['admin']} 
 *   userProfile={profile}
 *   fallback={<div>管理者権限が必要です</div>}
 * >
 *   <AdminOnlyComponent />
 * </PermissionGated>
 * 
 * // 管理者と所属長のみ表示
 * <PermissionGated 
 *   requiredRoles={['admin', 'manager']} 
 *   userProfile={profile}
 * >
 *   <ManagerLevelComponent />
 * </PermissionGated>
 * 
 * // スタッフは表示されない（管理者・所属長のみ）
 * <PermissionGated 
 *   requiredRoles={['admin', 'manager']} 
 *   userProfile={profile}
 *   fallback={
 *     <div className="access-denied">
 *       <h3>アクセス権限がありません</h3>
 *       <p>この機能は管理者または所属長のみ利用できます。</p>
 *     </div>
 *   }
 * >
 *   <WorkScheduleManagement />
 * </PermissionGated>
 */
