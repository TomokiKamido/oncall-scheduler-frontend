import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Users, Settings, Plus, Trash2, Move } from 'lucide-react';
import { Staff, Assignment, Group } from '../../types';
import { generateDateRange } from '../../utils/dateUtils';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './AdvancedAssignmentScheduler.css';

// ドラッグアイテムの型定義
interface DragItem {
  type: string;
  id: number;
  staff: Staff;
}

// ドラッグタイプの定義
const ItemTypes = {
  STAFF: 'staff',
};

interface AdvancedAssignmentSchedulerProps {
  staffMembers: Staff[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
}

// ドラッグ可能なスタッフアイテムコンポーネント
const DraggableStaffItem: React.FC<{ staff: Staff }> = ({ staff }) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.STAFF,
    item: { type: ItemTypes.STAFF, id: staff.id, staff },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // カスタムプレビューを設定してカーソル追従を実現
  useEffect(() => {
    preview(
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: '#1e293b',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(59, 130, 246, 0.3)',
          transform: 'rotate(3deg)',
          opacity: 0.95,
          cursor: 'grabbing',
          zIndex: 1000,
          width: '220px',
          height: '56px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#3b82f6',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            flexShrink: 0,
          }}
        >
          {staff.name.substring(0, 2)}
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              fontWeight: '500',
              color: '#f8fafc',
              fontSize: '0.875rem',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {staff.name}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#cbd5e1',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {staff.department || '部署不明'}
          </div>
        </div>
        <Move size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
      </div>,
      { captureDraggingState: true }
    );
  }, [preview, staff]);

  return (
    <div
      ref={drag}
      className={`draggable-staff-item ${isDragging ? 'dragging' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div className="staff-avatar">
        {staff.name.substring(0, 2)}
      </div>
      <div className="staff-info">
        <div className="staff-name">{staff.name}</div>
        <div className="staff-department">{staff.department || '部署不明'}</div>
      </div>
      <Move size={16} className="drag-handle" />
    </div>
  );
};

// ドロップ可能なグループゾーンコンポーネント
const DroppableGroupZone: React.FC<{
  groupId: string;
  children: React.ReactNode;
  onDrop: (item: DragItem, groupId: string) => void;
}> = ({ groupId, children, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.STAFF,
    drop: (item: DragItem) => {
      onDrop(item, groupId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`group-staff-drop-zone droppable-zone ${
        isActive ? 'active' : ''
      } ${canDrop ? 'can-drop' : ''}`}
      style={{
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : undefined,
        borderColor: isActive ? '#3b82f6' : undefined,
      }}
    >
      {children}
    </div>
  );
};

// ドロップ可能な未割り当てゾーンコンポーネント
const DroppableUnassignedZone: React.FC<{
  children: React.ReactNode;
  onDrop: (item: DragItem) => void;
}> = ({ children, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.STAFF,
    drop: (item: DragItem) => {
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`unassigned-staff-drop-zone droppable-zone ${
        isActive ? 'active' : ''
      } ${canDrop ? 'can-drop' : ''}`}
      style={{
        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : undefined,
        borderColor: isActive ? '#10b981' : undefined,
      }}
    >
      {children}
    </div>
  );
};

const AdvancedAssignmentScheduler: React.FC<AdvancedAssignmentSchedulerProps> = ({ 
  staffMembers, 
  onAssignmentsChange 
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 期間設定方式
  const [dateRangeMode, setDateRangeMode] = useState<'custom' | 'monthly'>('custom');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // グループ設定
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6');

  // 初期日付設定
  useEffect(() => {
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);
    
    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = twoWeeksLater.toISOString().split('T')[0];
    
    if (dateRangeMode === 'custom') {
      setStartDate(startDateStr);
      setEndDate(endDateStr);
    }
    
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, [dateRangeMode]);

  // 月毎設定時の日付自動設定
  useEffect(() => {
    if (dateRangeMode === 'monthly' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      const startDateStr = `${year}-${month}-01`;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const endDateStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      setStartDate(startDateStr);
      setEndDate(endDateStr);
    }
  }, [dateRangeMode, selectedMonth]);

  // ドロップハンドラー: スタッフをグループに追加
  const handleStaffToGroupDrop = useCallback((item: DragItem, groupId: string) => {
    console.log('Staff dropped to group:', { staffId: item.id, groupId });
    
    setGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.id === groupId) {
          // 既にグループに存在するかチェック
          if (!group.staffIds.includes(item.id)) {
            return {
              ...group,
              staffIds: [...group.staffIds, item.id]
            };
          }
        } else {
          // 他のグループから削除
          return {
            ...group,
            staffIds: group.staffIds.filter(staffId => staffId !== item.id)
          };
        }
        return group;
      })
    );
  }, []);

  // ドロップハンドラー: スタッフを未割り当てに戻す
  const handleStaffToUnassignedDrop = useCallback((item: DragItem) => {
    console.log('Staff dropped to unassigned:', { staffId: item.id });
    
    setGroups(prevGroups => 
      prevGroups.map(group => ({
        ...group,
        staffIds: group.staffIds.filter(staffId => staffId !== item.id)
      }))
    );
  }, []);

  // グループ作成
  const createGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      color: newGroupColor,
      staffIds: [],
      isActive: true
    };
    
    setGroups(prev => [...prev, newGroup]);
    setNewGroupName('');
    setNewGroupColor('#3b82f6');
  };

  // グループ削除
  const deleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  };

  // フィルタリングされたスタッフメンバーを取得
  const getFilteredStaffMembers = () => {
    if (!Array.isArray(staffMembers)) return [];
    
    if (selectedGroup === 'all') {
      return staffMembers;
    } else if (selectedGroup === 'unassigned') {
      const assignedStaffIds = groups.flatMap(group => group.staffIds || []);
      return staffMembers.filter(staff => !assignedStaffIds.includes(staff.id));
    } else {
      const group = groups.find(g => g.id === selectedGroup);
      return group ? staffMembers.filter(staff => (group.staffIds || []).includes(staff.id)) : [];
    }
  };

  // 最適なスケジュール生成
  const generateOptimalSchedule = () => {
    const filteredStaff = getFilteredStaffMembers();
    
    if (!Array.isArray(filteredStaff) || filteredStaff.length === 0) {
      alert('スタッフが選択されていません');
      return;
    }

    if (!startDate || !endDate) {
      alert('開始日と終了日を設定してください');
      return;
    }

    const dateRange = generateDateRange(startDate, endDate);
    const newAssignments: Assignment[] = [];

    dateRange.forEach((date, dateIndex) => {
      // 日勤と夜勤の両方を割り当て
      ['day', 'night'].forEach((shift, shiftIndex) => {
        const staffIndex = (dateIndex + shiftIndex) % filteredStaff.length;
        const assignedStaff = filteredStaff[staffIndex];
        
        newAssignments.push({
          id: `${date}-${shift}`,
          date,
          shift: shift as 'day' | 'night',
          staffId: assignedStaff.id,
          staffName: assignedStaff.name
        });
      });
    });

    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="advanced-assignment-scheduler">
        <div className="scheduler-header">
          <h2>
            <Zap className="header-icon" />
            高度な割り当てスケジューラー（React DnD版）
          </h2>
          <p>スタッフをドラッグ&ドロップしてグループに割り当て、最適なスケジュールを生成します。</p>
        </div>

        {/* 期間設定 */}
        <div className="date-range-selector">
          <div className="range-mode-toggle">
            <button
              className={`mode-button ${dateRangeMode === 'custom' ? 'active' : ''}`}
              onClick={() => setDateRangeMode('custom')}
            >
              カスタム期間
            </button>
            <button
              className={`mode-button ${dateRangeMode === 'monthly' ? 'active' : ''}`}
              onClick={() => setDateRangeMode('monthly')}
            >
              月単位
            </button>
          </div>

          {dateRangeMode === 'custom' ? (
            <>
              <div className="date-input">
                <label>開始日</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-field"
                />
              </div>
              <div className="date-input">
                <label>終了日</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-field"
                />
              </div>
            </>
          ) : (
            <div className="date-input">
              <label>対象月</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="date-field"
              />
            </div>
          )}

          <button
            onClick={generateOptimalSchedule}
            className="generate-button"
            disabled={!startDate || !endDate}
          >
            <Zap size={16} />
            スケジュール生成
          </button>
        </div>

        {/* スタッフグループ管理 */}
        <div className="staff-groups-section">
          <div className="section-header">
            <h3>
              <Users size={20} />
              スタッフグループ管理
            </h3>
            <button
              onClick={() => setShowGroupSettings(!showGroupSettings)}
              className="settings-button"
            >
              <Settings size={16} />
              設定
            </button>
          </div>

          {/* グループ作成設定 */}
          {showGroupSettings && (
            <div className="group-settings">
              <div className="create-group-form">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="グループ名を入力"
                  className="group-name-input"
                />
                <input
                  type="color"
                  value={newGroupColor}
                  onChange={(e) => setNewGroupColor(e.target.value)}
                  className="group-color-input"
                />
                <button
                  onClick={createGroup}
                  className="create-group-button"
                  disabled={!newGroupName.trim()}
                >
                  <Plus size={16} />
                  グループ作成
                </button>
              </div>
            </div>
          )}

          {/* フィルター選択 */}
          <div className="group-filter">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="group-select"
            >
              <option value="all">全スタッフ</option>
              <option value="unassigned">未割り当て</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* スタッフリスト */}
          <div className="staff-list">
            <h4>
              {selectedGroup === 'all' ? '全スタッフ' : 
               selectedGroup === 'unassigned' ? '未割り当てスタッフ' :
               groups.find(g => g.id === selectedGroup)?.name || 'スタッフ'}
              （{getFilteredStaffMembers().length}人）
            </h4>
            
            {selectedGroup === 'unassigned' ? (
              <DroppableUnassignedZone onDrop={handleStaffToUnassignedDrop}>
                <div className="staff-grid">
                  {getFilteredStaffMembers().map(staff => (
                    <DraggableStaffItem key={staff.id} staff={staff} />
                  ))}
                </div>
              </DroppableUnassignedZone>
            ) : (
              <div className="staff-grid">
                {getFilteredStaffMembers().map(staff => (
                  <DraggableStaffItem key={staff.id} staff={staff} />
                ))}
              </div>
            )}
          </div>

          {/* グループ表示 */}
          {groups.map(group => (
            <div key={group.id} className="group-container">
              <div 
                className="group-header"
                style={{ borderLeftColor: group.color }}
              >
                <h4 style={{ color: group.color }}>
                  {group.name} ({group.staffIds.length}人)
                </h4>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="delete-group-button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <DroppableGroupZone 
                groupId={group.id}
                onDrop={handleStaffToGroupDrop}
              >
                <div className="group-staff-grid">
                  {group.staffIds.map(staffId => {
                    const staff = staffMembers.find(s => s.id === staffId);
                    return staff ? (
                      <DraggableStaffItem key={staff.id} staff={staff} />
                    ) : null;
                  })}
                </div>
              </DroppableGroupZone>
            </div>
          ))}
        </div>

        {/* 生成されたスケジュール表示 */}
        {assignments.length > 0 && (
          <div className="schedule-results">
            <h4>生成されたスケジュール</h4>
            <div className="assignments-list">
              {assignments.map(assignment => (
                <div key={assignment.id} className="assignment-item">
                  <span className="assignment-date">{assignment.date}</span>
                  <span className={`assignment-shift shift-${assignment.shift}`}>
                    {assignment.shift === 'day' ? '日勤' : '夜勤'}
                  </span>
                  <span className="assignment-staff">{assignment.staffName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default AdvancedAssignmentScheduler;
