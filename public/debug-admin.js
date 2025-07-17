// 本番環境での管理者権限デバッグツール
// ブラウザのコンソールで使用

// 管理者権限の状態を確認する関数
window.debugAdminRights = () => {
  console.log('🔍 管理者権限デバッグ情報:');
  console.log('================================');
  
  // 現在のユーザー情報
  const auth = window.firebase?.auth?.();
  const currentUser = auth?.currentUser;
  console.log('👤 現在のユーザー:', {
    email: currentUser?.email || 'なし',
    uid: currentUser?.uid || 'なし',
    emailVerified: currentUser?.emailVerified || false,
    displayName: currentUser?.displayName || 'なし'
  });
  
  // ローカルストレージのプロファイル
  const localProfile = localStorage.getItem('oncall_user_profile');
  if (localProfile) {
    try {
      const profile = JSON.parse(localProfile);
      console.log('💾 ローカルプロファイル:', profile);
      console.log('🔍 権限情報:', {
        role: profile.role,
        isAdmin: profile.role === 'admin',
        managedDepartments: profile.managedDepartments,
        canManage: (profile.managedDepartments || []).length > 0
      });
    } catch (error) {
      console.error('❌ ローカルプロファイル解析エラー:', error);
    }
  } else {
    console.log('❌ ローカルプロファイルが見つかりません');
  }
  
  // セッションストレージの管理者権限
  if (currentUser) {
    const adminOverride = sessionStorage.getItem('admin_override_' + currentUser.uid);
    const adminProfile = sessionStorage.getItem('admin_profile_' + currentUser.uid);
    console.log('🔧 セッション管理者権限:', {
      override: adminOverride === 'true',
      hasProfile: !!adminProfile
    });
    
    if (adminProfile) {
      try {
        const parsed = JSON.parse(adminProfile);
        console.log('👑 セッション管理者プロファイル:', parsed);
      } catch (error) {
        console.error('❌ セッション管理者プロファイル解析エラー:', error);
      }
    }
  }
  
  // 管理者メールアドレスかどうかの判定
  const adminEmails = [
    'admin@oncall-scheduler.com',
    'llb5yyuihdx@gmail.com',
    'manager@oncall-scheduler.com'
  ];
  const isAdminEmail = currentUser?.email && adminEmails.includes(currentUser.email);
  console.log('📧 管理者メール判定:', {
    email: currentUser?.email || 'なし',
    isAdmin: isAdminEmail,
    adminEmails: adminEmails
  });
  
  console.log('================================');
};

// 管理者権限を強制設定する関数
window.forceAdminRights = () => {
  const auth = window.firebase?.auth?.();
  const currentUser = auth?.currentUser;
  
  if (!currentUser || !currentUser.email) {
    console.error('❌ ログインしているユーザーがいません');
    return;
  }
  
  const adminEmails = [
    'admin@oncall-scheduler.com',
    'llb5yyuihdx@gmail.com',
    'manager@oncall-scheduler.com'
  ];
  
  if (!adminEmails.includes(currentUser.email)) {
    console.error('❌ 管理者メールアドレスではありません');
    return;
  }
  
  console.log('🔧 管理者権限を強制設定中...');
  
  const adminProfile = {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName || 'Admin User',
    role: 'admin',
    department: 'システム管理部',
    managedDepartments: ['dept_001', 'dept_002', 'dept_003'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    // ローカルストレージに設定
    localStorage.setItem('oncall_user_profile', JSON.stringify(adminProfile));
    
    // セッションストレージにも設定
    sessionStorage.setItem('admin_override_' + currentUser.uid, 'true');
    sessionStorage.setItem('admin_profile_' + currentUser.uid, JSON.stringify(adminProfile));
    
    console.log('✅ 管理者権限設定完了:', adminProfile);
    console.log('🔄 ページを再読み込みして反映します...');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ 管理者権限設定エラー:', error);
  }
};

// 全てのキャッシュをクリアする関数
window.clearAllCache = () => {
  console.log('🧹 全てのキャッシュをクリア中...');
  
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    // IndexedDBもクリア（可能であれば）
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(({ name }) => {
          indexedDB.deleteDatabase(name);
        });
      }).catch(() => {
        console.log('⚠️ IndexedDBのクリアに失敗しました');
      });
    }
    
    console.log('✅ キャッシュクリア完了');
    console.log('🔄 ページを再読み込みします...');
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (error) {
    console.error('❌ キャッシュクリアエラー:', error);
  }
};

console.log('🛠️ 管理者権限デバッグツールが利用可能です:');
console.log('- window.debugAdminRights() : 現在の権限状態を確認');
console.log('- window.forceAdminRights() : 管理者権限を強制設定');
console.log('- window.clearAllCache() : 全てのキャッシュをクリア');
console.log('');
console.log('💡 使用方法:');
console.log('1. llb5yyuihdx@gmail.com でログイン');
console.log('2. window.debugAdminRights() で現在の状態を確認');
console.log('3. 管理者権限がない場合は window.forceAdminRights() を実行');
console.log('4. ページが自動的に再読み込みされるまで待つ');
