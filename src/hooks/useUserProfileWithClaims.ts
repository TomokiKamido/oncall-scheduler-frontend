import { useMemo } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { useCustomClaimsContext } from './useCustomClaims';
import { isAdminEmail } from '../utils/adminManager'; // 管理者メール判定をインポート

/**
 * Custom Claims ベースの新しい useUserProfile Hook
 * 従来の Firestore プロファイル管理から移行
 */
export const useUserProfileWithClaims = (user: User | null) => {
  const { claims, loading: claimsLoading, error: claimsError, refreshClaims } = useCustomClaimsContext();

  // Custom Claims からユーザープロファイルを構築
  const profile = useMemo((): UserProfile | null => {
    if (!user || !claims) return null;

    // 管理者メールの場合はadminをデフォルトに、そうでなければstaff
    const defaultRole = isAdminEmail(user.email || '') ? 'admin' : 'staff';

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'ユーザー',
      role: claims.role || defaultRole,
      department: claims.hosp || '',
      managedDepartments: claims.chiefOf || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(claims.updatedAt || Date.now())
    };
  }, [user, claims]);

  return {
    profile,
    loading: claimsLoading,
    error: claimsError,
    refreshProfile: refreshClaims
  };
};

// 互換性のため既存の useUserProfile を維持（非推奨）
export const useUserProfile = (user: User | null) => {
  console.warn('⚠️ useUserProfile は非推奨です。useUserProfileWithClaims を使用してください。');
  return useUserProfileWithClaims(user);
};
