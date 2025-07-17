import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, ROLE_PERMISSIONS, RolePermissions } from '../types';
import { isAdminEmail, forceAdminProfile } from '../utils/adminManager';
// import { addDebugLog } from '../components/common/DebugOverlay';

// ⚠️ 非推奨: 従来の Firestore ベースプロファイル管理
// 新しいシステムでは Custom Claims を使用してください

// ローカルストレージキー
const LOCAL_PROFILE_KEY = 'oncall_user_profile';

// グローバルプロファイルキャッシュ
let globalProfileCache: { [userId: string]: UserProfile } = {};
let lastFetchTime: { [userId: string]: number } = {};

// キャッシュ有効期限（5分）
const CACHE_DURATION = 5 * 60 * 1000;

// 役割の正規化（viewer, editorをstaffに統一）
const normalizeRole = (role: string): 'admin' | 'manager' | 'staff' => {
  if (role === 'admin') return 'admin';
  if (role === 'manager') return 'manager';
  // viewer, editor, またはその他の役割はすべてstaffに統一
  return 'staff';
};

// ローカルプロファイルの保存
const saveLocalProfile = (profile: UserProfile) => {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    // グローバルキャッシュにも保存
    globalProfileCache[profile.uid] = profile;
    lastFetchTime[profile.uid] = Date.now();
    // addDebugLog('💾 プロファイルをキャッシュに保存', 'info');
  } catch (error) {
    // addDebugLog('❌ プロファイル保存エラー', 'error');
  }
};

// キャッシュからプロファイル取得
const getCachedProfile = (userId: string): UserProfile | null => {
  // グローバルキャッシュから取得
  if (globalProfileCache[userId]) {
    const lastFetch = lastFetchTime[userId] || 0;
    if (Date.now() - lastFetch < CACHE_DURATION) {
      // addDebugLog('⚡ グローバルキャッシュからプロファイル取得', 'info');
      return globalProfileCache[userId];
    }
  }
  
  // ローカルストレージから取得
  try {
    const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (saved) {
      const profile = JSON.parse(saved);
      if (profile.uid === userId) {
        // グローバルキャッシュに復元
        globalProfileCache[userId] = profile;
        // addDebugLog('📄 ローカルストレージからプロファイル復元', 'info');
        return profile;
      }
    }
  } catch (error) {
    // addDebugLog('❌ ローカルプロファイル読み込みエラー', 'error');
  }
  return null;
};

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザープロファイル更新イベントリスナー
  useEffect(() => {
    const handleProfileUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId, updates } = customEvent.detail;
      console.log(`🔄 プロファイル更新イベント受信: ${userId}`, updates);
      
      if (user && user.uid === userId) {
        console.log('🧹 現在ユーザーのキャッシュクリアを実行');
        
        try {
          // キャッシュクリア
          localStorage.removeItem(LOCAL_PROFILE_KEY);
          delete globalProfileCache[user.uid];
          delete lastFetchTime[user.uid];
          
          // セッションストレージのキャッシュもクリア
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes(user.uid)) {
              sessionStorage.removeItem(key);
            }
          });

          // Firestoreから最新データを取得
          const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            const latestProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || data.displayName || '',
              role: normalizeRole(data.role || (isAdminEmail(user.email || '') ? 'admin' : 'staff')),
              department: data.department || '',
              managedDepartments: data.managedDepartments || [],
              isActive: data.isActive !== false,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            };
            
            setProfile(latestProfile);
            saveLocalProfile(latestProfile);
            console.log('✅ プロファイル更新イベント処理完了');
          } else {
            console.warn('⚠️ Firestoreプロファイルが見つかりません');
            // フォールバック: ローカル更新を適用
            if (profile) {
              const updatedProfile = { ...profile, ...updates };
              setProfile(updatedProfile);
              saveLocalProfile(updatedProfile);
            }
          }
        } catch (error) {
          console.error('❌ プロファイル再取得エラー:', error);
          // フォールバック: ローカル更新を適用
          if (profile) {
            const updatedProfile = { ...profile, ...updates };
            setProfile(updatedProfile);
            saveLocalProfile(updatedProfile);
          }
        }
      }
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [user, profile]);

// 管理者権限強制チェック
  const checkForceAdminOverride = useCallback((user: User): UserProfile | null => {
    if (!user.email) return null;
    
    if (!isAdminEmail(user.email)) return null;
    
    // セッションストレージで管理者権限オーバーライドをチェック
    const adminOverride = sessionStorage.getItem('admin_override_' + user.uid);
    const adminProfileData = sessionStorage.getItem('admin_profile_' + user.uid);
    
    if (adminOverride === 'true' && adminProfileData) {
      try {
        const adminProfile = JSON.parse(adminProfileData);
        console.log(`👑 セッション管理者権限を検出: ${user.email}`);
        return adminProfile;
      } catch (error) {
        console.error(`❌ セッション管理者プロファイル解析エラー:`, error);
      }
    }
    
    // 強制的に管理者プロファイルを作成
    console.log(`🔧 管理者権限を強制適用: ${user.email}`);
    const forceAdminProfileData = forceAdminProfile(user);
    
    // セッションストレージに保存
    try {
      sessionStorage.setItem('admin_override_' + user.uid, 'true');
      sessionStorage.setItem('admin_profile_' + user.uid, JSON.stringify(forceAdminProfileData));
      localStorage.setItem('oncall_user_profile', JSON.stringify(forceAdminProfileData));
    } catch (error) {
      console.error(`❌ 管理者権限保存エラー:`, error);
    }
    
    return forceAdminProfileData;
  }, []);

  // 即座にデフォルトプロファイルを設定する関数
  const setImmediateProfile = (user: User) => {
    // 管理者メールの場合は即座にadminロールを設定
    const defaultRole = normalizeRole(isAdminEmail(user.email || '') ? 'admin' : 'staff');
    
    const immediateProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || '',
      role: defaultRole,
      department: defaultRole === 'admin' ? 'システム管理部' : '',
      managedDepartments: [], // 管理部署の初期化
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setProfile(immediateProfile);
    // addDebugLog(`⚡ 即座プロファイル設定: ${user.email}`, 'info');
    return immediateProfile;
  };

  // プロファイル更新後にFirestoreから最新データを再取得
  const refreshProfile = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 プロファイル強制再取得: ${user.email}`);
      
      // キャッシュクリア
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      delete globalProfileCache[user.uid];
      delete lastFetchTime[user.uid];
      
      // セッションストレージのキャッシュもクリア
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes(user.uid)) {
          sessionStorage.removeItem(key);
        }
      });

      // Firestoreから最新データを取得
      const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const latestProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || data.displayName || '',
          role: normalizeRole(data.role || (isAdminEmail(user.email || '') ? 'admin' : 'staff')),
          department: data.department || '',
          managedDepartments: data.managedDepartments || [],
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        setProfile(latestProfile);
        saveLocalProfile(latestProfile);
        console.log(`✅ プロファイル強制再取得完了: role=${latestProfile.role}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ プロファイル強制再取得エラー:', error);
      return false;
    }
  }, [user]);

  // 手動でプロファイルを更新する関数
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return false;

    setLoading(true);
    setError(null);

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'userProfiles', user.uid), updatedData);
      
      setProfile((prev: UserProfile | null) => prev ? { ...prev, ...updatedData } : null);
      // addDebugLog(`Profile updated for: ${user.email}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プロファイル更新エラー';
      setError(errorMessage);
      // addDebugLog(`Profile update error: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 権限チェック
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!profile) return false;
    return ROLE_PERMISSIONS[profile.role][permission];
  };

  // 管理者権限チェック
  const isAdmin = (): boolean => {
    return profile?.role === 'admin';
  };

  // マネージャー権限チェック
  const isManager = (): boolean => {
    return profile?.role === 'manager';
  };

  // スタッフ権限チェック
  const isStaff = (): boolean => {
    return profile?.role === 'staff';
  };

  // ユーザーが変更されたときにプロファイルを取得
  useEffect(() => {
    if (user && user.uid) {
      console.log(`🔄 useEffect triggered for user: ${user.email} (${user.uid})`);
      
      // 最初に管理者権限強制チェック
      const forceAdminProfile = checkForceAdminOverride(user);
      if (forceAdminProfile) {
        console.log(`👑 管理者権限強制適用: ${user.email}`);
        setProfile(forceAdminProfile);
        setLoading(false);
        return;
      }
      
      // 管理者メールかどうかを確認
      const isUserAdmin = isAdminEmail(user.email || '');
      
      if (isUserAdmin) {
        console.log(`🔄 管理者ユーザーのキャッシュをクリア: ${user.email}`);
        localStorage.removeItem(LOCAL_PROFILE_KEY);
        delete globalProfileCache[user.uid];
        delete lastFetchTime[user.uid];
      }
      
      // まずキャッシュからプロファイルを確認
      const cachedProfile = getCachedProfile(user.uid);
      if (cachedProfile) {
        setProfile(cachedProfile);
        console.log(`⚡ キャッシュから即座にプロファイル復元: role=${cachedProfile.role}, isAdmin=${cachedProfile.role === 'admin'}`);
        
        // 管理者メール以外で、キャッシュが新しい場合はFirestore取得をスキップ
        const lastFetch = lastFetchTime[user.uid] || 0;
        if (!isUserAdmin && Date.now() - lastFetch < CACHE_DURATION) { // 5分以内なら取得スキップ
          console.log(`⚡ キャッシュが新しいため、Firestore取得をスキップ（残り${Math.round((CACHE_DURATION - (Date.now() - lastFetch)) / 1000)}秒）`);
          return;
        }
      } else {
        // キャッシュがない場合は即座にデフォルトプロファイルを設定
        setImmediateProfile(user);
      }
      
      // バックグラウンドでFirestoreから最新のプロファイルを取得（非ブロッキング）
      setTimeout(() => {
        refreshProfile();
      }, 100);
      
    } else if (!user) {
      console.log(`🚪 ユーザーがログアウトしました`);
      setProfile(null);
      setError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // checkForceAdminOverride, refreshProfile, userを依存関係に含めると無限ループが発生するため除外
  }, [user?.uid]);

  // エラー状態が1秒以上続く場合の超高速フォールバック
  useEffect(() => {
    if (error && user && !loading && !profile) {
      const timer = setTimeout(() => {
        // addDebugLog('⚡ 超高速フォールバック実行', 'info');
        const emergencyProfile = setImmediateProfile(user);
        saveLocalProfile(emergencyProfile);
        setError(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [error, user, loading, profile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    hasPermission,
    isAdmin,
    isManager,
    isStaff,
    refetch: () => user && refreshProfile(),
    refreshProfile, // 手動更新用の関数を追加
  };
};
