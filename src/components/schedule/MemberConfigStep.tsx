import { Users, Calendar } from 'lucide-react';
import React from 'react';
import { Staff, WorkType, MemberWorkConfig } from '../../types';
import './MemberConfigStep.css';

interface MemberConfigStepProps {
    staffMembers: Staff[];
    workTypes: WorkType[];
    memberWorkConfig: MemberWorkConfig;
    onMemberWorkConfigChange: (config: MemberWorkConfig) => void;
    isCompleted: boolean;
}

const MemberConfigStep: React.FC<MemberConfigStepProps> = ({
    staffMembers,
    workTypes,
    memberWorkConfig,
    onMemberWorkConfigChange,
    isCompleted
}) => {

    // メンバーの勤務設定を更新
    const updateMemberWorkConfig = (
        memberId: number, 
        workTypeId: string, 
        field: 'minDays' | 'maxDays', 
        value: number
    ) => {
        const clampedValue = Math.max(0, Math.min(31, value));
        
        const newConfig = { ...memberWorkConfig };
        
        // メンバーの設定が存在しない場合は初期化
        if (!newConfig[memberId]) {
            newConfig[memberId] = {};
        }
        
        // 勤務形態の設定が存在しない場合は初期化
        if (!newConfig[memberId][workTypeId]) {
            newConfig[memberId][workTypeId] = { minDays: 0, maxDays: 10 };
        }
        
        // 値を更新
        const currentConfig = newConfig[memberId][workTypeId];
        const updatedConfig = { ...currentConfig, [field]: clampedValue };
        
        // min/maxの整合性チェック
        if (field === 'minDays' && clampedValue > updatedConfig.maxDays) {
            updatedConfig.maxDays = clampedValue;
        } else if (field === 'maxDays' && clampedValue < updatedConfig.minDays) {
            updatedConfig.minDays = clampedValue;
        }
        
        newConfig[memberId][workTypeId] = updatedConfig;
        onMemberWorkConfigChange(newConfig);
    };

    // メンバーの勤務設定を取得（デフォルト値付き）
    const getMemberWorkConfig = (memberId: number, workTypeId: string) => {
        return memberWorkConfig[memberId]?.[workTypeId] || { minDays: 0, maxDays: 10 };
    };

    // 全体設定の一括適用
    const applyToAllMembers = (workTypeId: string, minDays: number, maxDays: number) => {
        const newConfig = { ...memberWorkConfig };
        
        staffMembers.forEach(member => {
            if (!newConfig[member.id]) {
                newConfig[member.id] = {};
            }
            newConfig[member.id][workTypeId] = { minDays, maxDays };
        });
        
        onMemberWorkConfigChange(newConfig);
    };

    return (
        <div className="member-config-section step-section">
            <div className="member-config-header">
                <div className="header-info">
                    <Users size={20} />
                    <div>
                        <h4>メンバー別勤務設定</h4>
                        <p>各メンバーが各勤務形態で働く日数の最小・最大値を設定します</p>
                    </div>
                </div>
            </div>

            {workTypes.length === 0 ? (
                <div className="no-worktypes-message">
                    <Calendar size={48} />
                    <h5>勤務形態が設定されていません</h5>
                    <p>ステップ2で勤務形態を設定してください</p>
                </div>
            ) : (
                <div className="member-config-grid-container">
                    {/* 一括設定セクション */}
                    <div className="bulk-settings-section">
                        <h6>一括設定</h6>
                        <div className="bulk-settings-grid">
                            {workTypes.map(workType => (
                                <div key={workType.id} className="bulk-setting-item">
                                    <div className="worktype-header">
                                        <div 
                                            className="worktype-color-indicator"
                                            style={{ backgroundColor: workType.color }}
                                        ></div>
                                        <span className="worktype-name">{workType.name}</span>
                                    </div>
                                    <div className="bulk-inputs">
                                        <input
                                            type="number"
                                            min="0"
                                            max="31"
                                            placeholder="最小"
                                            className="bulk-input"
                                            onChange={(e) => {
                                                const minValue = parseInt(e.target.value) || 0;
                                                applyToAllMembers(workType.id, minValue, Math.max(minValue, 10));
                                            }}
                                        />
                                        <span>〜</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="31"
                                            placeholder="最大"
                                            className="bulk-input"
                                            onChange={(e) => {
                                                const maxValue = parseInt(e.target.value) || 10;
                                                applyToAllMembers(workType.id, 0, maxValue);
                                            }}
                                        />
                                        <span>日</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* メインの設定グリッド */}
                    <div 
                        className="member-config-grid"
                        style={{ '--worktype-count': workTypes.length } as React.CSSProperties}
                    >
                        {/* ヘッダー行 */}
                        <div className="member-header-cell">メンバー</div>
                        {workTypes.map(workType => (
                            <div key={workType.id} className="worktype-header-cell">
                                <div 
                                    className="worktype-color-indicator"
                                    style={{ backgroundColor: workType.color }}
                                ></div>
                                <div className="worktype-info">
                                    <span className="worktype-name">{workType.name}</span>
                                    <span className="worktype-time">
                                        {workType.startTime} - {workType.endTime}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* メンバー行 */}
                        {staffMembers.map(member => (
                            <React.Fragment key={member.id}>
                                <div className="member-cell">
                                    <div className="member-info">
                                        <span className="member-name">{member.name}</span>
                                        <span className="member-role">{member.role}</span>
                                    </div>
                                </div>
                                {workTypes.map(workType => {
                                    const config = getMemberWorkConfig(member.id, workType.id);
                                    return (
                                        <div key={workType.id} className="config-cell">
                                            <div className="day-inputs">
                                                <div className="input-group">
                                                    <label>最小</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="31"
                                                        value={config.minDays}
                                                        onChange={(e) => updateMemberWorkConfig(
                                                            member.id,
                                                            workType.id,
                                                            'minDays',
                                                            parseInt(e.target.value) || 0
                                                        )}
                                                        className="day-input"
                                                    />
                                                </div>
                                                <span className="separator">〜</span>
                                                <div className="input-group">
                                                    <label>最大</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="31"
                                                        value={config.maxDays}
                                                        onChange={(e) => updateMemberWorkConfig(
                                                            member.id,
                                                            workType.id,
                                                            'maxDays',
                                                            parseInt(e.target.value) || 0
                                                        )}
                                                        className="day-input"
                                                    />
                                                </div>
                                                <span className="unit">日</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            <div className="step-completion">
                {isCompleted ? (
                    <div className="completion-status completed">
                        ✓ メンバー別勤務設定が完了しました
                    </div>
                ) : (
                    <div className="completion-status incomplete">
                        各メンバーの勤務設定を確認してください
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberConfigStep;
