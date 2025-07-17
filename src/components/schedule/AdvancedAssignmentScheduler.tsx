import { Zap, Folder } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Assignment, CustomRule, Staff, WorkType, WorkCalendarDay, MemberWorkConfig, StaffSkill, Group } from '../../types';
import { useConfiguration } from '../../hooks/useConfiguration';
import './AdvancedAssignmentScheduler.css';
import CustomRuleStep from './CustomRuleStep';
import MemberConfigStep from './MemberConfigStep';
import PeriodSetupStep from './PeriodSetupStep';
import ScheduleGenerationStep from './ScheduleGenerationStep';
import WorkTypeSetupStep from './WorkTypeSetupStep';
import WorkCalendarStep from './WorkCalendarStep';
import SimpleConfigurationManager from './SimpleConfigurationManager';
import LoadConfirmDialog from './LoadConfirmDialog';

interface AdvancedAssignmentSchedulerProps {
  staffMembers: Staff[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
}

const AdvancedAssignmentScheduler: React.FC<AdvancedAssignmentSchedulerProps> = ({
  staffMembers,
  onAssignmentsChange
}) => {
  // ステップ管理
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // ステップ1: 期間設定の状態管理
  const getCurrentMonth = () => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM形式
  };

  const getMonthStartEnd = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    
    // YYYY-MM-DD形式で文字列を構築するヘルパー関数
    const formatDate = (y: number, m: number, d: number) => {
      return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    };
    
    // 開始日：その月の1日
    const startStr = formatDate(year, month, 1);
    
    // 終了日：その月の最終日を取得
    const lastDayOfMonth = new Date(year, month, 0).getDate(); // 翌月の0日 = 当月の最終日
    const endStr = formatDate(year, month, lastDayOfMonth);
    
    return {
      start: startStr,
      end: endStr
    };
  };

  const currentMonth = getCurrentMonth();
  const defaultDates = getMonthStartEnd(currentMonth);

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [dateRangeMode, setDateRangeMode] = useState<'custom' | 'monthly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // 月が変更された時に開始日と終了日を自動更新
  React.useEffect(() => {
    if (dateRangeMode === 'monthly' && selectedMonth) {
      const dates = getMonthStartEnd(selectedMonth);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  }, [selectedMonth, dateRangeMode]);

  // ステップ2: 勤務形態設定の状態管理
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);

  // ステップ3: 勤務カレンダーの状態管理
  const [workCalendar, setWorkCalendar] = useState<WorkCalendarDay[]>([]);

  // ステップ4: メンバー別勤務設定の状態管理
  const [memberWorkConfig, setMemberWorkConfig] = useState<MemberWorkConfig>({});

  // ステップ5: カスタムルール設定の状態管理
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);

  // スキル情報の状態管理
  const [availableSkills] = useState<StaffSkill[]>([
    { id: 'leadership', name: 'リーダーシップ', category: 'leadership' },
    { id: 'icu_certified', name: 'ICU認定', category: 'certification' },
    { id: 'emergency_care', name: '救急看護', category: 'technical' },
    { id: 'senior_experience', name: '上級者経験', category: 'experience' },
    { id: 'new_grad_support', name: '新人指導', category: 'leadership' },
    { id: 'night_shift_qualified', name: '夜勤資格', category: 'certification' },
    { id: 'critical_care', name: '重症患者ケア', category: 'technical' },
    { id: 'medication_specialist', name: '薬剤管理専門', category: 'technical' },
  ]);

  // グループ情報の状態管理（ダミーデータ）
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 'group_all',
      name: '全スタッフ',
      description: '全てのスタッフメンバー',
      staffIds: staffMembers.map(staff => staff.id),
      isActive: true
    },
    {
      id: 'group_senior',
      name: 'シニアスタッフ',
      description: '経験豊富なスタッフ',
      staffIds: staffMembers.filter(staff => staff.role.includes('主任') || staff.role.includes('師長')).map(staff => staff.id),
      isActive: true
    },
    {
      id: 'group_night',
      name: '夜勤対応チーム',
      description: '夜勤業務に対応可能なスタッフ',
      staffIds: staffMembers.filter(staff => !staff.role.includes('新人')).map(staff => staff.id),
      isActive: true
    }
  ]);

  // ステップ6: スケジュール生成の状態管理
  const [generatedAssignments, setGeneratedAssignments] = useState<Assignment[]>([]);

  // Configuration Manager の状態管理
  const [isConfigManagerOpen, setIsConfigManagerOpen] = useState(false);
  const [isLoadConfirmOpen, setIsLoadConfirmOpen] = useState(false);
  const [hasShownInitialDialog, setHasShownInitialDialog] = useState(false);
  const {
    history,
    autoSave,
    isAutoSaveEnabled
  } = useConfiguration();

  // ユーザーの手動保存設定のみ取得（自動保存を除外、最新2件まで）
  const userConfigs = history
    .filter(config => !config.metadata.autoSaved && config.name !== '')
    .slice(0, 2);

  // 初回表示時のマイ設定読み込み確認
  useEffect(() => {
    if (currentStep === 1 && userConfigs.length > 0 && !hasShownInitialDialog) {
      setIsLoadConfirmOpen(true);
      setHasShownInitialDialog(true);
    }
  }, [currentStep, userConfigs.length, hasShownInitialDialog]);

  // 自動保存用のsettings object を作成
  const getCurrentSettings = useCallback(() => ({
    workTypes,
    workCalendar,
    groups,
    customRules,
    memberWorkConfigs: memberWorkConfig
  }), [workTypes, workCalendar, groups, customRules, memberWorkConfig]);

  // 自動保存の実行（最終ステップでのみ）
  useEffect(() => {
    if (isAutoSaveEnabled && currentStep === 6) {
      const settings = getCurrentSettings();
      autoSave(settings, currentStep);
    }
  }, [currentStep, isAutoSaveEnabled, autoSave, getCurrentSettings]);

  // 設定読み込みハンドラー（SimpleConfigurationManagerから）
  const handleLoadConfiguration = async (settings: any) => {
    try {
      // ステップ1でのみ設定読み込みを許可
      if (currentStep !== 1) {
        console.warn('設定の読み込みはステップ1でのみ可能です');
        return;
      }
      
      if (settings.workTypes) setWorkTypes(settings.workTypes);
      if (settings.workCalendar) setWorkCalendar(settings.workCalendar);
      if (settings.groups) setGroups(settings.groups);
      if (settings.customRules) setCustomRules(settings.customRules);
      if (settings.memberWorkConfigs) setMemberWorkConfig(settings.memberWorkConfigs);
      
      // 設定内容に応じて適切なステップに移動
      let targetStep = 2;
      if (settings.workTypes?.length > 0) targetStep = 3;
      if (settings.workCalendar?.length > 0) targetStep = 4;
      if (settings.groups?.length > 1) targetStep = 5;
      if (settings.customRules?.length > 0) targetStep = 6;
      
      setCurrentStep(targetStep);
      setIsConfigManagerOpen(false);
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
    }
  };

  // 設定読み込み時のハンドリング
  const handleLoadConfigurationFromDialog = (config: any) => {
    try {
      if (config.settings?.workTypes) setWorkTypes(config.settings.workTypes);
      if (config.settings?.workCalendar) setWorkCalendar(config.settings.workCalendar);
      if (config.settings?.groups) setGroups(config.settings.groups);
      if (config.settings?.customRules) setCustomRules(config.settings.customRules);
      if (config.settings?.memberWorkConfigs) setMemberWorkConfig(config.settings.memberWorkConfigs);
      
      // 設定内容に応じて適切なステップに移動
      let targetStep = 2; // デフォルトはステップ2
      
      if (config.settings?.workTypes?.length > 0) {
        targetStep = 3; // 勤務形態が設定済みならステップ3へ
      }
      if (config.settings?.workCalendar?.length > 0) {
        targetStep = 4; // 勤務カレンダーが設定済みならステップ4へ
      }
      if (config.settings?.groups?.length > 1) { // 全スタッフ以外のグループがある
        targetStep = 5; // グループが設定済みならステップ5へ
      }
      if (config.settings?.customRules?.length > 0) {
        targetStep = 6; // カスタムルールが設定済みならステップ6へ
      }
      
      setCurrentStep(targetStep);
      setIsLoadConfirmOpen(false);
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
      setIsLoadConfirmOpen(false);
    }
  };

  // 新規作成選択時
  const handleCreateNew = () => {
    setIsLoadConfirmOpen(false);
    // 現在のステップ1のままで続行
  };

  // ステップ1のボタン有効化の条件を明確にする関数
  const isStep1Completed = () => {
    if (dateRangeMode === 'custom') {
      return startDate.trim() !== '' && endDate.trim() !== '';
    } else if (dateRangeMode === 'monthly') {
      return selectedMonth.trim() !== '';
    }
    return false;
  };

  // ステップ2のボタン有効化の条件
  const isStep2Completed = () => {
    return workTypes.length > 0;
  };

  // ステップ3のボタン有効化の条件
  const isStep3Completed = () => {
    // 期間が設定されていて、かつ勤務形態が1つ以上ある場合に有効
    if (!isStep1Completed() || workTypes.length === 0) return false;
    // 全日程に対して設定があることを推奨するが、必須ではない
    return true;
  };

  // ステップ4のボタン有効化の条件
  const isStep4Completed = () => {
    // 全メンバーが最低1つの勤務形態で設定されていることを確認
    return staffMembers.length > 0 && workTypes.length > 0;
  };

  // ステップ5のボタン有効化の条件（オプション）
  const isStep5Completed = () => {
    return true; // カスタムルールは任意なので常にtrue
  };

  // ステップ6のボタン有効化の条件
  const isStep6Completed = () => {
    return generatedAssignments.length > 0;
  };

  // 現在のステップの情報を取得
  const getCurrentStepInfo = () => {
    switch (currentStep) {
      case 1:
        return { icon: '📅', title: '期間設定', description: 'スケジュールを作成する期間を設定してください' };
      case 2:
        return { icon: '🏷️', title: '勤務形態設定', description: '日勤、夜勤など勤務形態を定義してください' };
      case 3:
        return { icon: '�', title: '勤務カレンダー', description: '各日に必要な勤務形態を選択してください' };
      case 4:
        return { icon: '�👥', title: 'グループ設定', description: 'スタッフをグループに分けてください' };
      case 5:
        return { icon: '⚙️', title: 'カスタムルール', description: '詳細なスケジューリングルールを設定してください' };
      case 6:
        return { icon: '✨', title: 'スケジュール生成', description: '設定に基づいてスケジュールを生成します' };
      default:
        return { icon: '📅', title: '期間設定', description: 'スケジュールを作成する期間を設定してください' };
    }
  };

  // 現在のステップのボタン有効化
  const isCurrentStepCompleted = () => {
    switch (currentStep) {
      case 1: return isStep1Completed();
      case 2: return isStep2Completed();
      case 3: return isStep3Completed();
      case 4: return isStep4Completed();
      case 5: return isStep5Completed();
      case 6: return isStep6Completed();
      default: return false;
    }
  };

  // 次のステップに進む
  const handleNextStep = () => {
    if (currentStep < totalSteps && isCurrentStepCompleted()) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === totalSteps) {
      // 最終ステップの場合の処理
      alert('設定が完了しました！スケジュール生成の準備ができました。');
    }
  };

  // 前のステップに戻る
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="advanced-assignment-scheduler">
      {/* タイトルと設定管理ボタン */}
      <div className="scheduler-header">
        <h3 className="scheduler-title">
          <Zap className="scheduler-icon" />
          高度なスケジュール設定
        </h3>
        {/* マイ設定ボタンはステップ1でのみ表示 */}
        {currentStep === 1 && (
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => setIsConfigManagerOpen(true)}
              title="マイ設定を管理"
            >
              <Folder size={16} />
              マイ設定
            </button>
          </div>
        )}
      </div>

      {/* プログレス表示 */}
      <div className="schedule-progress">
        <div className="progress-header">
          <h4>{getCurrentStepInfo().icon}{getCurrentStepInfo().title}（ステップ {currentStep}/{totalSteps}）</h4>
          <span className="progress-text">{getCurrentStepInfo().description}</span>
        </div>
      </div>

      {/* ステップ1: 期間設定 */}
      {currentStep === 1 && (
        <PeriodSetupStep
          startDate={startDate}
          endDate={endDate}
          dateRangeMode={dateRangeMode}
          selectedMonth={selectedMonth}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDateRangeModeChange={setDateRangeMode}
          onSelectedMonthChange={setSelectedMonth}
          isCompleted={isStep1Completed()}
        />
      )}

      {/* ステップ2: 勤務形態設定 */}
      {currentStep === 2 && (
        <WorkTypeSetupStep
          workTypes={workTypes}
          onWorkTypesChange={setWorkTypes}
          isCompleted={workTypes.length > 0}
        />
      )}

      {/* ステップ3: 勤務カレンダー */}
      {currentStep === 3 && (
        <WorkCalendarStep
          startDate={startDate ? new Date(startDate) : new Date()}
          endDate={endDate ? new Date(endDate) : new Date()}
          workTypes={workTypes}
          workCalendar={workCalendar}
          onWorkCalendarChange={setWorkCalendar}
          isCompleted={workCalendar.length > 0}
        />
      )}

      {/* ステップ4: メンバー設定 */}
      {currentStep === 4 && (
        <MemberConfigStep
          staffMembers={staffMembers}
          workTypes={workTypes}
          memberWorkConfig={memberWorkConfig}
          onMemberWorkConfigChange={setMemberWorkConfig}
          isCompleted={isStep4Completed()}
        />
      )}

      {/* ステップ5: カスタムルール設定 */}
      {currentStep === 5 && (
        <CustomRuleStep
          staffMembers={staffMembers}
          groups={groups}
          workTypes={workTypes}
          customRules={customRules}
          onCustomRulesChange={setCustomRules}
          onGroupsChange={setGroups}
          availableSkills={availableSkills}
        />
      )}

      {/* ステップ6: スケジュール生成 */}
      {currentStep === 6 && (
        <ScheduleGenerationStep
          startDate={startDate}
          endDate={endDate}
          dateRangeMode={dateRangeMode}
          selectedMonth={selectedMonth}
          staffMembers={staffMembers}
          workTypes={workTypes}
          workCalendar={workCalendar}
          groups={groups}
          memberWorkConfigs={Object.entries(memberWorkConfig).map(([memberId, workTypeConfigs]) => ({
            memberId: parseInt(memberId),
            workTypeConfigs: Object.entries(workTypeConfigs).map(([workTypeId, config]) => ({
              workTypeId,
              minDays: (config as { minDays: number; maxDays: number }).minDays,
              maxDays: (config as { minDays: number; maxDays: number }).maxDays
            }))
          }))}
          customRules={customRules}
          onAssignmentsChange={(assignments) => {
            setGeneratedAssignments(assignments);
            onAssignmentsChange(assignments);
          }}
        />
      )}

      {/* Navigation */}
      <div className="step-navigation">
        <div className="step-buttons">
          <button
            className="btn-secondary"
            disabled={currentStep === 1}
            onClick={handlePrevStep}
          >
            ← 前へ
          </button>
          <button
            className="btn-primary"
            disabled={!isCurrentStepCompleted()}
            onClick={handleNextStep}
          >
            {currentStep < totalSteps ? '次へ →' : '完了'}
          </button>
        </div>
      </div>

      {/* Simple Configuration Manager Modal */}
      <SimpleConfigurationManager
        isOpen={isConfigManagerOpen}
        onClose={() => setIsConfigManagerOpen(false)}
        onLoadConfiguration={handleLoadConfiguration}
        currentSettings={getCurrentSettings()}
        currentStep={currentStep}
        onSaveSuccess={(configId) => {
          console.log('設定が保存されました:', configId);
        }}
      />

      {/* Load Confirm Dialog */}
      <LoadConfirmDialog
        isOpen={isLoadConfirmOpen}
        onClose={() => setIsLoadConfirmOpen(false)}
        onLoadConfiguration={handleLoadConfigurationFromDialog}
        onCreateNew={handleCreateNew}
        configurations={userConfigs}
      />
    </div>
  );
};

export default AdvancedAssignmentScheduler;