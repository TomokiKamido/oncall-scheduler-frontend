// アプリケーション全体で使用される定数

// スタッフ関連
export const STAFF_STATUS = {
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
} as const;

export const DEFAULT_STAFF_ROLES = [
  'シニアエンジニア',
  'プロダクトマネージャー',
  'DevOpsエンジニア',
  'QAエンジニア',
  'フロントエンドエンジニア',
  'バックエンドエンジニア',
  'デザイナー',
] as const;

export const DEFAULT_DEPARTMENTS = [
  '開発部',
  '企画部',
  'インフラ部',
  '品質保証部',
  'デザイン部',
  '営業部',
] as const;

// 制限値
export const LIMITS = {
  STAFF_LIMIT_MIN: 0,
  STAFF_LIMIT_MAX: 31,
  ASSIGNMENT_PERIOD_MAX_DAYS: 365,
} as const;

// UI関連
export const COLORS = {
  PRIMARY: '#6366f1',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
} as const;

// デフォルト値
export const DEFAULTS = {
  TANAKA_LIMIT: 1,
  ASSIGNMENT_PERIOD_DAYS: 14,
  PAGE_SIZE: 10,
} as const;

// ルートパス
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  STAFF: '/staff',
  SCHEDULE: '/schedule',
} as const;

// タブ名
export const SCHEDULE_TABS = {
  CALENDAR: 'calendar',
  LIST: 'list',
  ASSIGNMENT: 'assignment',
} as const;

// メッセージ
export const MESSAGES = {
  SUCCESS: {
    STAFF_CREATED: 'スタッフが正常に追加されました',
    STAFF_UPDATED: 'スタッフ情報が更新されました',
    STAFF_DELETED: 'スタッフが削除されました',
    ASSIGNMENT_GENERATED: '割り当てが正常に生成されました',
  },
  ERROR: {
    REQUIRED_FIELDS: '必須フィールドを入力してください',
    INVALID_EMAIL: '有効なメールアドレスを入力してください',
    ASSIGNMENT_FAILED: '割り当ての生成に失敗しました',
    NO_ACTIVE_STAFF: 'アクティブなスタッフがいません',
  },
  WARNING: {
    DELETE_CONFIRMATION: '本当に削除しますか？',
    NO_ASSIGNMENTS: '割り当てがありません',
  },
} as const;

// 日付フォーマット
export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  JAPANESE: 'yyyy年MM月dd日',
  DISPLAY: 'M/d',
  DISPLAY_WITH_DAY: 'M/d(E)',
} as const;
