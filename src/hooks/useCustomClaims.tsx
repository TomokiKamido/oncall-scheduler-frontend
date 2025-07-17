import { useEffect, useRef, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, getIdTokenResult } from 'firebase/auth';
import useSWR from 'swr';
import React from 'react';

interface CustomClaims {
  role?: 'admin' | 'manager' | 'staff' | null;
  chiefOf?: string[] | null;
  hosp?: string | null;
  updatedAt?: number | null;
}

interface UseCustomClaimsResult {
  claims: CustomClaims | null;
  loading: boolean;
  error: Error | null;
  refreshClaims: () => Promise<void>;
}

/**
 * Firebase Custom Claims を定期的に更新する Hook
 * SWR を使用してメモリリークを防止し、ID トークンを 60 分ごとに強制更新
 */
export const useCustomClaims = (user: User | null): UseCustomClaimsResult => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Claims を取得する fetcher 関数
  const fetcher = useCallback(async (_uid: string): Promise<CustomClaims> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // ID トークンを強制更新して取得
      const idTokenResult = await getIdTokenResult(user, true);
      const claims = idTokenResult.claims;

      console.log('🔑 Custom Claims 取得:', claims);

      return {
        role: (claims.role as 'admin' | 'manager' | 'staff') || null,
        chiefOf: (claims.chiefOf as string[]) || null,
        hosp: (claims.hosp as string) || null,
        updatedAt: (claims.updatedAt as number) || null
      };
    } catch (error) {
      console.error('❌ Custom Claims 取得エラー:', error);
      throw error;
    }
  }, [user]);

  // SWR でデータ管理 (staleTime = 55分)
  const {
    data: claims,
    error,
    isLoading: loading,
    mutate
  } = useSWR(
    user ? `custom-claims-${user.uid}` : null,
    () => fetcher(user!.uid),
    {
      refreshInterval: 55 * 60 * 1000, // 55分ごと
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30 * 1000, // 30秒以内の重複リクエストを防止
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error('🚨 Custom Claims SWR エラー:', error);
      },
      onSuccess: (data) => {
        console.log('✅ Custom Claims 更新成功:', data);
      }
    }
  );

  // 手動で Claims を更新する関数
  const refreshClaims = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      console.log('🔄 Custom Claims 手動更新中...');
      await mutate();
      console.log('✅ Custom Claims 手動更新完了');
    } catch (error) {
      console.error('❌ Custom Claims 手動更新エラー:', error);
      throw error;
    }
  }, [user, mutate]);

  // 60分ごとの強制更新タイマー設定
  useEffect(() => {
    if (!user || !mountedRef.current) return;

    // 初回は即座に実行
    refreshClaims().catch(console.error);

    // 60分ごとのタイマー設定
    intervalRef.current = setInterval(() => {
      if (mountedRef.current && user) {
        console.log('⏰ 60分経過 - ID トークン強制更新');
        refreshClaims().catch(console.error);
      }
    }, 60 * 60 * 1000); // 60分

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, refreshClaims]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    claims: claims || null,
    loading,
    error: error || null,
    refreshClaims
  };
};

/**
 * Custom Claims Context
 */

interface CustomClaimsContextType {
  claims: CustomClaims | null;
  loading: boolean;
  error: Error | null;
  refreshClaims: () => Promise<void>;
}

const CustomClaimsContext = createContext<CustomClaimsContextType | undefined>(undefined);

interface CustomClaimsProviderProps {
  children: ReactNode;
  user: User | null;
}

export const CustomClaimsProvider: React.FC<CustomClaimsProviderProps> = ({
  children,
  user
}) => {
  const claimsData = useCustomClaims(user);

  return (
    <CustomClaimsContext.Provider value={claimsData}>
      {children}
    </CustomClaimsContext.Provider>
  );
};

/**
 * Custom Claims を使用するための Hook
 */
export const useCustomClaimsContext = (): CustomClaimsContextType => {
  const context = useContext(CustomClaimsContext);
  if (context === undefined) {
    throw new Error('useCustomClaimsContext must be used within a CustomClaimsProvider');
  }
  return context;
};

export type { CustomClaims, UseCustomClaimsResult };
