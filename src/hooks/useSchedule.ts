import { useState, useEffect } from 'react';
import { fetchSchedules, createSchedule, deleteSchedule } from '../services/api';
import { Schedule } from '../types';

const useSchedule = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await fetchSchedules();
        setSchedules(data);
      } catch (err) {
        setError('スケジュールの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  const addSchedule = async (newSchedule: Schedule) => {
    try {
      const createdSchedule = await createSchedule(newSchedule);
      setSchedules(prev => [...prev, createdSchedule]);
    } catch (err) {
      setError('スケジュールの作成に失敗しました');
    }
  };

  const removeSchedule = async (id: string) => {
    try {
      await deleteSchedule(id);
      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    } catch (err) {
      setError('スケジュールの削除に失敗しました');
    }
  };

  return {
    schedules,
    loading,
    error,
    addSchedule,
    removeSchedule,
  };
};

export default useSchedule;
