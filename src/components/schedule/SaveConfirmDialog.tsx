import React, { useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import './SaveConfirmDialog.css';

interface SaveConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndProceed: (name: string, description?: string) => void;
  onProceedWithoutSave: () => void;
  isLoading?: boolean;
}

const SaveConfirmDialog: React.FC<SaveConfirmDialogProps> = ({
  isOpen,
  onClose,
  onSaveAndProceed,
  onProceedWithoutSave,
  isLoading = false
}) => {
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  const handleSaveAndProceed = () => {
    if (saveName.trim()) {
      onSaveAndProceed(saveName.trim(), saveDescription.trim() || undefined);
      setSaveName('');
      setSaveDescription('');
    }
  };

  const handleClose = () => {
    setSaveName('');
    setSaveDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="save-confirm-overlay">
      <div className="save-confirm-modal">
        <div className="save-confirm-header">
          <h3>
            <Save size={20} />
            設定を保存しますか？
          </h3>
          <button onClick={handleClose} className="close-btn" disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        <div className="save-confirm-content">
          <div className="save-confirm-message">
            <AlertCircle size={16} className="info-icon" />
            <p>
              今回の設定をマイ設定に保存しておくと、次回から簡単に呼び出せます。
              <br />
              保存できる設定は最大2つまでです。
            </p>
          </div>

          <div className="save-form">
            <div className="form-group">
              <label htmlFor="saveName">設定名 *</label>
              <input
                id="saveName"
                type="text"
                placeholder="例：夜勤多めパターン、日勤中心パターン"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                maxLength={30}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="saveDescription">説明（任意）</label>
              <textarea
                id="saveDescription"
                placeholder="この設定の特徴や用途を入力"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                maxLength={100}
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="save-confirm-actions">
          <button
            onClick={handleSaveAndProceed}
            disabled={!saveName.trim() || isLoading}
            className="btn-primary"
          >
            {isLoading ? '保存中...' : '保存してスケジュール生成'}
          </button>
          <button
            onClick={onProceedWithoutSave}
            disabled={isLoading}
            className="btn-secondary"
          >
            保存せずにスケジュール生成
          </button>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="btn-cancel"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveConfirmDialog;
