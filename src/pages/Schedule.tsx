import { useState } from 'react';
import {
  Calendar,
  Users,
  Clock,
  Bell,
  Settings,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import ScheduleCalendar from '../components/schedule/ScheduleCalendar';
import ScheduleForm from '../components/schedule/ScheduleForm';
import ScheduleList from '../components/schedule/ScheduleList';
import AdvancedAssignmentScheduler from '../components/schedule/AdvancedAssignmentScheduler';
import { useUIPermissions } from '../hooks/useUIPermissions';
import './Schedule.css';

function Schedule() {
  const { showScheduleTab } = useUIPermissions();
  const [activeTab, setActiveTab] = useState('calendar');
  const [showForm, setShowForm] = useState(false);

  // 権限がない場合はアクセス拒否画面を表示
  if (!showScheduleTab()) {
    return (
      <div className="access-denied">
        <h2>アクセスが拒否されました</h2>
        <p>このページにアクセスする権限がありません。</p>
        <p>管理者にお問い合わせください。</p>
      </div>
    );
  }

  // サンプルスタッフデータ
  const staffMembers = [
    {
      id: 1,
      name: '田中太郎',
      email: 'tanaka@example.com',
      phone: '090-1234-5678',
      role: 'シニアエンジニア',
      department: '開発部',
      status: 'active' as const,
    },
    {
      id: 2,
      name: '佐藤花子',
      email: 'sato@example.com',
      phone: '090-2345-6789',
      role: 'プロダクトマネージャー',
      department: '企画部',
      status: 'active' as const,
    },
    {
      id: 3,
      name: '山田次郎',
      email: 'yamada@example.com',
      phone: '090-3456-7890',
      role: 'DevOpsエンジニア',
      department: 'インフラ部',
      status: 'active' as const,
    },
    {
      id: 4,
      name: '鈴木一郎',
      email: 'suzuki@example.com',
      phone: '090-4567-8901',
      role: 'QAエンジニア',
      department: '品質保証部',
      status: 'active' as const,
    },
  ];

  const handleAssignmentsChange = (assignments: any[]) => {
    console.log('新しい勤務割り当て:', assignments);
    // ここで割り当て結果を保存する処理を実装
  };

  return (
    <div className="schedule-page">
      {/* ヒーローセクション */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="gradient-text">スケジューラー</span>
            </h1>
            <p className="hero-description">
              効率的なシフト管理をサポートします
            </p>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">12</span>
                <span className="stat-label">アクティブメンバー</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">稼働時間</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Bell size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">24</span>
                <span className="stat-label">今月のアラート</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* タブナビゲーション */}
      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={20} />
          カレンダー
        </button>
        <button
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <Users size={20} />
          スケジュール一覧
        </button>
        <button
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          <Settings size={20} />
          高度な割り当て
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Bell size={20} />
          分析
        </button>

        <div className="tab-actions">
          <button className="btn-secondary">
            <Search size={16} />
            検索
          </button>
          <button className="btn-secondary">
            <Filter size={16} />
            フィルター
          </button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} />
            新規スケジュール
          </button>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="main-content">
        {showForm && (
          <div className="form-overlay">
            <div className="form-modal">
              <div className="form-header">
                <h3>新規スケジュール作成</h3>
                <button className="close-button" onClick={() => setShowForm(false)}>
                  ×
                </button>
              </div>
              <ScheduleForm />
            </div>
          </div>
        )}

        <div className="content-wrapper">
          {activeTab === 'calendar' && (
            <div className="calendar-view">
              <div className="view-header">
                <h2>カレンダー表示</h2>
                <div className="view-controls">
                  <button className="btn-secondary">
                    <Settings size={16} />
                    表示設定
                  </button>
                </div>
              </div>
              <ScheduleCalendar />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="list-view">
              <div className="view-header">
                <h2>スケジュール一覧</h2>
                <div className="view-controls">
                  <select className="select-control">
                    <option>今月</option>
                    <option>来月</option>
                    <option>全期間</option>
                  </select>
                </div>
              </div>
              <ScheduleList />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-view">
              <div className="view-header">
                <h2>分析・統計</h2>
              </div>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>月別稼働時間</h4>
                  <p>分析データがここに表示されます</p>
                </div>
                <div className="analytics-card">
                  <h4>メンバー別負荷</h4>
                  <p>負荷バランス分析がここに表示されます</p>
                </div>
                <div className="analytics-card">
                  <h4>アラート履歴</h4>
                  <p>アラート履歴がここに表示されます</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="advanced-assignment-view">
              <div className="view-header">
                <h2>高度な割り当てスケジューラー</h2>
              </div>
              <AdvancedAssignmentScheduler
                staffMembers={staffMembers}
                onAssignmentsChange={handleAssignmentsChange}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Schedule;
