import React, { useState } from 'react';
import { Department } from '../../types';
import { useDepartments } from '../../hooks/useDepartments';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import DepartmentForm from './DepartmentForm';
import LoadingProgress from '../common/LoadingProgress';
import { Building2, Users, Settings, Plus, Edit, Trash2, UserCheck } from 'lucide-react';
import './DepartmentManagement.css';

interface DepartmentManagementProps {
  onBack?: () => void;
}

const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { role } = useRole();
  const { 
    departments, 
    isLoading: isDepartmentsLoading, 
    error: departmentsError,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
  } = useDepartments();
  
  const {
    grantPermission
  } = usePermissions();

  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);

  // 権限チェック
  const canManageDepartments = role === 'admin';

  if (!canManageDepartments) {
    return (
      <div className="permission-denied">
        <h2>アクセス権限がありません</h2>
        <p>部署管理機能は管理者のみご利用いただけます。</p>
      </div>
    );
  }

  const handleCreateDepartment = async (name: string, description: string, managerId?: string) => {
    const result = await createDepartment(name, description, managerId, user?.uid || 'admin');
    if (result) {
      setShowForm(false);
      
      // 管理者が指定されている場合は権限を付与
      if (managerId) {
        await grantPermission(managerId, result.id, 'manager', true, user?.uid || 'admin');
      }
    }
  };

  const handleUpdateDepartment = async (
    id: string, 
    name: string, 
    description: string, 
    managerId?: string
  ) => {
    const updates: Partial<Pick<Department, 'name' | 'description' | 'managerId' | 'isActive'>> = {
      name,
      description
    };
    
    if (managerId !== undefined) {
      updates.managerId = managerId;
    }
    
    const result = await updateDepartment(id, updates);
    if (result) {
      setEditingDepartment(null);
      
      // 管理者が変更された場合は権限を更新
      if (managerId) {
        await grantPermission(managerId, id, 'manager', true, user?.uid || 'admin');
      }
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (window.confirm('この部署を削除してもよろしいですか？')) {
      await deleteDepartment(id);
    }
  };

  const activeDepartments = departments.filter(d => d.isActive);

  if (isDepartmentsLoading) {
    return (
      <LoadingProgress
        title="部署管理システム"
        steps={[
          '部署情報を取得中',
          '管理者権限を確認中',
          '所属長情報を読み込み中',
          '管理画面を準備中'
        ]}
        duration={2000}
      />
    );
  }

  return (
    <div className="department-management">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Building2 size={28} />
            部署管理
          </h1>
          <p>医療機関の部署を管理し、所属長を指定できます</p>
        </div>
        <div className="header-actions">
          {onBack && (
            <button 
              className="btn btn-secondary"
              onClick={onBack}
            >
              ← ダッシュボードに戻る
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            新しい部署を作成
          </button>
        </div>
      </div>

      {departmentsError && (
        <div className="error-message">
          <span>⚠️ {departmentsError}</span>
        </div>
      )}

      <div className="departments-grid">
        {activeDepartments.map(department => {
          const stats = getDepartmentStats(department.id);
          
          return (
            <div key={department.id} className="department-card">
              <div className="card-header">
                <div className="department-info">
                  <h3>{department.name}</h3>
                  <p>{department.description}</p>
                </div>
                <div className="card-actions">
                  <button
                    className="btn btn-icon"
                    onClick={() => setEditingDepartment(department.id)}
                    title="編集"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn btn-icon btn-danger"
                    onClick={() => handleDeleteDepartment(department.id)}
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <Users size={20} />
                  <div>
                    <span className="stat-value">{stats.totalStaff}</span>
                    <span className="stat-label">総スタッフ数</span>
                  </div>
                </div>
                <div className="stat-item">
                  <UserCheck size={20} />
                  <div>
                    <span className="stat-value">{stats.activeStaff}</span>
                    <span className="stat-label">アクティブ</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Settings size={20} />
                  <div>
                    <span className="stat-value">{stats.pendingRequests}</span>
                    <span className="stat-label">未承認希望</span>
                  </div>
                </div>
              </div>

              <div className="manager-info">
                <h4>所属長</h4>
                {department.managerId ? (
                  <div className="manager-badge">
                    <UserCheck size={16} />
                    <span>指定済み</span>
                  </div>
                ) : (
                  <div className="no-manager">
                    <span>未指定</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <span className="created-date">
                  作成日: {department.createdAt.toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {activeDepartments.length === 0 && (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>部署がありません</h3>
          <p>新しい部署を作成して始めましょう</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            最初の部署を作成
          </button>
        </div>
      )}

      {/* 部署作成フォーム */}
      {showForm && (
        <DepartmentForm
          onSubmit={handleCreateDepartment}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 部署編集フォーム */}
      {editingDepartment && (
        (() => {
          const department = departments.find(d => d.id === editingDepartment);
          return department ? (
            <DepartmentForm
              department={department}
              onSubmit={(name, description, managerId) => 
                handleUpdateDepartment(editingDepartment, name, description, managerId)
              }
              onCancel={() => setEditingDepartment(null)}
              isEditing
            />
          ) : null;
        })()
      )}
    </div>
  );
};

export default DepartmentManagement;
