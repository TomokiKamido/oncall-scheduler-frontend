import { Activity, Users, Calendar, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import React from 'react';
import { RoleBadge } from '../components/RoleBadge';
import { useRole } from '../hooks/useRole';
import { AuthDebug } from '../components/AuthDebug';

const Dashboard: React.FC = () => {
  const { role, loading } = useRole();

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>ダッシュボード</h1>
          <p>オンコール運用の概要</p>
          {/* デバッグ用：現在のロール表示 */}
          <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              現在のロール: {loading ? '読み込み中...' : <RoleBadge role={role} />}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
              ロール値: {role} (loading: {loading ? 'true' : 'false'})
            </p>
          </div>
        </div>

        {/* 開発用：Authentication Debug */}
        <AuthDebug />

        {/* 統計カード */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon active">
              <Activity size={24} />
            </div>
            <div className="stat-content">
              <h3>1</h3>
              <p>アクティブオンコール</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>12</h3>
              <p>チームメンバー</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <h3>8</h3>
              <p>今月のスケジュール</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <h3>3</h3>
              <p>未解決アラート</p>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="dashboard-content">
          <div className="card">
            <div className="card-header">
              <h3>現在のオンコール</h3>
              <span className="live-indicator">
                <div className="pulse"></div>
                LIVE
              </span>
            </div>
            <div className="current-oncall">
              <div className="oncall-member">
                <div className="member-avatar">田</div>
                <div className="member-info">
                  <h4>田中太郎</h4>
                  <p>プライマリーオンコール</p>
                </div>
              </div>
              <div className="oncall-time">
                <Clock size={16} />
                <span>09:00 - 18:00</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>今週の活動</h3>
              <TrendingUp size={20} />
            </div>
            <div className="activity-chart">
              <div className="chart-bar" style={{ height: '60%' }}>
                <span>月</span>
              </div>
              <div className="chart-bar" style={{ height: '80%' }}>
                <span>火</span>
              </div>
              <div className="chart-bar active" style={{ height: '90%' }}>
                <span>水</span>
              </div>
              <div className="chart-bar" style={{ height: '40%' }}>
                <span>木</span>
              </div>
              <div className="chart-bar" style={{ height: '70%' }}>
                <span>金</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>最近のアラート</h3>
            </div>
            <div className="alert-list">
              <div className="alert-item high">
                <div className="alert-dot"></div>
                <div className="alert-content">
                  <h5>サーバー応答時間異常</h5>
                  <p>2分前</p>
                </div>
              </div>
              <div className="alert-item medium">
                <div className="alert-dot"></div>
                <div className="alert-content">
                  <h5>ディスク使用量警告</h5>
                  <p>15分前</p>
                </div>
              </div>
              <div className="alert-item low">
                <div className="alert-dot"></div>
                <div className="alert-content">
                  <h5>メモリ使用量増加</h5>
                  <p>1時間前</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
