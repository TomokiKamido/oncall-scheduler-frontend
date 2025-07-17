import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserRole } from '../../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { /*collection,*/ /*doc,*/ /*getDocs,*/ /*setDoc,*/ /*Timestamp,*/ /*getDoc,*/ /*serverTimestamp, addDoc*/ } from 'firebase/firestore';
import { /*db,*/ auth } from '../../config/firebase';
import { useDepartments } from '../../hooks/useDepartments';
import { useToast } from '../../hooks/useToast';
// import { permissionService, UserPermission } from '../../services/permissionService';
import { useAuthContext } from '../../contexts/AuthContext';
import './UserManagement.css';

interface UserManagementProps {
  onBack: () => void;
}

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  disabled: boolean;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime?: string;
  };
}

// 簡易版のUserPermission型定義
interface UserPermission {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  department: string;
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface UserManagementData extends UserPermission {
  hasChanges?: boolean;
  originalRole?: UserRole;
  originalDepartment?: string;
  authUser?: AuthUser; // Firebase Auth のユーザー情報
}

// 役割の正規化（viewer, editorをstaffに統一）
// const normalizeRole = (role: string): UserRole => {
//   if (role === 'admin') return 'admin';
//   if (role === 'manager') return 'manager';
//   // viewer, editor, またはその他の役割はすべてstaffに統一
//   return 'staff';
// };

// 役割の表示名を取得
// const getRoleDisplayName = (role: UserRole | string): string => {
//   switch (role) {
//     case 'admin':
//       return '管理者';
//     case 'manager':
//       return 'マネージャー';
//     case 'staff':
//       return 'スタッフ';
//     default:
//       return 'スタッフ';
//   }
// };

export const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<UserPermission>>>(new Map());
  const [editingUser, setEditingUser] = useState<UserManagementData | null>(null);
  const { departments } = useDepartments();
  const { showSuccess, showError } = useToast();
  const { /*currentUser,*/ refreshPermissions } = useAuthContext();
  
  // Functions を asia-northeast1 リージョンで初期化
  const functions = getFunctions(undefined, 'asia-northeast1');

  const fetchAuthUsers = useCallback(async () => {
    try {
      console.log('🔄 [Auth Users] Starting fetch from Cloud Function...');
      console.log('🔍 [Auth] Current user state:', auth.currentUser?.uid, auth.currentUser?.email);
      
      const listUsersFunction = httpsCallable(functions, 'listUsers');
      const result = await listUsersFunction();
      const data = result.data as { users: AuthUser[] };
      
      console.log('✅ [Auth Users] Raw response:', data);
      console.log('✅ [Auth Users] Users count:', data.users?.length || 0);
      
      if (!data.users || data.users.length === 0) {
        console.warn('⚠️ [Auth Users] No users returned from Cloud Function.');
        showError('認証ユーザーが見つかりません。Firebase Authenticationを確認してください。');
      } else {
        console.log('📊 [Auth Users] Successfully fetched users:', data.users);
      }
      
      return data.users || [];
    } catch (error) {
      console.error('❌ [Auth Users] Error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        details: (error as any)?.details
      });
      showError(`認証ユーザーの取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }, [functions, showError]);

  const fetchPermissions = useCallback(async () => {
    try {
      console.log('🔄 [Permissions] Starting fetch from Firestore...');
      // 簡易版：空の配列を返すか、実際のfetch処理をコメントアウト
      console.log('✅ [Permissions] Using empty permissions array');
      return [];
    } catch (error) {
      console.error('❌ [Permissions] Error fetching permissions:', error);
      showError('権限情報の取得に失敗しました');
      return [];
    }
  }, [showError]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [authUsersData, permissionsData] = await Promise.all([
        fetchAuthUsers(),
        fetchPermissions()
      ]);
      
      setAuthUsers(authUsersData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('❌ [Data Load] Error loading data:', error);
      showError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [fetchAuthUsers, fetchPermissions, showError]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const mergedUsers: UserManagementData[] = useMemo(() => {
    return authUsers.map(authUser => {
      const permission = permissions.find(p => p.uid === authUser.uid);
      const pendingChange = pendingChanges.get(authUser.uid);
      
      const baseUser: UserManagementData = {
        uid: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName || '(名前未設定)',
        role: permission?.role || 'staff',
        department: permission?.department || '',
        isActive: permission?.isActive !== false,
        createdAt: permission?.createdAt || new Date(),
        updatedAt: permission?.updatedAt || new Date(),
        authUser: authUser
      };

      // 保留中の変更があるかチェック
      const hasChanges = pendingChange !== undefined;

      return {
        ...baseUser,
        // 保留中の変更があれば適用
        role: pendingChange?.role || baseUser.role,
        department: pendingChange?.department || baseUser.department,
        // 元の値を保存
        originalRole: baseUser.role,
        originalDepartment: baseUser.department,
        hasChanges
      };
    });
  }, [authUsers, permissions, pendingChanges]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return mergedUsers;
    }
    return mergedUsers.filter(user =>
      (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [mergedUsers, searchTerm]);

  // 権限変更を一時的に保存
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const newPendingChanges = new Map(pendingChanges);
    const currentChanges = newPendingChanges.get(userId) || {};
    
    newPendingChanges.set(userId, {
      ...currentChanges,
      role: newRole
    });
    
    setPendingChanges(newPendingChanges);
  };

  // 部署変更を一時的に保存
  const handleDepartmentChange = (userId: string, newDepartment: string) => {
    const newPendingChanges = new Map(pendingChanges);
    const currentChanges = newPendingChanges.get(userId) || {};
    
    newPendingChanges.set(userId, {
      ...currentChanges,
      department: newDepartment
    });
    
    setPendingChanges(newPendingChanges);
  };

  // 変更を保存（新しい権限システム対応）
  const saveChanges = async () => {
    if (pendingChanges.size === 0) {
      showError('保存する変更がありません');
      return;
    }

    setIsSaving(true);
    const errors: string[] = [];
    const successes: string[] = [];

    try {
      // Cloud Function を使用して権限を更新
      const updateUserPermission = httpsCallable(functions, 'updateUserPermission');

      for (const [userId, changes] of pendingChanges.entries()) {
        const user = mergedUsers.find(u => u.uid === userId);
        if (!user) continue;

        try {
          console.log(`Updating permission for ${userId}:`, changes);
          
          // 新しい権限データを準備
          const permissionData = {
            uid: userId,
            role: changes.role || user.originalRole,
            department: changes.department || user.originalDepartment,
            isActive: changes.isActive !== undefined ? changes.isActive : user.isActive
          };

          // Cloud Function で権限を更新
          await updateUserPermission(permissionData);

          // 成功ログ
          console.log(`✅ Permission updated for ${userId}`);
          successes.push(`${user.displayName || user.email} の権限を更新しました`);

        } catch (error) {
          console.error(`❌ Permission update failed for ${userId}:`, error);
          errors.push(`${user.displayName || user.email} の権限更新に失敗しました`);
        }
      }

      // 成功メッセージ
      if (successes.length > 0) {
        showSuccess(`${successes.length}件の権限を更新しました`);
      }

      // エラーメッセージ
      if (errors.length > 0) {
        showError(errors.join('\n'));
      }

      // 変更をクリア
      setPendingChanges(new Map());
      
      // 権限データを再読み込み
      await loadAllData();
      
      // 現在のユーザーの権限情報を更新
      await refreshPermissions();

    } catch (error) {
      console.error('❌ Permission save failed:', error);
      showError('権限の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 変更を破棄
  const discardChanges = () => {
    if (pendingChanges.size === 0) return;

    const confirmDiscard = window.confirm('未保存の変更があります。破棄してもよろしいですか？');
    if (!confirmDiscard) return;

    setPendingChanges(new Map());
    showSuccess('変更を破棄しました');
  };

  // 権限を同期する関数
  // const syncUserRoles = async () => {
  //   setIsSaving(true);
  //   try {
  //     const syncFunction = httpsCallable(functions, 'syncUserRoles');
  //     const result = await syncFunction();
  //     const data = result.data as { success: boolean; syncCount: number; errorCount: number; message: string };
  //     
  //     console.log('✅ [Role Sync] Sync completed:', data);
  //     showSuccess(data.message);
  //     
  //     // データを再読み込み
  //     const [authUsersData, firestoreUsersData, actualRolesData] = await Promise.all([
  //       fetchAuthUsers(),
  //       fetchFirestoreUsers(),
  //       fetchActualRoles()
  //     ]);
  //     
  //     setAuthUsers(authUsersData);
  //     setUsers(firestoreUsersData);
  //     setActualRoles(actualRolesData);
  //     
  //   } catch (error) {
  //     console.error('❌ [Role Sync] Error:', error);
  //     showError('権限の同期に失敗しました');
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 全ユーザーのFirestoreプロファイルを更新または作成
  // const updateAllUserProfiles = async () => {
  //   setLoading(true);
  //   try {
  //     const allAuthUsers = await fetchAuthUsers(); // fetchAllAuthUsers を fetchAuthUsers に変更
  //     if (allAuthUsers.length > 0) {
  //       for (const authUser of allAuthUsers) {
  //         await createProfileIfNotExists(authUser);
  //       }
  //       const firestoreUsersData = await fetchFirestoreUsers(); // 更新後のプロファイルを再取得
  //       setUsers(firestoreUsersData); // stateを更新してUIに反映
  //       showSuccess(`✅ 全${allAuthUsers.length}ユーザーのプロファイル情報を同期しました。`);
  //     }
  //   } catch (error) {
  //     console.error('❌ 全ユーザー情報の更新エラー:', error);
  //     showError('全ユーザー情報の更新中にエラーが発生しました。');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Firestoreにプロファイルが存在しない場合のみ作成
  // const createProfileIfNotExists = async (authUser: AuthUser) => {
  //   const userRef = doc(db, 'users', authUser.uid);
  //   try {
  //     const userSnap = await getDoc(userRef);
  //     if (!userSnap.exists()) {
  //       const newUserProfile: Omit<UserProfile, 'uid'> = {
  //         displayName: authUser.displayName || '',
  //         email: authUser.email || '',
  //         role: 'staff',
  //         department: '',
  //         managedDepartments: [],
  //         isActive: true,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //       };
  //       await setDoc(userRef, newUserProfile);
  //       
  //       // カスタムクレームも同期
  //       try {
  //         const setCustomClaims = httpsCallable(functions, 'setCustomUserClaimsCallable');
  //         await setCustomClaims({ 
  //           uid: authUser.uid, 
  //           customClaims: { 
  //             role: 'staff',
  //             department: ''
  //           }
  //         });
  //         console.log(`✅ ${authUser.email} のプロファイルとカスタムクレームを作成完了`);
  //       } catch (error) {
  //         console.error(`❌ ${authUser.email} のカスタムクレーム作成エラー:`, error);
  //       }
  //       
  //       showSuccess(`${authUser.email} のFirestoreプロファイルを作成しました。`);
  //     }
  //   } catch (error) {
  //     console.error(`❌ ${authUser.email} のプロファイル作成エラー:`, error);
  //     showError(`プロファイルの作成に失敗しました: ${error}`);
  //   }
  // };

  // 権限システムを完全にリセットする関数
  const resetPermissionSystem = async () => {
    const confirmMessage = `権限システムを完全にリセットしますか？

この操作により：
- 全ユーザーの権限がデフォルトの設定に戻ります
- llb5yyuihdx@gmail.com が管理者に設定されます
- 他のユーザーは staff 権限に設定されます
- この操作は取り消せません

本当に実行しますか？`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsSaving(true);
    try {
      console.log('🔄 [Permission Reset] Starting permission system reset...');
      
      const resetFunction = httpsCallable(functions, 'resetPermissionSystem');
      const result = await resetFunction();
      const data = result.data as { 
        success: boolean; 
        message: string; 
        results: Array<{ email: string; role: string; status: string }>;
        adminEmails: string[];
        managerEmails: string[];
        staffEmails: string[];
      };
      
      console.log('✅ [Permission Reset] Reset completed:', data);
      showSuccess(data.message);
      
      // 詳細結果をログに出力
      if (data.results && data.results.length > 0) {
        console.log('📋 [Permission Reset] Detailed results:');
        data.results.forEach(result => {
          console.log(`  - ${result.email}: ${result.role} (${result.status})`);
        });
      }
      
      // データを再読み込み
      await loadAllData();
      
      // 現在のユーザーの権限情報を更新
      await refreshPermissions();
      
    } catch (error) {
      console.error('❌ [Permission Reset] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`権限システムのリセットに失敗しました: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading-indicator">データを読み込んでいます...</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="header-left">
          <button onClick={onBack} className="back-button">
            &larr; ダッシュボードに戻る
          </button>
          <h1>ユーザー権限管理</h1>
        </div>
        <div className="header-actions">
          {pendingChanges.size > 0 && (
            <>
              <span className="pending-changes-count">
                {pendingChanges.size}件の未保存の変更
              </span>
              <button
                onClick={discardChanges}
                className="btn-secondary"
                disabled={isSaving}
              >
                変更を破棄
              </button>
              <button
                onClick={saveChanges}
                className="btn-primary save-button"
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '変更を保存'}
              </button>
            </>
          )}
          <button 
            onClick={resetPermissionSystem} 
            disabled={loading || isSaving}
            className="btn-danger"
            style={{ 
              backgroundColor: '#dc2626', 
              color: 'white',
              border: 'none',
              marginRight: '8px',
              fontWeight: 'bold'
            }}
            title="権限システムを完全にリセットします（管理者のみ）"
          >
            {isSaving ? 'リセット中...' : '🔄 権限システムリセット'}
          </button>
          <button 
            onClick={loadAllData} 
            disabled={loading || isSaving}
            className="btn-secondary"
          >
            {loading ? '更新中...' : '⟲ データを更新'}
          </button>
        </div>
      </div>

      <div className="search-bar-container">
        <input
          type="text"
          placeholder="名前またはメールアドレスで検索..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {(loading || isSaving) && <div className="loading-indicator">
        {isSaving ? '変更を保存中...' : '読み込み中...'}
      </div>}

      <div className="user-list-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>メールアドレス</th>
              <th>権限</th>
              <th>部署</th>
              <th>ステータス</th>
              <th>登録日</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              return (
                <tr key={user.uid} className={`${user.hasChanges ? 'has-changes' : ''}`}>
                  <td>{user.displayName || 'N/A'}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                      className="role-select"
                    >
                      <option value="admin">管理者</option>
                      <option value="manager">マネージャー</option>
                      <option value="staff">スタッフ</option>
                    </select>
                    {user.hasChanges && <span className="change-indicator">*</span>}
                  </td>
                  <td>
                    <select
                      value={user.department}
                      onChange={(e) => handleDepartmentChange(user.uid, e.target.value)}
                      className="department-select"
                    >
                      <option value="">未所属</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    {user.hasChanges && <span className="change-indicator">*</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'アクティブ' : '無効'}
                    </span>
                  </td>
                  <td>{user.createdAt ? 
                    (user.createdAt instanceof Date ? 
                      user.createdAt.toLocaleDateString() : 
                      new Date(user.createdAt).toLocaleDateString()) : 
                    'N/A'}
                  </td>
                  <td>
                    <button onClick={() => setEditingUser(user)} className="edit-button">
                      詳細編集
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>{editingUser.displayName} の詳細編集</h2>
            <p>（ここに詳細な編集フォームを実装します）</p>
            <button onClick={() => setEditingUser(null)}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
};
