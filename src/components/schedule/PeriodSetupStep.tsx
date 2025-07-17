import React from 'react';

interface PeriodSetupStepProps {
    startDate: string;
    endDate: string;
    dateRangeMode: 'custom' | 'monthly';
    selectedMonth: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onDateRangeModeChange: (mode: 'custom' | 'monthly') => void;
    onSelectedMonthChange: (month: string) => void;
    isCompleted: boolean;
}

const PeriodSetupStep: React.FC<PeriodSetupStepProps> = ({
    startDate,
    endDate,
    dateRangeMode,
    selectedMonth,
    onStartDateChange,
    onEndDateChange,
    onDateRangeModeChange,
    onSelectedMonthChange,
    isCompleted
}) => {
    console.log('PeriodSetupStep rendered with title: 期間設定（ステップ 1/4）');
    
    return (
        <div className="period-setup-section step-section">

            <div className="date-range-mode">
                <label>
                    <input
                        type="radio"
                        value="custom"
                        checked={ dateRangeMode === 'custom' }
                        onChange={ (e) => onDateRangeModeChange(e.target.value as 'custom') }
                    />
                    カスタム期間
                </label>
                <label>
                    <input
                        type="radio"
                        value="monthly"
                        checked={ dateRangeMode === 'monthly' }
                        onChange={ (e) => onDateRangeModeChange(e.target.value as 'monthly') }
                    />
                    月単位
                </label>
            </div>

            { dateRangeMode === 'custom' ? (
                <div className="custom-date-range">
                    <div className="date-input">
                        <label>開始日</label>
                        <input
                            type="date"
                            value={ startDate }
                            onChange={ (e) => onStartDateChange(e.target.value) }
                        />
                    </div>
                    <div className="date-input">
                        <label>終了日</label>
                        <input
                            type="date"
                            value={ endDate }
                            onChange={ (e) => onEndDateChange(e.target.value) }
                        />
                    </div>
                </div>
            ) : (
                <div className="monthly-date-range">
                    <div className="date-input">
                        <label>対象月</label>
                        <input
                            type="month"
                            value={ selectedMonth }
                            onChange={ (e) => onSelectedMonthChange(e.target.value) }
                        />
                    </div>
                </div>
            ) }

            <div className="step-completion">
                { isCompleted ? (
                    <div className="completion-status completed">
                        ✓ 期間設定が完了しました
                    </div>
                ) : (
                    <div className="completion-status incomplete">
                        期間を設定してください
                    </div>
                ) }
            </div>
        </div>
    );
};

export default PeriodSetupStep;
