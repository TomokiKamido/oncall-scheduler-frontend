import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { MiniProgressBar } from '../common/ProgressBar';
import ShiftRequestForm from '../schedule/ShiftRequestForm';
import './StaffDashboard.css';

interface StaffDashboardProps {
  profile: UserProfile;
  onRefreshProfile?: () => void;
  isRefreshing?: boolean;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ profile, onRefreshProfile, isRefreshing }) => {
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [showShiftRequestForm, setShowShiftRequestForm] = useState(false);

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

  const handleOpenShiftRequestForm = () => {
    console.log('StaffDashboard: Opening shift request form');
    setShowShiftRequestForm(true);
  };

  const handleCloseShiftRequestForm = () => {
    console.log('StaffDashboard: Closing shift request form');
    setShowShiftRequestForm(false);
  };
  return (
    <div className="staff-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <div className="header-left">
            <h1>👨‍💻 ダッシュボード</h1>
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
        <div className="dashboard-card primary-card">
          <div className="card-icon">📝</div>
          <h3>勤務希望提出</h3>
          <p>来月の勤務希望を提出・編集</p>
          <div className="card-actions">
            <button 
              className="btn btn-primary"
              onClick={handleOpenShiftRequestForm}
            >
              希望を提出
            </button>
            <button className="btn btn-secondary">下書き保存</button>
          </div>
          <div className="card-status">
            <span className="status-label">提出状況:</span>
            <span className="status-badge pending">未提出</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📅</div>
          <h3>今月のスケジュール</h3>
          <p>自分の勤務スケジュールを確認</p>
          <div className="card-actions">
            <button className="btn btn-primary">スケジュール確認</button>
            <button className="btn btn-secondary">カレンダー表示</button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🔄</div>
          <h3>シフト変更申請</h3>
          <p>急な用事でのシフト変更申請</p>
          <div className="card-actions">
            <button className="btn btn-primary">変更申請</button>
            <button className="btn btn-secondary">申請履歴</button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👥</div>
          <h3>部署メンバー</h3>
          <p>同じ部署のメンバー情報</p>
          <div className="card-actions">
            <button className="btn btn-primary">メンバー一覧</button>
            <button className="btn btn-secondary">連絡先</button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📊</div>
          <h3>勤務実績</h3>
          <p>自分の勤務実績と統計</p>
          <div className="card-actions">
            <button className="btn btn-primary">実績確認</button>
            <button className="btn btn-secondary">月別統計</button>
          </div>
        </div>

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

      <div className="schedule-summary">
        <h3>📋 今週の予定</h3>
        <div className="schedule-week">
          <div className="day-card">
            <div className="day-header">
              <span className="day-name">月</span>
              <span className="day-date">19</span>
            </div>
            <div className="day-content">
              <span className="shift-time">9:00-17:00</span>
              <span className="shift-type">日勤</span>
            </div>
          </div>
          
          <div className="day-card">
            <div className="day-header">
              <span className="day-name">火</span>
              <span className="day-date">20</span>
            </div>
            <div className="day-content">
              <span className="shift-time">休み</span>
            </div>
          </div>
          
          <div className="day-card">
            <div className="day-header">
              <span className="day-name">水</span>
              <span className="day-date">21</span>
            </div>
            <div className="day-content">
              <span className="shift-time">9:00-17:00</span>
              <span className="shift-type">日勤</span>
            </div>
          </div>
          
          <div className="day-card">
            <div className="day-header">
              <span className="day-name">木</span>
              <span className="day-date">22</span>
            </div>
            <div className="day-content">
              <span className="shift-time">16:00-24:00</span>
              <span className="shift-type">夜勤</span>
            </div>
          </div>
          
          <div className="day-card">
            <div className="day-header">
              <span className="day-name">金</span>
              <span className="day-date">23</span>
            </div>
            <div className="day-content">
              <span className="shift-time">休み</span>
            </div>
          </div>
          
          <div className="day-card weekend">
            <div className="day-header">
              <span className="day-name">土</span>
              <span className="day-date">24</span>
            </div>
            <div className="day-content">
              <span className="shift-time">9:00-17:00</span>
              <span className="shift-type">日勤</span>
            </div>
          </div>
          
          <div className="day-card weekend">
            <div className="day-header">
              <span className="day-name">日</span>
              <span className="day-date">25</span>
            </div>
            <div className="day-content">
              <span className="shift-time">休み</span>
            </div>
          </div>
        </div>
      </div>

      <div className="notifications">
        <h3>🔔 お知らせ</h3>
        <div className="notification-list">
          <div className="notification-item important">
            <div className="notification-icon">⚠️</div>
            <div className="notification-content">
              <span className="notification-title">勤務希望の提出期限について</span>
              <span className="notification-text">来月の勤務希望の提出期限は6月25日です</span>
              <span className="notification-time">今日</span>
            </div>
          </div>
          
          <div className="notification-item">
            <div className="notification-icon">📅</div>
            <div className="notification-content">
              <span className="notification-title">スケジュール公開</span>
              <span className="notification-text">7月のスケジュールが公開されました</span>
              <span className="notification-time">昨日</span>
            </div>
          </div>
          
          <div className="notification-item">
            <div className="notification-icon">💬</div>
            <div className="notification-content">
              <span className="notification-title">連絡事項</span>
              <span className="notification-text">来週のミーティングについて</span>
              <span className="notification-time">2日前</span>
            </div>
          </div>
        </div>
      </div>

      {/* 勤務希望提出フォームモーダル */}
      {showShiftRequestForm && (
        <div className="modal-overlay" onClick={handleCloseShiftRequestForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>勤務希望提出</h2>
              <button 
                className="modal-close-btn"
                onClick={handleCloseShiftRequestForm}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <ShiftRequestForm onClose={handleCloseShiftRequestForm} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
