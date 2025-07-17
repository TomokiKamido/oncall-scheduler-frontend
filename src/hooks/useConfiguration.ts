import { useState, useEffect, useCallback } from 'react';
import { ConfigurationHistory, FavoriteConfiguration, WorkType, WorkCalendarDay, Group, CustomRule } from '../types';
import { useAuth } from './useAuth';

interface ConfigurationSettings {
  workTypes: WorkType[];
  workCalendar: WorkCalendarDay[];
  groups: Group[];
  customRules: CustomRule[];
  memberWorkConfigs: any;
}

interface UseConfigurationReturn {
  // 状態
  history: ConfigurationHistory[];
  favorites: FavoriteConfiguration[];
  currentConfig: ConfigurationHistory | null;
  isAutoSaveEnabled: boolean;
  isLoading: boolean;
  
  // 基本操作
  saveConfiguration: (
    settings: ConfigurationSettings,
    name?: string,
    description?: string,
    isAutoSave?: boolean
  ) => Promise<string>;
  loadConfiguration: (id: string) => Promise<ConfigurationSettings | null>;
  deleteConfiguration: (id: string) => Promise<boolean>;
  
  // お気に入り管理
  addToFavorites: (historyId: string, name: string, description?: string) => Promise<boolean>;
  removeFromFavorites: (favoriteId: string) => Promise<boolean>;
  starConfiguration: (historyId: string) => Promise<boolean>;
  unstarConfiguration: (historyId: string) => Promise<boolean>;
  
  // 履歴管理
  getRecentConfigurations: (limit?: number) => ConfigurationHistory[];
  getFavoriteConfigurations: () => FavoriteConfiguration[];
  searchConfigurations: (query: string) => ConfigurationHistory[];
  clearHistory: () => Promise<boolean>;
  
  // 自動保存
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  autoSave: (settings: ConfigurationSettings, stepCompleted: number) => Promise<void>;
  
  // エクスポート/インポート
  exportConfigurations: (ids?: string[]) => string;
  importConfigurations: (jsonData: string) => Promise<boolean>;
  
  // 統計
  getUsageStats: () => {
    totalConfigurations: number;
    totalFavorites: number;
    mostUsedConfiguration: FavoriteConfiguration | null;
    recentActivity: ConfigurationHistory[];
  };
}

const STORAGE_KEYS = {
  HISTORY: 'scheduler_config_history',
  FAVORITES: 'scheduler_config_favorites',
  SETTINGS: 'scheduler_config_settings',
  AUTO_SAVE: 'scheduler_auto_save_config'
};

export const useConfiguration = (): UseConfigurationReturn => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ConfigurationHistory[]>([]);
  const [favorites, setFavorites] = useState<FavoriteConfiguration[]>([]);
  const [currentConfig, setCurrentConfig] = useState<ConfigurationHistory | null>(null);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 初期化
  useEffect(() => {
    loadFromStorage();
  }, [user]);

  // ストレージからデータ読み込み
  const loadFromStorage = useCallback(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const storedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        // ユーザー固有の履歴のみフィルタ
        const userHistory = user 
          ? parsedHistory.filter((h: ConfigurationHistory) => h.userId === user.uid)
          : parsedHistory;
        setHistory(userHistory);
      }

      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        const userFavorites = user
          ? parsedFavorites.filter((f: FavoriteConfiguration) => f.userId === user.uid)
          : parsedFavorites;
        setFavorites(userFavorites);
      }

      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setIsAutoSaveEnabled(settings.autoSave ?? true);
      }
    } catch (error) {
      console.error('Failed to load configuration from storage:', error);
    }
  }, [user]);

  // ストレージに保存
  const saveToStorage = useCallback((
    newHistory: ConfigurationHistory[],
    newFavorites: FavoriteConfiguration[]
  ) => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to save configuration to storage:', error);
    }
  }, []);

  // 設定保存
  const saveConfiguration = useCallback(async (
    settings: ConfigurationSettings,
    name?: string,
    description?: string,
    isAutoSave = false
  ): Promise<string> => {
    if (!user) {
      throw new Error('ユーザーがログインしていません');
    }

    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newConfig: ConfigurationHistory = {
        id: configId,
        userId: user.uid,
        timestamp: now,
        name: name || (isAutoSave ? `自動保存 ${new Date().toLocaleString('ja-JP')}` : `設定 ${new Date().toLocaleString('ja-JP')}`),
        description: description || '',
        settings,
        metadata: {
          stepCompleted: 5, // 全ステップ完了と仮定
          totalSteps: 6,
          autoSaved: isAutoSave,
          version: '1.0.0',
          modificationsFromTemplate: []
        },
        tags: isAutoSave ? ['auto-save'] : [],
        starred: false,
        isDefault: false
      };

      const updatedHistory = [newConfig, ...history];
      
      // 履歴は最大100件まで保持
      if (updatedHistory.length > 100) {
        updatedHistory.splice(100);
      }

      setHistory(updatedHistory);
      setCurrentConfig(newConfig);
      saveToStorage(updatedHistory, favorites);

      return configId;
    } finally {
      setIsLoading(false);
    }
  }, [user, history, favorites, saveToStorage]);

  // 設定読み込み
  const loadConfiguration = useCallback(async (id: string): Promise<ConfigurationSettings | null> => {
    setIsLoading(true);
    try {
      const config = history.find(h => h.id === id);
      if (!config) {
        console.warn(`Configuration with id ${id} not found`);
        return null;
      }

      setCurrentConfig(config);

      // 使用回数を更新（お気に入りの場合）
      const favorite = favorites.find(f => f.historyId === id);
      if (favorite) {
        const updatedFavorites = favorites.map(f =>
          f.id === favorite.id
            ? { ...f, usageCount: f.usageCount + 1, lastUsed: new Date().toISOString() }
            : f
        );
        setFavorites(updatedFavorites);
        saveToStorage(history, updatedFavorites);
      }

      return config.settings;
    } finally {
      setIsLoading(false);
    }
  }, [history, favorites, saveToStorage]);

  // 設定削除
  const deleteConfiguration = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updatedHistory = history.filter(h => h.id !== id);
      const updatedFavorites = favorites.filter(f => f.historyId !== id);
      
      setHistory(updatedHistory);
      setFavorites(updatedFavorites);
      saveToStorage(updatedHistory, updatedFavorites);

      if (currentConfig?.id === id) {
        setCurrentConfig(null);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      return false;
    }
  }, [history, favorites, currentConfig, saveToStorage]);

  // お気に入りに追加
  const addToFavorites = useCallback(async (
    historyId: string,
    name: string,
    description?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const config = history.find(h => h.id === historyId);
      if (!config) return false;

      const favoriteId = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newFavorite: FavoriteConfiguration = {
        id: favoriteId,
        historyId,
        userId: user.uid,
        name,
        description: description || '',
        category: 'favorite',
        usageCount: 0,
        lastUsed: new Date().toISOString(),
        quickAccess: false
      };

      const updatedFavorites = [...favorites, newFavorite];
      setFavorites(updatedFavorites);
      saveToStorage(history, updatedFavorites);

      return true;
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      return false;
    }
  }, [user, history, favorites, saveToStorage]);

  // お気に入りから削除
  const removeFromFavorites = useCallback(async (favoriteId: string): Promise<boolean> => {
    try {
      const updatedFavorites = favorites.filter(f => f.id !== favoriteId);
      setFavorites(updatedFavorites);
      saveToStorage(history, updatedFavorites);
      return true;
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      return false;
    }
  }, [favorites, history, saveToStorage]);

  // スター付け
  const starConfiguration = useCallback(async (historyId: string): Promise<boolean> => {
    try {
      const updatedHistory = history.map(h =>
        h.id === historyId ? { ...h, starred: true } : h
      );
      setHistory(updatedHistory);
      saveToStorage(updatedHistory, favorites);
      return true;
    } catch (error) {
      console.error('Failed to star configuration:', error);
      return false;
    }
  }, [history, favorites, saveToStorage]);

  // スター削除
  const unstarConfiguration = useCallback(async (historyId: string): Promise<boolean> => {
    try {
      const updatedHistory = history.map(h =>
        h.id === historyId ? { ...h, starred: false } : h
      );
      setHistory(updatedHistory);
      saveToStorage(updatedHistory, favorites);
      return true;
    } catch (error) {
      console.error('Failed to unstar configuration:', error);
      return false;
    }
  }, [history, favorites, saveToStorage]);

  // 最近の設定取得
  const getRecentConfigurations = useCallback((limit = 10): ConfigurationHistory[] => {
    return history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [history]);

  // お気に入り設定取得
  const getFavoriteConfigurations = useCallback((): FavoriteConfiguration[] => {
    return favorites.sort((a, b) => b.usageCount - a.usageCount);
  }, [favorites]);

  // 設定検索
  const searchConfigurations = useCallback((query: string): ConfigurationHistory[] => {
    const lowercaseQuery = query.toLowerCase();
    return history.filter(h =>
      h.name?.toLowerCase().includes(lowercaseQuery) ||
      h.description?.toLowerCase().includes(lowercaseQuery) ||
      h.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [history]);

  // 履歴クリア
  const clearHistory = useCallback(async (): Promise<boolean> => {
    try {
      setHistory([]);
      setFavorites([]);
      setCurrentConfig(null);
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      localStorage.removeItem(STORAGE_KEYS.FAVORITES);
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }, []);

  // 自動保存有効化
  const enableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(true);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ autoSave: true }));
  }, []);

  // 自動保存無効化
  const disableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(false);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ autoSave: false }));
  }, []);

  // 自動保存実行
  const autoSave = useCallback(async (
    settings: ConfigurationSettings,
    stepCompleted: number
  ): Promise<void> => {
    if (!isAutoSaveEnabled || !user) return;

    try {
      // 前回の自動保存から15分以内の場合はスキップ
      const lastAutoSave = history.find(h => h.metadata.autoSaved);
      if (lastAutoSave) {
        const timeDiff = Date.now() - new Date(lastAutoSave.timestamp).getTime();
        if (timeDiff < 15 * 60 * 1000) return; // 15分未満
      }

      const autoSaveName = `自動保存 - ステップ${stepCompleted}完了`;
      await saveConfiguration(settings, autoSaveName, `ステップ${stepCompleted}の設定を自動保存`, true);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [isAutoSaveEnabled, user, history, saveConfiguration]);

  // エクスポート
  const exportConfigurations = useCallback((ids?: string[]): string => {
    const configurationsToExport = ids
      ? history.filter(h => ids.includes(h.id))
      : history;

    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      configurations: configurationsToExport,
      metadata: {
        appVersion: '1.0.0',
        userAgent: navigator.userAgent,
        exportedBy: user?.uid || 'anonymous'
      }
    };

    return JSON.stringify(exportData, null, 2);
  }, [history, user]);

  // インポート
  const importConfigurations = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      const importData = JSON.parse(jsonData);
      const importedConfigs = importData.configurations || [];

      // インポートされた設定にユーザーIDを付与
      const updatedConfigs = importedConfigs.map((config: ConfigurationHistory) => ({
        ...config,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user?.uid || 'anonymous',
        timestamp: new Date().toISOString()
      }));

      const mergedHistory = [...history, ...updatedConfigs];
      setHistory(mergedHistory);
      saveToStorage(mergedHistory, favorites);

      return true;
    } catch (error) {
      console.error('Failed to import configurations:', error);
      return false;
    }
  }, [history, favorites, user, saveToStorage]);

  // 使用統計
  const getUsageStats = useCallback(() => {
    const mostUsedFavorite = favorites.reduce((prev, current) =>
      (prev.usageCount > current.usageCount) ? prev : current,
      favorites[0] || null
    );

    const recentActivity = history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return {
      totalConfigurations: history.length,
      totalFavorites: favorites.length,
      mostUsedConfiguration: mostUsedFavorite,
      recentActivity
    };
  }, [history, favorites]);

  return {
    history,
    favorites,
    currentConfig,
    isAutoSaveEnabled,
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
    clearHistory,
    enableAutoSave,
    disableAutoSave,
    autoSave,
    exportConfigurations,
    importConfigurations,
    getUsageStats
  };
};
