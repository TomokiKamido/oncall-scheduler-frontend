import React, { useState } from 'react';
import { 
  Save, 
  Folder, 
  Star, 
  Download, 
  Upload, 
  Trash2, 
  Search,
  Clock,
  Settings,
  Heart,
  X,
  FileText
} from 'lucide-react';
import { useConfiguration } from '../../hooks/useConfiguration';
import { ConfigurationHistory } from '../../types';
import './ConfigurationManager.css';

interface ConfigurationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConfiguration?: (settings: any) => void;
  currentSettings?: any;
  onSaveSuccess?: (configId: string) => void;
}

const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({
  isOpen,
  onClose,
  onLoadConfiguration,
  currentSettings,
  onSaveSuccess
}) => {
  const {
    history,
    favorites,
    isLoading,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    addToFavorites,
    removeFromFavorites,
    starConfiguration,
    unstarConfiguration,
    getRecentConfigurations,
    getFavoriteConfigurations,
    searchConfigurations,
    exportConfigurations,
    importConfigurations,
    getUsageStats
  } = useConfiguration();

  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'all' | 'stats'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [saveDialogData, setSaveDialogData] = useState({ name: '', description: '' });
  const [importData, setImportData] = useState('');

  // 表示する設定リストを取得
  const getDisplayConfigurations = () => {
    let configs: ConfigurationHistory[] = [];
    
    switch (activeTab) {
      case 'recent':
        configs = getRecentConfigurations(20);
        break;
      case 'favorites':
        const favoriteConfigs = getFavoriteConfigurations();
        configs = favoriteConfigs.map(fav => 
          history.find(h => h.id === fav.historyId)
        ).filter(Boolean) as ConfigurationHistory[];
        break;
      case 'all':
        configs = history;
        break;
      default:
        configs = [];
    }

    if (searchQuery) {
      configs = searchConfigurations(searchQuery);
    }

    return configs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // 設定保存処理
  const handleSave = async () => {
    if (!currentSettings) {
      alert('保存する設定がありません');
      return;
    }

    if (!saveDialogData.name.trim()) {
      alert('設定名を入力してください');
      return;
    }

    try {
      const configId = await saveConfiguration(
        currentSettings,
        saveDialogData.name,
        saveDialogData.description
      );
      
      setShowSaveDialog(false);
      setSaveDialogData({ name: '', description: '' });
      onSaveSuccess?.(configId);
      
      // 成功メッセージ
      const notification = document.createElement('div');
      notification.className = 'save-success-notification';
      notification.textContent = '設定を保存しました';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      alert('設定の保存に失敗しました');
    }
  };

  // 設定読み込み処理
  const handleLoad = async (configId: string) => {
    try {
      const settings = await loadConfiguration(configId);
      if (settings && onLoadConfiguration) {
        onLoadConfiguration(settings);
        onClose();
        
        // 成功メッセージ
        const notification = document.createElement('div');
        notification.className = 'load-success-notification';
        notification.textContent = '設定を読み込みました';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('設定の読み込みに失敗しました');
    }
  };

  // お気に入り切り替え
  const handleToggleFavorite = async (config: ConfigurationHistory) => {
    const favorite = favorites.find(f => f.historyId === config.id);
    
    if (favorite) {
      await removeFromFavorites(favorite.id);
    } else {
      await addToFavorites(config.id, config.name || 'お気に入り設定');
    }
  };

  // スター切り替え
  const handleToggleStar = async (configId: string, isStarred: boolean) => {
    if (isStarred) {
      await unstarConfiguration(configId);
    } else {
      await starConfiguration(configId);
    }
  };

  // エクスポート処理
  const handleExport = () => {
    const exportIds = selectedConfigs.length > 0 ? selectedConfigs : undefined;
    const data = exportConfigurations(exportIds);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scheduler_config_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSelectedConfigs([]);
  };

  // インポート処理
  const handleImport = async () => {
    if (!importData.trim()) {
      alert('インポートデータを入力してください');
      return;
    }

    try {
      const success = await importConfigurations(importData);
      if (success) {
        setShowImportDialog(false);
        setImportData('');
        alert('設定をインポートしました');
      } else {
        alert('インポートに失敗しました');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('インポートデータの形式が正しくありません');
    }
  };

  // ファイルからインポート
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const displayConfigs = getDisplayConfigurations();
  const stats = getUsageStats();

  return (
    <div className="configuration-manager-overlay">
      <div className="configuration-manager">
        {/* ヘッダー */}
        <div className="config-header">
          <h3>
            <Settings size={20} />
            設定管理
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ツールバー */}
        <div className="config-toolbar">
          <div className="toolbar-left">
            <button 
              className="save-btn"
              onClick={() => setShowSaveDialog(true)}
              disabled={!currentSettings}
            >
              <Save size={16} />
              現在の設定を保存
            </button>
          </div>
          
          <div className="toolbar-right">
            <button 
              className="export-btn"
              onClick={handleExport}
              disabled={selectedConfigs.length === 0 && history.length === 0}
            >
              <Download size={16} />
              エクスポート
            </button>
            <button 
              className="import-btn"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload size={16} />
              インポート
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="config-tabs">
          <button 
            className={`tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <Clock size={16} />
            最近使用 ({getRecentConfigurations(20).length})
          </button>
          <button 
            className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={16} />
            お気に入り ({favorites.length})
          </button>
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Folder size={16} />
            すべて ({history.length})
          </button>
          <button 
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <FileText size={16} />
            統計
          </button>
        </div>

        {/* 検索バー */}
        {activeTab !== 'stats' && (
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="設定を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="config-content">
          {activeTab === 'stats' ? (
            // 統計画面
            <div className="stats-view">
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>総設定数</h4>
                  <div className="stat-value">{stats.totalConfigurations}</div>
                </div>
                <div className="stat-card">
                  <h4>お気に入り数</h4>
                  <div className="stat-value">{stats.totalFavorites}</div>
                </div>
                <div className="stat-card">
                  <h4>最も使用</h4>
                  <div className="stat-value">
                    {stats.mostUsedConfiguration?.name || 'なし'}
                  </div>
                </div>
              </div>
              
              <div className="recent-activity">
                <h4>最近のアクティビティ</h4>
                <div className="activity-list">
                  {stats.recentActivity.map(config => (
                    <div key={config.id} className="activity-item">
                      <div className="activity-name">{config.name}</div>
                      <div className="activity-time">
                        {new Date(config.timestamp).toLocaleString('ja-JP')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // 設定リスト
            <div className="config-list">
              {isLoading ? (
                <div className="loading">読み込み中...</div>
              ) : displayConfigs.length === 0 ? (
                <div className="empty-state">
                  <Folder size={48} />
                  <p>設定が見つかりません</p>
                  {searchQuery && (
                    <p>検索条件: "{searchQuery}"</p>
                  )}
                </div>
              ) : (
                displayConfigs.map(config => {
                  const favorite = favorites.find(f => f.historyId === config.id);
                  const isSelected = selectedConfigs.includes(config.id);
                  
                  return (
                    <div 
                      key={config.id} 
                      className={`config-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="config-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedConfigs([...selectedConfigs, config.id]);
                            } else {
                              setSelectedConfigs(selectedConfigs.filter(id => id !== config.id));
                            }
                          }}
                        />
                      </div>
                      
                      <div className="config-info" onClick={() => handleLoad(config.id)}>
                        <div className="config-name">
                          {config.name}
                          {config.metadata.autoSaved && (
                            <span className="auto-save-badge">自動保存</span>
                          )}
                          {config.starred && (
                            <Star size={14} className="starred" />
                          )}
                        </div>
                        {config.description && (
                          <div className="config-description">{config.description}</div>
                        )}
                        <div className="config-meta">
                          <span className="config-date">
                            {new Date(config.timestamp).toLocaleString('ja-JP')}
                          </span>
                          {favorite && (
                            <span className="usage-count">
                              使用回数: {favorite.usageCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="config-actions">
                        <button
                          className={`action-btn ${config.starred ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(config.id, config.starred);
                          }}
                          title="スターを付ける"
                        >
                          <Star size={16} />
                        </button>
                        
                        <button
                          className={`action-btn ${favorite ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(config);
                          }}
                          title="お気に入り"
                        >
                          <Heart size={16} />
                        </button>
                        
                        <button
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('この設定を削除しますか？')) {
                              deleteConfiguration(config.id);
                            }
                          }}
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 保存ダイアログ */}
        {showSaveDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <div className="dialog-header">
                <h4>設定を保存</h4>
                <button onClick={() => setShowSaveDialog(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="dialog-content">
                <div className="form-group">
                  <label>設定名 *</label>
                  <input
                    type="text"
                    value={saveDialogData.name}
                    onChange={(e) => setSaveDialogData({
                      ...saveDialogData,
                      name: e.target.value
                    })}
                    placeholder="例: 平日シフト設定"
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label>説明</label>
                  <textarea
                    value={saveDialogData.description}
                    onChange={(e) => setSaveDialogData({
                      ...saveDialogData,
                      description: e.target.value
                    })}
                    placeholder="設定の詳細や用途を記載してください"
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowSaveDialog(false)}
                >
                  キャンセル
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleSave}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* インポートダイアログ */}
        {showImportDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <div className="dialog-header">
                <h4>設定をインポート</h4>
                <button onClick={() => setShowImportDialog(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="dialog-content">
                <div className="form-group">
                  <label>ファイルから選択</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                  />
                </div>
                <div className="form-group">
                  <label>またはJSONデータを貼り付け</label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="エクスポートされたJSONデータを貼り付けてください"
                    rows={10}
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowImportDialog(false)}
                >
                  キャンセル
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={!importData.trim()}
                >
                  インポート
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationManager;
