// スタッフ関連の型定義
export interface Staff {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  workDays?: number;
  skills?: StaffSkillAssignment[];     // スキル情報
}

// スキル関連の型定義
export interface StaffSkill {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface StaffSkillAssignment {
  skillId: string;
  level: number; // e.g., 1-5
  assignedAt: Date;
}

// スケジュール関連の型定義
export interface Schedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  staffId: number;
  staffName?: string;
}

// 割り当て関連の型定義
export interface Assignment {
  id: string;
  date: string;
  staffId: number;
  staffName: string;
  shift: string; // 勤務形態IDに変更
  workTypeId?: string; // 勤務形態ID
}

// 割り当て統計
export interface AssignmentStats {
  totalDays: number;
  workDays: number;
  offDays: number;
  workTypes: { [key: string]: number };
}

// 勤務形態関連の型定義
export interface WorkType {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  isDefault: boolean;
  description?: string;
  // 平日の人数設定
  weekdayMinStaff?: number;
  weekdayMaxStaff?: number;
  // 休日の人数設定
  holidayMinStaff?: number;
  holidayMaxStaff?: number;
  // 後方互換性のため残す（非推奨）
  minStaff?: number;
  maxStaff?: number;
}

// 勤務カレンダー関連の型定義
export interface WorkCalendarDay {
  date: string;
  requiredWorkTypes: string[]; // 必要な勤務形態のIDリスト
  isEmpty?: boolean; // カレンダー表示用の空セル
  // 祝日・特別日設定
  isHoliday?: boolean;
  holidayName?: string;
  holidayType?: 'national' | 'hospital' | 'department';
  useHolidayStaffing?: boolean; // 休日人員体制を使うか
  isRecurring?: boolean; // 毎年繰り返すか
}

// 祝日設定用の型定義
export interface HolidayConfig {
  id: string;
  date: string;
  name: string;
  type: 'national' | 'hospital' | 'department';
  isRecurring: boolean;
  useHolidayStaffing: boolean;
  description?: string;
}

export interface WorkCalendar {
  days: WorkCalendarDay[];
}

// グループ関連の型定義
export interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
  staffIds: number[];
  maxDailyAssignments?: number;
  isActive: boolean;
}

// ドラッグ&ドロップ関連の型定義
export interface DragStaff {
  id: number;
  name: string;
  role: string;
}

// ユーザー権限管理関連の型定義
export type UserRole = 'admin' | 'manager' | 'staff';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  disabled: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  department: string;
  managedDepartments: string[];
  isActive: boolean;
  createdAt: Date | { toDate(): Date }; // Firestore Timestamp | Date
  updatedAt: Date | { toDate(): Date }; // Firestore Timestamp | Date
  chiefOf?: string[]; // 管理している部門のリスト
  hosp?: string; // 病院名
}

export type MergedUser = AuthUser & UserProfile;

// 権限の詳細を定義
export interface RolePermissions {
  canManageUsers: boolean;
  canCreateSchedules: boolean;
  canEditSchedules: boolean;
  canDeleteSchedules: boolean;
  canViewAllSchedules: boolean;
  canManageStaff: boolean;
  canViewReports: boolean;
  canManageDepartments: boolean;
  canManagePermissions: boolean;
  canViewDepartmentData: boolean;
}

// 権限設定
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canManageUsers: true,
    canCreateSchedules: true,
    canEditSchedules: true,
    canDeleteSchedules: true,
    canViewAllSchedules: true,
    canManageStaff: true,
    canViewReports: true,
    canManageDepartments: true,
    canManagePermissions: true,
    canViewDepartmentData: true,
  },
  manager: {
    canManageUsers: false,
    canCreateSchedules: true,
    canEditSchedules: true,
    canDeleteSchedules: true,
    canViewAllSchedules: true,
    canManageStaff: true,
    canViewReports: true,
    canManageDepartments: false, // 部署の追加・削除は不可
    canManagePermissions: true, // 部署内の権限管理
    canViewDepartmentData: true, // 自部署のみ
  },
  staff: {
    canManageUsers: false,
    canCreateSchedules: false,
    canEditSchedules: false,
    canDeleteSchedules: false,
    canViewAllSchedules: false, // 自分のスケジュールのみ
    canManageStaff: false,
    canViewReports: false,
    canManageDepartments: false,
    canManagePermissions: false,
    canViewDepartmentData: true, // 自部署のデータは閲覧可能
  },
};

// メンバー個別勤務設定関連の型定義
export interface MemberWorkConfig {
  [memberId: number]: {
    [workTypeId: string]: {
      minDays: number;
      maxDays: number;
    }
  }
}

// === 設定管理システム用の型定義 ===

// 設定履歴管理
export interface ConfigurationHistory {
  id: string;
  userId: string;
  facilityId?: string;
  timestamp: string;
  name?: string; // ユーザー定義の設定名
  description?: string;
  settings: {
    workTypes: WorkType[];
    workCalendar: WorkCalendarDay[];
    groups: Group[];
    customRules: CustomRule[];
    memberWorkConfigs: Record<string, unknown>;
  };
  metadata: {
    templateUsed?: string;
    modificationsFromTemplate: string[];
    stepCompleted: number; // 完了したステップ数
    totalSteps: number;
    autoSaved: boolean;
    version: string;
  };
  tags: string[];
  starred: boolean;
  isDefault: boolean; // デフォルト設定として使用
}

// お気に入り設定
export interface FavoriteConfiguration {
  id: string;
  historyId: string;
  userId: string;
  name: string;
  description?: string;
  category: 'recent' | 'favorite' | 'template' | 'shared';
  usageCount: number;
  lastUsed: string;
  quickAccess: boolean; // クイックアクセス対象
}

// 設定差分
export interface ConfigurationDiff {
  step: number;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
  reason?: string;
}

// 設定管理の状態
export interface ConfigurationManager {
  currentConfig?: ConfigurationHistory;
  history: ConfigurationHistory[];
  favorites: FavoriteConfiguration[];
  isAutoSaveEnabled: boolean;
  autoSaveInterval: number;
  maxHistoryCount: number;
}

// 設定エクスポート/インポート
export interface ConfigurationExport {
  version: string;
  exportDate: string;
  configurations: ConfigurationHistory[];
  metadata: {
    appVersion: string;
    userAgent: string;
    exportedBy: string;
  };
}

// === 勤務希望システム関連の型定義 ===
export type ShiftRequestType = 'prefer' | 'avoid' | 'unavailable' | 'mandatory';
export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending_review';
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ShiftRequest {
  id: string;
  staffId: number;
  staffName: string;
  requestDate: string;
  workTypeId?: string; // 特定の勤務形態への希望
  requestType: ShiftRequestType;
  priority: RequestPriority;
  reason?: string;
  comments?: string;
  status: RequestStatus;
  submittedAt: Date;
  updatedAt: Date;
  reviewedBy?: string; // 承認者のUID
  reviewedAt?: Date;
  reviewComments?: string;
  deadlineDate: string; // 希望提出期限
}

export interface ShiftRequestPeriod {
  id: string;
  title: string;
  description?: string;
  targetMonth: string; // YYYY-MM形式
  submissionDeadline: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  departments?: string[]; // 対象部署
}

export interface RequestBatch {
  id: string;
  staffId: number;
  periodId: string;
  requests: ShiftRequest[];
  status: 'draft' | 'submitted' | 'reviewed';
  submittedAt?: Date;
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
}

export interface RequestSummary {
  staffId: number;
  staffName: string;
  department: string;
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  submissionDate?: Date;
  lastUpdated: Date;
}

export interface RequestConflict {
  id: string;
  date: string;
  workTypeId: string;
  conflictingRequests: ShiftRequest[];
  conflictType: 'overdemand' | 'underdemand' | 'skill_shortage';
  severity: 'low' | 'medium' | 'high';
  suggestedResolution?: string;
}

// 勤務希望の統計情報
export interface RequestStatistics {
  periodId: string;
  totalStaff: number;
  submittedStaff: number;
  submissionRate: number;
  totalRequests: number;
  approvedRate: number;
  rejectedRate: number;
  conflictCount: number;
  departmentStats: {
    department: string;
    submissionRate: number;
    approvalRate: number;
  }[];
  requestTypeDistribution: {
    type: ShiftRequestType;
    count: number;
    percentage: number;
  }[];
}

// === 部署管理関連の型定義 ===
export interface Department {
  id: string;
  name: string;
  description: string;
  managerId?: string; // 所属長のUID
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentStats {
  totalStaff: number;
  activeStaff: number;
  pendingRequests: number;
  completedSchedules: number;
}

// 権限管理関連の型定義
export interface UserPermission {
  userId: string;
  departmentId: string;
  role: UserRole;
  canManageDepartment: boolean;
  grantedBy: string;
  grantedAt: Date;
}

// === 既存の型定義 ===

// 高度な設定（カスタムルール）関連の型定義

// ルールの種類
export type RuleType = 'work_type_count' | 'skill_requirement' | 'staff_conflict';

// 勤務回数制限ルール
export interface WorkTypeCountSettings {
  type: 'work_type_count';
  workTypeCountLimits: {
    workTypeId: string;
    min: number;
    max: number;
  }[];
  period: 'month' | 'week';
}

// スキル要件ルール
export interface SkillRequirementSettings {
  type: 'skill_requirement';
  requirements: {
    skillId: string;
    requiredLevel: number;
    requiredCount: number;
    workTypeIds: string[]; // 対象となる勤務形態
  }[];
}

// スタッフ競合ルール
export interface StaffConflictSettings {
  type: 'staff_conflict';
  conflicts: {
    staffIds: number[];
    workTypeIds: string[];
    separation: number; // 0: 同日不可, 1: 連続日不可など
  }[];
}

// ルール設定のUnion型
export type RuleSettings =
  | WorkTypeCountSettings
  | SkillRequirementSettings
  | StaffConflictSettings;

// カスタムルールの本体
export interface CustomRule {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  priority: number;
  settings: RuleSettings;
  groupId: string; // Add groupId property
}


// 設定保存関連の型定義
export interface ConfigurationSettings {
  id: string;
  userId: string;
  facilityId?: string;
  timestamp: string;
  name?: string; // ユーザー定義の設定名
  description?: string;
  workTypes?: WorkType[];
  workCalendar?: WorkCalendarDay[];
  groups?: Group[];
  customRules?: CustomRule[];
  memberWorkConfigs?: Record<string, unknown>;
  templateUsed?: string;
  modificationsFromTemplate?: string[];
  stepCompleted?: number; // 完了したステップ数
  totalSteps?: number;
  autoSaved?: boolean;
  version?: string;
  tags?: string[];
  starred?: boolean;
  isDefault?: boolean; // デフォルト設定として使用
}
