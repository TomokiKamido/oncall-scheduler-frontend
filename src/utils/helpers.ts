import { Assignment, AssignmentStats, Staff } from '../types';

// スタッフ関連のユーティリティ
export const getActiveStaff = (staff: Staff[]): Staff[] => {
  return staff.filter(s => s.status === 'active');
};

export const findStaffById = (staff: Staff[], id: number): Staff | undefined => {
  return staff.find(s => s.id === id);
};

export const filterStaffBySearch = (staff: Staff[], searchTerm: string): Staff[] => {
  if (!searchTerm.trim()) return staff;

  const term = searchTerm.toLowerCase();
  return staff.filter(
    s =>
      s.name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.role.toLowerCase().includes(term) ||
      s.department.toLowerCase().includes(term)
  );
};

// 割り当て統計の計算
export const calculateAssignmentStats = (
  assignments: Assignment[],
  staff: Staff[]
): AssignmentStats[] => {
  const stats: { [key: number]: AssignmentStats } = {};

  // 各スタッフの統計を初期化
  staff.forEach(s => {
    stats[s.id] = {
      totalDays: 0,
      workDays: 0,
      offDays: 0,
      workTypes: {}
    };
  });

  // 各スタッフの割り当て回数と勤務形態をカウント
  assignments.forEach(assignment => {
    if (stats[assignment.staffId]) {
      stats[assignment.staffId].workDays += 1;
      const workTypeId = assignment.workTypeId || assignment.shift;
      stats[assignment.staffId].workTypes[workTypeId] = (stats[assignment.staffId].workTypes[workTypeId] || 0) + 1;
    }
  });

  // 総日数と休日を計算（簡易版）
  Object.keys(stats).forEach(staffIdStr => {
    const staffId = parseInt(staffIdStr);
    if (stats[staffId]) {
      stats[staffId].totalDays = 30; // 仮の値、実際の日数計算が必要
      stats[staffId].offDays = stats[staffId].totalDays - stats[staffId].workDays;
    }
  });

  return staff.map(s => stats[s.id]);
};

// スタッフ制限のバリデーション
export const validateStaffLimit = (limit: number): number => {
  if (limit < 0) return 0;
  if (limit > 31) return 31;
  return limit;
};

// 配列のユーティリティ
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 数値フォーマット
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// オブジェクトのユーティリティ
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
