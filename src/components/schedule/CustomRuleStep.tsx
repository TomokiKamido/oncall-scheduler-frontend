import { Plus, X, Calendar, Shield, AlertTriangle, Users, Edit2, GripVertical } from 'lucide-react';
import React from 'react';
import { CustomRule, Group, Staff, WorkType, StaffSkill, RuleType, DragStaff } from '../../types';
import './CustomRuleStep.css';

interface CustomRuleStepProps {
    staffMembers: Staff[];
    groups: Group[];
    workTypes: WorkType[];
    customRules: CustomRule[];
    onCustomRulesChange: (rules: CustomRule[]) => void;
    onGroupsChange?: (groups: Group[]) => void;  // グループ変更のハンドラー
    availableSkills?: StaffSkill[];  // 利用可能なスキル一覧
}

const CustomRuleStep: React.FC<CustomRuleStepProps> = ({
    staffMembers,
    groups,
    workTypes,
    customRules,
    onCustomRulesChange,
    onGroupsChange,
    availableSkills = []
}) => {

    // 選択されたグループの状態管理
    const [selectedGroupId, setSelectedGroupId] = React.useState<string>(groups[0]?.id || '');
    const [selectedRuleType, setSelectedRuleType] = React.useState<RuleType>('work_type_count');

    // グループ管理の状態
    const [isGroupManagementMode, setIsGroupManagementMode] = React.useState<boolean>(false);
    const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
    const [newGroupName, setNewGroupName] = React.useState<string>('');
    const [draggedStaff, setDraggedStaff] = React.useState<DragStaff | null>(null);

    // デフォルトスキル一覧（availableSkillsが空の場合）
    const defaultSkills: StaffSkill[] = [
        { id: 'leadership', name: 'リーダーシップ', category: 'leadership' },
        { id: 'icu_certified', name: 'ICU認定', category: 'certification' },
        { id: 'emergency_care', name: '救急看護', category: 'technical' },
        { id: 'senior_experience', name: '上級者経験', category: 'experience' },
        { id: 'new_grad_support', name: '新人指導', category: 'leadership' },
    ];

    const skills = availableSkills.length > 0 ? availableSkills : defaultSkills;

    // グループが変更された時の初期選択更新
    React.useEffect(() => {
        if (groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId]);

    // 新しいルールを追加する汎用関数
    const addCustomRule = (ruleType: RuleType) => {
        if (workTypes.length === 0) {
            alert('勤務形態が設定されていません。先にステップ2で勤務形態を設定してください。');
            return;
        }

        const groupRulesCount = customRules.filter(rule => rule.groupId === selectedGroupId && rule.settings.type === ruleType).length;
        const groupName = groups.find(g => g.id === selectedGroupId)?.name || 'グループ';

        let newRule: CustomRule;

        switch (ruleType) {
            case 'work_type_count':
                newRule = {
                    id: `work_type_count_${Date.now()}`,
                    name: `${groupName} - 勤務帯別日数制限 ${groupRulesCount + 1}`,
                    isEnabled: true,
                    priority: 5,
                    groupId: selectedGroupId,
                    settings: {
                        type: 'work_type_count',
                        workTypeCountLimits: workTypes.map(workType => ({
                            workTypeId: workType.id,
                            min: 0,
                            max: 10
                        })),
                        period: 'month'
                    }
                };
                break;

            case 'skill_requirement':
                newRule = {
                    id: `skill_requirement_${Date.now()}`,
                    name: `${groupName} - スキル要件 ${groupRulesCount + 1}`,
                    isEnabled: true,
                    priority: 8,
                    groupId: selectedGroupId,
                    settings: {
                        type: 'skill_requirement',
                        requirements: [{
                            skillId: skills[0]?.id || 'leadership',
                            requiredCount: 1,
                            requiredLevel: 3,
                            workTypeIds: workTypes.map(wt => wt.id)
                        }]
                    }
                };
                break;

            case 'staff_conflict':
                newRule = {
                    id: `staff_conflict_${Date.now()}`,
                    name: `${groupName} - スタッフ間制約 ${groupRulesCount + 1}`,
                    isEnabled: true,
                    priority: 7,
                    groupId: selectedGroupId,
                    settings: {
                        type: 'staff_conflict',
                        conflicts: [{
                            staffIds: [],
                            workTypeIds: workTypes.map(wt => wt.id),
                            separation: 0
                        }]
                    }
                };
                break;

            default:
                alert('このルール種別はまだ実装されていません。');
                return;
        }

        onCustomRulesChange([...customRules, newRule]);
    };

    // 新しい勤務帯別日数制限ルールを追加
    const addWorkTypeCountRule = () => {
        addCustomRule('work_type_count');
    };

    // 新しいスキル要件ルールを追加
    const addSkillRequirementRule = () => {
        addCustomRule('skill_requirement');
    };

    // 新しいスタッフ間制約ルールを追加
    const addStaffConflictRule = () => {
        addCustomRule('staff_conflict');
    };

    // グループ管理機能
    const unassignedStaff = staffMembers.filter(staff => 
        !groups.filter(group => group.id !== 'group_all').some(group => group.staffIds.includes(staff.id))
    );

    // 新しいグループを追加
    const addNewGroup = () => {
        if (!onGroupsChange || !newGroupName.trim()) return;

        const newGroup: Group = {
            id: `group_${Date.now()}`,
            name: newGroupName.trim(),
            staffIds: [],
            isActive: true,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
        };

        onGroupsChange([...groups, newGroup]);
        setNewGroupName('');
    };

    // グループ名を更新
    const updateGroupName = (groupId: string, newName: string) => {
        if (!onGroupsChange || !newName.trim()) return;

        const updatedGroups = groups.map(group =>
            group.id === groupId ? { ...group, name: newName.trim() } : group
        );
        onGroupsChange(updatedGroups);
        setEditingGroupId(null);
    };

    // グループを削除
    const deleteGroup = (groupId: string) => {
        if (!onGroupsChange) return;

        // 「全スタッフ」グループは削除不可
        if (groupId === 'group_all') return;

        const groupToDelete = groups.find(g => g.id === groupId);
        if (!groupToDelete) return;

        if (groupToDelete.staffIds.length > 0) {
            const confirmDelete = window.confirm('このグループにはメンバーが含まれています。削除してもよろしいですか？メンバーは未割り当てになります。');
            if (!confirmDelete) return;
        }

        const updatedGroups = groups.filter(group => group.id !== groupId);
        onGroupsChange(updatedGroups);

        // 削除されたグループが選択されていた場合、別のグループを選択
        if (selectedGroupId === groupId && updatedGroups.length > 0) {
            setSelectedGroupId(updatedGroups[0].id);
        }
    };

    // ドラッグ&ドロップ処理
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, staff: Staff) => {
        // 全てのスタッフがドラッグ可能（「全スタッフ」グループの制限なし）        
        const dragStaff: DragStaff = {
            id: staff.id,
            name: staff.name,
            role: staff.role
        };
        setDraggedStaff(dragStaff);
        e.dataTransfer.setData('text/plain', JSON.stringify(dragStaff));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetGroupId: string | null) => {
        e.preventDefault();
        if (!onGroupsChange || !draggedStaff) return;

        // 「全スタッフ」グループへのドロップは無効化
        if (targetGroupId === 'group_all') return;

        // 「全スタッフ」グループ以外のグループから元のグループを検索
        const editableGroups = groups.filter(group => group.id !== 'group_all');
        const sourceGroupId = editableGroups.find(group => 
            group.staffIds.includes(draggedStaff.id)
        )?.id || null;

        // 同じグループにドロップした場合は何もしない
        if (sourceGroupId === targetGroupId) return;

        let updatedGroups = [...groups];

        // 元のグループからスタッフを削除（「全スタッフ」グループは除く）
        if (sourceGroupId) {
            updatedGroups = updatedGroups.map(group =>
                group.id === sourceGroupId
                    ? { ...group, staffIds: group.staffIds.filter(id => id !== draggedStaff.id) }
                    : group
            );
        }

        // 新しいグループにスタッフを追加
        if (targetGroupId) {
            updatedGroups = updatedGroups.map(group =>
                group.id === targetGroupId
                    ? { ...group, staffIds: [...group.staffIds, draggedStaff.id] }
                    : group
            );
        }

        // 「全スタッフ」グループは常に全スタッフを含むよう更新
        const allStaffIds = staffMembers.map(staff => staff.id);
        updatedGroups = updatedGroups.map(group =>
            group.id === 'group_all'
                ? { ...group, staffIds: allStaffIds }
                : group
        );

        onGroupsChange(updatedGroups);
        setDraggedStaff(null);
    };

    const handleDragEnd = () => {
        setDraggedStaff(null);
    };

    // スタッフを個別にグループから削除（未割り当てに戻す）
    const removeStaffFromGroup = (groupId: string, staffId: number) => {
        if (!onGroupsChange) return;

        // 「全スタッフ」グループからは削除しない
        if (groupId === 'group_all') return;

        // 指定されたグループからスタッフを削除し、「全スタッフ」グループは更新
        const allStaffIds = staffMembers.map(staff => staff.id);
        const updatedGroups = groups.map(group =>
            group.id === groupId
                ? { ...group, staffIds: group.staffIds.filter(id => id !== staffId) }
                : group.id === 'group_all'
                ? { ...group, staffIds: allStaffIds }
                : group
        );
        onGroupsChange(updatedGroups);
    };

    // グループ全体をリセット（全メンバーを未割り当てに戻す）
    const resetGroup = (groupId: string) => {
        if (!onGroupsChange) return;

        // 「全スタッフ」グループはリセット不可
        if (groupId === 'group_all') return;

        const group = groups.find(g => g.id === groupId);
        if (!group || group.staffIds.length === 0) return;

        const confirmReset = window.confirm(`「${group.name}」の全メンバー（${group.staffIds.length}人）を未割り当てに戻しますか？`);
        if (!confirmReset) return;

        // グループをリセットし、「全スタッフ」グループも更新
        const allStaffIds = staffMembers.map(staff => staff.id);
        const updatedGroups = groups.map(g =>
            g.id === groupId
                ? { ...g, staffIds: [] }
                : g.id === 'group_all'
                ? { ...g, staffIds: allStaffIds }
                : g
        );
        onGroupsChange(updatedGroups);
    };

    // 全グループをリセット（全メンバーを未割り当てに戻す）
    const resetAllGroups = () => {
        if (!onGroupsChange) return;

        // 「全スタッフ」グループを除いたグループでカウント
        const editableGroups = groups.filter(group => group.id !== 'group_all');
        const totalAssignedStaff = editableGroups.reduce((total, group) => total + group.staffIds.length, 0);
        if (totalAssignedStaff === 0) {
            alert('割り当て済みのスタッフがいません。');
            return;
        }

        const confirmReset = window.confirm(`全グループの全メンバー（${totalAssignedStaff}人）を未割り当てに戻しますか？この操作は元に戻せません。`);
        if (!confirmReset) return;

        // 「全スタッフ」グループは全スタッフを保持、他のグループはリセット
        const allStaffIds = staffMembers.map(staff => staff.id);
        const updatedGroups = groups.map(group => 
            group.id === 'group_all' 
                ? { ...group, staffIds: allStaffIds }
                : { ...group, staffIds: [] }
        );
        onGroupsChange(updatedGroups);
    };

    // ルールを削除
    const removeCustomRule = (ruleId: string) => {
        onCustomRulesChange(customRules.filter(rule => rule.id !== ruleId));
    };

    // ルールの設定を更新
    const updateRuleSettings = (ruleId: string, settings: any) => {
        onCustomRulesChange(
            customRules.map(rule =>
                rule.id === ruleId
                    ? { ...rule, settings: { ...rule.settings, ...settings } }
                    : rule
            )
        );
    };

    // ルールの優先度を更新
    const updateRulePriority = (ruleId: string, priority: number) => {
        onCustomRulesChange(
            customRules.map(rule =>
                rule.id === ruleId
                    ? { ...rule, priority: Math.max(1, Math.min(10, priority)) }
                    : rule
            )
        );
    };

    // ルール名の更新
    const updateRuleName = (ruleId: string, newName: string) => {
        onCustomRulesChange(
            customRules.map(rule =>
                rule.id === ruleId
                    ? { ...rule, name: newName }
                    : rule
            )
        );
    };

    // 勤務形態別日数制限の更新（バリデーション付き）
    const updateWorkTypeCountLimit = (ruleId: string, workTypeId: string, field: 'min' | 'max', value: number) => {
        const rule = customRules.find(r => r.id === ruleId);
        if (!rule || rule.settings.type !== 'work_type_count') return;

        const workTypeSettings = rule.settings as any; // 型の問題を回避

        // 値の範囲チェック
        const clampedValue = Math.max(0, Math.min(31, value));

        const updatedLimits = workTypeSettings.workTypeCountLimits.map((limit: any) => {
            if (limit.workTypeId === workTypeId) {
                const newLimit = { ...limit, [field]: clampedValue };
                
                // min/maxの整合性チェック
                if (field === 'min' && clampedValue > limit.max) {
                    newLimit.max = clampedValue;
                } else if (field === 'max' && clampedValue < limit.min) {
                    newLimit.min = clampedValue;
                }
                
                return newLimit;
            }
            return limit;
        });

        updateRuleSettings(ruleId, { workTypeCountLimits: updatedLimits });
    };

    // ルールのアクティブ状態を切り替え
    const toggleRuleActive = (ruleId: string) => {
        onCustomRulesChange(
            customRules.map(rule =>
                rule.id === ruleId
                    ? { ...rule, isEnabled: !rule.isEnabled }
                    : rule
            )
        );
    };

    // 勤務帯別日数設定のレンダリング
    const renderWorkTypeCountSettings = (rule: CustomRule) => {
        if (rule.settings.type !== 'work_type_count') return null;

        const workTypeSettings = rule.settings as any; // 型の問題を回避

        return (
            <div className="worktype-count-settings">
                <h6>勤務形態別日数制限</h6>
                <div className="worktype-limits-grid">
                    {workTypeSettings.workTypeCountLimits.map((limit: any) => {
                        const workType = workTypes.find(wt => wt.id === limit.workTypeId);
                        if (!workType) return null;

                        return (
                            <div key={limit.workTypeId} className="worktype-limit-item">
                                <div className="worktype-info">
                                    <div 
                                        className="worktype-color" 
                                        style={{ backgroundColor: workType.color }}
                                    ></div>
                                    <span className="worktype-name">{workType.name}</span>
                                </div>
                                <div className="count-inputs">
                                    <div className="count-input-group">
                                        <label>最小</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="31"
                                            value={limit.min}
                                            onChange={(e) => updateWorkTypeCountLimit(
                                                rule.id, 
                                                limit.workTypeId, 
                                                'min', 
                                                parseInt(e.target.value) || 0
                                            )}
                                            className="form-input-small"
                                        />
                                        <span>回</span>
                                    </div>
                                    <div className="count-input-group">
                                        <label>最大</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="31"
                                            value={limit.max}
                                            onChange={(e) => updateWorkTypeCountLimit(
                                                rule.id, 
                                                limit.workTypeId, 
                                                'max', 
                                                parseInt(e.target.value) || 0
                                            )}
                                            className="form-input-small"
                                        />
                                        <span>回</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="worktype-count-note">
                    <p>※ 最小回数は必須勤務回数、最大回数は上限勤務回数を設定します</p>
                    <p>※ 0回に設定すると制限なしとなります</p>
                </div>
            </div>
        );
    };

    // スキル要件設定のレンダリング
    const renderSkillRequirementSettings = (rule: CustomRule) => {
        if (rule.settings.type !== 'skill_requirement') return null;

        const skillSettings = rule.settings as any; // 型の問題を回避

        const addSkillRequirement = () => {
            const newRequirement = {
                skillId: skills[0]?.id || 'leadership',
                requiredCount: 1,
                requiredLevel: 3,
                workTypeIds: workTypes.map(wt => wt.id)
            };
            updateRuleSettings(rule.id, { requirements: [...skillSettings.requirements, newRequirement] });
        };

        const updateSkillRequirement = (index: number, field: string, value: any) => {
            const updatedRequirements = skillSettings.requirements.map((req: any, i: number) => {
                if (i === index) {
                    return { ...req, [field]: value };
                }
                return req;
            });
            updateRuleSettings(rule.id, { requirements: updatedRequirements });
        };

        const removeSkillRequirement = (index: number) => {
            const updatedRequirements = skillSettings.requirements.filter((_: any, i: number) => i !== index);
            updateRuleSettings(rule.id, { requirements: updatedRequirements });
        };

        return (
            <div className="skill-requirement-settings">
                <h6>スキル要件</h6>
                {skillSettings.requirements.map((req: any, index: number) => (
                    <div key={index} className="skill-requirement-item">
                        <select
                            value={req.skillId}
                            onChange={(e) => updateSkillRequirement(index, 'skillId', e.target.value)}
                            className="form-input-small"
                        >
                            {skills.map(skill => (
                                <option key={skill.id} value={skill.id}>{skill.name}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min="1"
                            value={req.requiredCount}
                            onChange={(e) => updateSkillRequirement(index, 'requiredCount', parseInt(e.target.value) || 1)}
                            className="form-input-small"
                        />
                        <span>人以上</span>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={req.requiredLevel}
                            onChange={(e) => updateSkillRequirement(index, 'requiredLevel', parseInt(e.target.value) || 1)}
                            className="form-input-small"
                        />
                        <span>レベル</span>
                        <button onClick={() => removeSkillRequirement(index)} className="remove-item-btn">
                            <X size={16} />
                        </button>
                    </div>
                ))}
                <button onClick={addSkillRequirement} className="add-item-btn">
                    <Plus size={16} /> スキル要件を追加
                </button>
            </div>
        );
    };

    // スタッフ間制約設定のレンダリング
    const renderStaffConflictSettings = (rule: CustomRule) => {
        if (rule.settings.type !== 'staff_conflict') return null;

        const conflictSettings = rule.settings as any; // 型の問題を回避

        const addConflict = () => {
            const newConflict = {
                staffIds: [],
                workTypeIds: workTypes.map(wt => wt.id),
                separation: 0
            };
            updateRuleSettings(rule.id, { conflicts: [...conflictSettings.conflicts, newConflict] });
        };

        const updateConflict = (index: number, field: string, value: any) => {
            const updatedConflicts = conflictSettings.conflicts.map((c: any, i: number) => {
                if (i === index) {
                    return { ...c, [field]: value };
                }
                return c;
            });
            updateRuleSettings(rule.id, { conflicts: updatedConflicts });
        };

        const removeConflict = (index: number) => {
            const updatedConflicts = conflictSettings.conflicts.filter((_: any, i: number) => i !== index);
            updateRuleSettings(rule.id, { conflicts: updatedConflicts });
        };

        return (
            <div className="staff-conflict-settings">
                <h6>スタッフ間の制約</h6>
                {conflictSettings.conflicts.map((conflict: any, index: number) => (
                    <div key={index} className="staff-conflict-item">
                        <select
                            multiple
                            value={conflict.staffIds.map((id: number) => String(id))}
                            onChange={(e) => {
                                const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                                updateConflict(index, 'staffIds', selectedIds);
                            }}
                            className="form-input-small"
                            style={{ height: '100px' }}
                        >
                            {staffMembers.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.name}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min="0"
                            value={conflict.separation}
                            onChange={(e) => updateConflict(index, 'separation', parseInt(e.target.value) || 0)}
                            className="form-input-small"
                            placeholder="分離日数"
                        />
                        <span>日分離</span>
                        <button onClick={() => removeConflict(index)} className="remove-item-btn">
                            <X size={16} />
                        </button>
                    </div>
                ))}
                <button onClick={addConflict} className="add-item-btn">
                    <Plus size={16} /> 制約を追加
                </button>
            </div>
        );
    };


    const renderRuleSettings = (rule: CustomRule) => {
        switch (rule.settings.type) {
            case 'work_type_count':
                return renderWorkTypeCountSettings(rule);
            case 'skill_requirement':
                return renderSkillRequirementSettings(rule);
            case 'staff_conflict':
                return renderStaffConflictSettings(rule);
            default:
                return <p>未対応のルール種別です。</p>;
        }
    };

    // 現在選択されているグループに紐づくルールのみフィルタリング
    const filteredRules = customRules.filter(rule => rule.groupId === selectedGroupId);

    // グループ管理UIのレンダリング
    const renderGroupManagement = () => {
        return (
            <div className="group-management-section">
                <div className="group-management-header">
                    <h5>
                        <Users size={18} />
                        グループ管理
                    </h5>
                    <div className="header-actions">
                        {isGroupManagementMode && (
                            <button
                                className="reset-all-btn"
                                onClick={resetAllGroups}
                                title="全グループをリセット"
                            >
                                全てリセット
                            </button>
                        )}
                        <button
                            className={`toggle-management-btn ${isGroupManagementMode ? 'active' : ''}`}
                            onClick={() => setIsGroupManagementMode(!isGroupManagementMode)}
                            title={isGroupManagementMode ? 'グループ管理を閉じる' : 'グループ管理を開く'}
                        >
                            {isGroupManagementMode ? '閉じる' : '編集'}
                        </button>
                    </div>
                </div>

                {isGroupManagementMode && (
                    <div className="group-management-content">
                        {/* 未割り当てスタッフ */}
                        <div 
                            className="unassigned-staff-area"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, null)}
                        >
                            <h6>未割り当てスタッフ ({unassignedStaff.length}名)</h6>
                            <div className="staff-grid">
                                {unassignedStaff.length > 0 ? (
                                    unassignedStaff.map(staff => (
                                        <div
                                            key={staff.id}
                                            className="staff-card unassigned"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, staff)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <GripVertical size={12} className="drag-handle" />
                                            <div className="staff-info">
                                                <span className="staff-name">{staff.name}</span>
                                                <span className="staff-role">{staff.role}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-message">すべてのスタッフが割り当て済みです</div>
                                )}
                            </div>
                        </div>

                        {/* グループ一覧 */}
                        <div className="groups-management-list">
                            <h6>グループ一覧</h6>
                            {groups.filter(group => group.id !== 'group_all').map(group => (
                                <div 
                                    key={group.id} 
                                    className="group-management-item"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, group.id)}
                                >
                                    <div className="group-header">
                                        <div className="group-info">
                                            <div 
                                                className="group-color-indicator"
                                                style={{ backgroundColor: group.color }}
                                            />
                                            {editingGroupId === group.id ? (
                                                <input
                                                    type="text"
                                                    value={group.name}
                                                    onChange={(e) => {
                                                        const updatedGroups = groups.map(g =>
                                                            g.id === group.id ? { ...g, name: e.target.value } : g
                                                        );
                                                        onGroupsChange?.(updatedGroups);
                                                    }}
                                                    onBlur={() => setEditingGroupId(null)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            updateGroupName(group.id, group.name);
                                                        } else if (e.key === 'Escape') {
                                                            setEditingGroupId(null);
                                                        }
                                                    }}
                                                    className="group-name-input"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span 
                                                    className="group-name"
                                                    onClick={() => setEditingGroupId(group.id)}
                                                >
                                                    {group.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="group-actions">
                                            <button
                                                className="btn-icon-small btn-reset"
                                                onClick={() => resetGroup(group.id)}
                                                title="グループをリセット"
                                                disabled={group.staffIds.length === 0}
                                            >
                                                リセット
                                            </button>
                                            <button
                                                className="btn-icon-small"
                                                onClick={() => setEditingGroupId(group.id)}
                                                title="グループ名を編集"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className="btn-icon-small btn-danger"
                                                onClick={() => deleteGroup(group.id)}
                                                title="グループを削除"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="group-members">
                                        {group.staffIds.length > 0 ? (
                                            <div className="members-grid">
                                                {group.staffIds.map(staffId => {
                                                    const staff = staffMembers.find(s => s.id === staffId);
                                                    if (!staff) return null;
                                                    return (
                                                        <div
                                                            key={staffId}
                                                            className="staff-card assigned"
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, staff)}
                                                            onDragEnd={handleDragEnd}
                                                        >
                                                            <GripVertical size={10} className="drag-handle" />
                                                            <div className="staff-info">
                                                                <span className="staff-name">{staff.name}</span>
                                                                <span className="staff-role">{staff.role}</span>
                                                            </div>
                                                            <button
                                                                className="remove-btn"
                                                                onClick={() => removeStaffFromGroup(group.id, staffId)}
                                                                title="グループから削除"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="empty-group-message">
                                                メンバーをここにドラッグしてください
                                            </div>
                                        )}
                                    </div>
                                    <div className="group-footer">
                                        <button
                                            className="btn-secondary small"
                                            onClick={() => resetGroup(group.id)}
                                            disabled={group.staffIds.length === 0}
                                        >
                                            全メンバーを未割り当てに戻す
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 新しいグループを追加 */}
                        <div className="add-group-section">
                            <div className="add-group-form">
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="新しいグループ名を入力"
                                    className="new-group-input"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addNewGroup();
                                        }
                                    }}
                                />
                                <button
                                    className="btn-primary"
                                    onClick={addNewGroup}
                                    disabled={!newGroupName.trim()}
                                >
                                    <Plus size={16} />
                                    グループを追加
                                </button>
                            </div>
                        </div>

                        {/* 全グループリセットボタン */}
                        <div className="reset-all-groups">
                            <button
                                className="btn-danger"
                                onClick={resetAllGroups}
                                disabled={groups.length === 0}
                            >
                                全グループをリセット
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // グループメンバーのレンダリング
    const renderGroupMembers = (group: Group) => {
        const members = group.staffIds.slice(0, 3).map(staffId => {
            const staff = staffMembers.find(s => s.id === staffId);
            return staff?.name || '';
        });
        
        if (group.staffIds.length > 3) {
            members.push(`他${group.staffIds.length - 3}名`);
        }
        
        return members.join(', ');
    };

    return (
        <div className="custom-rule-section step-section">
            {/* グループ管理セクション */}
            {renderGroupManagement()}

            <div className="custom-rule-layout">
                {/* 左側: グループ選択 */}
                <div className="groups-selection-panel">
                    <h5>グループ選択</h5>
                    <div className="groups-list">
                        {groups.map(group => (
                            <div
                                key={group.id}
                                className={`group-selection-card ${selectedGroupId === group.id ? 'selected' : ''}`}
                                onClick={() => setSelectedGroupId(group.id)}
                            >
                                <div className="group-header-info">
                                    <h6>{group.name}</h6>
                                    <span className="member-count">
                                        {group.staffIds.length}名
                                    </span>
                                </div>
                                <div className="group-members-preview">
                                    {renderGroupMembers(group)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右側: 選択されたグループのルール */}
                <div className="rules-management-panel">
                    {selectedGroupId ? (
                        <>
                            <h5>{groups.find(g => g.id === selectedGroupId)?.name || ''} のルール設定</h5>
                            
                            {/* ルール追加セクション */}
                            <div className="rule-add-section">
                                <h6>新しいルールを追加</h6>
                                
                                {/* ルール種別選択 */}
                                <div className="rule-type-selection">
                                    <label>ルール種別</label>
                                    <div className="rule-type-buttons">
                                        <button
                                            className={`rule-type-btn ${selectedRuleType === 'work_type_count' ? 'active' : ''}`}
                                            onClick={() => setSelectedRuleType('work_type_count')}
                                        >
                                            <Calendar size={16} />
                                            勤務形態別日数制限
                                        </button>
                                        <button
                                            className={`rule-type-btn ${selectedRuleType === 'skill_requirement' ? 'active' : ''}`}
                                            onClick={() => setSelectedRuleType('skill_requirement')}
                                        >
                                            <Shield size={16} />
                                            スキル要件
                                        </button>
                                        <button
                                            className={`rule-type-btn ${selectedRuleType === 'staff_conflict' ? 'active' : ''}`}
                                            onClick={() => setSelectedRuleType('staff_conflict')}
                                        >
                                            <AlertTriangle size={16} />
                                            スタッフ間制約
                                        </button>
                                    </div>
                                </div>

                                {/* ルール説明 */}
                                <div className="rule-add-description">
                                    {selectedRuleType === 'work_type_count' && (
                                        <p>勤務形態ごとの日数制限を設定します。グループ内のスタッフに適用されます。</p>
                                    )}
                                    {selectedRuleType === 'skill_requirement' && (
                                        <p>特定の勤務形態で必要なスキルを持つスタッフの最低人数を設定します。</p>
                                    )}
                                    {selectedRuleType === 'staff_conflict' && (
                                        <p>特定のスタッフ同士の勤務制約（同勤務禁止など）を設定します。</p>
                                    )}
                                </div>

                                {/* ルール追加ボタン */}
                                <div className="rule-add-buttons">
                                    {selectedRuleType === 'work_type_count' && (
                                        <button
                                            className="add-rule-btn primary"
                                            onClick={addWorkTypeCountRule}
                                            disabled={workTypes.length === 0}
                                        >
                                            <Plus size={16} />
                                            <span>勤務帯別日数制限ルールを追加</span>
                                        </button>
                                    )}
                                    {selectedRuleType === 'skill_requirement' && (
                                        <button
                                            className="add-rule-btn primary"
                                            onClick={addSkillRequirementRule}
                                            disabled={workTypes.length === 0 || skills.length === 0}
                                        >
                                            <Plus size={16} />
                                            <span>スキル要件ルールを追加</span>
                                        </button>
                                    )}
                                    {selectedRuleType === 'staff_conflict' && (
                                        <button
                                            className="add-rule-btn primary"
                                            onClick={addStaffConflictRule}
                                            disabled={workTypes.length === 0 || staffMembers.length < 2}
                                        >
                                            <Plus size={16} />
                                            <span>スタッフ間制約ルールを追加</span>
                                        </button>
                                    )}
                                </div>

                                {/* 警告メッセージ */}
                                {workTypes.length === 0 && (
                                    <p className="warning-message">
                                        ※ 勤務形態が設定されていません。先にステップ2で勤務形態を設定してください。
                                    </p>
                                )}
                                {selectedRuleType === 'staff_conflict' && staffMembers.length < 2 && (
                                    <p className="warning-message">
                                        ※ スタッフ間制約ルールには2人以上のスタッフが必要です。
                                    </p>
                                )}
                            </div>

                            {/* ルール一覧 */}
                            <div className="rules-list">
                                {filteredRules.length === 0 ? (
                                    <p>このグループにはルールが設定されていません。</p>
                                ) : (
                                    filteredRules.map(rule => (
                                        <div key={rule.id} className={`rule-item ${rule.isEnabled ? 'enabled' : 'disabled'}`}>
                                            <div className="rule-header">
                                                <div className="rule-title">
                                                    <input
                                                        type="text"
                                                        value={rule.name}
                                                        onChange={(e) => updateRuleName(rule.id, e.target.value)}
                                                        className="rule-name-input"
                                                    />
                                                    <div className="rule-priority">
                                                        <label>優先度:</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            value={rule.priority}
                                                            onChange={(e) => updateRulePriority(rule.id, parseInt(e.target.value) || 1)}
                                                            className="priority-input"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="rule-actions">
                                                    <button
                                                        className={`btn-icon-small ${rule.isEnabled ? 'btn-enabled' : 'btn-disabled'}`}
                                                        onClick={() => toggleRuleActive(rule.id)}
                                                        title={rule.isEnabled ? 'ルールを無効化' : 'ルールを有効化'}
                                                    >
                                                        {rule.isEnabled ? '有効' : '無効'}
                                                    </button>
                                                    <button
                                                        className="btn-icon-small btn-danger"
                                                        onClick={() => removeCustomRule(rule.id)}
                                                        title="ルールを削除"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="rule-content">
                                                {renderRuleSettings(rule)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <p>グループを選択してください。</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomRuleStep;
