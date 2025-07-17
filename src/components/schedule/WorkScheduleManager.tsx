import React, { useState } from 'react';
import { Calendar, Users, Settings, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { UserProfile } from '../../types';
import PermissionGated from '../auth/PermissionGated';
import './WorkScheduleManager.css';

interface WorkScheduleManagerProps {
  userProfile: UserProfile;
}

interface Schedule {
  id: string;
  title: string;
  date: string;
  assignedStaff: string[];
  status: 'active' | 'completed' | 'cancelled';
  createdBy: string;
  department: string;
}

const WorkScheduleManager: React.FC<WorkScheduleManagerProps> = ({ userProfile }) => {
  const [schedules] = useState<Schedule[]>([
    {
      id: '1',
      title: '夜間緊急対応',
      date: '2025-06-20',
      assignedStaff: ['田中太郎', '佐藤花子'],
      status: 'active',
      createdBy: '管理者',
      department: '開発部'
    },
    {
      id: '2',
      title: '週末保守作業',
      date: '2025-06-21',
      assignedStaff: ['山田次郎'],
      status: 'active',
      createdBy: '管理者',
      department: 'インフラ部'
    }
  ]);

  // 権限に応じたフィルタリング
  const getVisibleSchedules = () => {
    switch (userProfile.role) {
      case 'admin':
        // 管理者は全てのスケジュールを表示
        return schedules;
      case 'manager':
        // 所属長は自分の部署のスケジュールのみ表示
        return schedules.filter(schedule => 
          schedule.department === userProfile.department
        );
      case 'staff':
        // スタッフは自分が割り当てられたスケジュールのみ表示
        return schedules.filter(schedule => 
          schedule.assignedStaff.includes(userProfile.displayName || userProfile.email || '')
        );
      default:
        return [];
    }
  };

  const visibleSchedules = getVisibleSchedules();

  return (
    <div className="work-schedule-manager">
      <div className="schedule-header">
        <h2>
          <Calendar className="icon" />
          勤務スケジュール管理
        </h2>
        
        {/* 管理者と所属長のみスケジュール作成可能 */}
        <PermissionGated 
          requiredRoles={['admin', 'manager']} 
          userProfile={userProfile}
        >
          <button 
            className="btn btn-primary"
            onClick={() => {/* TODO: 実装予定 */}}
          >
            <Plus className="icon" />
            新規スケジュール作成
          </button>
        </PermissionGated>
      </div>

      {/* 権限に応じた表示メッセージ */}
      <div className="permission-info">
        {userProfile.role === 'admin' && (
          <div className="info-badge admin">
            <Settings className="icon" />
            管理者権限: 全社のスケジュールを管理できます
          </div>
        )}
        {userProfile.role === 'manager' && (
          <div className="info-badge manager">
            <Users className="icon" />
            所属長権限: {userProfile.department}のスケジュールを管理できます
          </div>
        )}
        {userProfile.role === 'staff' && (
          <div className="info-badge staff">
            <Eye className="icon" />
            スタッフ権限: 自分の担当スケジュールを確認できます
          </div>
        )}
      </div>

      {/* スケジュール一覧 */}
      <div className="schedule-list">
        {visibleSchedules.length === 0 ? (
          <div className="empty-state">
            <Calendar className="empty-icon" />
            <h3>スケジュールがありません</h3>
            <p>
              {userProfile.role === 'staff' 
                ? '現在、あなたに割り当てられたスケジュールはありません。'
                : 'まだスケジュールが作成されていません。'}
            </p>
          </div>
        ) : (
          visibleSchedules.map(schedule => (
            <div key={schedule.id} className="schedule-card">
              <div className="schedule-info">
                <h3>{schedule.title}</h3>
                <p className="schedule-date">📅 {schedule.date}</p>
                <p className="schedule-staff">
                  👥 担当: {schedule.assignedStaff.join(', ')}
                </p>
                <p className="schedule-department">🏢 部署: {schedule.department}</p>
                <span className={`status-badge ${schedule.status}`}>
                  {schedule.status === 'active' ? '実行中' : 
                   schedule.status === 'completed' ? '完了' : 'キャンセル'}
                </span>
              </div>
              
              <div className="schedule-actions">
                {/* スタッフは閲覧のみ */}
                {userProfile.role === 'staff' ? (
                  <button className="btn btn-secondary">
                    <Eye className="icon" />
                    詳細確認
                  </button>
                ) : (
                  <>
                    {/* 管理者と所属長は編集・削除可能 */}
                    <PermissionGated 
                      requiredRoles={['admin', 'manager']} 
                      userProfile={userProfile}
                    >
                      <button className="btn btn-secondary">
                        <Edit className="icon" />
                        編集
                      </button>
                    </PermissionGated>
                    
                    {/* 管理者のみ削除可能 */}
                    <PermissionGated 
                      requiredRoles={['admin']} 
                      userProfile={userProfile}
                    >
                      <button className="btn btn-danger">
                        <Trash2 className="icon" />
                        削除
                      </button>
                    </PermissionGated>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 管理者専用の統計情報 */}
      <PermissionGated 
        requiredRoles={['admin']} 
        userProfile={userProfile}
      >
        <div className="admin-statistics">
          <h3>📊 管理者専用統計</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{schedules.length}</span>
              <span className="stat-label">総スケジュール数</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {schedules.filter(s => s.status === 'active').length}
              </span>
              <span className="stat-label">実行中</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {new Set(schedules.flatMap(s => s.assignedStaff)).size}
              </span>
              <span className="stat-label">関与スタッフ数</span>
            </div>
          </div>
        </div>
      </PermissionGated>

      {/* 所属長専用の部署管理 */}
      <PermissionGated 
        requiredRoles={['manager']} 
        userProfile={userProfile}
      >
        <div className="department-management">
          <h3>👥 {userProfile.department} 管理</h3>
          <p>所属長として、部署のスケジュール管理を行えます。</p>
          <div className="department-actions">
            <button className="btn btn-primary">部署メンバー管理</button>
            <button className="btn btn-secondary">レポート生成</button>
          </div>
        </div>
      </PermissionGated>
    </div>
  );
};

export default WorkScheduleManager;
