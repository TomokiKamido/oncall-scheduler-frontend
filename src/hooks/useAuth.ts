import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
  User
} from 'firebase/auth';
import { useRole } from './useRole';
import { auth } from '../config/firebase';
import { useUserProfile } from './useUserProfile';
import { UserProfile, RolePermissions } from '../types';
import { isAdminEmail } from '../utils/adminManager';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string, department?: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isStaff: () => boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  refetchProfile: () => void;
  refreshProfile: () => void; // 手動更新関数を追加
  canManageDepartment: (departmentId?: string) => boolean;
  canManageAnyDepartment: () => boolean;
  getManagedDepartments: () => string[];
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { role } = useRole();
  
  // ユーザープロファイル機能を追加
  const { 
    profile, 
    loading: profileLoading,
    hasPermission,
    isAdmin,
    isManager,
    isStaff,
    updateProfile,
    refetch,
    refreshProfile // 手動更新関数を追加
  } = useUserProfile(user);

  useEffect(() => {
    console.log('🔐 Firebase Auth初期化中...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const message = user ? `🔐 認証状態変更: ログイン済み: ${user.email}` : '🔐 認証状態変更: 未ログイン';
      console.log(message);
      
      if (user) {
        console.log('👤 認証ユーザー詳細:', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName
        });
      }
      
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // プロファイル情報の変化を監視
  useEffect(() => {
    if (user && profile) {
      console.log('👤 現在のプロファイル情報:', {
        uid: profile.uid,
        email: profile.email,
        role: profile.role,
        department: profile.department,
        managedDepartments: profile.managedDepartments,
        isAdmin: role === 'admin'
      });
    }
  }, [user, profile, role]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log(`🔑 ログイン試行: ${email}`);
      console.log('🔍 Firebase認証開始:', email);
      console.log('🔍 Firebase Auth設定確認:', auth.config);
      console.log('🔍 Auth現在の状態:', auth.currentUser);
      
      // Firebase認証状態の詳細確認
      console.log(`🔍 Firebase Auth準備完了: ${auth.app.name}`);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('🔍 Firebase認証成功:', userCredential.user.uid);
      console.log('🔍 ユーザー詳細:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
        displayName: userCredential.user.displayName,
        creationTime: userCredential.user.metadata.creationTime,
        lastSignInTime: userCredential.user.metadata.lastSignInTime
      });
      
      // 一時的にメール認証チェックを無効化（デバッグ用）
      console.log('🔍 メール認証状態:', userCredential.user.emailVerified);
      console.log(`📧 メール認証状態: ${userCredential.user.emailVerified ? '✅ 認証済み' : '❌ 未認証'}`);
      
      // メール認証チェック（一時的にコメントアウト）
      /*
      if (!userCredential.user.emailVerified) {
        console.log(`❌ メール未認証: ${email}`);
        await signOut(auth); // 未認証の場合はログアウト
        throw new Error('auth/email-not-verified');
      }
      */
      
      console.log(`✅ ログイン成功: ${email}`);
      
      // 管理者権限の自動設定（新しいシステムを使用）
      if (isAdminEmail(email)) {
        console.log(`👑 管理者ユーザーログイン検出: ${email}`);
        try {
          // ログイン時は既存プロファイルを取得せず、authStateAdminCheckerに任せる
          // これによりFirestoreの最新データが確認される
          console.log(`� 管理者権限チェックはauthStateAdminCheckerで実行されます`);
        } catch (error) {
          console.error(`❌ 管理者権限設定エラー:`, error);
        }
      }
      
      console.log('🔍 ログイン処理完了');
    } catch (error: unknown) {
      console.error('🔍 ログインエラー詳細:', error);
      const errorObj = error as { code?: string; message?: string; stack?: string };
      console.error('🔍 エラーコード:', errorObj.code);
      console.error('🔍 エラーメッセージ:', errorObj.message);
      console.error('🔍 エラースタック:', errorObj.stack);
      
      console.log(`❌ ログインエラー (${errorObj.code}): ${errorObj.message}`);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName?: string, department?: string): Promise<void> => {
    try {
      console.log(`📝 新規登録試行: ${email}, 部署: ${department}`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // displayNameが提供されている場合、Firebaseプロファイルに設定
      if (displayName && userCredential.user) {
        await updateFirebaseProfile(userCredential.user, {
          displayName: displayName
        });
        console.log(`✅ ユーザープロファイル更新: ${displayName}`);
      }
      
      // 部署情報を含むプロファイルデータを準備
      if (department && userCredential.user) {
        // プロファイル作成時に部署情報を含める
        console.log(`📋 部署情報をプロファイルに設定: ${department}`);
        // この情報はuseUserProfileフックで使用される
        localStorage.setItem('pending_user_department', department);
      }
      
      // メール認証を送信
      await sendEmailVerification(userCredential.user);
      console.log(`📧 認証メールを送信: ${email}`);
      console.log(`✅ 新規登録成功: ${email}`);
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      console.log(`❌ 新規登録エラー: ${errorObj.message}`);
      throw error;
    }
  };

  const sendVerificationEmail = async (): Promise<void> => {
    if (!user) {
      throw new Error('ユーザーがログインしていません');
    }
    
    try {
      console.log('📧 認証メール再送信試行');
      await sendEmailVerification(user);
      console.log('✅ 認証メール再送信成功');
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      console.log(`❌ 認証メール送信エラー: ${errorObj.message}`);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 ログアウト試行');
      await signOut(auth);
      console.log('✅ ログアウト成功');
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      console.log(`❌ ログアウトエラー: ${errorObj.message}`);
      throw error;
    }
  };

  // 部署管理権限のチェック
  const canManageDepartment = (departmentId?: string): boolean => {
    if (!profile) return false;
    
    // 管理者は全ての部署を管理できる
    if (role === 'admin') return true;
    
    // 特定の部署が指定されている場合
    if (departmentId) {
      return profile.managedDepartments?.includes(departmentId) || false;
    }
    
    // 何らかの部署を管理できるか
    return (profile.managedDepartments?.length || 0) > 0;
  };

  const canManageAnyDepartment = (): boolean => {
    if (!profile) return false;
    return role === 'admin' || (profile.managedDepartments?.length || 0) > 0;
  };

  const getManagedDepartments = (): string[] => {
    if (!profile) return [];
    return profile.managedDepartments || [];
  };

  return {
    user,
    profile,
    loading,
    profileLoading,
    login,
    register,
    sendEmailVerification: sendVerificationEmail,
    logout,
    hasPermission,
    isAdmin,
    isManager,
    isStaff,
    updateProfile,
    refetchProfile: refetch,
    refreshProfile, // 手動更新関数を追加
    canManageDepartment,
    canManageAnyDepartment,
    getManagedDepartments
  };
};
