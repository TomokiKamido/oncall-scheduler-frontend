// ステップ管理に関する共通の型定義
import { CustomRule, Group } from '../../types';

export interface ScheduleStepData {
    // ステップ1: 期間設定
    periodData: {
        startDate: string;
        endDate: string;
        dateRangeMode: 'custom' | 'monthly';
        selectedMonth: string;
    };

    // ステップ2: グループ設定
    groupData: {
        groups: Group[];
        newGroupName: string;
        newGroupDescription: string;
        selectedStaffForNewGroup: number[];
    };

    // ステップ3: カスタムルール設定
    customRuleData: {
        customRules: CustomRule[];
    };
}

export interface ScheduleStepProps {
    isCompleted: boolean;
    onStepComplete?: () => void;
    onStepChange?: (stepData: any) => void;
}

// 型の再エクスポート
export type { CustomRule, Group } from '../../types';

