import { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Clock } from 'lucide-react';
import './ScheduleCalendar.css';

const ScheduleCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // ダミーデータ
  const schedules = [
    { date: 15, member: '田中太郎', type: 'primary', time: '09:00-18:00' },
    { date: 16, member: '佐藤花子', type: 'backup', time: '18:00-翌09:00' },
    { date: 17, member: '山田次郎', type: 'primary', time: '09:00-18:00' },
    { date: 18, member: '鈴木一郎', type: 'backup', time: '18:00-翌09:00' },
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setCurrentDate(newDate);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="schedule-calendar">
      {/* カレンダーヘッダー */}
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button 
            className="nav-button"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="calendar-title">
            {currentYear}年 {currentMonth + 1}月
          </h3>
          <button 
            className="nav-button"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color primary"></div>
            <span>プライマリー</span>
          </div>
          <div className="legend-item">
            <div className="legend-color backup"></div>
            <span>バックアップ</span>
          </div>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="calendar-grid">
        {/* 曜日ヘッダー */}
        <div className="weekday-header">
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        {/* カレンダー日付 */}
        <div className="calendar-body">
          {emptyDays.map(day => (
            <div key={`empty-${day}`} className="calendar-day empty"></div>
          ))}
          
          {days.map(day => {
            const isToday = day === today.getDate() && 
                           currentMonth === today.getMonth() && 
                           currentYear === today.getFullYear();
            
            const daySchedules = schedules.filter(s => s.date === day);
            
            return (
              <div 
                key={day} 
                className={`calendar-day ${isToday ? 'today' : ''} ${daySchedules.length > 0 ? 'has-schedule' : ''}`}
              >
                <div className="day-number">{day}</div>
                
                {daySchedules.map((schedule, index) => (
                  <div 
                    key={index}
                    className={`schedule-item ${schedule.type}`}
                  >
                    <div className="schedule-member">
                      <User size={12} />
                      <span>{schedule.member}</span>
                    </div>
                    <div className="schedule-time">
                      <Clock size={10} />
                      <span>{schedule.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;