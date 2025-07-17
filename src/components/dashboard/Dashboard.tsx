import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import StaffDashboard from './StaffDashboard';
import ProgressBar from '../common/ProgressBar';
import CustomClaimsDebug from '../debug/CustomClaimsDebug';
import TestRoleRequest from '../debug/TestRoleRequest';
// import { addDebugLog } from '../common/DebugOverlay';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, profile, profileLoading, loading, refetchProfile, refreshProfile } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 手動プロファイル更新の処理
  const handleRefreshProfile = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    // addDebugLog('🔄 ユーザーがプロファイル手動更新を実行', 'info');
    
    try {
      refreshProfile();
      
      // 更新完了まで少し待つ
      setTimeout(() => {
        setIsRefreshing(false);
        // addDebugLog('✅ プロファイル手動更新完了', 'info');
      }, 2000);
    } catch (error) {
      setIsRefreshing(false);
      // addDebugLog('❌ プロファイル手動更新エラー', 'error');
    }
  };

  // 5秒でタイムアウト（大幅短縮）
  useEffect(() => {
    if (loading || profileLoading) {
      // ローディング状態になったらタイムアウトを一度リセット
      setLoadingTimeout(false);
      
      const timer = setTimeout(() => {
        if (loading || profileLoading) {
          setLoadingTimeout(true);
          // addDebugLog('⏰ ダッシュボード読み込みタイムアウト（5秒）', 'warning');
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, profileLoading, retryCount]);

  // デバッグ情報追加
  useEffect(() => {
    console.log(`🔍 Dashboard状態更新:`, {
      loading,
      profileLoading,
      userExists: !!user,
      userEmail: user?.email,
      userUid: user?.uid,
      profileExists: !!profile,
      profileRole: profile?.role,
      profileEmail: profile?.email
    });
  }, [loading, profileLoading, user, profile]);

  // タイムアウトした場合の表示
  if (loadingTimeout) {
    // addDebugLog('Dashboard: タイムアウト発生', 'error');
    return (
      <div className="dashboard-error">
        <div className="error-icon">⏰</div>
        <h2>読み込みがタイムアウトしました</h2>
        <p>ネットワーク接続またはFirebaseの設定を確認してください。</p>
        <div style={{ marginTop: '20px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setLoadingTimeout(false);
              setRetryCount(prev => prev + 1);
              // addDebugLog('🔄 プロファイル再取得を実行', 'info');
              refetchProfile();
            }}
            style={{ marginRight: '10px' }}
          >
            再試行 ({retryCount + 1})
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setLoadingTimeout(false);
              window.location.reload();
            }}
          >
            ページ再読み込み
          </button>
        </div>
        <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
          DebugOverlayで詳細な状況を確認してください
        </div>
      </div>
    );
  }

  // ローディング中の表示
  if (loading || profileLoading) {
    // addDebugLog('Dashboard: ローディング中...', 'info');
    const loadingMessage = loading ? '🔐 認証確認中...' : '📋 プロファイル読み込み中...';
    const subMessage = loading && profileLoading ? 
      '認証状態とプロファイルを確認しています' : 
      loading ? '認証状態を確認しています' :
      'プロファイル情報を取得しています';
    
    return (
      <ProgressBar 
        duration={2500}
        message={loadingMessage}
        subMessage={subMessage}
      />
    );
  }

  // プロファイルが取得できない場合（認証後5秒経過のみ）
  if (!profile && !loading && !profileLoading && user) {
    // ユーザーは認証済みだがプロファイルがない場合のみエラー表示
    // addDebugLog('Dashboard: プロファイル作成が必要', 'warning');
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h2>プロファイルを準備中...</h2>
        <p>初回ログインの場合、プロファイルを作成しています。</p>
        <div style={{ marginTop: '20px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => {
              // addDebugLog('🔄 プロファイル手動再取得', 'info');
              refetchProfile();
            }}
            style={{ marginRight: '10px' }}
          >
            プロファイル作成
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            ページ再読み込み
          </button>
        </div>
      </div>
    );
  }

  // 権限に応じてダッシュボードを表示
  if (profile) {
    console.log(`🎯 Dashboard: プロファイル情報:`, profile);
    console.log(`🎯 Dashboard: 選択されるダッシュボード: ${profile.role}`);

    switch (profile.role) {
      case 'admin':
        console.log(`🔧 AdminDashboard を表示します`);
        return (
          <AdminDashboard 
            profile={profile} 
            onRefreshProfile={handleRefreshProfile}
            isRefreshing={isRefreshing}
          />
        );
      case 'manager':
        console.log(`👨‍💼 ManagerDashboard を表示します`);
        return (
          <ManagerDashboard 
            profile={profile} 
            onRefreshProfile={handleRefreshProfile}
            isRefreshing={isRefreshing}
          />
        );
      case 'staff':
      default:
        console.log(`👨‍💻 StaffDashboard を表示します`);
        return (
          <StaffDashboard 
            profile={profile} 
            onRefreshProfile={handleRefreshProfile}
            isRefreshing={isRefreshing}
          />
        );
    }
  }

  // フォールバック（通常は到達しないはず）
  return (
    <div>
      {/* Custom Claims テスト用コンポーネント */}
      {process.env.NODE_ENV === 'development' && (
        <div>
          <CustomClaimsDebug />
          <TestRoleRequest />
        </div>
      )}
      
      <ProgressBar 
        duration={3000}
        message="ダッシュボードを準備中..."
        subMessage="初期化処理を実行しています"
      />
    </div>
  );
};

export default Dashboard;
