import { useEffect, useState } from 'react';
import { fetchStaff } from '../services/api';
import { Staff, WorkType } from '../types';

// ダミーの勤務形態データ
const defaultWorkTypes: WorkType[] = [
  {
    id: 'day',
    name: '日勤',
    startTime: '08:00',
    endTime: '17:00',
    color: '#3b82f6',
    isDefault: true,
    description: '通常の日勤',
    weekdayMinStaff: 2,
    weekdayMaxStaff: 4,
    holidayMinStaff: 1,
    holidayMaxStaff: 2
  },
  {
    id: 'night',
    name: '夜勤',
    startTime: '20:00',
    endTime: '08:00',
    color: '#1f2937',
    isDefault: false,
    description: '夜間勤務',
    weekdayMinStaff: 1,
    weekdayMaxStaff: 2,
    holidayMinStaff: 1,
    holidayMaxStaff: 2
  },
  {
    id: 'evening',
    name: '遅番',
    startTime: '15:00',
    endTime: '23:00',
    color: '#f59e0b',
    isDefault: false,
    description: '遅番勤務',
    weekdayMinStaff: 1,
    weekdayMaxStaff: 3,
    holidayMinStaff: 1,
    holidayMaxStaff: 2
  }
];

export const useStaff = () => {
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [workTypes] = useState<WorkType[]>(defaultWorkTypes);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const data = await fetchStaff();
        setStaffMembers(data);
      } catch (err) {
        setError('スタッフの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  return { 
    staffMembers, 
    workTypes,
    loading, 
    error,
    // 後方互換性のため
    staffList: staffMembers
  };
};
