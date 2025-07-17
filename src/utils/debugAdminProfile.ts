// 緊急時の管理者権限設定用ユーティリティ
// ブラウザのコンソールで実行可能

// TypeScript型定義の拡張
declare global {
  interface Window {
    forceAdminProfile: (email?: string) => void;
    checkCurrentProfile: () => void;
    clearProfileCache: () => void;
  }
}

// グローバル関数として追加
window.forceAdminProfile = (email = 'llb5yyuihdx@gmail.com') => {
  console.log(`🚨 緊急管理者権限設定: ${email}`);
  
  // 現在のユーザーUIDを取得
  const auth = require('firebase/auth').getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ ユーザーがログインしていません');
    return;
  }
  
  // ローカルストレージのプロファイルを管理者に設定
  const adminProfile = {
    uid: currentUser.uid, // 現在のユーザーのUIDを使用
    email: email,
    displayName: 'Emergency Admin',
    role: 'admin',
    department: 'システム管理部',
    managedDepartments: ['dept_001', 'dept_002', 'dept_003'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    localStorage.setItem('oncall_user_profile', JSON.stringify(adminProfile));
    console.log(`✅ 管理者プロファイルを強制設定しました:`, adminProfile);
    console.log(`🔄 ページをリロードしてください`);
    
    // 自動リロード
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error(`❌ プロファイル設定エラー:`, error);
  }
};

// デバッグ用：現在のプロファイル確認
window.checkCurrentProfile = () => {
  try {
    const profile = localStorage.getItem('oncall_user_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      console.log(`👤 現在のプロファイル:`, parsed);
      console.log(`🔍 権限チェック: role=${parsed.role}, isAdmin=${parsed.role === 'admin'}`);
    } else {
      console.log(`❌ プロファイルが見つかりません`);
    }
  } catch (error) {
    console.error(`❌ プロファイル確認エラー:`, error);
  }
};

// プロファイルキャッシュクリア
window.clearProfileCache = () => {
  try {
    localStorage.removeItem('oncall_user_profile');
    console.log(`🗑️ プロファイルキャッシュをクリアしました`);
    console.log(`🔄 ページをリロードしてください`);
    
    // 自動リロード
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error(`❌ キャッシュクリアエラー:`, error);
  }
};

console.log(`🛠️ 緊急デバッグ関数が利用可能です:`);
console.log(`- window.forceAdminProfile() : 強制的に管理者権限を設定`);
console.log(`- window.checkCurrentProfile() : 現在のプロファイルを確認`);
console.log(`- window.clearProfileCache() : プロファイルキャッシュをクリア`);

export {};
