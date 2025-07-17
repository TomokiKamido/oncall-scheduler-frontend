import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

/**
 * 必要ロールを受け取り、アクセス可否を判定するガード
 *   <Route element={<RequireRole role="admin" />}>
 *     <Route path="/admin" element={<AdminPage />} />
 *   </Route>
 */
export function RequireRole({ role: requiredRole }: { role: 'admin' | 'manager' }) {
  const { role, loading } = useRole();

  // ローディング中は何も描画しない
  if (loading) return null;

  // 権限 OK → 子ルートへ、NG → トップページへリダイレクト
  if (
    role === 'admin' ||
    (requiredRole === 'manager' && role === 'manager')
  ) {
    return <Outlet />;
  }
  return <Navigate to="/" replace />;
}
