import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, Send, Trash2, Plus } from 'lucide-react';
import { useShiftRequests } from '../../hooks/useShiftRequests';
import { useAuth } from '../../hooks/useAuth';
import { useStaff } from '../../hooks/useStaff';
import { ShiftRequestType, RequestPriority } from '../../types';
import './ShiftRequestForm.css';

interface ShiftRequestFormProps {
  onClose?: () => void;
}

const ShiftRequestForm: React.FC<ShiftRequestFormProps> = ({ onClose }) => {
  const { profile } = useAuth();
  const { workTypes } = useStaff();
  const {
    requests,
    currentPeriod,
    createRequest,
    deleteRequest,
    submitRequests,
    canSubmitRequests,
    isLoading,
    error
  } = useShiftRequests();

  // フォーム状態
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('');
  const [requestType, setRequestType] = useState<ShiftRequestType>('prefer');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 自分の勤務希望のみフィルタリング
  const myRequests = requests.filter(req => 
    req.staffId === parseInt(profile?.uid || '0')
  );

  // 提出可能かチェック
  const canSubmit = currentPeriod && canSubmitRequests(currentPeriod.id);
  const isDeadlinePassed = currentPeriod && new Date() >= (
    currentPeriod.submissionDeadline instanceof Date 
      ? currentPeriod.submissionDeadline 
      : new Date(currentPeriod.submissionDeadline)
  );

  // デバッグ情報（開発用）
  console.log('ShiftRequestForm Debug:', {
    currentPeriod,
    canSubmit,
    isDeadlinePassed,
    selectedDate,
    canSubmitRequests: currentPeriod ? canSubmitRequests(currentPeriod.id) : false,
    profile,
    workTypes: workTypes?.length || 0,
    myRequestsCount: myRequests.length
  });

  // 月のカレンダー生成
  const generateCalendarDays = () => {
    if (!currentPeriod) return [];
    
    // targetMonthから年と月を取得
    const [year, month] = currentPeriod.targetMonth.split('-').map(Number);
    
    // その月の最初の日と最後の日を計算
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0); // 次の月の0日目 = 現在月の最終日
    
    const days = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month - 1, d));
    }
    
    console.log('📅 カレンダー日付生成:', {
      targetMonth: currentPeriod.targetMonth,
      year,
      month,
      firstDay: firstDay.toISOString().split('T')[0],
      lastDay: lastDay.toISOString().split('T')[0],
      daysCount: days.length
    });
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // 日付範囲の計算
  const getDateRange = () => {
    if (calendarDays.length === 0) return { min: '', max: '' };
    
    const min = calendarDays[0].toISOString().split('T')[0];
    const max = calendarDays[calendarDays.length - 1].toISOString().split('T')[0];
    
    console.log('📅 日付範囲:', { min, max });
    return { min, max };
  };

  const { min: minDate, max: maxDate } = getDateRange();

  // 勤務希望の追加
  const handleAddRequest = async () => {
    if (!selectedDate) {
      alert('日付を選択してください');
      return;
    }
    
    if (!canSubmit) {
      alert('現在勤務希望を追加できません');
      return;
    }

    console.log('📝 勤務希望追加:', {
      selectedDate,
      selectedWorkType,
      requestType,
      priority,
      reason
    });

    const success = await createRequest(
      selectedDate,
      selectedWorkType || null,
      requestType,
      priority,
      reason.trim() || undefined
    );

    if (success) {
      console.log('✅ 勤務希望が追加されました');
      setSelectedDate('');
      setSelectedWorkType('');
      setRequestType('prefer');
      setPriority('medium');
      setReason('');
    } else {
      console.error('❌ 勤務希望の追加に失敗しました');
    }
  };

  // 勤務希望の削除
  const handleDeleteRequest = async (requestId: string) => {
    if (window.confirm('この勤務希望を削除しますか？')) {
      await deleteRequest(requestId);
    }
  };

  // 一括提出
  const handleSubmitAll = async () => {
    if (!currentPeriod || !canSubmit) return;

    const draftRequests = myRequests.filter(req => req.status === 'draft');
    if (draftRequests.length === 0) {
      alert('提出可能な勤務希望がありません');
      return;
    }

    if (window.confirm(`${draftRequests.length}件の勤務希望を提出しますか？提出後は編集できません。`)) {
      setIsSubmitting(true);
      const success = await submitRequests(currentPeriod.id);
      setIsSubmitting(false);

      if (success) {
        alert('勤務希望を提出しました！');
      }
    }
  };

  // 勤務希望タイプの表示名
  const getRequestTypeDisplay = (type: ShiftRequestType) => {
    const types = {
      prefer: { label: '希望', color: '#22c55e', icon: '👍' },
      avoid: { label: '回避希望', color: '#f59e0b', icon: '⚠️' },
      unavailable: { label: '勤務不可', color: '#ef4444', icon: '❌' },
      mandatory: { label: '必須勤務', color: '#3b82f6', icon: '⭐' }
    };
    return types[type];
  };

  // 優先度の表示名
  const getPriorityDisplay = (priority: RequestPriority) => {
    const priorities = {
      low: { label: '低', color: '#6b7280' },
      medium: { label: '中', color: '#f59e0b' },
      high: { label: '高', color: '#ef4444' },
      urgent: { label: '緊急', color: '#dc2626' }
    };
    return priorities[priority];
  };

  // ステータスの表示名
  const getStatusDisplay = (status: string) => {
    const statuses = {
      draft: { label: '下書き', color: '#6b7280' },
      submitted: { label: '提出済み', color: '#3b82f6' },
      approved: { label: '承認', color: '#22c55e' },
      rejected: { label: '拒否', color: '#ef4444' },
      pending_review: { label: '審査中', color: '#f59e0b' }
    };
    return statuses[status as keyof typeof statuses];
  };

  if (!currentPeriod) {
    console.log('❌ currentPeriod が null/undefined のため、フォームを表示できません');
    return (
      <div className="shift-request-form">
        <div className="no-period-message">
          <AlertCircle size={48} />
          <h3>勤務希望受付期間がありません</h3>
          <p>現在、勤務希望の受付期間が設定されていません。</p>
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            background: '#f0f0f0', 
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            🔍 デバッグ情報: currentPeriod = {String(currentPeriod)}
            <br />
            Profile: {profile?.email || 'No profile'}
            <br />
            WorkTypes: {workTypes?.length || 0} available
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              style={{ 
                marginTop: '20px',
                padding: '10px 20px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="shift-request-form">
      <div className="form-header">
        <h2>
          <Calendar size={24} />
          勤務希望提出
        </h2>
        <div className="period-info">
          <h3>{currentPeriod.title}</h3>
          <p>対象月: {currentPeriod.targetMonth}</p>
          <p className={`deadline ${isDeadlinePassed ? 'expired' : ''}`}>
            <Clock size={16} />
            提出期限: {
              currentPeriod.submissionDeadline instanceof Date 
                ? currentPeriod.submissionDeadline.toLocaleDateString('ja-JP')
                : new Date(currentPeriod.submissionDeadline).toLocaleDateString('ja-JP')
            } 
            {
              currentPeriod.submissionDeadline instanceof Date
                ? currentPeriod.submissionDeadline.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                : new Date(currentPeriod.submissionDeadline).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
            }
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isDeadlinePassed && (
        <div className="deadline-expired">
          <AlertCircle size={16} />
          提出期限が過ぎています。勤務希望の追加・編集はできません。
        </div>
      )}

      <div className="form-content">
        <div className="form-section">
          <h3>勤務希望の追加</h3>
          
          {!canSubmit && (
            <div className="info-message" style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
              <p>現在勤務希望を追加できません。</p>
              <p>canSubmit: {canSubmit?.toString()}</p>
              <p>currentPeriod: {currentPeriod ? 'あり' : 'なし'}</p>
              <p>isDeadlinePassed: {isDeadlinePassed?.toString()}</p>
            </div>
          )}
          
          {canSubmit ? (
            <div className="request-form">
              <div className="form-row">
                <div className="form-group">
                  <label>希望日</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      console.log('📅 日付選択:', e.target.value);
                      setSelectedDate(e.target.value);
                    }}
                    min={minDate}
                    max={maxDate}
                    disabled={!minDate || !maxDate}
                  />
                  {(!minDate || !maxDate) && (
                    <div className="form-help">
                      対象月: {currentPeriod?.targetMonth || '未設定'}
                    </div>
                  )}
                  {minDate && maxDate && (
                    <div className="form-help">
                      選択可能期間: {minDate} 〜 {maxDate}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>勤務形態（任意）</label>
                  <select
                    value={selectedWorkType}
                    onChange={(e) => setSelectedWorkType(e.target.value)}
                  >
                    <option value="">指定なし</option>
                    {workTypes.map(wt => (
                      <option key={wt.id} value={wt.id}>
                        {wt.name} ({wt.startTime}-{wt.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>希望の種類</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value as ShiftRequestType)}
                  >
                    <option value="prefer">希望する</option>
                    <option value="avoid">できれば避けたい</option>
                    <option value="unavailable">勤務不可</option>
                    <option value="mandatory">必須勤務</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>優先度</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as RequestPriority)}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">緊急</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>理由（任意）</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="希望の理由を入力してください..."
                  rows={3}
                  maxLength={200}
                />
                <span className="char-count">{reason.length}/200</span>
              </div>

              <button
                className="btn-primary"
                onClick={handleAddRequest}
                disabled={!selectedDate || isLoading || !canSubmit}
              >
                <Plus size={16} />
                希望を追加
              </button>
              
              {/* デバッグ情報 */}
              <div className="debug-info" style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                <p>Debug: selectedDate={selectedDate}, canSubmit={canSubmit?.toString()}, isLoading={isLoading?.toString()}</p>
                <p>期間ID: {currentPeriod?.id}, アクティブ: {currentPeriod?.isActive?.toString()}</p>
                <p>期限: {currentPeriod?.submissionDeadline?.toISOString()}</p>
              </div>
            </div>
          ) : (
            <div className="cannot-submit-message">
              <p>現在勤務希望を追加できません。期間設定や期限をご確認ください。</p>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>登録済み勤務希望 ({myRequests.length}件)</h3>
            {canSubmit && myRequests.some(req => req.status === 'draft') && (
              <button
                className="btn-submit"
                onClick={handleSubmitAll}
                disabled={isSubmitting}
              >
                <Send size={16} />
                {isSubmitting ? '提出中...' : '一括提出'}
              </button>
            )}
          </div>

          <div className="requests-list">
            {myRequests.length === 0 ? (
              <div className="empty-state">
                <p>まだ勤務希望が登録されていません</p>
              </div>
            ) : (
              myRequests
                .sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime())
                .map(request => {
                  const typeInfo = getRequestTypeDisplay(request.requestType);
                  const priorityInfo = getPriorityDisplay(request.priority);
                  const statusInfo = getStatusDisplay(request.status);
                  const workType = workTypes.find(wt => wt.id === request.workTypeId);

                  return (
                    <div key={request.id} className="request-item">
                      <div className="request-header">
                        <span className="request-date">
                          {new Date(request.requestDate).toLocaleDateString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </span>
                        <span 
                          className="request-type"
                          style={{ color: typeInfo.color }}
                        >
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                        <span 
                          className="request-priority"
                          style={{ color: priorityInfo.color }}
                        >
                          優先度: {priorityInfo.label}
                        </span>
                        <span 
                          className="request-status"
                          style={{ color: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      {workType && (
                        <div className="request-worktype">
                          勤務形態: {workType.name} ({workType.startTime}-{workType.endTime})
                        </div>
                      )}

                      {request.reason && (
                        <div className="request-reason">
                          理由: {request.reason}
                        </div>
                      )}

                      {request.reviewComments && (
                        <div className="review-comments">
                          <strong>審査コメント:</strong> {request.reviewComments}
                        </div>
                      )}

                      {request.status === 'draft' && canSubmit && (
                        <div className="request-actions">
                          <button
                            className="btn-danger-small"
                            onClick={() => handleDeleteRequest(request.id)}
                            disabled={isLoading}
                          >
                            <Trash2 size={14} />
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {onClose && (
        <div className="form-footer">
          <button className="btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      )}
    </div>
  );
};

export default ShiftRequestForm;
