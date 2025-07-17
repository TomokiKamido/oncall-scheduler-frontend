// 開発環境専用：特定ユーザーを管理者に強制設定する機能
import { getAuth } from 'firebase/auth';

export const forceAdminProfile = (email: string) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ ユーザーがログインしていません');
    return;
  }

  const adminProfile = {
    uid: currentUser.uid, // 現在のユーザーのUIDを使用
    email: email,
    displayName: email.split('@')[0] + '_admin',
    role: 'admin',
    department: 'システム管理部',
    managedDepartments: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // ローカルストレージに強制保存
  localStorage.setItem('oncall_user_profile', JSON.stringify(adminProfile));
  
  console.log('🔧 管理者プロファイルを強制設定:', adminProfile);
  
  // ページ再読み込みで反映
  window.location.reload();
};

// 現在の状況をチェックする関数
export const checkUserStatus = () => {
  const profile = localStorage.getItem('oncall_user_profile');
  const authData = Object.keys(localStorage).find(key => key.includes('firebase:authUser'));
  
  console.log('=== 現在の状況 ===');
  console.log('プロファイル:', profile ? JSON.parse(profile) : 'なし');
  
  if (authData) {
    console.log('認証データ:', JSON.parse(localStorage.getItem(authData) || '{}'));
  }
  
  console.log('全ローカルストレージキー:', Object.keys(localStorage));
  
  return { profile: profile ? JSON.parse(profile) : null };
};

// 強制的にキャッシュをクリアする関数
export const clearAllCache = () => {
  // 関連するキャッシュをすべてクリア
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.includes('oncall') || 
    key.includes('firebase') || 
    key.includes('user') ||
    key.includes('profile')
  );
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('🗑️ クリアしたキー:', keysToRemove);
  
  // セッションストレージもクリア
  sessionStorage.clear();
  
  window.location.reload();
};

// グローバル関数として公開（常に有効）
((window as unknown) as Record<string, unknown>).forceAdminProfile = forceAdminProfile;
((window as unknown) as Record<string, unknown>).checkUserStatus = checkUserStatus;
((window as unknown) as Record<string, unknown>).clearAllCache = clearAllCache;

// 即座に管理者にする関数
((window as unknown) as Record<string, unknown>).makeAdminNow = () => {
  forceAdminProfile('llb5yyuihdx@gmail.com');
};

// 起動時に自動実行
console.log('🚀 forceAdminProfile.ts ロード完了');
forceAdminProfile('llb5yyuihdx@gmail.com');

export default forceAdminProfile;
