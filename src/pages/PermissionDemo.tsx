import { useState } from 'react';
import { Users, Settings, Eye, Crown, UserCheck, User } from 'lucide-react';
import { UserProfile } from '../types';
import PermissionGated from '../components/auth/PermissionGated';
import WorkScheduleManager from '../components/schedule/WorkScheduleManager';
import './PermissionDemo.css';

// デモ用のユーザープロファイル
const demoProfiles: Record<string, UserProfile> = {
  admin: {
    uid: 'demo-admin',
    email: 'admin@example.com',
    displayName: '管理者 太郎',
    role: 'admin',
    department: 'システム管理部',
    managedDepartments: [], // 管理部署（管理者は全部署を管理可能）
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  manager: {
    uid: 'demo-manager',
    email: 'manager@example.com',
    displayName: '所属長 花子',
    role: 'manager',
    department: '開発部',
    managedDepartments: ['dept_001'], // 担当部署
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  staff: {
    uid: 'demo-staff',
    email: 'staff@example.com',
    displayName: 'スタッフ 次郎',
    role: 'staff',
    department: '開発部',
    managedDepartments: [], // スタッフは部署管理権限なし
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

function PermissionDemo() {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'staff'>('admin');
  const [activeDemo, setActiveDemo] = useState<'overview' | 'schedule'>('overview');

  const currentProfile = demoProfiles[selectedRole];

  const roleButtons = [
    { 
      role: 'admin' as const, 
      label: '管理者', 
      icon: Crown, 
      color: '#667eea',
      description: '全ての機能にアクセス可能'
    },
    { 
      role: 'manager' as const, 
      label: '所属長', 
      icon: UserCheck, 
      color: '#48bb78',
      description: '部署内の管理機能を利用可能'
    },
    { 
      role: 'staff' as const, 
      label: 'スタッフ', 
      icon: User, 
      color: '#4299e1',
      description: '閲覧中心の限定的なアクセス'
    }
  ];

  const renderOverviewDemo = () => (
    <div className="permission-overview">
      <div className="demo-header">
        <h2>権限デモ: {currentProfile.displayName}さんの視点</h2>
        <div className={`current-role-badge ${selectedRole}`}>
          {roleButtons.find(r => r.role === selectedRole)?.icon && 
            (() => {
              const IconComponent = roleButtons.find(r => r.role === selectedRole)!.icon;
              return <IconComponent className="role-icon" />;
            })()
          }
          {roleButtons.find(r => r.role === selectedRole)?.label}
        </div>
      </div>

      <div className="permission-comparison">
        <div className="permission-section">
          <h3>🏠 ダッシュボード機能</h3>
          <div className="feature-list">
            <PermissionGated requiredRoles={['admin']} userProfile={currentProfile}>
              <div className="feature-item available">
                <Crown className="feature-icon" />
                <span>システム全体の管理・設定</span>
              </div>
            </PermissionGated>
            
            <PermissionGated 
              requiredRoles={['admin', 'manager']} 
              userProfile={currentProfile}
              fallback={
                <div className="feature-item disabled">
                  <UserCheck className="feature-icon" />
                  <span>部署管理機能（利用不可）</span>
                </div>
              }
            >
              <div className="feature-item available">
                <UserCheck className="feature-icon" />
                <span>部署管理機能</span>
              </div>
            </PermissionGated>

            <div className="feature-item available">
              <User className="feature-icon" />
              <span>個人プロファイル管理</span>
            </div>
          </div>
        </div>

        <div className="permission-section">
          <h3>📅 スケジュール機能</h3>
          <div className="feature-list">
            <PermissionGated 
              requiredRoles={['admin']} 
              userProfile={currentProfile}
              fallback={
                <div className="feature-item disabled">
                  <Settings className="feature-icon" />
                  <span>新規スケジュール作成（利用不可）</span>
                </div>
              }
            >
              <div className="feature-item available">
                <Settings className="feature-icon" />
                <span>新規スケジュール作成</span>
              </div>
            </PermissionGated>

            <PermissionGated 
              requiredRoles={['admin', 'manager']} 
              userProfile={currentProfile}
              fallback={
                <div className="feature-item disabled">
                  <Users className="feature-icon" />
                  <span>スケジュール編集・削除（利用不可）</span>
                </div>
              }
            >
              <div className="feature-item available">
                <Users className="feature-icon" />
                <span>スケジュール編集・削除</span>
              </div>
            </PermissionGated>

            <div className="feature-item available">
              <Eye className="feature-icon" />
              <span>スケジュール閲覧</span>
            </div>
          </div>
        </div>

        <div className="permission-section">
          <h3>👥 ユーザー管理機能</h3>
          <div className="feature-list">
            <PermissionGated 
              requiredRoles={['admin']} 
              userProfile={currentProfile}
              fallback={
                <div className="feature-item disabled">
                  <Crown className="feature-icon" />
                  <span>全ユーザー管理（利用不可）</span>
                </div>
              }
            >
              <div className="feature-item available">
                <Crown className="feature-icon" />
                <span>全ユーザー管理</span>
              </div>
            </PermissionGated>

            <PermissionGated 
              requiredRoles={['admin', 'manager']} 
              userProfile={currentProfile}
              fallback={
                <div className="feature-item disabled">
                  <UserCheck className="feature-icon" />
                  <span>部署メンバー管理（利用不可）</span>
                </div>
              }
            >
              <div className="feature-item available">
                <UserCheck className="feature-icon" />
                <span>部署メンバー管理</span>
              </div>
            </PermissionGated>

            <div className="feature-item available">
              <User className="feature-icon" />
              <span>自己プロファイル編集</span>
            </div>
          </div>
        </div>
      </div>

      <div className="data-visibility">
        <h3>📊 データ表示範囲</h3>
        <div className="visibility-info">
          {selectedRole === 'admin' && (
            <div className="visibility-item admin">
              <Crown className="visibility-icon" />
              <div>
                <strong>全社データ表示</strong>
                <p>全部署、全スタッフのスケジュールと統計情報を表示</p>
              </div>
            </div>
          )}
          {selectedRole === 'manager' && (
            <div className="visibility-item manager">
              <UserCheck className="visibility-icon" />
              <div>
                <strong>部署データのみ表示</strong>
                <p>{currentProfile.department}のスケジュールとメンバー情報のみ表示</p>
              </div>
            </div>
          )}
          {selectedRole === 'staff' && (
            <div className="visibility-item staff">
              <User className="visibility-icon" />
              <div>
                <strong>個人データのみ表示</strong>
                <p>自分に割り当てられたスケジュールのみ表示</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="permission-demo">
      <div className="demo-controls">
        <div className="role-selector">
          <h2>権限デモンストレーション</h2>
          <p>異なる権限でのUIの見え方を比較できます</p>
          
          <div className="role-buttons">
            {roleButtons.map(({ role, label, icon: IconComponent, color, description }) => (
              <button
                key={role}
                className={`role-button ${selectedRole === role ? 'active' : ''}`}
                onClick={() => setSelectedRole(role)}
                style={{ '--role-color': color } as React.CSSProperties}
              >
                <IconComponent className="role-button-icon" />
                <div className="role-button-content">
                  <span className="role-button-label">{label}</span>
                  <span className="role-button-desc">{description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="demo-tabs">
          <button
            className={`demo-tab ${activeDemo === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveDemo('overview')}
          >
            権限比較
          </button>
          <button
            className={`demo-tab ${activeDemo === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveDemo('schedule')}
          >
            実際のUI
          </button>
        </div>
      </div>

      <div className="demo-content">
        {activeDemo === 'overview' ? renderOverviewDemo() : (
          <div className="ui-demo">
            <div className="ui-demo-header">
              <h3>{currentProfile.displayName}さんとしてログイン中</h3>
              <p>実際のスケジュール管理画面を{selectedRole}権限で表示</p>
            </div>
            <WorkScheduleManager userProfile={currentProfile} />
          </div>
        )}
      </div>
    </div>
  );
}

export default PermissionDemo;
