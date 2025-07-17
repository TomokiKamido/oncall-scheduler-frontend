import { useState, useEffect, useCallback } from 'react';
import { 
  ShiftRequest, 
  ShiftRequestPeriod, 
  RequestBatch, 
  RequestSummary,
  RequestConflict,
  RequestStatistics,
  ShiftRequestType, 
  RequestStatus,
  RequestPriority 
} from '../types';
import { useAuth } from './useAuth';

interface UseShiftRequestsReturn {
  // 状態
  requests: ShiftRequest[];
  periods: ShiftRequestPeriod[];
  currentPeriod: ShiftRequestPeriod | null;
  requestBatch: RequestBatch | null;
  requestSummaries: RequestSummary[];
  conflicts: RequestConflict[];
  statistics: RequestStatistics | null;
  isLoading: boolean;
  error: string | null;

  // 基本操作（スタッフ向け）
  createRequest: (
    date: string,
    workTypeId: string | null,
    requestType: ShiftRequestType,
    priority: RequestPriority,
    reason?: string
  ) => Promise<boolean>;
  updateRequest: (requestId: string, updates: Partial<ShiftRequest>) => Promise<boolean>;
  deleteRequest: (requestId: string) => Promise<boolean>;
  submitRequests: (periodId: string) => Promise<boolean>;
  
  // 管理操作（管理者向け）
  reviewRequest: (
    requestId: string, 
    status: 'approved' | 'rejected',
    comments?: string
  ) => Promise<boolean>;
  batchReview: (
    requestIds: string[],
    status: 'approved' | 'rejected',
    comments?: string
  ) => Promise<boolean>;
  
  // 期間管理
  createPeriod: (
    title: string,
    targetMonth: string,
    deadline: Date,
    description?: string,
    departments?: string[]
  ) => Promise<boolean>;
  updatePeriod: (periodId: string, updates: Partial<ShiftRequestPeriod>) => Promise<boolean>;
  closePeriod: (periodId: string) => Promise<boolean>;
  
  // データ取得
  fetchRequestsForPeriod: (periodId: string) => Promise<void>;
  fetchRequestsForStaff: (staffId: number, periodId?: string) => Promise<void>;
  fetchRequestSummaries: (periodId: string) => Promise<void>;
  fetchStatistics: (periodId: string) => Promise<void>;
  detectConflicts: (periodId: string) => Promise<void>;
  
  // ユーティリティ
  canSubmitRequests: (periodId: string) => boolean;
  canReviewRequests: () => boolean;
  getRequestsForDate: (date: string) => ShiftRequest[];
  getConflictsForDate: (date: string) => RequestConflict[];
}

export const useShiftRequests = (): UseShiftRequestsReturn => {
  const { user, profile, hasPermission } = useAuth();
  
  // 状態管理
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [periods, setPeriods] = useState<ShiftRequestPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<ShiftRequestPeriod | null>(null);
  const [requestBatch, setRequestBatch] = useState<RequestBatch | null>(null);
  const [requestSummaries, setRequestSummaries] = useState<RequestSummary[]>([]);
  const [conflicts, setConflicts] = useState<RequestConflict[]>([]);
  const [statistics, setStatistics] = useState<RequestStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LocalStorage キー
  const STORAGE_KEYS = {
    REQUESTS: 'shift_requests',
    PERIODS: 'shift_request_periods',
    BATCHES: 'request_batches',
    SUMMARIES: 'request_summaries',
    CONFLICTS: 'request_conflicts',
    STATISTICS: 'request_statistics'
  };

  // データの永続化
  const saveToStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage save error:', error);
    }
  }, []);

  const loadFromStorage = useCallback((key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Storage load error:', error);
      return null;
    }
  }, []);

  // Date型フィールドを復元するヘルパー関数
  const restoreDateFields = useCallback((periods: any[]): ShiftRequestPeriod[] => {
    return periods.map(period => ({
      ...period,
      submissionDeadline: new Date(period.submissionDeadline),
      createdAt: new Date(period.createdAt),
      updatedAt: new Date(period.updatedAt)
    }));
  }, []);

  const restoreRequestDateFields = useCallback((requests: any[]): ShiftRequest[] => {
    return requests.map(request => ({
      ...request,
      submittedAt: new Date(request.submittedAt),
      createdAt: new Date(request.createdAt),
      updatedAt: new Date(request.updatedAt),
      reviewedAt: request.reviewedAt ? new Date(request.reviewedAt) : undefined
    }));
  }, []);

  // 初期データの読み込み
  useEffect(() => {
    const loadInitialData = () => {
      setIsLoading(true);
      try {
        const storedRequestsRaw = loadFromStorage(STORAGE_KEYS.REQUESTS) || [];
        const storedPeriodsRaw = loadFromStorage(STORAGE_KEYS.PERIODS) || [];
        const storedBatch = loadFromStorage(STORAGE_KEYS.BATCHES);
        const storedSummaries = loadFromStorage(STORAGE_KEYS.SUMMARIES) || [];
        const storedConflicts = loadFromStorage(STORAGE_KEYS.CONFLICTS) || [];
        const storedStatistics = loadFromStorage(STORAGE_KEYS.STATISTICS);

        // Date型フィールドを復元
        const storedRequests = restoreRequestDateFields(storedRequestsRaw);
        const storedPeriods = restoreDateFields(storedPeriodsRaw);

        setRequests(storedRequests);
        
        // デモ用：アクティブな期間がない場合は自動作成
        let finalPeriods = storedPeriods;
        let activePeriod = storedPeriods.find((p: ShiftRequestPeriod) => p.isActive);
        
        console.log('🔍 useShiftRequests初期化:', {
          storedPeriodsCount: storedPeriods.length,
          activePeriod: activePeriod ? 'found' : 'not found',
          needsDefaultPeriod: !activePeriod
        });
        
        if (!activePeriod) {
          console.log('📅 デモ用期間を自動作成中...');
          // 来月の勤務希望期間を自動作成
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const targetMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
          
          // 提出期限は今から1週間後
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 7);
          
          const defaultPeriod: ShiftRequestPeriod = {
            id: `period_${Date.now()}_demo`,
            title: `${nextMonth.getFullYear()}年${nextMonth.getMonth() + 1}月勤務希望`,
            description: 'デモ用の勤務希望受付期間',
            targetMonth,
            submissionDeadline: deadline,
            isActive: true,
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          finalPeriods = [...storedPeriods, defaultPeriod];
          activePeriod = defaultPeriod;
          saveToStorage(STORAGE_KEYS.PERIODS, finalPeriods);
          console.log('✅ デモ用期間を作成しました:', defaultPeriod);
        }
        
        setPeriods(finalPeriods);
        setRequestBatch(storedBatch);
        setRequestSummaries(storedSummaries);
        setConflicts(storedConflicts);
        setStatistics(storedStatistics);

        // アクティブな期間を設定
        setCurrentPeriod(activePeriod || null);
        console.log('🎯 currentPeriodを設定:', activePeriod ? 'success' : 'null');
      } catch (error) {
        setError('データの読み込みに失敗しました');
        console.error('Initial data load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [loadFromStorage, STORAGE_KEYS, saveToStorage, restoreDateFields, restoreRequestDateFields]);

  // 勤務希望の作成
  const createRequest = useCallback(async (
    date: string,
    workTypeId: string | null,
    requestType: ShiftRequestType,
    priority: RequestPriority,
    reason?: string
  ): Promise<boolean> => {
    if (!user || !profile || !currentPeriod) return false;

    try {
      const newRequest: ShiftRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        staffId: profile.uid ? parseInt(profile.uid) : 0,
        staffName: profile.displayName || profile.email,
        requestDate: date,
        ...(workTypeId && { workTypeId }),
        requestType,
        priority,
        ...(reason && { reason }),
        status: 'draft',
        submittedAt: new Date(),
        updatedAt: new Date(),
        deadlineDate: currentPeriod.submissionDeadline.toISOString().split('T')[0]
      };

      const updatedRequests = [...requests, newRequest];
      setRequests(updatedRequests);
      saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests);
      return true;
    } catch (error) {
      setError('勤務希望の作成に失敗しました');
      console.error('Create request error:', error);
      return false;
    }
  }, [user, profile, currentPeriod, requests, saveToStorage, STORAGE_KEYS.REQUESTS]);

  // 勤務希望の更新
  const updateRequest = useCallback(async (
    requestId: string, 
    updates: Partial<ShiftRequest>
  ): Promise<boolean> => {
    try {
      const updatedRequests = requests.map(req => 
        req.id === requestId 
          ? { ...req, ...updates, updatedAt: new Date() }
          : req
      );
      setRequests(updatedRequests);
      saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests);
      return true;
    } catch (error) {
      setError('勤務希望の更新に失敗しました');
      console.error('Update request error:', error);
      return false;
    }
  }, [requests, saveToStorage, STORAGE_KEYS.REQUESTS]);

  // 勤務希望の削除
  const deleteRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const updatedRequests = requests.filter(req => req.id !== requestId);
      setRequests(updatedRequests);
      saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests);
      return true;
    } catch (error) {
      setError('勤務希望の削除に失敗しました');
      console.error('Delete request error:', error);
      return false;
    }
  }, [requests, saveToStorage, STORAGE_KEYS.REQUESTS]);

  // 勤務希望の提出
  const submitRequests = useCallback(async (periodId: string): Promise<boolean> => {
    if (!user || !profile) return false;

    try {
      // 指定された期間のドラフト状態の勤務希望を取得
      const staffRequests = requests.filter(req => 
        req.staffId === parseInt(profile.uid || '0') && 
        req.status === 'draft' &&
        req.deadlineDate.includes(periodId) // periodIdが含まれる勤務希望のみ
      );

      if (staffRequests.length === 0) {
        setError('提出する勤務希望がありません');
        return false;
      }

      const updatedRequests = requests.map(req => 
        staffRequests.find(sr => sr.id === req.id)
          ? { ...req, status: 'submitted' as RequestStatus, submittedAt: new Date() }
          : req
      );

      setRequests(updatedRequests);
      saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests);
      return true;
    } catch (error) {
      setError('勤務希望の提出に失敗しました');
      console.error('Submit requests error:', error);
      return false;
    }
  }, [user, profile, requests, saveToStorage, STORAGE_KEYS.REQUESTS, setError]);

  // 勤務希望の承認・拒否
  const reviewRequest = useCallback(async (
    requestId: string,
    status: 'approved' | 'rejected',
    comments?: string
  ): Promise<boolean> => {
    if (!hasPermission('canEditSchedules')) return false;

    try {
      const updatedRequests = requests.map(req => 
        req.id === requestId
          ? {
              ...req,
              status: status as RequestStatus,
              ...(user?.uid && { reviewedBy: user.uid }),
              reviewedAt: new Date(),
              ...(comments && { reviewComments: comments }),
              updatedAt: new Date()
            }
          : req
      );

      setRequests(updatedRequests);
      saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests);
      return true;
    } catch (error) {
      setError('勤務希望の審査に失敗しました');
      console.error('Review request error:', error);
      return false;
    }
  }, [hasPermission, user, requests, saveToStorage, STORAGE_KEYS.REQUESTS]);

  // 一括承認・拒否
  const batchReview = useCallback(async (
    requestIds: string[],
    status: 'approved' | 'rejected',
    comments?: string
  ): Promise<boolean> => {
    if (!hasPermission('canEditSchedules')) return false;

    try {
      const updatedRequests = requests.map(req => 
        requestIds.includes(req.id)
          ? {
              ...req,
              status: status as RequestStatus,
              ...(user?.uid && { reviewedBy: user.uid }),
              reviewedAt: new Date(),
              ...(comments && { reviewComments: comments }),
              updatedAt: new Date()
            }
          : req
      );

      setRequests(updatedRequests);
      saveToStorage(STORAGE_KEYS.REQUESTS, updatedRequests);
      return true;
    } catch (error) {
      setError('一括審査に失敗しました');
      console.error('Batch review error:', error);
      return false;
    }
  }, [hasPermission, user, requests, saveToStorage, STORAGE_KEYS.REQUESTS]);

  // 期間の作成
  const createPeriod = useCallback(async (
    title: string,
    targetMonth: string,
    deadline: Date,
    description?: string,
    departments?: string[]
  ): Promise<boolean> => {
    if (!hasPermission('canCreateSchedules')) return false;

    try {
      // 既存のアクティブ期間を無効化
      const updatedPeriods = periods.map(p => ({ ...p, isActive: false }));

      const newPeriod: ShiftRequestPeriod = {
        id: `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        ...(description && { description }),
        targetMonth,
        submissionDeadline: deadline,
        isActive: true,
        createdBy: user?.uid || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(departments && { departments })
      };

      const finalPeriods = [...updatedPeriods, newPeriod];
      setPeriods(finalPeriods);
      setCurrentPeriod(newPeriod);
      saveToStorage(STORAGE_KEYS.PERIODS, finalPeriods);
      return true;
    } catch (error) {
      setError('期間の作成に失敗しました');
      console.error('Create period error:', error);
      return false;
    }
  }, [hasPermission, user, periods, saveToStorage, STORAGE_KEYS.PERIODS]);

  // ユーティリティ関数
  const canSubmitRequests = useCallback((periodId: string): boolean => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return false;
    return period.isActive && new Date() < period.submissionDeadline;
  }, [periods]);

  const canReviewRequests = useCallback((): boolean => {
    return hasPermission('canEditSchedules');
  }, [hasPermission]);

  const getRequestsForDate = useCallback((date: string): ShiftRequest[] => {
    return requests.filter(req => req.requestDate === date);
  }, [requests]);

  const getConflictsForDate = useCallback((date: string): RequestConflict[] => {
    return conflicts.filter(conflict => conflict.date === date);
  }, [conflicts]);

  // データ取得の実装（今回は省略、実際にはAPIから取得）
  const fetchRequestsForPeriod = useCallback(async (periodId: string): Promise<void> => {
    // 実装は省略（Firebase/APIからのデータ取得）
    console.log('Fetching requests for period:', periodId);
  }, []);

  const fetchRequestsForStaff = useCallback(async (staffId: number, periodId?: string): Promise<void> => {
    // 実装は省略
    console.log('Fetching requests for staff:', staffId, 'period:', periodId);
  }, []);

  const fetchRequestSummaries = useCallback(async (periodId: string): Promise<void> => {
    // 実装は省略
    console.log('Fetching request summaries for period:', periodId);
  }, []);

  const fetchStatistics = useCallback(async (periodId: string): Promise<void> => {
    // 実装は省略
    console.log('Fetching statistics for period:', periodId);
  }, []);

  const detectConflicts = useCallback(async (periodId: string): Promise<void> => {
    // 実装は省略
    console.log('Detecting conflicts for period:', periodId);
  }, []);

  const updatePeriod = useCallback(async (periodId: string, updates: Partial<ShiftRequestPeriod>): Promise<boolean> => {
    // 実装は省略
    console.log('Updating period:', periodId, 'with updates:', updates);
    return false;
  }, []);

  const closePeriod = useCallback(async (periodId: string): Promise<boolean> => {
    // 実装は省略
    console.log('Closing period:', periodId);
    return false;
  }, []);

  return {
    // 状態
    requests,
    periods,
    currentPeriod,
    requestBatch,
    requestSummaries,
    conflicts,
    statistics,
    isLoading,
    error,

    // 基本操作
    createRequest,
    updateRequest,
    deleteRequest,
    submitRequests,

    // 管理操作
    reviewRequest,
    batchReview,

    // 期間管理
    createPeriod,
    updatePeriod,
    closePeriod,

    // データ取得
    fetchRequestsForPeriod,
    fetchRequestsForStaff,
    fetchRequestSummaries,
    fetchStatistics,
    detectConflicts,

    // ユーティリティ
    canSubmitRequests,
    canReviewRequests,
    getRequestsForDate,
    getConflictsForDate
  };
};
