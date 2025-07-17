import { useState } from 'react';
import { Plus, Search, Filter, Users, UserPlus, Mail, Heart } from 'lucide-react';
import StaffList from '../components/staff/StaffList';
import StaffForm from '../components/staff/StaffForm';
import ShiftRequestForm from '../components/schedule/ShiftRequestForm';
import ShiftRequestReview from '../components/schedule/ShiftRequestReview';
import { useAuth } from '../hooks/useAuth';
import { useUIPermissions } from '../hooks/useUIPermissions';
import './Staff.css';

interface LocalStaff {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

function Staff() {
  const { hasPermission, isStaff, profile, user, loading, profileLoading } = useAuth();
  const { showStaffTab } = useUIPermissions();
  
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<LocalStaff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // 勤務希望関連の状態
  const [showShiftRequestForm, setShowShiftRequestForm] = useState(false);
  const [showShiftRequestReview, setShowShiftRequestReview] = useState(false);

  // デバッグ情報をコンソールに出力
  console.log('Debug Info - Staff Page:', {
    user: user?.email,
    profile: profile,
    loading,
    profileLoading,
    isStaff: isStaff(),
    hasEditPermission: hasPermission('canEditSchedules'),
    profileRole: profile?.role,
    profileActive: profile?.isActive,
    showShiftRequestForm,
    showShiftRequestReview
  });
  
  // デバッグ用のボタンクリックハンドラ
  const handleShiftRequestClick = () => {
    try {
      console.log('🔥 勤務希望提出ボタンがクリックされました');
      console.log('現在のshowShiftRequestForm状態:', showShiftRequestForm);
      
      setShowShiftRequestForm(true);
      
      console.log('✅ setShowShiftRequestForm(true) が実行されました');
      
      // 状態変更の確認用タイマー
      setTimeout(() => {
        console.log('📋 1秒後のshowShiftRequestForm状態:', showShiftRequestForm);
      }, 1000);
      
    } catch (error) {
      console.error('❌ ボタンクリック時のエラー:', error);
      alert('エラーが発生しました: ' + error);
    }
  };
  
  const handleShiftRequestReviewClick = () => {
    try {
      console.log('🔥 勤務希望審査ボタンがクリックされました');
      setShowShiftRequestReview(true);
      console.log('✅ setShowShiftRequestReview(true) が実行されました');
    } catch (error) {
      console.error('❌ 審査ボタンクリック時のエラー:', error);
      alert('エラーが発生しました: ' + error);
    }
  };
  
  const [staffMembers, setStaffMembers] = useState<LocalStaff[]>([
    {
      id: 1,
      name: '田中太郎',
      email: 'tanaka@example.com',
      phone: '090-1234-5678',
      role: 'シニアエンジニア',
      department: '開発部',
      status: 'active',
    },
    {
      id: 2,
      name: '佐藤花子',
      email: 'sato@example.com',
      phone: '090-2345-6789',
      role: 'プロダクトマネージャー',
      department: '企画部',
      status: 'active',
    },
    {
      id: 3,
      name: '山田次郎',
      email: 'yamada@example.com',
      phone: '090-3456-7890',
      role: 'DevOpsエンジニア',
      department: 'インフラ部',
      status: 'active',
    },
    {
      id: 4,
      name: '鈴木一郎',
      email: 'suzuki@example.com',
      phone: '090-4567-8901',
      role: 'QAエンジニア',
      department: '品質保証部',
      status: 'inactive',
    },
  ]);

  const handleAddStaff = (newStaff: Omit<LocalStaff, 'id'>) => {
    const staff: LocalStaff = {
      ...newStaff,
      id: Math.max(...staffMembers.map(s => s.id)) + 1,
    };
    setStaffMembers([...staffMembers, staff]);
    setShowForm(false);
  };

  const handleEditStaff = (staff: LocalStaff) => {
    setEditingStaff(staff);
    setShowForm(true);
  };

  const handleUpdateStaff = (updatedStaffData: Omit<LocalStaff, 'id'>) => {
    if (editingStaff) {
      const updatedStaff: LocalStaff = {
        ...updatedStaffData,
        id: editingStaff.id,
      };
      setStaffMembers(
        staffMembers.map(staff => (staff.id === editingStaff.id ? updatedStaff : staff))
      );
      setEditingStaff(null);
      setShowForm(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (id: number) => {
    setStaffMembers(staffMembers.filter(staff => staff.id !== id));
  };

  const handleStatusUpdate = (updatedStaff: LocalStaff) => {
    setStaffMembers(
      staffMembers.map(staff => (staff.id === updatedStaff.id ? updatedStaff : staff))
    );
  };

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || staff.role.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  const activeStaffCount = staffMembers.filter(s => s.status === 'active').length;
  const departments = [...new Set(staffMembers.map(s => s.department))];

  // 権限がない場合はアクセス拒否画面を表示
  if (!showStaffTab()) {
    return (
      <div className="access-denied">
        <h2>アクセスが拒否されました</h2>
        <p>このページにアクセスする権限がありません。</p>
        <p>管理者にお問い合わせください。</p>
      </div>
    );
  }

  return (
    <div className="staff-page">
      {/* ヒーローセクション */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              スタッフ
              <span className="gradient-text">管理</span>
            </h1>
            <p className="hero-description">
              チームメンバーの情報を管理し、オンコール体制を効率的に運用します
            </p>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{activeStaffCount}</span>
                <span className="stat-label">アクティブメンバー</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <UserPlus size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{departments.length}</span>
                <span className="stat-label">部署数</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Mail size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">{staffMembers.length}</span>
                <span className="stat-label">総メンバー</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ツールバー */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="名前、メール、役職で検索..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <Filter size={16} />
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">すべての役職</option>
              <option value="エンジニア">エンジニア</option>
              <option value="マネージャー">マネージャー</option>
              <option value="DevOps">DevOps</option>
              <option value="QA">QA</option>
            </select>
          </div>
        </div>
        <div className="toolbar-right">
          {/* デバッグ情報表示 */}
          <div style={{ fontSize: '12px', color: '#666', marginRight: '10px', border: '1px solid #ddd', padding: '5px', borderRadius: '4px' }}>
            <div>User: {user?.email || 'Not logged in'}</div>
            <div>Role: {profile?.role || 'No role'} | Loading: {loading ? 'true' : 'false'} | Profile Loading: {profileLoading ? 'true' : 'false'}</div>
            <div>isStaff(): {isStaff() ? 'true' : 'false'} | hasEditPermission: {hasPermission('canEditSchedules') ? 'true' : 'false'}</div>
            <div>Modal States: ShiftForm: {showShiftRequestForm ? 'true' : 'false'} | Review: {showShiftRequestReview ? 'true' : 'false'}</div>
          </div>
          
          {/* スタッフ向け：勤務希望提出ボタン（一時的に条件緩和） */}
          {(isStaff() || user) && (
            <button
              className="btn-secondary"
              onClick={handleShiftRequestClick}
              title={!isStaff() ? 'デバッグモード: 権限なしでも表示' : '勤務希望を提出'}
              style={{ 
                border: '2px solid red', // デバッグ用の視覚的確認
                position: 'relative',
                zIndex: 1000 // z-index問題の回避
              }}
            >
              <Heart size={16} />
              勤務希望を提出
            </button>
          )}
          
          {/* 管理者向け：勤務希望審査ボタン */}
          {hasPermission('canEditSchedules') && (
            <button
              className="btn-warning"
              onClick={handleShiftRequestReviewClick}
              style={{ 
                border: '2px solid blue', // デバッグ用の視覚的確認
                position: 'relative',
                zIndex: 1000
              }}
            >
              <Heart size={16} />
              勤務希望を審査
            </button>
          )}
          
          <button
            className="btn-primary"
            onClick={() => {
              setEditingStaff(null);
              setShowForm(true);
            }}
          >
            <Plus size={16} />
            新規スタッフ追加
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="main-content">
        {showForm && (
          <div className="form-overlay">
            <div className="form-modal">
              <div className="form-header">
                <h3>{editingStaff ? 'スタッフ情報編集' : '新規スタッフ追加'}</h3>
                <button className="close-button" onClick={handleCancelForm}>
                  ×
                </button>
              </div>
              <StaffForm
                onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff}
                onCancel={handleCancelForm}
                initialData={editingStaff ? editingStaff : undefined}
                isEdit={!!editingStaff}
              />
            </div>
          </div>
        )}

        <div className="content-wrapper">
          <StaffList
            staffMembers={filteredStaff}
            onDelete={handleDeleteStaff}
            onUpdate={handleStatusUpdate}
            onEdit={handleEditStaff}
          />
        </div>
      </main>

      {/* 勤務希望提出フォーム */}
      {showShiftRequestForm && (
        <div className="modal-overlay" onClick={() => {
          console.log('🚫 モーダルオーバーレイがクリックされました');
        }}>
          <div className="modal-content" onClick={(e) => {
            e.stopPropagation();
            console.log('📋 モーダルコンテンツがクリックされました');
          }}>
            <div style={{ padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
              🔍 デバッグ: 勤務希望提出フォームが表示されています (showShiftRequestForm: {String(showShiftRequestForm)})
            </div>
            <ShiftRequestForm onClose={() => {
              console.log('❌ 勤務希望フォームを閉じます');
              setShowShiftRequestForm(false);
            }} />
          </div>
        </div>
      )}

      {/* showShiftRequestFormがtrueだがフォームが表示されない場合のデバッグ */}
      {showShiftRequestForm && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'red',
          color: 'white',
          padding: '10px',
          zIndex: 9999,
          fontSize: '12px'
        }}>
          🚨 Modal Should Be Visible: {String(showShiftRequestForm)}
        </div>
      )}

      {/* 勤務希望審査画面 */}
      {showShiftRequestReview && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
              🔍 デバッグ: 勤務希望審査画面が表示されています
            </div>
            <ShiftRequestReview onClose={() => {
              console.log('❌ 勤務希望審査画面を閉じます');
              setShowShiftRequestReview(false);
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Staff;
