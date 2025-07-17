#!/bin/bash

# =============================================================================
# Custom Claims + Firestore Security Rules システム動作確認用 curl 例
# =============================================================================

# 環境変数設定
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_REGION="asia-northeast1"
CLOUD_FUNCTION_URL="https://${FIREBASE_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net"

echo "🚀 Custom Claims システム動作確認開始"
echo "プロジェクトID: ${FIREBASE_PROJECT_ID}"
echo "リージョン: ${FIREBASE_REGION}"
echo ""

# =============================================================================
# 1. テスト用ロール申請作成（HTTP トリガー）
# =============================================================================

echo "📝 1. テスト用ロール申請を作成中..."

# スタッフ権限申請
curl -X POST "${CLOUD_FUNCTION_URL}/testRoleRequest" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-user-001",
    "role": "staff",
    "hosp": "テスト病院A"
  }' | jq '.'

echo ""

# 所属長権限申請
curl -X POST "${CLOUD_FUNCTION_URL}/testRoleRequest" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-manager-001", 
    "role": "manager",
    "chiefOf": ["dept_001", "dept_002"],
    "hosp": "テスト病院B"
  }' | jq '.'

echo ""

# 管理者権限申請
curl -X POST "${CLOUD_FUNCTION_URL}/testRoleRequest" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-admin-001",
    "role": "admin",
    "hosp": "テスト病院C"
  }' | jq '.'

echo ""

# =============================================================================
# 2. Firebase Auth Custom Claims 確認
# =============================================================================

echo "🔑 2. Custom Claims 確認手順"
echo ""
echo "以下のJavaScriptコードをブラウザコンソールで実行してください："
echo ""
echo "// Firebase Auth の初期化後"
echo "import { getAuth, getIdTokenResult } from 'firebase/auth';"
echo ""
echo "const auth = getAuth();"
echo "const user = auth.currentUser;"
echo ""
echo "if (user) {"
echo "  // ID トークンを強制更新して Claims を取得"
echo "  getIdTokenResult(user, true).then((idTokenResult) => {"
echo "    console.log('🔑 Custom Claims:', idTokenResult.claims);"
echo "    console.log('📋 Role:', idTokenResult.claims.role);"
echo "    console.log('🏥 Hospital:', idTokenResult.claims.hosp);"
echo "    console.log('👥 Chief Of:', idTokenResult.claims.chiefOf);"
echo "  });"
echo "} else {"
echo "  console.log('❌ ユーザーがログインしていません');"
echo "}"
echo ""

# =============================================================================
# 3. Firestore Security Rules テスト用データ作成
# =============================================================================

echo "📊 3. Security Rules テスト用データ"
echo ""
echo "以下のFirestoreデータを手動で作成してテストしてください："
echo ""

# テスト用部署申請データ
cat << 'EOF'
// コレクション: departments/dept_001/requests/2025-06/test-user-001
{
  "requestType": "shift_change",
  "requestDate": "2025-06-23T09:00:00Z",
  "createdAt": "2025-06-23T09:00:00Z",
  "description": "シフト変更申請",
  "status": "pending"
}

// コレクション: departments/dept_002/requests/2025-06/test-user-002  
{
  "requestType": "vacation_request",
  "requestDate": "2025-06-25T09:00:00Z", 
  "createdAt": "2025-06-23T09:00:00Z",
  "description": "休暇申請",
  "status": "pending"
}
EOF

echo ""

# =============================================================================
# 4. Security Rules テスト手順
# =============================================================================

echo "🛡️ 4. Security Rules テスト手順"
echo ""
echo "A. 申請作成テスト（CREATE権限）"
echo "   ✅ 本人: /departments/dept_001/requests/2025-06/{自分のUID} → 成功"
echo "   ❌ 他人: /departments/dept_001/requests/2025-06/{他人のUID} → 失敗"
echo ""
echo "B. 申請閲覧テスト（READ権限）"
echo "   ✅ 部署責任者: chiefOf=['dept_001'] のユーザーが dept_001 の申請閲覧 → 成功"
echo "   ❌ 他部署責任者: chiefOf=['dept_002'] のユーザーが dept_001 の申請閲覧 → 失敗"
echo "   ❌ 一般スタッフ: role='staff' のユーザーが申請閲覧 → 失敗"
echo ""
echo "C. ロール申請テスト"
echo "   ✅ 認証済みユーザー: roleRequests コレクションへの CREATE → 成功"
echo "   ❌ 未認証ユーザー: roleRequests コレクションへの CREATE → 失敗"
echo ""

# =============================================================================
# 5. React Hook 動作確認
# =============================================================================

echo "⚛️ 5. React Hook 動作確認コード"
echo ""
echo "// useCustomClaims Hook の使用例"
cat << 'EOF'
import { useCustomClaims, CustomClaimsProvider } from '@/hooks/useCustomClaims';

// App.tsx
function App() {
  const [user] = useAuthState(auth);
  
  return (
    <CustomClaimsProvider user={user}>
      <YourAppComponents />
    </CustomClaimsProvider>
  );
}

// コンポーネント内での使用
function MyComponent() {
  const { claims, loading, error, refreshClaims } = useCustomClaimsContext();
  
  useEffect(() => {
    if (claims) {
      console.log('🔑 Current Role:', claims.role);
      console.log('👥 Managed Departments:', claims.chiefOf);
      console.log('🏥 Hospital:', claims.hosp);
    }
  }, [claims]);
  
  if (loading) return <div>Claims を取得中...</div>;
  if (error) return <div>エラー: {error.message}</div>;
  
  return (
    <div>
      <p>現在の権限: {claims?.role || 'なし'}</p>
      <button onClick={refreshClaims}>Claims を更新</button>
    </div>
  );
}
EOF

echo ""

# =============================================================================
# 6. withRoleGuard HOC 使用例
# =============================================================================

echo "🔒 6. withRoleGuard HOC 使用例"
echo ""
cat << 'EOF'
// pages/admin.tsx (管理者のみアクセス可能)
import { withRoleGuard } from '@/components/withRoleGuard';

function AdminPage() {
  return <div>管理者専用ページ</div>;
}

export default withRoleGuard(AdminPage, { 
  requiredRole: 'admin' 
});

// pages/manager.tsx (所属長以上がアクセス可能)
function ManagerPage() {
  return <div>所属長専用ページ</div>;
}

export default withRoleGuard(ManagerPage, { 
  requiredRole: 'manager',
  allowedRoles: ['admin', 'manager']
});
EOF

echo ""

# =============================================================================
# 7. 期待される動作ログ
# =============================================================================

echo "📝 7. 期待される動作ログ"
echo ""
echo "Cloud Function ログ（Firebase Console）:"
echo "✅ Processing role request for user test-user-001: {role: 'staff', ...}"
echo "✅ Successfully updated custom claims for user test-user-001"
echo ""
echo "ブラウザコンソール（React アプリ）:"
echo "🔑 Custom Claims 取得: {role: 'staff', hosp: 'テスト病院A', updatedAt: 1640995200000}"
echo "⏰ 60分経過 - ID トークン強制更新"
echo "✅ 権限チェック通過: ユーザー権限=staff"
echo ""

# =============================================================================
# 8. トラブルシューティング
# =============================================================================

echo "🔧 8. トラブルシューティング"
echo ""
echo "問題: Claims が反映されない"
echo "解決: getIdTokenResult(user, true) で強制更新を実行"
echo ""
echo "問題: Security Rules で権限エラー"
echo "解決: Firebase Console で Claims が正しく設定されているか確認"
echo ""
echo "問題: SWR のキャッシュが更新されない" 
echo "解決: mutate() を手動実行するか、refreshInterval を短縮"
echo ""

echo "🎉 動作確認手順完了！"
EOF
