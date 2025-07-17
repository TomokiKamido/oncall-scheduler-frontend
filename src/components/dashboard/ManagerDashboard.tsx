import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { MiniProgressBar } from '../common/ProgressBar';
import { useUIPermissions } from '../../hooks/useUIPermissions';
import RoleBasedComponent from '../auth/RoleBasedComponent';
import './ManagerDashboard.css';

interface ManagerDashboardProps {
  profile: UserProfile;
  onRefreshProfile?: () => void;
  isRefreshing?: boolean;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ profile, onRefreshProfile, isRefreshing }) => {
  const [refreshProgress, setRefreshProgress] = useState(0);
  const { 
    showAdvancedScheduling,
    showStaffManagement,
    showDepartmentData
  } = useUIPermissions();

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
  return (
    <div className="manager-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <div className="header-left">
            <h1>👨‍💼 所属長ダッシュボード</h1>
            <p>ようこそ、{profile.displayName || profile.email}さん</p>
            {profile.department && (
              <div className="department-info">
                <span className="department-badge">{profile.department}</span>
              </div>
            )}
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
        {/* 勤務希望提出（全ユーザー共通） */}
        <div className="dashboard-card primary-card">
          <div className="card-icon">�</div>
          <h3>勤務希望提出</h3>
          <p>来月の勤務希望を提出・編集</p>
          <div className="card-actions">
            <button className="btn btn-primary">希望を提出</button>
            <button className="btn btn-secondary">下書き保存</button>
          </div>
          <div className="card-status">
            <span className="status-label">提出状況:</span>
            <span className="status-badge pending">未提出</span>
          </div>
        </div>

        {/* 勤務希望承認（所属長・管理者） */}
        <RoleBasedComponent requiredPermission="canManageStaff">
          <div className="dashboard-card important-card">
            <div className="card-icon">✅</div>
            <h3>勤務希望承認</h3>
            <p>部署メンバーの勤務希望を承認・調整</p>
            <div className="card-actions">
              <button className="btn btn-primary">承認待ち一覧</button>
              <button className="btn btn-secondary">承認履歴</button>
            </div>
            <div className="card-status">
              <span className="status-label">未承認:</span>
              <span className="status-badge urgent">5件</span>
            </div>
          </div>
        </RoleBasedComponent>

        {/* スケジュール作成（所属長・管理者） */}
        {showAdvancedScheduling() && (
          <div className="dashboard-card">
            <div className="card-icon">📅</div>
            <h3>スケジュール作成</h3>
            <p>部署のスケジュールを作成・編集</p>
            <div className="card-actions">
              <button className="btn btn-primary">新規作成</button>
              <button className="btn btn-secondary">テンプレート</button>
            </div>
          </div>
        )}

        {/* スタッフ管理（所属長・管理者） */}
        {showStaffManagement() && (
          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>スタッフ管理</h3>
            <p>部署メンバーの管理と設定</p>
            <div className="card-actions">
              <button className="btn btn-primary">メンバー一覧</button>
              <button className="btn btn-secondary">スキル管理</button>
            </div>
          </div>
        )}

        {/* 部署レポート（所属長・管理者） */}
        {showDepartmentData() && (
          <div className="dashboard-card">
            <div className="card-icon">�</div>
            <h3>部署レポート</h3>
            <p>部署の勤務実績と統計</p>
            <div className="card-actions">
              <button className="btn btn-primary">月次レポート</button>
              <button className="btn btn-secondary">勤務統計</button>
            </div>
          </div>
        )}

        {/* 個人設定（全ユーザー共通） */}
        <div className="dashboard-card">
          <div className="card-icon">⚙️</div>
          <h3>個人設定</h3>
          <p>プロフィールと通知設定</p>
          <div className="card-actions">
            <button className="btn btn-primary">プロフィール編集</button>
            <button className="btn btn-secondary">通知設定</button>
          </div>
        </div>
      </div>

      {showDepartmentData() && (
        <div className="department-overview">
          <h3>📈 部署の状況</h3>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-icon">👥</div>
              <div className="overview-content">
                <span className="overview-label">部署メンバー</span>
                <span className="overview-value">-- 名</span>
              </div>
            </div>
            
            <div className="overview-card">
              <div className="overview-icon">📅</div>
              <div className="overview-content">
                <span className="overview-label">今月のスケジュール</span>
                <span className="overview-value">作成済み</span>
              </div>
            </div>
            
            <div className="overview-card">
              <div className="overview-icon">⏰</div>
              <div className="overview-content">
                <span className="overview-label">未提出の希望</span>
                <span className="overview-value">-- 件</span>
              </div>
            </div>
            
            <div className="overview-card">
              <div className="overview-icon">🔄</div>
              <div className="overview-content">
                <span className="overview-label">変更申請</span>
                <span className="overview-value">-- 件</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDepartmentData() && (
        <div className="recent-activity">
          <h3>📋 最近の活動</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">今日</span>
              <span className="activity-text">田中さんから勤務希望が提出されました</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">昨日</span>
              <span className="activity-text">来月のスケジュール作成が開始できます</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">2日前</span>
              <span className="activity-text">佐藤さんからシフト変更申請がありました</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
