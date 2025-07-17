import { format, parseISO, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

// 日付フォーマット関連
export const formatDate = (dateString: string, dateFormat = 'yyyy/MM/dd'): string => {
  const date = parseISO(dateString);
  return format(date, dateFormat);
};

export const formatDateJapanese = (dateString: string): string => {
  const date = parseISO(dateString);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${format(date, 'M/d')}(${days[date.getDay()]})`;
};

export const getCurrentDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getCurrentDateFormatted = (): string => {
  return format(new Date(), 'yyyy/MM/dd');
};

// 日付計算関連
export const addDaysToDate = (dateString: string, days: number): string => {
  const date = parseISO(dateString);
  return format(addDays(date, days), 'yyyy-MM-dd');
};

export const getWeekRange = (date: Date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // 月曜始まり
  const end = endOfWeek(date, { weekStartsOn: 1 });

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
};

export const getTwoWeeksRange = (date: Date = new Date()) => {
  const start = date;
  const end = addDays(date, 13); // 14日間

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
};

// 日付範囲生成
export const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const current = parseISO(startDate);
  const end = parseISO(endDate);

  while (current <= end) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// 日付比較関連
export const isDateInFuture = (dateString: string): boolean => {
  const date = parseISO(dateString);
  return date > new Date();
};

export const isDateToday = (dateString: string): boolean => {
  const date = parseISO(dateString);
  return isSameDay(date, new Date());
};

export const daysDifference = (startDate: string, endDate: string): number => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};
