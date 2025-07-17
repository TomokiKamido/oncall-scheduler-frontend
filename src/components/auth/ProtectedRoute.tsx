import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ProgressBar from '../common/ProgressBar';
// import { addDebugLog } from '../common/DebugOverlay';
import Login from './Login';

interface ProtectedRouteProps {
  children: ReactNode;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  const debugMessage = `🛡️ ProtectedRoute: user=${user?.email || 'null'}, loading=${loading}`;
  console.log(debugMessage);
  // addDebugLog(debugMessage, 'info');

  if (loading) {
    console.log('🛡️ 認証チェック中...');
    // addDebugLog('🛡️ 認証チェック中...', 'info');
    return (
      <ProgressBar 
        duration={2000}
        message="🔐 認証確認中"
        subMessage="ログイン状態を確認しています"
      />
    );
  }

  if (!user) {
    console.log('🛡️ ユーザー未認証 → ログイン画面表示');
    // addDebugLog('🛡️ ユーザー未認証 → ログイン画面表示', 'warning');
    return <Login />;
  }

  console.log('🛡️ ユーザー認証済み → アプリ表示');
  // addDebugLog('🛡️ ユーザー認証済み → アプリ表示', 'info');
  return <>{children}</>;
};

export default ProtectedRoute;
