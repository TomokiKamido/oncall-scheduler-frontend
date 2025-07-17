import { useState } from 'react';
import {
  Calendar,
  Users,
  Clock,
  Settings,
  Plus,
  Eye,
  Shield,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getRoleLabel } from '../components/RoleBadge';
import PermissionGated from '../components/auth/PermissionGated';
import WorkScheduleManager from '../components/schedule/WorkScheduleManager';
import ScheduleCalendar from '../components/schedule/ScheduleCalendar';
import ScheduleForm from '../components/schedule/ScheduleForm';
import ScheduleList from '../components/schedule/ScheduleList';
import ProgressBar from '../components/common/ProgressBar';
import './Schedule.css';
import './ScheduleWithPermissions.css';

function Schedule() {
  const { profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule-manager');

  // 認証情報の読み込み中
  if (loading || !profile) {
    return (
      <ProgressBar 
        duration={2000}
        message="スケジュール情報を読み込み中..."
        subMessage="権限情報を確認しています"
      />
    );
  }

  // 権限に応じたタブの表示制御
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'schedule-manager', label: '勤務管理', icon: Clock, roles: ['admin', 'manager', 'staff'] },
      { id: 'calendar', label: 'カレンダー', icon: Calendar, roles: ['admin', 'manager', 'staff'] },
    ];

    // 管理者と所属長のみ利用可能な機能
    const managerTabs = [
      { id: 'assignment', label: '自動割当て', icon: Settings, roles: ['admin', 'manager'] },
      { id: 'list', label: 'スケジュール一覧', icon: Users, roles: ['admin', 'manager'] },
    ];

    // 管理者のみ利用可能な機能
    const adminTabs = [
      { id: 'form', label: '新規作成', icon: Plus, roles: ['admin'] },
    ];

    const allTabs = [...baseTabs, ...managerTabs, ...adminTabs];
    
    return allTabs.filter(tab => 
      tab.roles.includes(profile.role as 'admin' | 'manager' | 'staff')
    );
  };

  const availableTabs = getAvailableTabs();

  // アクセス権限のない機能へのアクセスを検知
  const currentTab = availableTabs.find(tab => tab.id === activeTab);
  if (!currentTab) {
    // 権限のないタブにアクセスしようとした場合、最初のタブに戻す
    const firstAvailableTab = availableTabs[0];
    if (firstAvailableTab && activeTab !== firstAvailableTab.id) {
      setActiveTab(firstAvailableTab.id);
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule-manager':
        return <WorkScheduleManager userProfile={profile} />;
      
      case 'calendar':
        return (
          <div className="schedule-content">
            <div className="content-header">
              <Calendar className="icon" />
              <div>
                <h2>スケジュールカレンダー</h2>
                <p>
                  {profile.role === 'staff' 
                    ? 'あなたの担当スケジュールを確認できます'
                    : 'チームのスケジュールを確認・管理できます'
                  }
                </p>
              </div>
            </div>
            <ScheduleCalendar />
          </div>
        );
      
      case 'assignment':
        return (
          <PermissionGated 
            requiredRoles={['admin', 'manager']} 
            userProfile={profile}
            fallback={
              <div className="access-denied">
                <Shield className="denied-icon" />
                <h3>アクセス権限がありません</h3>
                <p>自動割当て機能は管理者または所属長のみ利用できます。</p>
              </div>
            }
          >
            <div className="schedule-content">
              <div className="content-header">
                <Settings className="icon" />
                <div>
                  <h2>スケジュール自動割当て</h2>
                  <p>この機能は廃止されました。高度な割り当て機能をご利用ください。</p>
                </div>
              </div>
            </div>
          </PermissionGated>
        );
      
      case 'list':
        return (
          <PermissionGated 
            requiredRoles={['admin', 'manager']} 
            userProfile={profile}
            fallback={
              <div className="access-denied">
                <Shield className="denied-icon" />
                <h3>アクセス権限がありません</h3>
                <p>スケジュール一覧管理は管理者または所属長のみ利用できます。</p>
              </div>
            }
          >
            <div className="schedule-content">
              <div className="content-header">
                <Users className="icon" />
                <div>
                  <h2>スケジュール一覧管理</h2>
                  <p>全てのスケジュールを一覧で管理します</p>
                </div>
              </div>
              <ScheduleList />
            </div>
          </PermissionGated>
        );
      
      case 'form':
        return (
          <PermissionGated 
            requiredRoles={['admin']} 
            userProfile={profile}
            fallback={
              <div className="access-denied">
                <Shield className="denied-icon" />
                <h3>アクセス権限がありません</h3>
                <p>新規スケジュール作成は管理者のみ利用できます。</p>
              </div>
            }
          >
            <div className="schedule-content">
              <div className="content-header">
                <Plus className="icon" />
                <div>
                  <h2>新規スケジュール作成</h2>
                  <p>新しいオンコールスケジュールを作成します</p>
                </div>
              </div>
              <ScheduleForm />
            </div>
          </PermissionGated>
        );
      
      default:
        return <WorkScheduleManager userProfile={profile} />;
    }
  };

  return (
    <div className="schedule-page">
      {/* 権限表示バッジ */}
      <div className="permission-header">
        <div className={`role-badge ${profile.role}`}>
          {profile.role === 'admin' && <Settings className="role-icon" />}
          {profile.role === 'manager' && <Users className="role-icon" />}
          {profile.role === 'staff' && <Eye className="role-icon" />}
          <span>
            {getRoleLabel(profile.role)}権限
          </span>
        </div>
        <div className="user-info">
          <span>{profile.displayName || profile.email}</span>
          {profile.department && <span className="department">({profile.department})</span>}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="schedule-tabs">
        {availableTabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent className="tab-icon" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* コンテンツエリア */}
      <div className="schedule-main">
        {renderContent()}
      </div>

      {/* 権限説明フッター */}
      <div className="permission-footer">
        <h4>権限について</h4>
        <div className="permission-guide">
          <div className="permission-item">
            <Settings className="permission-icon admin" />
            <div>
              <strong>管理者</strong>
              <p>全ての機能にアクセス可能。スケジュール作成・編集・削除、ユーザー管理など</p>
            </div>
          </div>
          <div className="permission-item">
            <Users className="permission-icon manager" />
            <div>
              <strong>所属長</strong>
              <p>部署内のスケジュール管理、自動割当て、メンバー管理が可能</p>
            </div>
          </div>
          <div className="permission-item">
            <Eye className="permission-icon staff" />
            <div>
              <strong>スタッフ</strong>
              <p>自分の担当スケジュールの確認、カレンダー表示が可能</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Schedule;
