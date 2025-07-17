import React, { useState, useEffect } from 'react';
import { Department } from '../../types';
import { Building2, X, Save, User } from 'lucide-react';
import './DepartmentForm.css';

interface DepartmentFormProps {
  department?: Department;
  onSubmit: (name: string, description: string, managerId?: string) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (department) {
      setName(department.name);
      setDescription(department.description);
      setManagerId(department.managerId || '');
    }
  }, [department]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!name.trim()) {
      newErrors.name = '部署名は必須です';
    } else if (name.trim().length < 2) {
      newErrors.name = '部署名は2文字以上で入力してください';
    }

    if (!description.trim()) {
      newErrors.description = '説明は必須です';
    } else if (description.trim().length < 5) {
      newErrors.description = '説明は5文字以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(
        name.trim(),
        description.trim(),
        managerId.trim() || undefined
      );
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content department-form-modal">
        <div className="modal-header">
          <h2>
            <Building2 size={24} />
            {isEditing ? '部署編集' : '新しい部署を作成'}
          </h2>
          <button 
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="department-form">
          <div className="form-group">
            <label htmlFor="name">
              部署名 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'error' : ''}
              placeholder="例: 内科、外科、小児科"
              maxLength={50}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              説明 <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={errors.description ? 'error' : ''}
              placeholder="部署の役割や特徴を入力してください"
              rows={3}
              maxLength={200}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
            <small className="char-count">
              {description.length}/200文字
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="managerId">
              <User size={16} />
              所属長のユーザーID（オプション）
            </label>
            <input
              type="text"
              id="managerId"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="所属長のユーザーIDを入力（後から設定も可能）"
              maxLength={100}
            />
            <small className="help-text">
              所属長を指定すると、その方にこの部署の管理権限が付与されます
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Save size={16} />
              {isEditing ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentForm;
