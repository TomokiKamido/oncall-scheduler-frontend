import { Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { WorkType } from '../../types';

interface WorkTypeSetupStepProps {
    workTypes: WorkType[];
    onWorkTypesChange: (workTypes: WorkType[]) => void;
    isCompleted: boolean;
}

const WorkTypeSetupStep: React.FC<WorkTypeSetupStepProps> = ({
    workTypes,
    onWorkTypesChange,
    isCompleted
}) => {
    const [activeTab, setActiveTab] = useState<'weekday' | 'holiday'>('weekday');

    // デフォルト勤務形態
    const defaultWorkTypes: Partial<WorkType>[] = [
        { 
            name: '日勤（日直）', 
            startTime: '08:00', 
            endTime: '17:00', 
            color: '#3b82f6', 
            weekdayMinStaff: 2, 
            weekdayMaxStaff: 5,
            holidayMinStaff: 1,
            holidayMaxStaff: 3
        },
        { 
            name: '深夜（当直）', 
            startTime: '17:00', 
            endTime: '08:00', 
            color: '#8b5cf6', 
            weekdayMinStaff: 1, 
            weekdayMaxStaff: 3,
            holidayMinStaff: 1,
            holidayMaxStaff: 2
        },
        { 
            name: '準夜', 
            startTime: '16:00', 
            endTime: '00:00', 
            color: '#06b6d4', 
            weekdayMinStaff: 1, 
            weekdayMaxStaff: 4,
            holidayMinStaff: 1,
            holidayMaxStaff: 2
        }
    ];

    // デフォルト勤務形態を追加
    const addDefaultWorkType = (defaultType: Partial<WorkType>) => {
        const newWorkType: WorkType = {
            id: `worktype-${Date.now()}`,
            name: defaultType.name || '',
            startTime: defaultType.startTime || '09:00',
            endTime: defaultType.endTime || '18:00',
            color: defaultType.color || '#3b82f6',
            isDefault: true,
            weekdayMinStaff: defaultType.weekdayMinStaff || 1,
            weekdayMaxStaff: defaultType.weekdayMaxStaff || 5,
            holidayMinStaff: defaultType.holidayMinStaff || 1,
            holidayMaxStaff: defaultType.holidayMaxStaff || 3
        };
        onWorkTypesChange([...workTypes, newWorkType]);
    };

    // カスタム勤務形態を追加
    const addCustomWorkType = () => {
        const newWorkType: WorkType = {
            id: `worktype-${Date.now()}`,
            name: '',
            startTime: '09:00',
            endTime: '18:00',
            color: '#6b7280',
            isDefault: false,
            description: '',
            weekdayMinStaff: 1,
            weekdayMaxStaff: 5,
            holidayMinStaff: 1,
            holidayMaxStaff: 3
        };
        onWorkTypesChange([...workTypes, newWorkType]);
    };

    // 勤務形態を削除
    const removeWorkType = (id: string) => {
        onWorkTypesChange(workTypes.filter(wt => wt.id !== id));
    };

    // 勤務形態を更新
    const updateWorkType = (id: string, updates: Partial<WorkType>) => {
        onWorkTypesChange(
            workTypes.map(wt =>
                wt.id === id ? { ...wt, ...updates } : wt
            )
        );
    };

    // 時間の有効性チェック
    const isValidTimeRange = (startTime: string, endTime: string): boolean => {
        if (!startTime || !endTime) return false;
        
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        
        // 翌日にまたがる場合（深夜勤務など）
        if (end < start) {
            return true; // 翌日終了として有効
        }
        
        return end > start;
    };

    return (
        <div className="work-type-setup-section step-section">
            {/* 既存の勤務形態 */}
            {workTypes.length > 0 && (
                <div className="existing-work-types">
                    <h5>設定済み勤務形態</h5>
                    <div className="work-types-list">
                        {workTypes.map(workType => (
                            <div key={workType.id} className="work-type-card">
                                <div className="work-type-header">
                                    <div 
                                        className="work-type-color"
                                        style={{ backgroundColor: workType.color }}
                                    ></div>
                                    <div className="work-type-info">
                                        <input
                                            type="text"
                                            placeholder="勤務形態名"
                                            value={workType.name}
                                            onChange={(e) => updateWorkType(workType.id, { name: e.target.value })}
                                            className="work-type-name-input"
                                        />
                                        {!workType.isDefault && (
                                            <input
                                                type="text"
                                                placeholder="説明（任意）"
                                                value={workType.description || ''}
                                                onChange={(e) => updateWorkType(workType.id, { description: e.target.value })}
                                                className="work-type-description-input"
                                            />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeWorkType(workType.id)}
                                        className="remove-work-type-btn"
                                        title="勤務形態を削除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="work-type-settings">
                                    <div className="time-range-settings">
                                        <div className="time-input-group">
                                            <label>開始時間</label>
                                            <input
                                                type="time"
                                                value={workType.startTime}
                                                onChange={(e) => updateWorkType(workType.id, { startTime: e.target.value })}
                                                className="time-input"
                                            />
                                        </div>
                                        <div className="time-separator">〜</div>
                                        <div className="time-input-group">
                                            <label>終了時間</label>
                                            <input
                                                type="time"
                                                value={workType.endTime}
                                                onChange={(e) => updateWorkType(workType.id, { endTime: e.target.value })}
                                                className="time-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="color-setting">
                                        <label>カラー</label>
                                        <input
                                            type="color"
                                            value={workType.color}
                                            onChange={(e) => updateWorkType(workType.id, { color: e.target.value })}
                                            className="color-input"
                                        />
                                    </div>

                                    <div className="staff-count-settings">
                                        <div className="staff-count-tabs">
                                            <button
                                                type="button"
                                                className={`tab-button ${activeTab === 'weekday' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('weekday')}
                                            >
                                                平日
                                            </button>
                                            <button
                                                type="button"
                                                className={`tab-button ${activeTab === 'holiday' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('holiday')}
                                            >
                                                休日
                                            </button>
                                        </div>

                                        <div className="staff-count-inputs">
                                            {activeTab === 'weekday' && (
                                                <>
                                                    <div className="staff-count-input-group">
                                                        <label>平日最小人数</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            value={workType.weekdayMinStaff || 1}
                                                            onChange={(e) => {
                                                                const value = parseInt(e.target.value) || 1;
                                                                const maxStaff = workType.weekdayMaxStaff || value;
                                                                updateWorkType(workType.id, {
                                                                    weekdayMinStaff: value,
                                                                    weekdayMaxStaff: Math.max(value, maxStaff)
                                                                });
                                                            }}
                                                            className="staff-count-input"
                                                        />
                                                    </div>
                                                    <div className="staff-count-input-group">
                                                        <label>平日最大人数</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            value={workType.weekdayMaxStaff || 5}
                                                            onChange={(e) => {
                                                                const value = parseInt(e.target.value) || 1;
                                                                const minStaff = workType.weekdayMinStaff || 1;
                                                                updateWorkType(workType.id, {
                                                                    weekdayMaxStaff: value,
                                                                    weekdayMinStaff: Math.min(value, minStaff)
                                                                });
                                                            }}
                                                            className="staff-count-input"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {activeTab === 'holiday' && (
                                                <>
                                                    <div className="staff-count-input-group">
                                                        <label>休日最小人数</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            value={workType.holidayMinStaff || 1}
                                                            onChange={(e) => {
                                                                const value = parseInt(e.target.value) || 1;
                                                                const maxStaff = workType.holidayMaxStaff || value;
                                                                updateWorkType(workType.id, {
                                                                    holidayMinStaff: value,
                                                                    holidayMaxStaff: Math.max(value, maxStaff)
                                                                });
                                                            }}
                                                            className="staff-count-input"
                                                        />
                                                    </div>
                                                    <div className="staff-count-input-group">
                                                        <label>休日最大人数</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            value={workType.holidayMaxStaff || 3}
                                                            onChange={(e) => {
                                                                const value = parseInt(e.target.value) || 1;
                                                                const minStaff = workType.holidayMinStaff || 1;
                                                                updateWorkType(workType.id, {
                                                                    holidayMaxStaff: value,
                                                                    holidayMinStaff: Math.min(value, minStaff)
                                                                });
                                                            }}
                                                            className="staff-count-input"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {!isValidTimeRange(workType.startTime, workType.endTime) && (
                                        <div className="time-warning">
                                            ⚠️ 時間設定を確認してください
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 勤務形態追加セクション */}
            <div className="add-work-types-section">
                <h5>勤務形態を追加</h5>
                
                {/* デフォルト勤務形態 */}
                <div className="default-work-types">
                    <h6>標準的な勤務形態</h6>
                    <div className="default-work-types-grid">
                        {defaultWorkTypes.map((defaultType, index) => {
                            const isAlreadyAdded = workTypes.some(wt => 
                                wt.name === defaultType.name && wt.isDefault
                            );
                            
                            return (
                                <button
                                    key={index}
                                    className={`default-work-type-btn ${isAlreadyAdded ? 'added' : ''}`}
                                    onClick={() => !isAlreadyAdded && addDefaultWorkType(defaultType)}
                                    disabled={isAlreadyAdded}
                                >
                                    <div 
                                        className="work-type-color-preview"
                                        style={{ backgroundColor: defaultType.color }}
                                    ></div>
                                    <div className="work-type-details">
                                        <span className="work-type-name">{defaultType.name}</span>
                                        <span className="work-type-time">
                                            {defaultType.startTime} 〜 {defaultType.endTime}
                                        </span>
                                    </div>
                                    {isAlreadyAdded && <span className="added-check">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* カスタム勤務形態 */}
                <div className="custom-work-type">
                    <h6>カスタム勤務形態</h6>
                    <button
                        className="add-custom-work-type-btn"
                        onClick={addCustomWorkType}
                    >
                        <Plus size={16} />
                        独自の勤務形態を追加
                    </button>
                </div>
            </div>

            {/* ヘルプ・説明 */}
            <div className="work-type-help">
                <h6>💡 勤務形態について</h6>
                <ul>
                    <li>各勤務形態には開始時間と終了時間を設定してください</li>
                    <li>翌日にまたがる勤務（深夜勤務など）も設定可能です</li>
                    <li>色分けによりスケジュールで視覚的に区別できます</li>
                    <li>設定した勤務形態は次のステップでカレンダーに反映されます</li>
                </ul>
            </div>

            <div className="step-completion">
                {isCompleted ? (
                    <div className="completion-status completed">
                        ✓ 勤務形態設定が完了しました
                    </div>
                ) : (
                    <div className="completion-status incomplete">
                        少なくとも1つの勤務形態を設定してください
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkTypeSetupStep;
