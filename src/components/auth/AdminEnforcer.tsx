// 管理者権限強制設定コンポーネント
import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isAdminEmail, checkAndSetAdminOnLogin, verifyAdminStatus } from '../../utils/adminManager';

interface AdminEnforcerProps {
  children: React.ReactNode;
}

const AdminEnforcer: React.FC<AdminEnforcerProps> = ({ children }) => {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !user.email) return;

    // 管理者メールアドレスでない場合はスキップ
    if (!isAdminEmail(user.email)) return;

    console.log(`👑 AdminEnforcer: 管理者ユーザー検出 - ${user.email}`);

    // プロファイルが管理者権限を持っているかチェック
    const hasAdminRights = profile && verifyAdminStatus(profile);

    if (!hasAdminRights) {
      console.log(`🔧 AdminEnforcer: 管理者権限が不足 - 強制設定実行`);
      
      // 管理者権限を強制設定
      checkAndSetAdminOnLogin(user)
        .then((adminProfile) => {
          if (adminProfile) {
            console.log(`✅ AdminEnforcer: 管理者権限設定完了`, adminProfile);
            
            // プロファイルが更新されるまで少し待つ
            setTimeout(() => {
              const currentProfile = localStorage.getItem('oncall_user_profile');
              if (currentProfile) {
                try {
                  const parsed = JSON.parse(currentProfile);
                  if (!verifyAdminStatus(parsed)) {
                    console.log(`⚠️ AdminEnforcer: 権限が反映されていません - ページリロード`);
                    window.location.reload();
                  }
                } catch (error) {
                  console.error(`❌ AdminEnforcer: プロファイル確認エラー`, error);
                }
              }
            }, 1500);
          }
        })
        .catch((error) => {
          console.error(`❌ AdminEnforcer: 権限設定エラー`, error);
        });
    } else {
      console.log(`✅ AdminEnforcer: 管理者権限確認済み - ${user.email}`);
    }
  }, [user, profile]);

  return <>{children}</>;
};

export default AdminEnforcer;
