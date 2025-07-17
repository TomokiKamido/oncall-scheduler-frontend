import { Calendar, Download, RefreshCw, User, Users, AlertTriangle, CheckCircle, Clock, Heart, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Assignment, CustomRule, Staff, WorkType, WorkCalendarDay, Group, SkillRequirementSettings, StaffConflictSettings, WorkTypeCountSettings } from '../../types';
import { useConfiguration } from '../../hooks/useConfiguration';
import { useShiftRequests } from '../../hooks/useShiftRequests';
import SaveConfirmDialog from './SaveConfirmDialog';
import './ScheduleGenerationStep.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Replace any types with proper interfaces for schedule generation logic

interface MemberWorkConfigForGeneration {
    memberId: number;
    workTypeConfigs: {
        workTypeId: string;
        minDays: number;
        maxDays: number;
    }[];
}

interface ScheduleGenerationStepProps {
    startDate: string;
    endDate: string;
    dateRangeMode: 'custom' | 'monthly';
    selectedMonth: string;
    staffMembers: Staff[];
    workTypes: WorkType[];
    workCalendar: WorkCalendarDay[];
    groups: Group[];
    memberWorkConfigs: MemberWorkConfigForGeneration[];
    customRules: CustomRule[];
    onAssignmentsChange: (assignments: Assignment[]) => void;
}

const ScheduleGenerationStep: React.FC<ScheduleGenerationStepProps> = ({
    startDate,
    endDate,
    dateRangeMode,
    selectedMonth,
    staffMembers,
    workTypes,
    workCalendar,
    groups,
    memberWorkConfigs,
    customRules,
    onAssignmentsChange
}) => {

    const { saveConfiguration } = useConfiguration();
    
    // 勤務希望機能を追加
    const { 
        requests, 
        currentPeriod,
        canReviewRequests 
    } = useShiftRequests();
    
    const [generatedAssignments, setGeneratedAssignments] = useState<Assignment[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStep, setGenerationStep] = useState('');
    const [generationErrors, setGenerationErrors] = useState<string[]>([]);
    const [generationWarnings, setGenerationWarnings] = useState<string[]>([]);
    const [generationStats, setGenerationStats] = useState<{
        totalAssignments: number;
        successfulAssignments: number;
        failedAssignments: number;
        coverage: number;
        warnings: string[];
        constraintsSatisfied: number;
        constraintsTotal: number;
        generationTime: number;
        iterations: number;
        totalDays: number;
        groupsUsed: number;
        rulesApplied: number;
        [key: string]: unknown;
    } | null>(null);
    
    // 勤務希望関連の状態
    const [showShiftRequests, setShowShiftRequests] = useState(false);
    const [requestStats, setRequestStats] = useState({
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0
    });

    // 日付範囲を取得
    const getDateRange = (): { start: Date; end: Date } => {
        if (dateRangeMode === 'monthly' && selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0);
            return { start, end };
        } else {
            return {
                start: new Date(startDate),
                end: new Date(endDate)
            };
        }
    };

    // スケジュール生成のメインロジック
    const generateSchedule = async () => {
        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationErrors([]);
        setGenerationWarnings([]);
        
        const startTime = Date.now();

        try {
            setGenerationStep('スケジュール生成を初期化中...');
            const { start, end } = getDateRange();
            
            // 日付の配列を作成
            const dates: Date[] = [];
            const currentDate = new Date(start);
            while (currentDate <= end) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            setGenerationProgress(10);
            setGenerationStep('制約条件を分析中...');

            // 高度なスケジュール生成アルゴリズム
            const result = await generateAdvancedSchedule(dates, startTime);
            
            setGeneratedAssignments(result.assignments);
            onAssignmentsChange(result.assignments);
            
            // Transform stats to match expected type
            const transformedStats = {
                ...result.stats,
                successfulAssignments: result.stats.totalAssignments || 0,
                failedAssignments: 0,
                coverage: result.stats.constraintsTotal > 0 
                    ? (result.stats.constraintsSatisfied / result.stats.constraintsTotal) * 100 
                    : 0,
                warnings: result.warnings || []
            };
            setGenerationStats(transformedStats);
            
            if (result.errors.length > 0) {
                setGenerationErrors(result.errors);
            }
            if (result.warnings.length > 0) {
                setGenerationWarnings(result.warnings);
            }

        } catch (error) {
            console.error('Schedule generation failed:', error);
            setGenerationErrors([`生成エラー: ${error instanceof Error ? error.message : '不明なエラー'}`]);
        } finally {
            setIsGenerating(false);
            setGenerationProgress(100);
            setGenerationStep('完了');
        }
    };

    // 高度なスケジュール生成アルゴリズム
    const generateAdvancedSchedule = async (dates: Date[], startTime: number) => {
        const assignments: Assignment[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];
        let assignmentId = 1;
        let iterations = 0;
        let constraintsSatisfied = 0;
        let constraintsTotal = 0;

        // ステップ1: 各日の必要人員と制約を分析
        setGenerationStep('日別要件を分析中...');
        const dailyRequirements = analyzeDailyRequirements(dates);
        setGenerationProgress(20);

        // ステップ1.5: 勤務希望を分析して制約に追加
        setGenerationStep('勤務希望を分析中...');
        const shiftRequestConstraints = analyzeShiftRequestConstraints(dates);
        setGenerationProgress(25);

        // ステップ2: グループ別スタッフ能力を評価
        setGenerationStep('スタッフ能力を評価中...');
        const staffCapabilities = evaluateStaffCapabilities();
        setGenerationProgress(30);

        // ステップ3: カスタムルール前処理
        setGenerationStep('カスタムルールを準備中...');
        const processedRules = preprocessCustomRules();
        setGenerationProgress(40);            // ステップ4: 制約満足問題として解決
        setGenerationStep('最適解を探索中...');
        
        for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
            const date = dates[dateIndex];
            const dateStr = date.toISOString().split('T')[0];
            const requirements = dailyRequirements.filter(req => 
                req.date.toISOString().split('T')[0] === dateStr
            );
            
            // 進捗更新
            const progress = 40 + (dateIndex / dates.length) * 50;
            setGenerationProgress(progress);
            setGenerationStep(`${dateStr} のスケジュールを生成中...`);

            // その日の全ての勤務帯に対して最適な割り当てを実行
            for (const requirement of requirements) {
                iterations++;
                
                const assignmentResult = await assignOptimalStaff(
                    date,
                    requirement,
                    assignments,
                    staffCapabilities,
                    processedRules,
                    shiftRequestConstraints // 勤務希望制約を追加
                );

                if (assignmentResult.success) {
                    const newAssignments = assignmentResult.assignments.map(a => {
                        const currentId = assignmentId++;
                        return {
                            ...a,
                            id: `assignment-${currentId}`
                        };
                    });
                    assignments.push(...newAssignments);
                    constraintsSatisfied += assignmentResult.constraintsSatisfied;
                } else {
                    errors.push(`${dateStr} ${requirement.workType.name}: ${assignmentResult.error}`);
                }
                
                constraintsTotal += assignmentResult.constraintsTotal;
            }
        }

        setGenerationProgress(90);
        setGenerationStep('結果を検証中...');

        // ステップ5: 最終検証と最適化
        const validationResult = validateAndOptimizeSchedule(assignments, processedRules);
        
        warnings.push(...validationResult.warnings);
        errors.push(...validationResult.errors);

        const endTime = Date.now();
        const generationTime = endTime - startTime;

        // 統計情報を計算
        const usedGroups = new Set(
            assignments.map(a => {
                const staff = staffMembers.find(s => s.id === a.staffId);
                return groups.find(g => g.staffIds.includes(staff?.id || 0))?.id;
            }).filter(Boolean)
        );

        const stats = {
            totalDays: dates.length,
            totalAssignments: assignments.length,
            groupsUsed: usedGroups.size,
            rulesApplied: processedRules.length,
            constraintsSatisfied,
            constraintsTotal,
            generationTime,
            iterations
        };

        return {
            assignments,
            stats,
            errors,
            warnings
        };
    };

    // === 高度なスケジュール生成アルゴリズム用のヘルパー関数 ===

    // 日別要件の分析
    const analyzeDailyRequirements = (dates: Date[]) => {
        return dates.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const calendarDay = workCalendar.find(d => d.date === dateStr);
            
            // 平日・休日・祝日の判定
            const isCalendarHoliday = calendarDay?.isHoliday && calendarDay?.useHolidayStaffing;
            const isWeekendHoliday = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = isCalendarHoliday || isWeekendHoliday;
            
            // その日に必要な勤務帯を取得
            const requiredWorkTypes = (calendarDay?.requiredWorkTypes && calendarDay.requiredWorkTypes.length > 0) ? 
                workTypes.filter(wt => calendarDay.requiredWorkTypes.includes(wt.id)) :
                workTypes;

            return requiredWorkTypes.map(workType => ({
                date,
                workType,
                isHoliday,
                requiredCount: isHoliday ? 
                    (workType.holidayMinStaff || workType.minStaff || 1) :
                    (workType.weekdayMinStaff || workType.minStaff || 1),
                maxCount: isHoliday ?
                    (workType.holidayMaxStaff || workType.maxStaff || workType.holidayMinStaff || workType.minStaff || 2) :
                    (workType.weekdayMaxStaff || workType.maxStaff || workType.weekdayMinStaff || workType.minStaff || 2)
            }));
        }).flat();
    };

    // 勤務希望の分析と制約生成
    const analyzeShiftRequestConstraints = (dates: Date[]) => {
        if (!currentPeriod || requests.length === 0) {
            return {
                preferenceConstraints: [],
                avoidanceConstraints: [],
                unavailableConstraints: [],
                mandatoryConstraints: [],
                stats: {
                    total: 0,
                    approved: 0,
                    rejected: 0,
                    pending: 0
                }
            };
        }

        const preferenceConstraints = [];
        const avoidanceConstraints = [];
        const unavailableConstraints = [];
        const mandatoryConstraints = [];

        let total = 0;
        let approved = 0;
        let rejected = 0;
        let pending = 0;

        // 日付範囲内の勤務希望をフィルタリング
        const dateStrings = dates.map(date => date.toISOString().split('T')[0]);
        const relevantRequests = requests.filter(req => 
            dateStrings.includes(req.requestDate)
        );

        // 承認済みの勤務希望のみを制約として使用
        const approvedRequests = relevantRequests.filter(req => req.status === 'approved');
        
        for (const request of approvedRequests) {
            total++;
            approved++;

            const constraint = {
                staffId: request.staffId,
                date: request.requestDate,
                workTypeId: request.workTypeId,
                priority: request.priority,
                reason: request.reason,
                weight: getPriorityWeight(request.priority)
            };

            switch (request.requestType) {
                case 'prefer':
                    preferenceConstraints.push(constraint);
                    break;
                case 'avoid':
                    avoidanceConstraints.push(constraint);
                    break;
                case 'unavailable':
                    unavailableConstraints.push(constraint);
                    break;
                case 'mandatory':
                    mandatoryConstraints.push(constraint);
                    break;
            }
        }

        // 統計情報を更新
        const pendingRequests = requests.filter(req => req.status === 'submitted' || req.status === 'pending_review');
        const rejectedRequests = requests.filter(req => req.status === 'rejected');
        
        total = requests.length;
        pending = pendingRequests.length;
        rejected = rejectedRequests.length;

        setRequestStats({ total, approved, rejected, pending });

        return {
            preferenceConstraints,
            avoidanceConstraints,
            unavailableConstraints,
            mandatoryConstraints,
            stats: { total, approved, rejected, pending }
        };
    };

    // 優先度に基づく重み付け
    const getPriorityWeight = (priority: string) => {
        switch (priority) {
            case 'urgent': return 10;
            case 'high': return 8;
            case 'medium': return 5;
            case 'low': return 3;
            default: return 5;
        }
    };

    // 勤務希望を考慮したスタッフの適合性チェック
    const checkShiftRequestCompatibility = (staffId: number, date: string, workTypeId: string, shiftRequestConstraints: any) => {
        const staffRequests = {
            preferences: shiftRequestConstraints.preferenceConstraints.filter((c: any) => 
                c.staffId === staffId && c.date === date
            ),
            avoidances: shiftRequestConstraints.avoidanceConstraints.filter((c: any) => 
                c.staffId === staffId && c.date === date
            ),
            unavailable: shiftRequestConstraints.unavailableConstraints.filter((c: any) => 
                c.staffId === staffId && c.date === date
            ),
            mandatory: shiftRequestConstraints.mandatoryConstraints.filter((c: any) => 
                c.staffId === staffId && c.date === date
            )
        };

        // 勤務不可の場合は絶対に割り当てない
        const unavailableForAny = staffRequests.unavailable.some((req: any) => 
            !req.workTypeId || req.workTypeId === workTypeId
        );
        if (unavailableForAny) {
            return { 
                compatible: false, 
                reason: '勤務不可希望', 
                score: -100 
            };
        }

        // 必須勤務の場合は優先的に割り当て
        const mandatoryForThis = staffRequests.mandatory.some((req: any) => 
            !req.workTypeId || req.workTypeId === workTypeId
        );
        if (mandatoryForThis) {
            const req = staffRequests.mandatory.find((r: any) => !r.workTypeId || r.workTypeId === workTypeId);
            return { 
                compatible: true, 
                reason: '必須勤務希望', 
                score: 50 + (req?.weight || 0)
            };
        }

        // 希望勤務の場合はスコアを加算
        const preferenceForThis = staffRequests.preferences.some((req: any) => 
            !req.workTypeId || req.workTypeId === workTypeId
        );
        if (preferenceForThis) {
            const req = staffRequests.preferences.find((r: any) => !r.workTypeId || r.workTypeId === workTypeId);
            return { 
                compatible: true, 
                reason: '希望勤務', 
                score: 20 + (req?.weight || 0)
            };
        }

        // 回避希望の場合はスコアを減算
        const avoidanceForThis = staffRequests.avoidances.some((req: any) => 
            !req.workTypeId || req.workTypeId === workTypeId
        );
        if (avoidanceForThis) {
            const req = staffRequests.avoidances.find((r: any) => !r.workTypeId || r.workTypeId === workTypeId);
            return { 
                compatible: true, 
                reason: '回避希望（可能であれば避ける）', 
                score: -(req?.weight || 0)
            };
        }

        return { 
            compatible: true, 
            reason: '希望なし', 
            score: 0 
        };
    };

    // スタッフ能力の評価
    const evaluateStaffCapabilities = () => {
        return staffMembers.map(staff => {
            // グループ情報を取得
            const staffGroups = groups.filter(group => group.staffIds.includes(staff.id));
            
            // 勤務設定を取得
            const memberConfig = memberWorkConfigs.find(config => config.memberId === staff.id);
            const workTypeCapabilities = memberConfig?.workTypeConfigs || [];

            // スキル情報（将来実装時に使用）
            const skills = staff.skills || [];

            return {
                staff,
                groups: staffGroups,
                workTypeCapabilities,
                skills,
                priority: calculateStaffPriority(staff, staffGroups)
            };
        });
    };

    // スタッフ優先度の計算
    const calculateStaffPriority = (staff: Staff, staffGroups: Group[]) => {
        let priority = 0;
        
        // 役職による優先度
        if (staff.role.includes('師長')) priority += 100;
        else if (staff.role.includes('主任')) priority += 80;
        else if (staff.role.includes('係長')) priority += 60;
        else if (staff.role.includes('経験者')) priority += 40;
        else if (staff.role.includes('新人')) priority -= 20;

        // グループによる優先度
        const seniorGroup = staffGroups.find(g => g.id === 'group_senior');
        if (seniorGroup) priority += 50;

        // ランダム要素を追加（同じ優先度のスタッフを均等に配置）
        priority += Math.random() * 10;

        return priority;
    };

    // カスタムルールの前処理
    const preprocessCustomRules = () => {
        return customRules.filter(rule => rule.isEnabled).map(rule => {
            // ルールを実行しやすい形に変換
            return {
                ...rule,
                targetGroup: groups.find(g => g.id === rule.groupId),
                weight: rule.priority || 5
            };
        });
    };

    // 最適なスタッフ割り当て（勤務希望考慮版）
    const assignOptimalStaff = async (date: Date, requirement: any, assignments: Assignment[], staffCapabilities: any[], processedRules: any[], shiftRequestConstraints?: any) => {
        const dateStr = date.toISOString().split('T')[0];
        const workType = requirement.workType;
        
        // この勤務帯に適用可能なルールを取得
        const applicableRules = processedRules.filter(rule => 
            rule.workTypeIds.includes(workType.id)
        );

        // 候補スタッフをフィルタリングと評価
        const candidates = staffCapabilities
            .filter(sc => {
                // 基本的な勤務可能性チェック
                const basicCheck = canWorkThisShift(sc, date, workType, assignments);
                if (!basicCheck) return false;

                // 勤務希望による絶対的制約チェック（勤務不可）
                if (shiftRequestConstraints) {
                    const requestCheck = checkShiftRequestCompatibility(sc.staff.id, dateStr, workType.id, shiftRequestConstraints);
                    return requestCheck.compatible;
                }
                
                return true;
            })
            .map(sc => ({
                ...sc,
                score: calculateAssignmentScore(sc, date, workType, assignments, applicableRules, shiftRequestConstraints)
            }))
            .sort((a, b) => b.score - a.score);

        const selectedAssignments = [];
        const errors = [];
        let constraintsSatisfied = 0;
        let constraintsTotal = applicableRules.length;

        // 必要人数分の最適な候補を選択
        for (let i = 0; i < Math.min(requirement.requiredCount, candidates.length); i++) {
            const candidate = candidates[i];
            
            // ルール検証
            const ruleCheck = validateRulesForAssignment(candidate, date, workType, assignments, applicableRules);
            
            if (ruleCheck.valid) {
                selectedAssignments.push({
                    date: dateStr,
                    staffId: candidate.staff.id,
                    staffName: candidate.staff.name,
                    shift: workType.name.toLowerCase() as 'day' | 'night' | 'evening'
                });
                constraintsSatisfied += ruleCheck.satisfiedRules;
            } else {
                errors.push(ruleCheck.reason || '制約違反');
            }
        }

        return {
            success: selectedAssignments.length > 0,
            assignments: selectedAssignments,
            error: selectedAssignments.length === 0 ? `適切なスタッフが見つかりません` : undefined,
            constraintsSatisfied,
            constraintsTotal
        };
    };

    // スタッフがこのシフトで勤務可能かチェック
    const canWorkThisShift = (staffCapability: any, date: Date, workType: WorkType, assignments: Assignment[]) => {
        const staff = staffCapability.staff;
        const dateStr = date.toISOString().split('T')[0];

        // 同日に他のシフトが割り当てられていないかチェック
        const sameDay = assignments.find(a => a.date === dateStr && a.staffId === staff.id);
        if (sameDay) return false;

        // 勤務設定があるかチェック
        const workTypeConfig = staffCapability.workTypeCapabilities.find(
            (wtc: any) => wtc.workTypeId === workType.id
        );
        if (!workTypeConfig || workTypeConfig.maxDays <= 0) return false;

        // 月の勤務回数制限チェック
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthlyAssignments = assignments.filter(a => {
            const assignmentDate = new Date(a.date);
            return a.staffId === staff.id &&
                   assignmentDate >= monthStart &&
                   assignmentDate <= monthEnd &&
                   a.shift === workType.name.toLowerCase();
        });

        return monthlyAssignments.length < workTypeConfig.maxDays;
    };

    // 割り当てスコアの計算（勤務希望を考慮）
    const calculateAssignmentScore = (staffCapability: any, date: Date, workType: WorkType, assignments: Assignment[], rules: any[], shiftRequestConstraints?: any) => {
        let score = staffCapability.priority;
        const dateStr = date.toISOString().split('T')[0];
        
        // 勤務希望の評価を追加
        if (shiftRequestConstraints) {
            const requestCompatibility = checkShiftRequestCompatibility(
                staffCapability.staff.id,
                dateStr,
                workType.id,
                shiftRequestConstraints
            );
            score += requestCompatibility.score;
            
            // デバッグ用
            if (requestCompatibility.reason !== '希望なし') {
                console.log(`勤務希望考慮: ${staffCapability.staff.name} - ${dateStr} - ${requestCompatibility.reason} (スコア: ${requestCompatibility.score})`);
            }
        }
        
        // 勤務バランスの評価
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthlyAssignments = assignments.filter(a => {
            const assignmentDate = new Date(a.date);
            return a.staffId === staffCapability.staff.id &&
                   assignmentDate >= monthStart &&
                   assignmentDate <= monthEnd;
        });

        // 少ない勤務数のスタッフを優先
        score -= monthlyAssignments.length * 10;

        // スキル要件ルールの評価
        for (const rule of rules) {
            if (rule.type === 'skill_requirement') {
                const settings = rule.settings as SkillRequirementSettings;
                const hasRequiredSkills = settings.requirements.every(req => {
                    const hasSkill = staffCapability.skills.some((skill: any) => skill.id === req.skillId);
                    return hasSkill;
                });
                if (hasRequiredSkills) score += 30;
            }
        }

        return score;
    };

    // ルール検証
    const validateRulesForAssignment = (staffCapability: any, date: Date, _workType: WorkType, assignments: Assignment[], rules: any[]) => {
        let valid = true;
        let satisfiedRules = 0;
        let reason = '';

        for (const rule of rules) {
            switch (rule.type) {
                case 'skill_requirement':
                    const skillResult = validateSkillRequirement(staffCapability, rule.settings as SkillRequirementSettings);
                    if (!skillResult.valid) {
                        valid = false;
                        reason = skillResult.reason;
                        break;
                    }
                    satisfiedRules++;
                    break;

                case 'staff_conflict':
                    const conflictResult = validateStaffConflict(staffCapability, date, assignments, rule.settings as StaffConflictSettings);
                    if (!conflictResult.valid) {
                        valid = false;
                        reason = conflictResult.reason;
                        break;
                    }
                    satisfiedRules++;
                    break;

                case 'worktype_count':
                    const countResult = validateWorkTypeCount(staffCapability, date, assignments, rule.settings as WorkTypeCountSettings);
                    if (!countResult.valid) {
                        valid = false;
                        reason = countResult.reason;
                        break;
                    }
                    satisfiedRules++;
                    break;
            }
        }

        return { valid, satisfiedRules, reason };
    };

    // スキル要件の検証
    const validateSkillRequirement = (staffCapability: any, settings: SkillRequirementSettings) => {
        for (const requirement of settings.requirements) {
            const hasSkill = staffCapability.skills.some((skill: any) => skill.id === requirement.skillId);
            if (!hasSkill) {
                return { valid: false, reason: `必要スキル不足: ${requirement.skillId}` };
            }
        }
        return { valid: true, reason: '' };
    };

    // スタッフ競合の検証
    const validateStaffConflict = (staffCapability: any, date: Date, assignments: Assignment[], settings: StaffConflictSettings) => {
        const dateStr = date.toISOString().split('T')[0];
        
        for (const conflict of settings.conflicts) {
            if (conflict.staffIds.includes(staffCapability.staff.id)) {
                // 同じ競合グループの他のスタッフが同日に勤務していないかチェック
                const conflictingStaffIds = conflict.staffIds.filter(id => id !== staffCapability.staff.id);
                const sameDayConflict = assignments.find(a => 
                    a.date === dateStr && conflictingStaffIds.includes(a.staffId)
                );
                
                if (sameDayConflict && conflict.separation === 0) {
                    return { valid: false, reason: `スタッフ競合: 同日勤務不可` };
                }
            }
        }
        
        return { valid: true, reason: '' };
    };

    // 勤務帯別回数制限の検証
    const validateWorkTypeCount = (staffCapability: any, date: Date, assignments: Assignment[], settings: WorkTypeCountSettings) => {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        for (const limit of settings.workTypeCountLimits) {
            const monthlyCount = assignments.filter(a => {
                const assignmentDate = new Date(a.date);
                return a.staffId === staffCapability.staff.id &&
                       assignmentDate >= monthStart &&
                       assignmentDate <= monthEnd &&
                       a.shift === limit.workTypeId.toLowerCase();
            }).length;
            
            if (monthlyCount >= limit.max) {
                return { valid: false, reason: `月間勤務回数上限超過: ${limit.workTypeId}` };
            }
        }
        
        return { valid: true, reason: '' };
    };

    // 最終検証と最適化
    const validateAndOptimizeSchedule = (assignments: Assignment[], _rules: any[]) => {
        const warnings: string[] = [];
        const errors: string[] = [];

        // 全体的なバランスチェック
        const staffWorkCounts = new Map<number, number>();
        assignments.forEach(a => {
            const currentCount = staffWorkCounts.get(a.staffId) || 0;
            staffWorkCounts.set(a.staffId, currentCount + 1);
        });

        // 勤務回数の偏りチェック
        const workCounts = Array.from(staffWorkCounts.values());
        const avgWork = workCounts.reduce((sum, count) => sum + count, 0) / workCounts.length;
        const maxWork = Math.max(...workCounts);
        const minWork = Math.min(...workCounts);

        if (maxWork - minWork > avgWork * 0.5) {
            warnings.push(`勤務回数に偏りがあります (最大: ${maxWork}, 最小: ${minWork})`);
        }

        // 各日の人員不足チェック
        const dateStaffCounts = new Map<string, number>();
        assignments.forEach(a => {
            const currentCount = dateStaffCounts.get(a.date) || 0;
            dateStaffCounts.set(a.date, currentCount + 1);
        });

        for (const [dateStr, count] of dateStaffCounts) {
            if (count < workTypes.length) {
                warnings.push(`${dateStr}: 人員不足の可能性があります`);
            }
        }

        return {
            optimizedAssignments: null, // 現在の実装では最適化は行わない
            warnings,
            errors
        };
    };

    // === 既存のヘルパー関数（後方互換性のため保持） ===

    // CSVエクスポート
    const exportToCSV = () => {
        if (generatedAssignments.length === 0) return;

        const csvHeader = '日付,スタッフ名,シフト\n';
        const csvData = generatedAssignments
            .map(assignment => `${assignment.date},${assignment.staffName},${assignment.shift}`)
            .join('\n');

        const blob = new Blob([csvHeader + csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `schedule_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // 日付範囲の表示用文字列
    const getDateRangeDisplay = (): string => {
        const { start, end } = getDateRange();
        return `${start.toLocaleDateString('ja-JP')} 〜 ${end.toLocaleDateString('ja-JP')}`;
    };

    // スケジュール生成開始（保存確認付き）
    const handleGenerateSchedule = () => {
        setIsSaveConfirmOpen(true);
    };

    // 保存してスケジュール生成
    const handleSaveAndGenerate = async (name: string, description?: string) => {
        try {
            const currentSettings = {
                workTypes,
                workCalendar,
                groups,
                customRules,
                memberWorkConfigs
            };
            
            await saveConfiguration(currentSettings, name, description);
            setIsSaveConfirmOpen(false);
            await generateSchedule();
        } catch (error) {
            console.error('保存エラー:', error);
            // 保存に失敗してもスケジュール生成は続行
            setIsSaveConfirmOpen(false);
            await generateSchedule();
        }
    };

    // 保存せずにスケジュール生成
    const handleGenerateWithoutSave = async () => {
        setIsSaveConfirmOpen(false);
        await generateSchedule();
    };

    return (
        <div className="schedule-generation-section step-section">
            {/* 設定内容の確認 */}
            <div className="generation-settings-summary">
                <h5>設定内容の確認</h5>
                <div className="settings-grid">
                    <div className="setting-item">
                        <Calendar size={16} />
                        <div>
                            <strong>期間:</strong> {getDateRangeDisplay()}
                        </div>
                    </div>
                    <div className="setting-item">
                        <User size={16} />
                        <div>
                            <strong>メンバー数:</strong> {memberWorkConfigs.length}名
                        </div>
                    </div>
                    <div className="setting-item">
                        <Users size={16} />
                        <div>
                            <strong>グループ数:</strong> {groups.filter(g => g.id !== 'group_all').length}グループ
                        </div>
                    </div>
                    <div className="setting-item">
                        <span>⚙️</span>
                        <div>
                            <strong>カスタムルール:</strong> {customRules.filter(r => r.isEnabled).length}件
                        </div>
                    </div>
                    {/* 勤務希望の統計情報 */}
                    <div className="setting-item">
                        <Heart size={16} />
                        <div>
                            <strong>勤務希望:</strong> 
                            <span className="request-stats">
                                承認済み{requestStats.approved}件、
                                審査待ち{requestStats.pending}件
                                {requestStats.rejected > 0 && `, 拒否済み${requestStats.rejected}件`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 勤務希望管理ボタン */}
                {canReviewRequests() && currentPeriod && (
                    <div className="shift-request-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => setShowShiftRequests(!showShiftRequests)}
                        >
                            <Heart size={16} />
                            勤務希望を確認 ({requestStats.pending > 0 ? `${requestStats.pending}件審査待ち` : '確認済み'})
                        </button>
                        {requestStats.pending > 0 && (
                            <button
                                className="btn-warning"
                                onClick={() => alert('勤務希望審査画面は別途実装されます')}
                            >
                                <AlertTriangle size={16} />
                                未審査の希望があります
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 勤務希望詳細表示 */}
            {showShiftRequests && currentPeriod && (
                <div className="shift-requests-summary">
                    <h4>勤務希望の概要</h4>
                    <div className="request-summary-grid">
                        <div className="summary-card approved">
                            <CheckCircle size={20} />
                            <div>
                                <span className="number">{requestStats.approved}</span>
                                <span className="label">承認済み</span>
                            </div>
                        </div>
                        <div className="summary-card pending">
                            <Clock size={20} />
                            <div>
                                <span className="number">{requestStats.pending}</span>
                                <span className="label">審査待ち</span>
                            </div>
                        </div>
                        {requestStats.rejected > 0 && (
                            <div className="summary-card rejected">
                                <XCircle size={20} />
                                <div>
                                    <span className="number">{requestStats.rejected}</span>
                                    <span className="label">拒否済み</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="request-actions">
                        <button
                            className="btn-primary"
                            onClick={() => {
                                // 勤務希望審査画面を開く（実装は簡略化）
                                alert('勤務希望審査画面は別途実装されます');
                            }}
                        >
                            詳細審査へ
                        </button>
                    </div>
                </div>
            )}

            {/* スケジュール生成ボタン */}
            <div className="generation-actions">
                <button
                    className="generate-schedule-btn"
                    onClick={handleGenerateSchedule}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw size={20} className="spinning" />
                            生成中...
                        </>
                    ) : (
                        <>
                            <Calendar size={20} />
                            スケジュール生成
                        </>
                    )}
                </button>
            </div>

            {/* 生成進捗表示 */}
            {isGenerating && (
                <div className="generation-progress">
                    <div className="progress-info">
                        <Clock size={16} />
                        <span>{generationStep}</span>
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${generationProgress}%` }}
                        />
                    </div>
                    <div className="progress-text">{generationProgress.toFixed(0)}%</div>
                </div>
            )}

            {/* エラー・警告表示 */}
            {(generationErrors.length > 0 || generationWarnings.length > 0) && (
                <div className="generation-messages">
                    {generationErrors.length > 0 && (
                        <div className="error-messages">
                            <div className="message-header">
                                <AlertTriangle size={16} />
                                <span>エラー ({generationErrors.length}件)</span>
                            </div>
                            <ul>
                                {generationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {generationWarnings.length > 0 && (
                        <div className="warning-messages">
                            <div className="message-header">
                                <AlertTriangle size={16} />
                                <span>警告 ({generationWarnings.length}件)</span>
                            </div>
                            <ul>
                                {generationWarnings.map((warning, index) => (
                                    <li key={index}>{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* 生成統計 */}
            {generationStats && (
                <div className="generation-stats">
                    <h5>
                        <CheckCircle size={16} />
                        生成結果
                    </h5>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">総日数:</span>
                            <span className="stat-value">{generationStats.totalDays}日</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">総割り当て:</span>
                            <span className="stat-value">{generationStats.totalAssignments}件</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">使用グループ:</span>
                            <span className="stat-value">{generationStats.groupsUsed}グループ</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">適用ルール:</span>
                            <span className="stat-value">{generationStats.rulesApplied}件</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">制約満足度:</span>
                            <span className="stat-value">
                                {(generationStats.constraintsTotal as number) > 0 
                                    ? `${(((generationStats.constraintsSatisfied as number) / (generationStats.constraintsTotal as number)) * 100).toFixed(1)}%`
                                    : 'N/A'
                                }
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">生成時間:</span>
                            <span className="stat-value">{((generationStats.generationTime as number) / 1000).toFixed(2)}秒</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">反復回数:</span>
                            <span className="stat-value">{generationStats.iterations}回</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 生成されたスケジュールの表示 */}
            {generatedAssignments.length > 0 && (
                <div className="generated-schedule">
                    <div className="schedule-header">
                        <h5>生成されたスケジュール</h5>
                        <button
                            className="export-csv-btn"
                            onClick={exportToCSV}
                        >
                            <Download size={16} />
                            CSVエクスポート
                        </button>
                    </div>
                    
                    <div className="schedule-table-container">
                        <table className="schedule-table">
                            <thead>
                                <tr>
                                    <th>日付</th>
                                    <th>スタッフ</th>
                                    <th>シフト</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generatedAssignments
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map((assignment) => (
                                        <tr key={assignment.id}>
                                            <td>{new Date(assignment.date).toLocaleDateString('ja-JP')}</td>
                                            <td>{assignment.staffName}</td>
                                            <td className={`shift-${assignment.shift}`}>{assignment.shift}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Save Confirm Dialog */}
            <SaveConfirmDialog
                isOpen={isSaveConfirmOpen}
                onClose={() => setIsSaveConfirmOpen(false)}
                onSaveAndProceed={handleSaveAndGenerate}
                onProceedWithoutSave={handleGenerateWithoutSave}
                isLoading={isGenerating}
            />
        </div>
    );
};

export default ScheduleGenerationStep;
