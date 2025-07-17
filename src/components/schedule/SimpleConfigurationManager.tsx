import React, { useState } from 'react';
import { Save, Folder, Trash2, X } from 'lucide-react';
import { useConfiguration } from '../../hooks/useConfiguration';
import './SimpleConfigurationManager.css';

interface SimpleConfigurationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConfiguration?: (settings: any) => void;
  currentSettings?: any;
  onSaveSuccess?: (configId: string) => void;
  currentStep?: number; // 現在のステップを追加
}

const SimpleConfigurationManager: React.FC<SimpleConfigurationManagerProps> = ({
  isOpen,
  onClose,
  onLoadConfiguration,
  currentSettings,
  onSaveSuccess,
  currentStep = 1
}) => {
  const {
    history,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration
  } = useConfiguration();

  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ユーザーの手動保存設定のみ取得（自動保存を除外、最新2件まで）
  const userConfigs = history
    .filter(config => !config.metadata.autoSaved && config.name !== '')
    .slice(0, 2);

  const handleSave = async () => {
    if (!saveName.trim() || !currentSettings) return;
    
    setIsLoading(true);
    try {
      const configId = await saveConfiguration(
        currentSettings, 
        saveName.trim(), 
        saveDescription.trim()
      );
      setSaveName('');
      setSaveDescription('');
      onSaveSuccess?.(configId);
      alert('設定を保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (configId: string) => {
    setIsLoading(true);
    try {
      const settings = await loadConfiguration(configId);
      if (settings && onLoadConfiguration) {
        onLoadConfiguration(settings);
        onClose();
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
      alert('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (configId: string, configName: string) => {
    if (window.confirm(`「${configName}」を削除しますか？`)) {
      setIsLoading(true);
      try {
        await deleteConfiguration(configId);
        alert('設定を削除しました');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  // ステップに応じたタイトルとメッセージ
  const getStepInfo = () => {
    if (currentStep === 1) {
      return {
        title: 'マイ設定を読み込み',
        description: '保存済みの設定を読み込んで、スケジュール作成を効率化できます。'
      };
    } else {
      return {
        title: 'マイ設定（読み込み不可）',
        description: 'ステップ1でのみ設定の読み込みが可能です。現在は保存済み設定の確認のみできます。'
      };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="simple-config-overlay">
      <div className="simple-config-modal">
        <div className="simple-config-header">
          <h3>
            <Folder size={20} />
            {stepInfo.title}
          </h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="simple-config-content">
          {/* ステップ情報の表示 */}
          <div className="step-info">
            <p>{stepInfo.description}</p>
          </div>

          {/* ステップ1以外では保存機能のみ表示 */}
          {currentStep !== 1 && (
            <div className="config-section">
              <h4>
                <Save size={16} />
                現在の設定を保存
              </h4>
              <div className="save-form">
                <input
                  type="text"
                  placeholder="設定名を入力（例：夜勤多めパターン）"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  maxLength={30}
                />
                <textarea
                  placeholder="説明（任意）"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  maxLength={100}
                  rows={2}
                />
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim() || !currentSettings || isLoading || userConfigs.length >= 2}
                  className="btn-primary"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
                {userConfigs.length >= 2 && (
                  <p className="warning-text">
                    ※ 保存できる設定は2つまでです。既存の設定を削除してから保存してください。
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ステップ1では保存済み設定の読み込み表示 */}
          {currentStep === 1 && (
            <div className="config-section">
              <h4>
                <Folder size={16} />
                保存済み設定（{userConfigs.length}/2）
              </h4>
              {userConfigs.length === 0 ? (
                <div className="empty-state">
                  <p>保存された設定がありません</p>
                </div>
              ) : (
                <div className="config-list">
                  {userConfigs.map((config) => (
                    <div key={config.id} className="config-item">
                      <div className="config-info">
                        <div className="config-name">{config.name}</div>
                        <div className="config-meta">
                          {new Date(config.timestamp).toLocaleString('ja-JP')}
                        </div>
                        {config.description && (
                          <div className="config-description">{config.description}</div>
                        )}
                      </div>
                      <div className="config-actions">
                        <button
                          onClick={() => handleLoad(config.id)}
                          disabled={isLoading}
                          className="btn-secondary"
                        >
                          読み込み
                        </button>
                        <button
                          onClick={() => handleDelete(config.id, config.name || '設定')}
                          disabled={isLoading}
                          className="btn-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ステップ1以外では保存済み設定の確認のみ */}
          {currentStep !== 1 && (
            <div className="config-section">
              <h4>
                <Folder size={16} />
                保存済み設定（確認のみ）
              </h4>
              {userConfigs.length === 0 ? (
                <div className="empty-state">
                  <p>保存された設定がありません</p>
                </div>
              ) : (
                <div className="config-list">
                  {userConfigs.map((config) => (
                    <div key={config.id} className="config-item view-only">
                      <div className="config-info">
                        <div className="config-name">{config.name}</div>
                        <div className="config-meta">
                          {new Date(config.timestamp).toLocaleString('ja-JP')}
                        </div>
                        {config.description && (
                          <div className="config-description">{config.description}</div>
                        )}
                      </div>
                      <div className="config-actions">
                        <button
                          onClick={() => handleDelete(config.id, config.name || '設定')}
                          disabled={isLoading}
                          className="btn-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleConfigurationManager;
