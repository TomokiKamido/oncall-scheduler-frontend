import { useState } from 'react';
import { Save, X, User, Mail, Phone, Briefcase, Building, AlertCircle } from 'lucide-react';
import './StaffForm.css';

interface Staff {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
}

interface StaffFormProps {
  onSubmit: (staff: Staff) => void;
  onCancel: () => void;
  initialData?: Staff | undefined;
  isEdit?: boolean;
}

const StaffForm: React.FC<StaffFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isEdit = false 
}) => {
  const [formData, setFormData] = useState<Staff>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    role: initialData?.role || '',
    department: initialData?.department || '',
    status: initialData?.status || 'active'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // エラーをクリア
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '電話番号は必須です';
    }
    if (!formData.role.trim()) {
      newErrors.role = '役職は必須です';
    }
    if (!formData.department.trim()) {
      newErrors.department = '部署は必須です';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="staff-form">
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label className="form-label">
            <User size={16} />
            氏名
          </label>
          <input
            type="text"
            name="name"
            placeholder="例: 田中太郎"
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? 'error' : ''}`}
          />
          {errors.name && (
            <div className="error-message">
              <AlertCircle size={14} />
              {errors.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            <Mail size={16} />
            メールアドレス
          </label>
          <input
            type="email"
            name="email"
            placeholder="例: tanaka@example.com"
            value={formData.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? 'error' : ''}`}
          />
          {errors.email && (
            <div className="error-message">
              <AlertCircle size={14} />
              {errors.email}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            <Phone size={16} />
            電話番号
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="例: 090-1234-5678"
            value={formData.phone}
            onChange={handleChange}
            className={`form-input ${errors.phone ? 'error' : ''}`}
          />
          {errors.phone && (
            <div className="error-message">
              <AlertCircle size={14} />
              {errors.phone}
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <Briefcase size={16} />
              役職
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`form-select ${errors.role ? 'error' : ''}`}
            >
              <option value="">役職を選択</option>
              <option value="シニアエンジニア">シニアエンジニア</option>
              <option value="エンジニア">エンジニア</option>
              <option value="プロダクトマネージャー">プロダクトマネージャー</option>
              <option value="DevOpsエンジニア">DevOpsエンジニア</option>
              <option value="QAエンジニア">QAエンジニア</option>
              <option value="テックリード">テックリード</option>
              <option value="アーキテクト">アーキテクト</option>
            </select>
            {errors.role && (
              <div className="error-message">
                <AlertCircle size={14} />
                {errors.role}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Building size={16} />
              部署
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`form-select ${errors.department ? 'error' : ''}`}
            >
              <option value="">部署を選択</option>
              <option value="開発部">開発部</option>
              <option value="企画部">企画部</option>
              <option value="インフラ部">インフラ部</option>
              <option value="品質保証部">品質保証部</option>
              <option value="デザイン部">デザイン部</option>
              <option value="営業部">営業部</option>
            </select>
            {errors.department && (
              <div className="error-message">
                <AlertCircle size={14} />
                {errors.department}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ステータス</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-select"
          >
            <option value="active">アクティブ</option>
            <option value="inactive">非アクティブ</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            <X size={16} />
            キャンセル
          </button>
          <button type="submit" className="btn-primary">
            <Save size={16} />
            {isEdit ? 'スタッフを更新' : 'スタッフを追加'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffForm;