import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Users, Settings, Plus, Trash2, Move } from 'lucide-react';
import { Staff, Assignment, Group } from '../../types';
import { generateDateRange } from '../../utils/dateUtils';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './AdvancedAssignmentScheduler.css';

// ドラッグアイテムの型定義
interface DragItem {
  id: number;
  staff: Staff;
}

// ドラッグタイプの定義
const ItemTypes = {
  STAFF: 'staff',
} as const;

interface AdvancedAssignmentSchedulerProps {
  staffMembers: Staff[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
}

// ドラッグ可能なスタッフアイテムコンポーネント
const DraggableStaffItem: React.FC<{ staff: Staff }> = ({ staff }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.STAFF,
    item: { id: staff.id, staff },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [staff]);

  return (
    <div
      ref={drag}
      className={`draggable-staff-item ${isDragging ? 'dragging' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
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
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.STAFF,
    drop: (item: DragItem) => {
      onDrop(item, groupId);
      return { groupId };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [groupId, onDrop]);

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`group-staff-drop-zone droppable-zone ${
        isActive ? 'active' : ''
      } ${canDrop ? 'can-drop' : ''}`}
      style={{
        minHeight: '100px',
        padding: '16px',
        border: '2px dashed #94a3b8',
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.05)',
        borderColor: isActive ? '#3b82f6' : '#94a3b8',
        borderRadius: '8px',
      }}
    >
      {!children || (Array.isArray(children) && children.length === 0) ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#94a3b8', 
          fontSize: '0.875rem',
          fontStyle: 'italic',
          padding: '20px 0'
        }}>
          スタッフをここにドロップ
        </div>
      ) : null}
      {children}
    </div>
  );
};

// ドロップ可能な未割り当てゾーンコンポーネント
const DroppableUnassignedZone: React.FC<{
  children: React.ReactNode;
  onDrop: (item: DragItem) => void;
}> = ({ children, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.STAFF,
    drop: (item: DragItem) => {
      onDrop(item);
      return { unassigned: true };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDrop]);

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`unassigned-staff-drop-zone droppable-zone ${
        isActive ? 'active' : ''
      } ${canDrop ? 'can-drop' : ''}`}
      style={{
        minHeight: '100px',
        padding: '16px',
        border: '2px dashed #10b981',
        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.02)',
        borderColor: isActive ? '#10b981' : '#10b981',
        borderRadius: '8px',
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

  // グループ設定（テスト用に1つデフォルトで追加）
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 'test-group-1',
      name: 'テストグループ1',
      color: '#3b82f6',
      staffIds: [],
      isActive: true
    }
  ]);
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
    console.log('Staff dropped to group:', { staffId: item.id, staffName: item.staff.name, groupId });
    
    setGroups(prevGroups => {
      return prevGroups.map(group => {
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
      });
    });
  }, []);

  // ドロップハンドラー: スタッフを未割り当てに戻す
  const handleStaffToUnassignedDrop = useCallback((item: DragItem) => {
    console.log('Staff dropped to unassigned:', { staffId: item.id, staffName: item.staff.name });
    
    setGroups(prevGroups => {
      return prevGroups.map(group => ({
        ...group,
        staffIds: group.staffIds.filter(staffId => staffId !== item.id)
      }));
    });
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
        {/* タイトル */}
        <div className="scheduler-header">
          <h3 className="scheduler-title">
            <Zap className="scheduler-icon" />
            高度なスケジュール設定
          </h3>
        </div>

        {/* 期間設定 */}
        <div className="date-range-section">
          <h4>期間設定</h4>
          
          <div className="date-range-mode">
            <label>
              <input
                type="radio"
                value="custom"
                checked={dateRangeMode === 'custom'}
                onChange={(e) => setDateRangeMode(e.target.value as 'custom')}
              />
              カスタム期間
            </label>
            <label>
              <input
                type="radio"
                value="monthly"
                checked={dateRangeMode === 'monthly'}
                onChange={(e) => setDateRangeMode(e.target.value as 'monthly')}
              />
              月単位
            </label>
          </div>

          {dateRangeMode === 'custom' ? (
            <div className="custom-date-range">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
              />
              <span>から</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
              />
              <span>まで</span>
            </div>
          ) : (
            <div className="monthly-date-range">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-input"
              />
            </div>
          )}
        </div>

        {/* スケジュール生成ボタン */}
        <div className="schedule-generation">
          <button
            onClick={generateOptimalSchedule}
            className="generate-button"
            disabled={!startDate || !endDate}
          >
            <Zap size={16} />
            最適スケジュール生成
          </button>
        </div>

        {/* スタッフ管理セクション */}
        <div className="staff-management-section">
          <h4>
            <Users size={20} />
            スタッフ管理
          </h4>

          {/* グループ設定 */}
          <div className="group-settings">
            <button
              onClick={() => setShowGroupSettings(!showGroupSettings)}
              className="group-settings-toggle"
            >
              <Settings size={16} />
              グループ設定
            </button>

            {showGroupSettings && (
              <div className="group-creation">
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
            )}
          </div>

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
