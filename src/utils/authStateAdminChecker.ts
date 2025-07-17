// 認証状態変更時の管理者権限自動設定
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { checkAndSetAdminOnLogin, isAdminEmail, verifyAdminStatus } from './adminManager';
import { UserProfile } from '../types';

// 認証状態監視と管理者権限自動設定の初期化
export const initAuthStateAdminCheck = () => {
  console.log('🔐 認証状態監視システム初期化中...');
  
  let lastUserId: string | null = null;
  
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log('👤 ユーザーがログアウトしました');
      lastUserId = null;
      return;
    }
    
    // 同じユーザーの重複処理を防ぐ
    if (lastUserId === user.uid) {
      return;
    }
    
    lastUserId = user.uid;
    console.log(`👤 認証状態変更: ${user.email} (uid: ${user.uid})`);
    
    // 管理者メールアドレスかチェック
    if (!user.email || !isAdminEmail(user.email)) {
      console.log('📝 通常ユーザーログイン');
      return;
    }
    
    console.log(`👑 管理者ユーザーログイン検出: ${user.email}`);
    
    // Firestoreから最新のプロファイルを取得
    let firestoreProfile: UserProfile | null = null;
    try {
      const docRef = doc(db, 'userProfiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        firestoreProfile = { ...docSnap.data(), uid: user.uid } as UserProfile;
        console.log('📋 Firestoreプロファイル取得:', { role: firestoreProfile.role, updatedAt: firestoreProfile.updatedAt });
      } else {
        console.log('📋 Firestoreプロファイルが存在しません（初回ログイン）');
      }
    } catch (error) {
      console.error('❌ Firestoreプロファイル取得エラー:', error);
    }
    
    // 既存のプロファイルを確認
    const existingProfile = localStorage.getItem('oncall_user_profile');
    let needsAdminSetup = true;
    
    // Firestoreプロファイルが存在し、明示的にroleが設定されている場合は尊重
    if (firestoreProfile && firestoreProfile.updatedAt) {
      console.log(`✅ Firestoreに明示的な権限設定あり (role: ${firestoreProfile.role}) - 手動設定を尊重`);
      needsAdminSetup = false;
      
      // ローカルストレージを最新データで更新
      localStorage.setItem('oncall_user_profile', JSON.stringify(firestoreProfile));
    } else if (existingProfile) {
      try {
        const profile = JSON.parse(existingProfile);
        if (verifyAdminStatus(profile)) {
          console.log('✅ 既存の管理者プロファイルが正常です');
          needsAdminSetup = false;
        } else {
          console.log('⚠️ 既存プロファイルに管理者権限がありません');
        }
      } catch (error) {
        console.error('❌ 既存プロファイル解析エラー:', error);
      }
    }
    
    if (needsAdminSetup) {
      console.log('🔧 管理者権限を設定中...');
      try {
        const adminProfile = await checkAndSetAdminOnLogin(user, firestoreProfile);
        if (adminProfile) {
          console.log('✅ 管理者権限設定完了:', adminProfile);
          
          // 少し待ってから権限確認
          setTimeout(() => {
            const currentProfile = localStorage.getItem('oncall_user_profile');
            if (currentProfile) {
              try {
                const profile = JSON.parse(currentProfile);
                if (verifyAdminStatus(profile)) {
                  console.log('🎉 管理者権限の反映が確認されました');
                } else {
                  console.log('⚠️ 管理者権限が反映されていません - 再試行');
                  checkAndSetAdminOnLogin(user, firestoreProfile);
                }
              } catch (error) {
                console.error('❌ 権限確認エラー:', error);
              }
            }
          }, 1000);
        }
      } catch (error) {
        console.error('❌ 管理者権限設定エラー:', error);
      }
    }
  });
  
  return unsubscribe;
};

// アプリ起動時の初期化
let initialized = false;

export const setupAdminAuthSystem = () => {
  if (initialized) {
    console.log('⚠️ 管理者認証システムは既に初期化済みです');
    return;
  }
  
  initialized = true;
  console.log('🚀 管理者認証システムを初期化します');
  
  // 認証状態監視を開始
  const unsubscribe = initAuthStateAdminCheck();
  
  // デバッグ用グローバル関数を追加
  if (typeof window !== 'undefined') {
    (window as any).adminAuthSystem = {
      reinitialize: () => {
        initialized = false;
        setupAdminAuthSystem();
      },
      forceCheck: async () => {
        const user = auth.currentUser;
        if (user) {
          console.log('🔍 手動管理者権限チェック実行');
          // Firestoreプロファイルを取得してから実行
          let firestoreProfile: UserProfile | null = null;
          try {
            const docRef = doc(db, 'userProfiles', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              firestoreProfile = { ...docSnap.data(), uid: user.uid } as UserProfile;
            }
          } catch (error) {
            console.error('❌ Firestoreプロファイル取得エラー:', error);
          }
          await checkAndSetAdminOnLogin(user, firestoreProfile);
        } else {
          console.log('❌ ログインしているユーザーがいません');
        }
      },
      status: () => {
        const user = auth.currentUser;
        const profile = localStorage.getItem('oncall_user_profile');
        
        console.log('📊 管理者認証システム状態:');
        console.log('- 現在のユーザー:', user?.email || 'なし');
        console.log('- 管理者メール判定:', user?.email ? isAdminEmail(user.email) : 'N/A');
        
        if (profile) {
          try {
            const parsed = JSON.parse(profile);
            console.log('- プロファイル役割:', parsed.role);
            console.log('- 管理者権限:', verifyAdminStatus(parsed) ? 'あり' : 'なし');
          } catch (error) {
            console.log('- プロファイルエラー:', error);
          }
        } else {
          console.log('- プロファイル: なし');
        }
      }
    };
    
    console.log('🛠️ デバッグ用グローバル関数が利用可能:');
    console.log('- window.adminAuthSystem.forceCheck() : 手動権限チェック');
    console.log('- window.adminAuthSystem.status() : システム状態確認');
    console.log('- window.adminAuthSystem.reinitialize() : システム再初期化');
  }
  
  return unsubscribe;
};

// アプリ起動時に自動実行
setupAdminAuthSystem();
