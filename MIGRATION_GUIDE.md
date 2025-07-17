/**
 * 既存システムから Custom Claims システムへの移行ガイド
 */

// =============================================================================
// 1. 既存の adminManager.ts を無効化または削除
// =============================================================================

// src/utils/adminManager.ts の強制権限システムを停止
export const checkAndSetAdminOnLogin = async (user: User): Promise<UserProfile | null> => {
  // ❌ 既存の強制権限システムを無効化
  console.log('⚠️ adminManager.ts は非推奨です。Custom Claims システムを使用してください。');
  return null;
};

// =============================================================================
// 2. UserManagement.tsx を Custom Claims 対応に変更
// =============================================================================

// 既存のFirestore更新の代わりに roleRequests を作成
const updateUserRole = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    console.log(`🔄 Custom Claims 権限変更申請中: ${userId}`, updates);
    
    // roleRequests コレクションに申請を作成
    const roleRequestData = {
      targetUid: userId,
      role: updates.role,
      chiefOf: updates.managedDepartments || [],
      hosp: updates.department || '',
      requestedBy: currentUser.uid,
      requestedAt: serverTimestamp(),
      status: 'approved' // 管理者申請なので即座に承認
    };

    await addDoc(collection(db, 'roleRequests'), roleRequestData);
    
    console.log('✅ Custom Claims 権限変更申請完了');
    alert(`✅ ${userName} の権限変更申請を送信しました。Custom Claims が自動で更新されます。`);
    
  } catch (error) {
    console.error('❌ Custom Claims 権限変更申請エラー:', error);
  }
};

// =============================================================================
// 3. useUserProfile.ts を Custom Claims 連携に変更
// =============================================================================

import { useCustomClaimsContext } from '@/hooks/useCustomClaims';

export const useUserProfile = (user: User | null) => {
  const { claims, loading: claimsLoading } = useCustomClaimsContext();
  
  // Custom Claims をメインの権限ソースとして使用
  const profile = useMemo(() => {
    if (!user || !claims) return null;
    
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: claims.role || 'staff',
      department: claims.hosp || '',
      managedDepartments: claims.chiefOf || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }, [user, claims]);

  return {
    profile,
    loading: claimsLoading,
    error: null,
    refreshProfile: async () => {
      // Custom Claims の更新は useCustomClaims で自動処理
    }
  };
};

// =============================================================================
// 4. App.tsx で Custom Claims Provider を追加
// =============================================================================

import { CustomClaimsProvider } from '@/hooks/useCustomClaims';

function App() {
  const [user] = useAuthState(auth);
  
  return (
    <CustomClaimsProvider user={user}>
      <Router>
        {/* 既存のコンポーネント */}
        <Routes>
          <Route path="/admin" element={
            withRoleGuard(AdminDashboard, { requiredRole: 'admin' })
          } />
          <Route path="/manager" element={
            withRoleGuard(ManagerDashboard, { 
              requiredRole: 'manager',
              allowedRoles: ['admin', 'manager'] 
            })
          } />
        </Routes>
      </Router>
    </CustomClaimsProvider>
  );
}

// =============================================================================
// 5. Cloud Functions のデプロイ
// =============================================================================

/*
cd functions
npm install firebase-functions firebase-admin
npm run deploy

# または特定の関数のみ
firebase deploy --only functions:processRoleRequest,functions:testRoleRequest
*/
