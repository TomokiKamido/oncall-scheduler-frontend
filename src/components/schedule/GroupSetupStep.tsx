import { Settings, Trash2 } from 'lucide-react';
import React from 'react';
import { Group, Staff } from '../../types';

interface GroupSetupStepProps {
    staffMembers: Staff[];
    groups: Group[];
    selectedGroup: string;
    showGroupSettings: boolean;
    newGroupName: string;
    newGroupColor: string;
    onGroupsChange: (groups: Group[]) => void;
    onSelectedGroupChange: (groupId: string) => void;
    onShowGroupSettingsChange: (show: boolean) => void;
    onNewGroupNameChange: (name: string) => void;
    onNewGroupColorChange: (color: string) => void;
    isCompleted: boolean;
}

const GroupSetupStep: React.FC<GroupSetupStepProps> = ({
    staffMembers,
    groups,
    selectedGroup,
    showGroupSettings,
    newGroupName,
    newGroupColor,
    onGroupsChange,
    onSelectedGroupChange,
    onShowGroupSettingsChange,
    onNewGroupNameChange,
    onNewGroupColorChange,
    isCompleted
}) => {
    // グループ作成関数
    const addGroup = () => {
        if (newGroupName.trim()) {
            const newGroup: Group = {
                id: `group-${Date.now()}`,
                name: newGroupName.trim(),
                color: newGroupColor,
                staffIds: [],
                isActive: true
            };
            onGroupsChange([...groups, newGroup]);
            onNewGroupNameChange('');
            onNewGroupColorChange('#3b82f6');
            // 新しく作成したグループを自動選択
            onSelectedGroupChange(newGroup.id);
        }
    };

    // ドラッグ&ドロップ関数
    const handleDragStart = (e: React.DragEvent, staff: Staff) => {
        e.dataTransfer.setData('application/json', JSON.stringify(staff));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // ドロップ: 未割り当てからグループに追加（未使用のため削除）
    // const handleDropToGroup = (e: React.DragEvent) => {
    //     e.preventDefault();
    //     const data = e.dataTransfer.getData('application/json');
    //     if (data && selectedGroup) {
    //         const staff: Staff = JSON.parse(data);
    //         addStaffToGroup(selectedGroup, staff.id);
    //     }
    // };

    // ドロップ: 特定のグループに追加
    const handleDropToSpecificGroup = (e: React.DragEvent, groupId: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const data = e.dataTransfer.getData('application/json');
        if (data) {
            const staff: Staff = JSON.parse(data);
            // 既に他のグループに所属している場合は移動
            const currentGroup = groups.find(g => g.staffIds.includes(staff.id));
            if (currentGroup && currentGroup.id !== groupId) {
                removeStaffFromGroup(currentGroup.id, staff.id);
            }
            // 新しいグループに追加（重複チェック）
            if (!groups.find(g => g.id === groupId)?.staffIds.includes(staff.id)) {
                addStaffToGroup(groupId, staff.id);
            }
        }
    };

    // リストクリックでグループに追加
    const handleMemberClick = (staff: Staff) => {
        if (selectedGroup) addStaffToGroup(selectedGroup, staff.id);
    };

    // スタッフをグループに追加
    const addStaffToGroup = (groupId: string, staffId: number) => {
        onGroupsChange(groups.map(g =>
            g.id === groupId ? { ...g, staffIds: [...g.staffIds, staffId] } : g
        ));
    };

    // スタッフをグループから削除
    const removeStaffFromGroup = (groupId: string, staffId: number) => {
        onGroupsChange(groups.map(g =>
            g.id === groupId ? { ...g, staffIds: g.staffIds.filter(id => id !== staffId) } : g
        ));
    };

    // グループ削除関数
    const deleteGroup = (groupId: string) => {
        onGroupsChange(groups.filter(group => group.id !== groupId));
        if (selectedGroup === groupId) {
            onSelectedGroupChange('all');
        }
    };

    return (
        <div className="group-setup-section step-section">
            {/* グループ追加ボタン */}
            <div className="group-management-header">
                <button
                    className="group-management-button"
                    onClick={() => onShowGroupSettingsChange(!showGroupSettings)}
                >
                    <Settings size={16} />
                    グループ追加
                </button>
            </div>

            {/* グループ管理UI */}
            {showGroupSettings && (
                <>
                <div className="group-creation-grid">
                    {/* 左：グループ名入力＆追加 */}
                    <div className="group-input-section bordered-box">
                        <label className="input-label">グループ名を入力してください</label>
                        <div className="group-input-form">
                            <input
                                type="text"
                                placeholder="グループ名"
                                value={newGroupName}
                                onChange={(e) => onNewGroupNameChange(e.target.value)}
                                className="group-name-input"
                            />
                            <input
                                type="color"
                                value={newGroupColor}
                                onChange={(e) => onNewGroupColorChange(e.target.value)}
                                className="group-color-input"
                                title="グループカラー"
                            />
                        </div>
                        <button
                            onClick={addGroup}
                            className="add-group-action-button"
                            disabled={!newGroupName.trim()}
                            title="グループを追加"
                        >
                            + 追加
                        </button>
                    </div>

                    {/* 右：作成済みグループ一覧 */}
                    <div className="group-list-section bordered-box">
                        <label className="section-label">作成済みグループ</label>
                        {groups.length > 0 ? (
                            <div className="created-groups-list">
                                {groups.map(group => (
                                    <div
                                        key={group.id}
                                        className={`group-item-container ${selectedGroup === group.id ? 'selected' : ''}`}
                                    >
                                        <div
                                            className="group-tag"
                                            onClick={() => onSelectedGroupChange(group.id)}
                                        >
                                            <span
                                                className="group-color-indicator"
                                                style={{ backgroundColor: group.color }}
                                            ></span>
                                            <span className="group-name">{group.name}</span>
                                            <span className="group-count">({group.staffIds.length}人)</span>
                                            <button
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (group.staffIds.length > 0) {
                                                        group.staffIds.forEach(staffId => 
                                                            removeStaffFromGroup(group.id, staffId)
                                                        );
                                                    }
                                                    deleteGroup(group.id); 
                                                }}
                                                className="delete-group-button"
                                                title="グループを削除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        
                                        {/* グループメンバー表示エリア */}
                                        <div
                                            className="group-members-dropzone"
                                            onDrop={(e) => handleDropToSpecificGroup(e, group.id)}
                                            onDragOver={handleDragOver}
                                            onDragEnter={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.add('drag-over');
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.classList.remove('drag-over');
                                            }}
                                        >
                                            {group.staffIds.length > 0 ? (
                                                <div className="group-members-list">
                                                    {group.staffIds.map(staffId => {
                                                        const staff = staffMembers.find(s => s.id === staffId);
                                                        return staff ? (
                                                            <div key={staff.id} className="group-member-item">
                                                                <span className="member-name">{staff.name}</span>
                                                                <button
                                                                    onClick={() => removeStaffFromGroup(group.id, staff.id)}
                                                                    className="remove-member-button"
                                                                    title="グループから削除"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="empty-group-placeholder">
                                                    メンバーをここにドロップ
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">グループがありません</div>
                        )}
                    </div>
                </div>
                {/* 未割り当てメンバー */}
                <div className="unassigned-members-section bordered-box">
                    <label className="section-label">未割当て可能メンバー</label>
                    <div className="unassigned-members-container">
                        {staffMembers.filter(s =>
                            !groups.some(g => g.staffIds.includes(s.id))
                        ).length > 0 ? (
                            staffMembers.filter(s =>
                                !groups.some(g => g.staffIds.includes(s.id))
                            ).map(staff => (
                                <div
                                    key={staff.id}
                                    className="unassigned-member-item"
                                    draggable
                                    onDragStart={e => handleDragStart(e, staff)}
                                    onClick={() => handleMemberClick(staff)}
                                    title="クリックまたはドラッグしてグループに追加"
                                >
                                    <span className="member-name">{staff.name}</span>
                                    <span className="member-role">{staff.role}</span>
                                </div>
                            ))
                        ) : (
                            <div className="no-unassigned-members">
                                すべてのメンバーがグループに割り当て済みです
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}

            <div className="step-completion">
                {isCompleted ? (
                    <div className="completion-status completed">
                        ✓ グループ設定が完了しました
                    </div>
                ) : (
                    <div className="completion-status incomplete">
                        少なくとも1つのグループを作成してください
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupSetupStep;
