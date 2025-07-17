import React, { useState } from 'react';
import { Folder, FileText, X, Calendar } from 'lucide-react';
import { ConfigurationHistory } from '../../types';
import './LoadConfirmDialog.css';

interface LoadConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConfiguration: (config: ConfigurationHistory) => void;
  onCreateNew: () => void;
  configurations: ConfigurationHistory[];
  isLoading?: boolean;
}

const LoadConfirmDialog: React.FC<LoadConfirmDialogProps> = ({
  isOpen,
  onClose,
  onLoadConfiguration,
  onCreateNew,
  configurations,
  isLoading = false
}) => {
  const [selectedConfig, setSelectedConfig] = useState<ConfigurationHistory | null>(null);

  const handleLoadConfiguration = () => {
    if (selectedConfig) {
      onLoadConfiguration(selectedConfig);
    }
  };

  const handleClose = () => {
    setSelectedConfig(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="load-confirm-overlay">
      <div className="load-confirm-modal">
        <div className="load-confirm-header">
          <h3>
            <Folder size={20} />
            マイ設定を読み込みますか？
          </h3>
          <button onClick={handleClose} className="close-btn" disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        <div className="load-confirm-content">
          <div className="load-confirm-message">
            <FileText size={16} className="info-icon" />
            <p>
              以前に保存した設定があります。読み込むと、保存された内容でスケジュール設定を開始できます。
            </p>
          </div>

          {configurations.length > 0 && (
            <div className="config-selection">
              <h4>保存済みの設定</h4>
              <div className="config-list">
                {configurations.map((config) => (
                  <div
                    key={config.id}
                    className={`config-option ${selectedConfig?.id === config.id ? 'selected' : ''}`}
                    onClick={() => setSelectedConfig(config)}
                  >
                    <div className="config-radio">
                      <input
                        type="radio"
                        name="selectedConfig"
                        checked={selectedConfig?.id === config.id}
                        onChange={() => setSelectedConfig(config)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="config-details">
                      <div className="config-name">{config.name}</div>
                      <div className="config-meta">
                        <Calendar size={12} />
                        {new Date(config.timestamp).toLocaleString('ja-JP')}
                      </div>
                      {config.description && (
                        <div className="config-description">{config.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="load-confirm-actions">
          <button
            onClick={handleLoadConfiguration}
            disabled={!selectedConfig || isLoading}
            className="btn-primary"
          >
            {isLoading ? '読み込み中...' : 'この設定を読み込む'}
          </button>
          <button
            onClick={onCreateNew}
            disabled={isLoading}
            className="btn-secondary"
          >
            新規で設定を作成
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

export default LoadConfirmDialog;
