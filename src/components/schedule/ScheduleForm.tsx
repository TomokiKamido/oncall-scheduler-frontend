import { useState } from 'react';
import { Save, X, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import './ScheduleForm.css';

interface ScheduleFormProps {
  onClose?: () => void;
  onSubmit?: (data: any) => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onClose, onSubmit }) => {
  const [scheduleData, setScheduleData] = useState({
    title: '',
    member: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'primary',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScheduleData({ ...scheduleData, [name]: value });
    
    // エラーをクリア
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!scheduleData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }
    if (!scheduleData.member.trim()) {
      newErrors.member = 'メンバーは必須です';
    }
    if (!scheduleData.date) {
      newErrors.date = '日付は必須です';
    }
    if (!scheduleData.startTime) {
      newErrors.startTime = '開始時間は必須です';
    }
    if (!scheduleData.endTime) {
      newErrors.endTime = '終了時間は必須です';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log('スケジュールデータ:', scheduleData);
      onSubmit?.(scheduleData);
      onClose?.();
    }
  };

  return (
    <div className="schedule-form">
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} />
            スケジュールタイトル
          </label>
          <input
            type="text"
            name="title"
            placeholder="例: 緊急対応オンコール"
            value={scheduleData.title}
            onChange={handleChange}
            className={`form-input ${errors.title ? 'error' : ''}`}
          />
          {errors.title && (
            <div className="error-message">
              <AlertCircle size={14} />
              {errors.title}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            <User size={16} />
            担当メンバー
          </label>
          <select
            name="member"
            value={scheduleData.member}
            onChange={handleChange}
            className={`form-select ${errors.member ? 'error' : ''}`}
          >
            <option value="">メンバーを選択</option>
            <option value="田中太郎">田中太郎</option>
            <option value="佐藤花子">佐藤花子</option>
            <option value="山田次郎">山田次郎</option>
            <option value="鈴木一郎">鈴木一郎</option>
          </select>
          {errors.member && (
            <div className="error-message">
              <AlertCircle size={14} />
              {errors.member}
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} />
              日付
            </label>
            <input
              type="date"
              name="date"
              value={scheduleData.date}
              onChange={handleChange}
              className={`form-input ${errors.date ? 'error' : ''}`}
            />
            {errors.date && (
              <div className="error-message">
                <AlertCircle size={14} />
                {errors.date}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">役割</label>
            <select
              name="type"
              value={scheduleData.type}
              onChange={handleChange}
              className="form-select"
            >
              <option value="primary">プライマリー</option>
              <option value="backup">バックアップ</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <Clock size={16} />
              開始時間
            </label>
            <input
              type="time"
              name="startTime"
              value={scheduleData.startTime}
              onChange={handleChange}
              className={`form-input ${errors.startTime ? 'error' : ''}`}
            />
            {errors.startTime && (
              <div className="error-message">
                <AlertCircle size={14} />
                {errors.startTime}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Clock size={16} />
              終了時間
            </label>
            <input
              type="time"
              name="endTime"
              value={scheduleData.endTime}
              onChange={handleChange}
              className={`form-input ${errors.endTime ? 'error' : ''}`}
            />
            {errors.endTime && (
              <div className="error-message">
                <AlertCircle size={14} />
                {errors.endTime}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">説明（オプション）</label>
          <textarea
            name="description"
            placeholder="追加の詳細や注意事項..."
            value={scheduleData.description}
            onChange={handleChange}
            className="form-textarea"
            rows={3}
          />
        </div>

        <div className="form-actions">
          {onClose && (
            <button type="button" className="btn-secondary" onClick={onClose}>
              <X size={16} />
              キャンセル
            </button>
          )}
          <button type="submit" className="btn-primary">
            <Save size={16} />
            スケジュールを保存
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleForm;