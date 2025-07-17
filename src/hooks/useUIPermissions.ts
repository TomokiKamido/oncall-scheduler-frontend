import { useAuth } from './useAuth';
import { useRole } from './useRole';

export const useUIPermissions = () => {
  const { hasPermission } = useAuth();
  const { role } = useRole();

  // ナビゲーションタブの表示制御
  const showScheduleTab = () => {
    return hasPermission('canCreateSchedules') || hasPermission('canEditSchedules');
  };

  const showStaffTab = () => {
    return hasPermission('canManageStaff');
  };

  const showReportsTab = () => {
    return hasPermission('canViewReports');
  };

  // ダッシュボード機能の表示制御
  const showDepartmentManagement = () => {
    return hasPermission('canManageDepartments');
  };

  const showUserManagement = () => {
    return hasPermission('canManageUsers');
  };

  const showAdvancedScheduling = () => {
    return hasPermission('canCreateSchedules');
  };

  const showStaffManagement = () => {
    return hasPermission('canManageStaff');
  };

  // 機能ボタンの表示制御
  const showCreateScheduleButton = () => {
    return hasPermission('canCreateSchedules');
  };

  const showEditScheduleButton = () => {
    return hasPermission('canEditSchedules');
  };

  const showDeleteScheduleButton = () => {
    return hasPermission('canDeleteSchedules');
  };

  // ロール別表示制御
  const isAdmin = () => role === 'admin';
  const isManager = () => role === 'manager';
  const isStaff = () => role === 'staff';

  // 部署関連の表示制御
  const showDepartmentData = () => {
    return hasPermission('canViewDepartmentData') || isAdmin();
  };

  const showAllSchedules = () => {
    return hasPermission('canViewAllSchedules') || isAdmin();
  };

  // 勤務希望関連の表示制御
  const showShiftRequestApproval = () => {
    return isManager() || isAdmin();
  };

  const showShiftRequestSubmission = () => {
    // 全ユーザーが勤務希望提出可能
    return true;
  };

  return {
    // ナビゲーション制御
    showScheduleTab,
    showStaffTab,
    showReportsTab,
    
    // ダッシュボード機能制御
    showDepartmentManagement,
    showUserManagement,
    showAdvancedScheduling,
    showStaffManagement,
    
    // 機能ボタン制御
    showCreateScheduleButton,
    showEditScheduleButton,
    showDeleteScheduleButton,
    
    // ロール判定
    isAdmin,
    isManager,
    isStaff,
    
    // データ表示制御
    showDepartmentData,
    showAllSchedules,
    
    // 勤務希望制御
    showShiftRequestApproval,
    showShiftRequestSubmission,
    
    // 汎用権限チェック
    hasPermission
  };
};
