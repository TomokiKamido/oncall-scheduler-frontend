import { useState } from 'react';
import { Calendar, User, Clock, MoreVertical, Edit, Trash2, CheckCircle } from 'lucide-react';
import './ScheduleList.css';

interface Schedule {
  id: number;
  title: string;
  member: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'primary' | 'backup';
  status: 'upcoming' | 'active' | 'completed';
}

const ScheduleList: React.FC = () => {
  const [schedules] = useState<Schedule[]>([
    { 
      id: 1, 
      title: '緊急対応オンコール', 
      member: '田中太郎',
      date: '2025-06-15', 
      startTime: '09:00',
      endTime: '18:00',
      type: 'primary',
      status: 'active'
    },
    { 
      id: 2, 
      title: 'バックアップ待機', 
      member: '佐藤花子',
      date: '2025-06-15', 
      startTime: '18:00',
      endTime: '09:00',
      type: 'backup',
      status: 'upcoming'
    },
    { 
      id: 3, 
      title: 'システム監視', 
      member: '山田次郎',
      date: '2025-06-16', 
      startTime: '09:00',
      endTime: '18:00',
      type: 'primary',
      status: 'upcoming'
    },
    { 
      id: 4, 
      title: '週末オンコール', 
      member: '鈴木一郎',
      date: '2025-06-14', 
      startTime: '00:00',
      endTime: '23:59',
      type: 'primary',
      status: 'completed'
    },
  ]);

  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'upcoming': return 'status-upcoming';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '実行中';
      case 'upcoming': return '予定';
      case 'completed': return '完了';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <div className="schedule-list">
      <div className="list-header">
        <h3>スケジュール一覧</h3>
        <div className="list-stats">
          <span className="stat">
            <CheckCircle size={16} />
            {schedules.filter(s => s.status === 'active').length} 実行中
          </span>
          <span className="stat">
            <Clock size={16} />
            {schedules.filter(s => s.status === 'upcoming').length} 予定
          </span>
        </div>
      </div>

      <div className="schedule-items">
        {schedules.map(schedule => (
          <div key={schedule.id} className={`schedule-item ${schedule.status}`}>
            <div className="item-main">
              <div className="item-header">
                <div className="item-title">
                  <h4>{schedule.title}</h4>
                  <span className={`status-badge ${getStatusColor(schedule.status)}`}>
                    {getStatusText(schedule.status)}
                  </span>
                  <span className={`type-badge ${schedule.type}`}>
                    {schedule.type === 'primary' ? 'プライマリー' : 'バックアップ'}
                  </span>
                </div>
                
                <div className="item-actions">
                  <button 
                    className="action-button"
                    onClick={() => setActiveDropdown(activeDropdown === schedule.id ? null : schedule.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {activeDropdown === schedule.id && (
                    <div className="dropdown-menu">
                      <button className="dropdown-item">
                        <Edit size={14} />
                        編集
                      </button>
                      <button className="dropdown-item delete">
                        <Trash2 size={14} />
                        削除
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="item-details">
                <div className="detail-item">
                  <User size={16} />
                  <span>{schedule.member}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>{formatDate(schedule.date)}</span>
                </div>
                <div className="detail-item">
                  <Clock size={16} />
                  <span>{schedule.startTime} - {schedule.endTime}</span>
                </div>
              </div>
            </div>

            {schedule.status === 'active' && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {schedules.length === 0 && (
        <div className="empty-state">
          <Calendar size={48} />
          <h4>スケジュールがありません</h4>
          <p>新しいスケジュールを作成してください。</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleList;