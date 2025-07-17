import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Calendar,
  Search,
  MessageSquare,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { useShiftRequests } from '../../hooks/useShiftRequests';
import { useAuth } from '../../hooks/useAuth';
import { useStaff } from '../../hooks/useStaff';
import { ShiftRequest, RequestStatus, ShiftRequestType } from '../../types';
import './ShiftRequestReview.css';

interface ShiftRequestReviewProps {
  onClose?: () => void;
}

const ShiftRequestReview: React.FC<ShiftRequestReviewProps> = ({ onClose }) => {
  const { hasPermission } = useAuth();
  const { staffMembers, workTypes } = useStaff();
  const {
    requests,
    currentPeriod,
    reviewRequest,
    batchReview,
    isLoading,
    error
  } = useShiftRequests();

  // フィルター状態
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('submitted');
  const [staffFilter, setStaffFilter] = useState<number | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // 一括審査用の状態
  const [batchMode, setBatchMode] = useState(false);
  const [batchComments, setBatchComments] = useState('');
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchAction, setBatchAction] = useState<'approved' | 'rejected'>('approved');

  // 個別審査用の状態
  const [reviewingRequest, setReviewingRequest] = useState<ShiftRequest | null>(null);
  const [reviewComments, setReviewComments] = useState('');

  // 権限チェック
  if (!hasPermission('canEditSchedules')) {
    return (
      <div className="shift-request-review">
        <div className="no-permission">
          <AlertTriangle size={48} />
          <h3>アクセス権限がありません</h3>
          <p>勤務希望の審査権限がありません。</p>
        </div>
      </div>
    );
  }

  if (!currentPeriod) {
    return (
      <div className="shift-request-review">
        <div className="no-period-message">
          <Calendar size={48} />
          <h3>審査可能な期間がありません</h3>
          <p>現在、審査可能な勤務希望受付期間がありません。</p>
        </div>
      </div>
    );
  }

  // フィルタリングされたリクエスト
  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (staffFilter !== 'all' && req.staffId !== staffFilter) return false;
    if (dateFilter && req.requestDate !== dateFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.staffName.toLowerCase().includes(query) ||
        req.reason?.toLowerCase().includes(query) ||
        req.comments?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // 統計情報
  const stats = {
    total: requests.length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    pending: requests.filter(r => r.status === 'pending_review').length
  };

  // 個別審査の実行
  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewingRequest) return;

    const success = await reviewRequest(
      reviewingRequest.id,
      status,
      reviewComments.trim() || undefined
    );

    if (success) {
      setReviewingRequest(null);
      setReviewComments('');
      alert(`勤務希望を${status === 'approved' ? '承認' : '拒否'}しました`);
    }
  };

  // 一括審査の実行
  const handleBatchReview = async () => {
    if (selectedRequests.length === 0) return;

    const success = await batchReview(
      selectedRequests,
      batchAction,
      batchComments.trim() || undefined
    );

    if (success) {
      setSelectedRequests([]);
      setBatchComments('');
      setShowBatchDialog(false);
      setBatchMode(false);
      alert(`${selectedRequests.length}件の勤務希望を${batchAction === 'approved' ? '承認' : '拒否'}しました`);
    }
  };

  // 選択の切り替え
  const toggleSelection = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  // 全選択/全解除
  const toggleSelectAll = () => {
    const visibleRequestIds = filteredRequests.map(req => req.id);
    if (selectedRequests.length === visibleRequestIds.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(visibleRequestIds);
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

  // ステータスの表示名
  const getStatusDisplay = (status: RequestStatus) => {
    const statuses = {
      draft: { label: '下書き', color: '#6b7280', icon: Clock },
      submitted: { label: '提出済み', color: '#3b82f6', icon: Clock },
      approved: { label: '承認', color: '#22c55e', icon: CheckCircle },
      rejected: { label: '拒否', color: '#ef4444', icon: XCircle },
      pending_review: { label: '審査中', color: '#f59e0b', icon: Clock }
    };
    return statuses[status];
  };

  return (
    <div className="shift-request-review">
      <div className="review-header">
        <h2>
          <Users size={24} />
          勤務希望審査
        </h2>
        <div className="period-info">
          <h3>{currentPeriod.title}</h3>
          <p>対象月: {currentPeriod.targetMonth}</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* 統計情報 */}
      <div className="stats-section">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">総件数</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.submitted}</span>
          <span className="stat-label">審査待ち</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.approved}</span>
          <span className="stat-label">承認済み</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.rejected}</span>
          <span className="stat-label">拒否済み</span>
        </div>
      </div>

      {/* フィルターとアクション */}
      <div className="controls-section">
        <div className="filters">
          <div className="filter-group">
            <label>ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
            >
              <option value="all">すべて</option>
              <option value="submitted">提出済み</option>
              <option value="approved">承認済み</option>
              <option value="rejected">拒否済み</option>
              <option value="pending_review">審査中</option>
            </select>
          </div>

          <div className="filter-group">
            <label>スタッフ</label>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
              <option value="all">すべて</option>
              {staffMembers.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.department})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>日付</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="search-group">
            <Search size={16} />
            <input
              type="text"
              placeholder="スタッフ名、理由で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="actions">
          <button
            className={`btn-secondary ${batchMode ? 'active' : ''}`}
            onClick={() => {
              setBatchMode(!batchMode);
              setSelectedRequests([]);
            }}
          >
            一括審査
          </button>

          {batchMode && selectedRequests.length > 0 && (
            <>
              <button
                className="btn-success"
                onClick={() => {
                  setBatchAction('approved');
                  setShowBatchDialog(true);
                }}
              >
                <Check size={16} />
                一括承認 ({selectedRequests.length})
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  setBatchAction('rejected');
                  setShowBatchDialog(true);
                }}
              >
                <X size={16} />
                一括拒否 ({selectedRequests.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* リクエスト一覧 */}
      <div className="requests-section">
        {batchMode && (
          <div className="batch-controls">
            <label className="select-all">
              <input
                type="checkbox"
                checked={filteredRequests.length > 0 && selectedRequests.length === filteredRequests.length}
                onChange={toggleSelectAll}
              />
              すべて選択
            </label>
          </div>
        )}

        <div className="requests-list">
          {filteredRequests.length === 0 ? (
            <div className="empty-state">
              <p>該当する勤務希望がありません</p>
            </div>
          ) : (
            filteredRequests
              .sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime())
              .map(request => {
                const typeInfo = getRequestTypeDisplay(request.requestType);
                const statusInfo = getStatusDisplay(request.status);
                const StatusIcon = statusInfo.icon;
                const workType = workTypes.find(wt => wt.id === request.workTypeId);
                const staff = staffMembers.find(s => s.id === request.staffId);

                return (
                  <div key={request.id} className="request-card">
                    {batchMode && (
                      <div className="request-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request.id)}
                          onChange={() => toggleSelection(request.id)}
                        />
                      </div>
                    )}

                    <div className="request-content">
                      <div className="request-main">
                        <div className="request-header">
                          <span className="request-date">
                            {new Date(request.requestDate).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </span>
                          <span className="staff-name">
                            {request.staffName} ({staff?.department})
                          </span>
                          <span 
                            className="request-type"
                            style={{ color: typeInfo.color }}
                          >
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                          <span 
                            className="request-status"
                            style={{ color: statusInfo.color }}
                          >
                            <StatusIcon size={14} />
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
                      </div>

                      {request.status === 'submitted' && !batchMode && (
                        <div className="request-actions">
                          <button
                            className="btn-success"
                            onClick={() => handleReview('approved')}
                            disabled={isLoading}
                          >
                            <CheckCircle size={16} />
                            承認
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleReview('rejected')}
                            disabled={isLoading}
                          >
                            <XCircle size={16} />
                            拒否
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setReviewingRequest(request);
                              setReviewComments('');
                            }}
                          >
                            <MessageSquare size={16} />
                            コメント付きで審査
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* 個別審査ダイアログ */}
      {reviewingRequest && (
        <div className="review-dialog-overlay">
          <div className="review-dialog">
            <h3>勤務希望の審査</h3>
            <div className="request-summary">
              <p><strong>スタッフ:</strong> {reviewingRequest.staffName}</p>
              <p><strong>希望日:</strong> {new Date(reviewingRequest.requestDate).toLocaleDateString('ja-JP')}</p>
              <p><strong>種類:</strong> {getRequestTypeDisplay(reviewingRequest.requestType).label}</p>
              {reviewingRequest.reason && (
                <p><strong>理由:</strong> {reviewingRequest.reason}</p>
              )}
            </div>
            <div className="comment-section">
              <label>審査コメント（任意）</label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="審査理由やコメントを入力..."
                rows={3}
              />
            </div>
            <div className="dialog-actions">
              <button
                className="btn-success"
                onClick={() => handleReview('approved')}
                disabled={isLoading}
              >
                <CheckCircle size={16} />
                承認
              </button>
              <button
                className="btn-danger"
                onClick={() => handleReview('rejected')}
                disabled={isLoading}
              >
                <XCircle size={16} />
                拒否
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setReviewingRequest(null);
                  setReviewComments('');
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一括審査ダイアログ */}
      {showBatchDialog && (
        <div className="review-dialog-overlay">
          <div className="review-dialog">
            <h3>一括{batchAction === 'approved' ? '承認' : '拒否'}</h3>
            <p>{selectedRequests.length}件の勤務希望を{batchAction === 'approved' ? '承認' : '拒否'}します。</p>
            <div className="comment-section">
              <label>一括コメント（任意）</label>
              <textarea
                value={batchComments}
                onChange={(e) => setBatchComments(e.target.value)}
                placeholder="一括審査のコメントを入力..."
                rows={3}
              />
            </div>
            <div className="dialog-actions">
              <button
                className={batchAction === 'approved' ? 'btn-success' : 'btn-danger'}
                onClick={handleBatchReview}
                disabled={isLoading}
              >
                {batchAction === 'approved' ? '一括承認' : '一括拒否'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowBatchDialog(false);
                  setBatchComments('');
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {onClose && (
        <div className="review-footer">
          <button className="btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      )}
    </div>
  );
};

export default ShiftRequestReview;
