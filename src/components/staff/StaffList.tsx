import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users, 
  Building, 
  Briefcase,
  CheckCircle,
  XCircle
} from 'lucide-react';
import './StaffList.css';

interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

interface StaffListProps {
  staffMembers: Staff[];
  onDelete: (id: number) => void;
  onUpdate: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
}

const StaffList: React.FC<StaffListProps> = ({ staffMembers, onDelete, onUpdate, onEdit }) => {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const getStatusIcon = (status: string) => {
    return status === 'active' ? 
      <CheckCircle size={16} className="status-icon active" /> : 
      <XCircle size={16} className="status-icon inactive" />;
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'アクティブ' : '非アクティブ';
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  const handleEdit = (staff: Staff) => {
    onEdit(staff);
    setActiveDropdown(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('このスタッフを削除してもよろしいですか？')) {
      onDelete(id);
    }
    setActiveDropdown(null);
  };

  const toggleStatus = (staff: Staff) => {
    const updatedStaff = {
      ...staff,
      status: staff.status === 'active' ? 'inactive' as const : 'active' as const
    };
    onUpdate(updatedStaff);
  };

  return (
    <div className="staff-list">
      <div className="list-header">
        <h3>スタッフメンバー</h3>
        <div className="list-stats">
          <span className="stat">
            <Users size={16} />
            {staffMembers.length} 名
          </span>
          <span className="stat">
            <CheckCircle size={16} />
            {staffMembers.filter(s => s.status === 'active').length} アクティブ
          </span>
        </div>
      </div>

      <div className="staff-grid">
        {staffMembers.map(staff => (
          <div key={staff.id} className={`staff-card ${staff.status}`}>
            <div className="card-header">
              <div className="staff-avatar">
                {staff.avatar ? (
                  <img src={staff.avatar} alt={staff.name} />
                ) : (
                  <span>{getAvatarInitials(staff.name)}</span>
                )}
              </div>
              
              <div className="staff-info">
                <h4 className="staff-name">{staff.name}</h4>
                <div className="staff-status">
                  {getStatusIcon(staff.status)}
                  <span>{getStatusText(staff.status)}</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="action-button"
                  onClick={() => setActiveDropdown(activeDropdown === staff.id ? null : staff.id)}
                >
                  <MoreVertical size={16} />
                </button>
                
                {activeDropdown === staff.id && (
                  <div className="dropdown-menu">
                    <button 
                      className="dropdown-item"
                      onClick={() => handleEdit(staff)}
                    >
                      <Edit size={14} />
                      編集
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={() => toggleStatus(staff)}
                    >
                      {staff.status === 'active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      {staff.status === 'active' ? '無効化' : '有効化'}
                    </button>
                    <button 
                      className="dropdown-item delete"
                      onClick={() => handleDelete(staff.id)}
                    >
                      <Trash2 size={14} />
                      削除
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="card-body">
              <div className="detail-item">
                <Briefcase size={16} />
                <div>
                  <span className="detail-label">役職</span>
                  <span className="detail-value">{staff.role}</span>
                </div>
              </div>

              <div className="detail-item">
                <Building size={16} />
                <div>
                  <span className="detail-label">部署</span>
                  <span className="detail-value">{staff.department}</span>
                </div>
              </div>

              <div className="detail-item">
                <Mail size={16} />
                <div>
                  <span className="detail-label">メール</span>
                  <span className="detail-value">{staff.email}</span>
                </div>
              </div>

              <div className="detail-item">
                <Phone size={16} />
                <div>
                  <span className="detail-label">電話</span>
                  <span className="detail-value">{staff.phone}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {staffMembers.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h4>スタッフが登録されていません</h4>
          <p>新しいスタッフメンバーを追加してください。</p>
        </div>
      )}
    </div>
  );
};

export default StaffList;