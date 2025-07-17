import { useState, useCallback, useEffect } from 'react';
import { Department, DepartmentStats } from '../types';

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ストレージキー
  const STORAGE_KEY = 'departments';

  // データの永続化
  const saveToStorage = useCallback((data: Department[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Department storage save error:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): Department[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Date型フィールドを復元
      return parsed.map((dept: any) => ({
        ...dept,
        createdAt: new Date(dept.createdAt),
        updatedAt: new Date(dept.updatedAt)
      }));
    } catch (error) {
      console.error('Department storage load error:', error);
      return [];
    }
  }, []);

  // 初期データの読み込み
  useEffect(() => {
    const loadInitialData = () => {
      setIsLoading(true);
      try {
        const storedDepartments = loadFromStorage();
        
        // デモデータがない場合は初期データを作成
        if (storedDepartments.length === 0) {
          const defaultDepartments: Department[] = [
            {
              id: 'dept_001',
              name: '内科',
              description: '内科部門',
              isActive: true,
              createdBy: 'system',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'dept_002',
              name: '外科',
              description: '外科部門',
              isActive: true,
              createdBy: 'system',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'dept_003',
              name: '小児科',
              description: '小児科部門',
              isActive: true,
              createdBy: 'system',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          
          setDepartments(defaultDepartments);
          saveToStorage(defaultDepartments);
          console.log('✅ デモ部署データを作成しました');
        } else {
          setDepartments(storedDepartments);
          console.log('📂 部署データを読み込みました:', storedDepartments.length);
        }
      } catch (error) {
        console.error('Department initialization error:', error);
        setError('部署データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [loadFromStorage, saveToStorage]);

  // 部署の作成
  const createDepartment = useCallback(async (
    name: string,
    description: string,
    managerId?: string,
    createdBy: string = 'admin'
  ): Promise<Department | null> => {
    try {
      setError(null);
      
      // 重複チェック
      const existingDept = departments.find(d => d.name.toLowerCase() === name.toLowerCase());
      if (existingDept) {
        setError('同じ名前の部署が既に存在します');
        return null;
      }

      const newDepartment: Department = {
        id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim(),
        ...(managerId && { managerId }), // managerIdがある場合のみ設定
        isActive: true,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedDepartments = [...departments, newDepartment];
      setDepartments(updatedDepartments);
      saveToStorage(updatedDepartments);
      
      console.log('✅ 部署を作成しました:', newDepartment);
      return newDepartment;
    } catch (error) {
      console.error('Department creation error:', error);
      setError('部署の作成に失敗しました');
      return null;
    }
  }, [departments, saveToStorage]);

  // 部署の更新
  const updateDepartment = useCallback(async (
    id: string,
    updates: Partial<Pick<Department, 'name' | 'description' | 'managerId' | 'isActive'>>
  ): Promise<boolean> => {
    try {
      setError(null);
      
      const departmentIndex = departments.findIndex(d => d.id === id);
      if (departmentIndex === -1) {
        setError('部署が見つかりません');
        return false;
      }

      // 名前の重複チェック（自分以外）
      if (updates.name) {
        const existingDept = departments.find(d => 
          d.id !== id && d.name.toLowerCase() === updates.name!.toLowerCase()
        );
        if (existingDept) {
          setError('同じ名前の部署が既に存在します');
          return false;
        }
      }

      const updatedDepartment: Department = {
        ...departments[departmentIndex],
        ...updates,
        updatedAt: new Date()
      };

      const updatedDepartments = [...departments];
      updatedDepartments[departmentIndex] = updatedDepartment;
      
      setDepartments(updatedDepartments);
      saveToStorage(updatedDepartments);
      
      console.log('✅ 部署を更新しました:', updatedDepartment);
      return true;
    } catch (error) {
      console.error('Department update error:', error);
      setError('部署の更新に失敗しました');
      return false;
    }
  }, [departments, saveToStorage]);

  // 部署の削除（論理削除）
  const deleteDepartment = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const departmentIndex = departments.findIndex(d => d.id === id);
      if (departmentIndex === -1) {
        setError('部署が見つかりません');
        return false;
      }

      const updatedDepartment: Department = {
        ...departments[departmentIndex],
        isActive: false,
        updatedAt: new Date()
      };

      const updatedDepartments = [...departments];
      updatedDepartments[departmentIndex] = updatedDepartment;
      
      setDepartments(updatedDepartments);
      saveToStorage(updatedDepartments);
      
      console.log('✅ 部署を削除しました:', id);
      return true;
    } catch (error) {
      console.error('Department deletion error:', error);
      setError('部署の削除に失敗しました');
      return false;
    }
  }, [departments, saveToStorage]);

  // 部署の取得
  const getDepartmentById = useCallback((id: string): Department | undefined => {
    return departments.find(d => d.id === id);
  }, [departments]);

  // アクティブな部署の取得
  const getActiveDepartments = useCallback((): Department[] => {
    return departments.filter(d => d.isActive);
  }, [departments]);

  // 部署統計の取得（モック）
  const getDepartmentStats = useCallback((_departmentId: string): DepartmentStats => {
    // 実際の実装では、スタッフ数や勤務希望数などを計算
    return {
      totalStaff: Math.floor(Math.random() * 20) + 5,
      activeStaff: Math.floor(Math.random() * 15) + 3,
      pendingRequests: Math.floor(Math.random() * 10),
      completedSchedules: Math.floor(Math.random() * 5) + 1
    };
  }, []);

  // 所属長の指定
  const assignManager = useCallback(async (
    departmentId: string,
    managerId: string
  ): Promise<boolean> => {
    return await updateDepartment(departmentId, { managerId });
  }, [updateDepartment]);

  // 所属長の解除
  const removeManager = useCallback(async (departmentId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const departmentIndex = departments.findIndex(d => d.id === departmentId);
      if (departmentIndex === -1) {
        setError('部署が見つかりません');
        return false;
      }

      const updatedDepartment: Department = {
        ...departments[departmentIndex],
        updatedAt: new Date()
      };
      
      // managerIdを削除
      delete (updatedDepartment as any).managerId;

      const updatedDepartments = [...departments];
      updatedDepartments[departmentIndex] = updatedDepartment;
      
      setDepartments(updatedDepartments);
      saveToStorage(updatedDepartments);
      
      console.log('✅ 所属長を解除しました:', departmentId);
      return true;
    } catch (error) {
      console.error('Manager removal error:', error);
      setError('所属長の解除に失敗しました');
      return false;
    }
  }, [departments, saveToStorage]);

  return {
    departments,
    isLoading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentById,
    getActiveDepartments,
    getDepartmentStats,
    assignManager,
    removeManager,
    setError
  };
};
