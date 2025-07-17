import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { MiniProgressBar } from '../common/ProgressBar';
import DepartmentManagement from '../admin/DepartmentManagement';
import { UserManagement } from '../admin/UserManagement';
import './AdminDashboard.css';

interface AdminDashboardProps {
  profile: UserProfile;
  onRefreshProfile?: () => void;
  isRefreshing?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ profile, onRefreshProfile, isRefreshing }) => {
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  useEffect(() => {
    if (isRefreshing) {
      setRefreshProgress(0);
      const interval = setInterval(() => {
        setRefreshProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setRefreshProgress(0);
    }
  }, [isRefreshing]);

  if (showDepartmentManagement) {
    return <DepartmentManagement onBack={() => setShowDepartmentManagement(false)} />;
  }

  if (showUserManagement) {
    return <UserManagement onBack={() => setShowUserManagement(false)} />;
  }
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <div className="header-left">
            <h1>🔧 アプリ管理者ダッシュボード</h1>
            <p>ようこそ、{profile.displayName || profile.email}さん</p>
          </div>
          <div className="header-right">
            {onRefreshProfile && (
              <button 
                className="btn btn-refresh"
                onClick={onRefreshProfile}
                disabled={isRefreshing}
                title="プロファイル情報を最新の状態に更新します"
              >
                {isRefreshing ? (
                  <>
                    更新中
                    <MiniProgressBar progress={refreshProgress} />
                  </>
                ) : (
                  <>
                    🔄 プロファイル更新
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon">👥</div>
          <h3>ユーザー管理</h3>
          <p>ユーザーの権限設定と管理</p>
          <div className="card-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowUserManagement(true)}
            >
              ユーザー一覧
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowUserManagement(true)}
            >
              権限設定
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📅</div>
          <h3>スケジュール管理</h3>
          <p>全社のスケジュール管理と設定</p>
          <div className="card-actions">
            <button className="btn btn-primary">スケジュール作成</button>
            <button className="btn btn-secondary">テンプレート管理</button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🏢</div>
          <h3>部署管理</h3>
          <p>医療機関の部署管理と所属長設定</p>
          <div className="card-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowDepartmentManagement(true)}
            >
              部署管理
            </button>
            <button className="btn btn-secondary">権限設定</button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👥</div>
          <h3>スタッフ管理</h3>
          <p>スタッフの管理と設定</p>
          <div className="card-actions">
            <button className="btn btn-primary">スタッフ管理</button>
            <button className="btn btn-secondary">スキル設定</button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📊</div>
          <h3>レポート・分析</h3>
          <p>使用状況とパフォーマンス分析</p>
          <div className="card-actions">
            <button className="btn btn-primary">統計レポート</button>
            <button className="btn btn-secondary">データエクスポート</button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">⚙️</div>
          <h3>システム設定</h3>
          <p>アプリケーション全体の設定</p>
          <div className="card-actions">
            <button className="btn btn-primary">基本設定</button>
            <button className="btn btn-secondary">セキュリティ設定</button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🛠️</div>
          <h3>システム監視</h3>
          <p>システムの健康状態と監視</p>
          <div className="card-actions">
            <button className="btn btn-primary">ログ確認</button>
            <button className="btn btn-secondary">パフォーマンス</button>
          </div>
        </div>
      </div>

      <div className="quick-stats">
        <h3>📈 システム概要</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">総ユーザー数</span>
            <span className="stat-value">--</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">アクティブスケジュール</span>
            <span className="stat-value">--</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">今月の登録数</span>
            <span className="stat-value">--</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">システム稼働率</span>
            <span className="stat-value">99.9%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
