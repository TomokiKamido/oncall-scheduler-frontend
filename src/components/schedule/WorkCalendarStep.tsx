import React, { useState, useEffect } from 'react';
import { WorkType, WorkCalendarDay, HolidayConfig } from '../../types';
import './WorkCalendarStep.css';

interface WorkCalendarStepProps {
  startDate: Date;
  endDate: Date;
  workTypes: WorkType[];
  workCalendar: WorkCalendarDay[];
  onWorkCalendarChange: (workCalendar: WorkCalendarDay[]) => void;
  isCompleted: boolean;
}

const WorkCalendarStep: React.FC<WorkCalendarStepProps> = ({
  startDate,
  endDate,
  workTypes,
  workCalendar,
  onWorkCalendarChange,
  isCompleted: _,  // 将来の機能拡張用（未使用）
}) => {
  // 未使用変数を明示的に無視
  void _;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<WorkCalendarDay[]>([]);
  const [holidays, setHolidays] = useState<HolidayConfig[]>([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Partial<HolidayConfig>>({
    name: '',
    type: 'hospital',
    isRecurring: false,
    useHolidayStaffing: true
  });

  // 期間内の全日付を生成
  useEffect(() => {
    const generateCalendarDays = () => {
      const days: WorkCalendarDay[] = [];
      
      // 文字列から直接日付を解析してタイムゾーン問題を回避
      const [startYear, startMonth, startDay] = startDate.toISOString().split('T')[0].split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.toISOString().split('T')[0].split('-').map(Number);
      
      const current = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      
      while (current <= end) {
        const year = current.getFullYear();
        const month = (current.getMonth() + 1).toString().padStart(2, '0');
        const day = current.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const existingDay = workCalendar.find(day => day.date === dateStr);
        
        const newDay: WorkCalendarDay = {
          date: dateStr,
          requiredWorkTypes: existingDay?.requiredWorkTypes || [],
        };
        
        // 既存の祝日情報があれば保持
        if (existingDay?.isHoliday !== undefined) {
          newDay.isHoliday = existingDay.isHoliday;
        }
        if (existingDay?.holidayName !== undefined) {
          newDay.holidayName = existingDay.holidayName;
        }
        if (existingDay?.holidayType !== undefined) {
          newDay.holidayType = existingDay.holidayType;
        }
        if (existingDay?.useHolidayStaffing !== undefined) {
          newDay.useHolidayStaffing = existingDay.useHolidayStaffing;
        }
        if (existingDay?.isRecurring !== undefined) {
          newDay.isRecurring = existingDay.isRecurring;
        }
        
        days.push(newDay);
        
        // 次の日に進む
        current.setDate(current.getDate() + 1);
      }
      
      return days;
    };

    const newCalendar = generateCalendarDays();
    setCalendar(newCalendar);
    
    // 初回のみworkCalendarに反映
    if (workCalendar.length === 0 || workCalendar.length !== newCalendar.length) {
      onWorkCalendarChange(newCalendar);
    }
    
    // 祝日を自動取得（期間変更時にも実行）
    setTimeout(() => {
      importNationalHolidays();
    }, 100); // わずかな遅延で確実に実行
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]); // importNationalHolidaysとonWorkCalendarChangeは意図的に除外

  // workCalendarが外部から変更された時にローカルstateを更新
  useEffect(() => {
    if (workCalendar.length > 0) {
      setCalendar(workCalendar);
    }
  }, [workCalendar]);

  // 勤務形態の選択状態を切り替え
  const toggleWorkType = (date: string, workTypeId: string) => {
    const updatedCalendar = calendar.map(day => {
      if (day.date === date) {
        const isSelected = day.requiredWorkTypes.includes(workTypeId);
        return {
          ...day,
          requiredWorkTypes: isSelected
            ? day.requiredWorkTypes.filter(id => id !== workTypeId)
            : [...day.requiredWorkTypes, workTypeId]
        };
      }
      return day;
    });
    
    setCalendar(updatedCalendar);
    onWorkCalendarChange(updatedCalendar);
  };

  // 日付のフォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}(${weekday})`;
  };

  // カレンダーを週単位で整理する関数
  const organizeCalendarByWeeks = (calendarDays: WorkCalendarDay[]) => {
    if (calendarDays.length === 0) return [];

    const weeks: WorkCalendarDay[][] = [];
    let currentWeek: WorkCalendarDay[] = [];

    // 最初の日の曜日を取得（0=日曜日）
    const firstDate = new Date(calendarDays[0].date);
    const firstDayOfWeek = firstDate.getDay();

    // 最初の週の前の空の日を追加
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: '',
        requiredWorkTypes: [],
        isEmpty: true
      });
    }

    // 各日をweeksに配置
    calendarDays.forEach(day => {
      currentWeek.push(day);

      // 土曜日（6）の場合、または週が満杯の場合は新しい週を開始
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // 最後の週の後の空の日を追加
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push({
        date: '',
        requiredWorkTypes: [],
        isEmpty: true
      });
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const calendarWeeks = organizeCalendarByWeeks(calendar);

  // 一括操作
  const applyToAllDays = (workTypeId: string, selected: boolean) => {
    const updatedCalendar = calendar.map(day => ({
      ...day,
      requiredWorkTypes: selected
        ? Array.from(new Set([...day.requiredWorkTypes, workTypeId]))
        : day.requiredWorkTypes.filter(id => id !== workTypeId)
    }));
    
    setCalendar(updatedCalendar);
    onWorkCalendarChange(updatedCalendar);
  };

  // 曜日パターン適用
  const applyToWeekdays = (workTypeId: string, weekdays: number[], selected: boolean) => {
    const updatedCalendar = calendar.map(day => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      
      if (weekdays.includes(dayOfWeek)) {
        return {
          ...day,
          requiredWorkTypes: selected
            ? Array.from(new Set([...day.requiredWorkTypes, workTypeId]))
            : day.requiredWorkTypes.filter(id => id !== workTypeId)
        };
      }
      return day;
    });
    
    setCalendar(updatedCalendar);
    onWorkCalendarChange(updatedCalendar);
  };

  // 祝日管理機能
  const addHoliday = (holidayData: HolidayConfig) => {
    setHolidays(prev => [...prev, holidayData]);
    
    // カレンダーに祝日情報を反映
    const updatedCalendar = calendar.map(day => {
      if (day.date === holidayData.date) {
        return {
          ...day,
          isHoliday: true,
          holidayName: holidayData.name,
          holidayType: holidayData.type,
          useHolidayStaffing: holidayData.useHolidayStaffing
        };
      }
      return day;
    });
    
    setCalendar(updatedCalendar);
    onWorkCalendarChange(updatedCalendar);
  };

  const removeHoliday = (holidayId: string) => {
    const holiday = holidays.find(h => h.id === holidayId);
    if (!holiday) return;

    setHolidays(prev => prev.filter(h => h.id !== holidayId));
    
    // カレンダーから祝日情報を削除
    const updatedCalendar = calendar.map(day => {
      if (day.date === holiday.date) {
        const { isHoliday, holidayName, holidayType, useHolidayStaffing, ...restDay } = day;
        return restDay;
      }
      return day;
    });
    
    setCalendar(updatedCalendar);
    onWorkCalendarChange(updatedCalendar);
  };

  // 国民の祝日を自動取得（簡易版）
  const importNationalHolidays = () => {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    const years = Array.from(new Set([startYear, endYear])); // 開始年と終了年

    const nationalHolidays = [
      { month: 1, day: 1, name: '元日' },
      { month: 1, day: 8, name: '成人の日' }, // 概算
      { month: 2, day: 11, name: '建国記念の日' },
      { month: 3, day: 20, name: '春分の日' }, // 概算
      { month: 4, day: 29, name: '昭和の日' },
      { month: 5, day: 3, name: '憲法記念日' },
      { month: 5, day: 4, name: 'みどりの日' },
      { month: 5, day: 5, name: 'こどもの日' },
      { month: 7, day: 15, name: '海の日' }, // 概算
      { month: 8, day: 11, name: '山の日' },
      { month: 9, day: 16, name: '敬老の日' }, // 概算
      { month: 9, day: 23, name: '秋分の日' }, // 概算
      { month: 10, day: 14, name: 'スポーツの日' }, // 概算
      { month: 11, day: 3, name: '文化の日' },
      { month: 11, day: 23, name: '勤労感謝の日' },
    ];

    let addedCount = 0;

    years.forEach(year => {
      nationalHolidays.forEach(holiday => {
        const dateStr = `${year}-${holiday.month.toString().padStart(2, '0')}-${holiday.day.toString().padStart(2, '0')}`;
        
        // 期間内かつ既存の祝日でない場合のみ追加
        const isInRange = dateStr >= startDate.toISOString().split('T')[0] && 
                         dateStr <= endDate.toISOString().split('T')[0];
        const isNotDuplicate = !holidays.some(h => h.date === dateStr);
        
        if (isInRange && isNotDuplicate) {
          const holidayConfig: HolidayConfig = {
            id: `national-${dateStr}`,
            date: dateStr,
            name: holiday.name,
            type: 'national',
            isRecurring: true,
            useHolidayStaffing: true
          };
          
          addHoliday(holidayConfig);
          addedCount++;
        }
      });
    });

    // 結果をユーザーに通知
    if (addedCount > 0) {
      console.log(`${addedCount}件の国民の祝日を追加しました`);
    } else {
      console.log('追加できる新しい祝日はありませんでした');
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) return;
    
    // 重複チェック
    const existingHoliday = holidays.find(h => h.date === newHoliday.date);
    if (existingHoliday) {
      alert(`${newHoliday.date}は既に「${existingHoliday.name}」として登録されています。`);
      return;
    }
    
    const holidayConfig: HolidayConfig = {
      id: `holiday-${Date.now()}`,
      date: newHoliday.date,
      name: newHoliday.name,
      type: newHoliday.type || 'hospital',
      isRecurring: newHoliday.isRecurring || false,
      useHolidayStaffing: newHoliday.useHolidayStaffing !== false,
      ...(newHoliday.description && { description: newHoliday.description })
    };
    
    addHoliday(holidayConfig);
    setShowHolidayModal(false);
    setNewHoliday({
      name: '',
      type: 'hospital',
      isRecurring: false,
      useHolidayStaffing: true
    });
    setSelectedDate(null); // 選択状態をクリア
  };

  return (
    <div className="work-calendar-step">
      <h3>勤務カレンダー設定</h3>
      <p className="step-description">
        各日に必要な勤務形態を選択してください。複数の勤務形態を同時に選択できます。
      </p>

      {workTypes.length === 0 ? (
        <div className="no-work-types">
          <p>勤務形態が設定されていません。前のステップで勤務形態を追加してください。</p>
        </div>
      ) : (
        <>
          {/* 祝日設定セクション */}
          <div className="holiday-settings-section">
            <h4>🎌 祝日・特別日設定</h4>
            
            <div className="holiday-actions">
              <button 
                className="btn-secondary"
                onClick={importNationalHolidays}
              >
                📅 国民の祝日を再取得
              </button>
              
              <button 
                className="btn-primary"
                onClick={() => {
                  setShowHolidayModal(true);
                  // 現在選択されている日付があれば、それを初期値に設定
                  if (selectedDate) {
                    setNewHoliday(prev => ({
                      ...prev,
                      date: selectedDate
                    }));
                  }
                }}
              >
                ➕ 祝日を追加
              </button>
            </div>

            {/* 祝日一覧 */}
            {holidays.length > 0 && (
              <div className="holidays-list">
                <h5>設定済み祝日</h5>
                {holidays.map(holiday => (
                  <div key={holiday.id} className="holiday-item">
                    <div className="holiday-info">
                      <span className="holiday-name">{holiday.name}</span>
                      <span className="holiday-date">{holiday.date}</span>
                      <span className={`holiday-type ${holiday.type}`}>
                        {holiday.type === 'national' ? '国民' : 
                         holiday.type === 'hospital' ? '病院' : '部署'}
                      </span>
                    </div>
                    <button
                      className="btn-danger-small"
                      onClick={() => removeHoliday(holiday.id)}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 祝日追加モーダル */}
          {showHolidayModal && (
            <div className="holiday-modal-overlay" onClick={() => setShowHolidayModal(false)}>
              <div className="holiday-modal" onClick={(e) => e.stopPropagation()}>
                <h4>祝日を追加</h4>
                
                <div className="modal-form">
                  <div className="form-group">
                    <label>日付</label>
                    <input
                      type="date"
                      value={newHoliday.date || ''}
                      onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                      min={startDate.toISOString().split('T')[0]}
                      max={endDate.toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>祝日名</label>
                    <input
                      type="text"
                      value={newHoliday.name || ''}
                      onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                      placeholder="例：病院創立記念日"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>種類</label>
                    <select
                      value={newHoliday.type || 'hospital'}
                      onChange={(e) => setNewHoliday({...newHoliday, type: e.target.value as 'national' | 'hospital' | 'department'})}
                    >
                      <option value="hospital">病院記念日</option>
                      <option value="department">部署特別日</option>
                      <option value="national">国民の祝日</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>説明（任意）</label>
                    <input
                      type="text"
                      value={newHoliday.description || ''}
                      onChange={(e) => setNewHoliday({...newHoliday, description: e.target.value})}
                      placeholder="祝日の詳細説明"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newHoliday.useHolidayStaffing !== false}
                        onChange={(e) => setNewHoliday({...newHoliday, useHolidayStaffing: e.target.checked})}
                      />
                      休日人員体制を適用
                    </label>
                  </div>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newHoliday.isRecurring || false}
                        onChange={(e) => setNewHoliday({...newHoliday, isRecurring: e.target.checked})}
                      />
                      毎年繰り返し
                    </label>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setShowHolidayModal(false);
                      setNewHoliday({
                        name: '',
                        type: 'hospital',
                        isRecurring: false,
                        useHolidayStaffing: true
                      });
                    }}
                  >
                    キャンセル
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleAddHoliday}
                    disabled={!newHoliday.name || !newHoliday.date}
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 一括操作パネル */}
          <div className="bulk-operations">
            <h4>一括操作</h4>
            <div className="bulk-controls">
              {workTypes.map(workType => (
                <div key={workType.id} className="bulk-control-item">
                  <div 
                    className="work-type-indicator"
                    style={{ backgroundColor: workType.color }}
                  />
                  <span className="work-type-name">{workType.name}</span>
                  <div className="bulk-buttons">
                    <button
                      className="bulk-btn apply-all"
                      onClick={() => applyToAllDays(workType.id, true)}
                    >
                      全日適用
                    </button>
                    <button
                      className="bulk-btn apply-weekdays"
                      onClick={() => applyToWeekdays(workType.id, [1,2,3,4,5], true)}
                    >
                      平日適用
                    </button>
                    <button
                      className="bulk-btn apply-weekends"
                      onClick={() => applyToWeekdays(workType.id, [0,6], true)}
                    >
                      土日適用
                    </button>
                    <button
                      className="bulk-btn clear-all"
                      onClick={() => applyToAllDays(workType.id, false)}
                    >
                      全解除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* カレンダーグリッド */}
          <div className="calendar-container">
            <div className="calendar-header">
              <div className="work-types-legend">
                {workTypes.map(workType => (
                  <div key={workType.id} className="legend-item">
                    <div 
                      className="legend-color"
                      style={{ backgroundColor: workType.color }}
                    />
                    <span className="legend-name">{workType.name}</span>
                    <span className="legend-time">
                      {workType.startTime} - {workType.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 曜日ヘッダー */}
            <div className="calendar-weekdays">
              {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                <div key={day} className="weekday-header">
                  {day}
                </div>
              ))}
            </div>

            {/* 週ごとのカレンダーグリッド */}
            <div className="calendar-weeks">
              {calendarWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="calendar-week">
                  {week.map((day, dayIndex) => {
                    // 土日の判定
                    const date = day.isEmpty ? null : new Date(day.date);
                    const dayOfWeek = date?.getDay();
                    const isSunday = dayOfWeek === 0;
                    const isSaturday = dayOfWeek === 6;
                    const isHoliday = day.isHoliday;
                    
                    return (
                      <div 
                        key={`${weekIndex}-${dayIndex}`} 
                        className={`calendar-day ${
                          day.isEmpty ? 'empty' : ''
                        } ${
                          !day.isEmpty && selectedDate === day.date ? 'selected' : ''
                        } ${
                          isSunday ? 'sunday' : ''
                        } ${
                          isSaturday ? 'saturday' : ''
                        } ${
                          isHoliday ? 'holiday' : ''
                        }`}
                        onClick={() => {
                          if (!day.isEmpty) {
                            setSelectedDate(selectedDate === day.date ? null : day.date);
                          }
                        }}
                      >
                        {!day.isEmpty && (
                          <>
                            <div className="date-header">
                              {formatDate(day.date)}
                              {isHoliday && (
                                <span className="holiday-indicator">🎌</span>
                              )}
                            </div>
                            
                            <div className="work-types-selection">
                              {workTypes.map(workType => {
                                const isSelected = day.requiredWorkTypes.includes(workType.id);
                                return (
                                  <button
                                    key={workType.id}
                                    className={`work-type-button ${isSelected ? 'selected' : ''}`}
                                    style={{
                                      backgroundColor: isSelected ? workType.color : 'transparent',
                                      borderColor: workType.color,
                                      color: isSelected ? '#fff' : workType.color
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleWorkType(day.date, workType.id);
                                    }}
                                    title={`${workType.name} (${workType.startTime} - ${workType.endTime})`}
                                  >
                                    {workType.name}
                                  </button>
                                );
                              })}
                            </div>

                            {day.requiredWorkTypes.length > 0 && (
                              <div className="selected-count">
                                {day.requiredWorkTypes.length}個選択中
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 選択状況サマリー */}
          <div className="calendar-summary">
            <h4>選択状況</h4>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">総日数:</span>
                <span className="stat-value">{calendar.length}日</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">勤務設定済み:</span>
                <span className="stat-value">
                  {calendar.filter(day => day.requiredWorkTypes.length > 0).length}日
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">未設定:</span>
                <span className="stat-value">
                  {calendar.filter(day => day.requiredWorkTypes.length === 0).length}日
                </span>
              </div>
            </div>
            
            {workTypes.map(workType => {
              const count = calendar.filter(day => 
                day.requiredWorkTypes.includes(workType.id)
              ).length;
              return (
                <div key={workType.id} className="work-type-summary">
                  <div 
                    className="summary-indicator"
                    style={{ backgroundColor: workType.color }}
                  />
                  <span className="summary-name">{workType.name}:</span>
                  <span className="summary-count">{count}日</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default WorkCalendarStep;
