// 管理者権限強制設定ユーティリティ
// アプリケーション起動時に実行される

import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// 管理者メールアドレス一覧
const ADMIN_EMAILS = [
  'admin@oncall-scheduler.com',
  'llb5yyuihdx@gmail.com',
  'manager@oncall-scheduler.com'
];

// 管理者プロファイルのテンプレート
const createForceAdminProfile = (email: string, uid: string) => ({
  uid,
  email,
  displayName: 'Admin User',
  role: 'admin',
  department: 'システム管理部',
  managedDepartments: ['dept_001', 'dept_002', 'dept_003'],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// 強制的に管理者プロファイルを設定
const forceSetAdminProfile = (email: string, uid: string) => {
  const adminProfile = createForceAdminProfile(email, uid);
  
  try {
    // ローカルストレージに強制設定
    localStorage.setItem('oncall_user_profile', JSON.stringify(adminProfile));
    
    // セッションストレージにも設定（二重保険）
    sessionStorage.setItem('admin_override_' + uid, 'true');
    sessionStorage.setItem('admin_profile_' + uid, JSON.stringify(adminProfile));
    
    console.log(`🔧 管理者権限を強制設定: ${email}`);
    console.log(`✅ プロファイル設定完了:`, adminProfile);
    
    return true;
  } catch (error) {
    console.error(`❌ 管理者権限設定エラー:`, error);
    return false;
  }
};

// 認証状態の監視と管理者権限の自動設定
const initializeAdminForce = () => {
  console.log(`🚀 管理者権限強制システム初期化中...`);
  
  onAuthStateChanged(auth, (user) => {
    if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
      console.log(`👑 管理者ユーザーを検出: ${user.email}`);
      
      // 即座に管理者権限を設定
      const success = forceSetAdminProfile(user.email, user.uid);
      
      if (success) {
        // 少し遅延してからページリロード（プロファイル反映のため）
        setTimeout(() => {
          const currentProfile = localStorage.getItem('oncall_user_profile');
          if (currentProfile) {
            try {
              const profile = JSON.parse(currentProfile);
              if (profile.role !== 'admin') {
                console.log(`🔄 権限が反映されていないため再設定中...`);
                forceSetAdminProfile(user.email!, user.uid);
                window.location.reload();
              } else {
                console.log(`✅ 管理者権限が正常に設定されました`);
              }
            } catch (error) {
              console.error(`❌ プロファイル確認エラー:`, error);
              window.location.reload();
            }
          }
        }, 1000);
      }
    }
  });
};

// グローバル関数として公開
declare global {
  interface Window {
    forceAdminNow: () => void;
    checkAdminStatus: () => void;
    resetToAdmin: () => void;
  }
}

// 緊急管理者権限設定関数
window.forceAdminNow = () => {
  const user = auth.currentUser;
  if (user && user.email) {
    console.log(`🚨 緊急管理者権限設定実行: ${user.email}`);
    forceSetAdminProfile(user.email, user.uid);
    setTimeout(() => window.location.reload(), 500);
  } else {
    console.log(`❌ ユーザーがログインしていません`);
  }
};

// 管理者状態確認関数
window.checkAdminStatus = () => {
  const user = auth.currentUser;
  const profile = localStorage.getItem('oncall_user_profile');
  
  console.log(`👤 現在のユーザー:`, user?.email);
  
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      console.log(`📋 現在のプロファイル:`, parsed);
      console.log(`🔍 管理者権限: ${parsed.role === 'admin' ? '✅ あり' : '❌ なし'}`);
    } catch (error) {
      console.log(`❌ プロファイル解析エラー:`, error);
    }
  } else {
    console.log(`❌ プロファイルが見つかりません`);
  }
};

// 管理者権限リセット関数
window.resetToAdmin = () => {
  const user = auth.currentUser;
  if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
    console.log(`🔄 管理者権限リセット実行: ${user.email}`);
    
    // 全てのキャッシュをクリア
    localStorage.clear();
    sessionStorage.clear();
    
    // 管理者プロファイルを再設定
    forceSetAdminProfile(user.email, user.uid);
    
    // ページリロード
    setTimeout(() => window.location.reload(), 500);
  } else {
    console.log(`❌ 管理者メールアドレスではありません`);
  }
};

// 初期化実行
initializeAdminForce();

console.log(`🛠️ 管理者権限強制システムが有効です:`);
console.log(`- window.forceAdminNow() : 即座に管理者権限を設定`);
console.log(`- window.checkAdminStatus() : 現在の権限状態を確認`);
console.log(`- window.resetToAdmin() : 管理者権限をリセット`);

export { forceSetAdminProfile, initializeAdminForce };
