import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { AuthProvider } from './contexts/AuthContext';
import { RequireRole } from './router/roleGuard';
import Header from './components/common/Header';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingProgress from './components/common/LoadingProgress';
import ToastContainer from './components/common/ToastContainer';
import Dashboard from './components/dashboard/Dashboard';
import Schedule from './pages/Schedule';
import ScheduleWithPermissions from './pages/ScheduleWithPermissions';
import PermissionDemo from './pages/PermissionDemo';
import Staff from './pages/Staff';

// 包括的ResizeObserverエラー抑制の設定
const setupGlobalResizeObserverErrorSuppression = () => {
  // エラーハンドラーの設定
  const handleGlobalError = (event: ErrorEvent) => {
    if (event.error?.message?.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (typeof event.reason === 'string' && event.reason.includes('ResizeObserver')) {
      event.preventDefault();
      return false;
    }
  };

  // ウィンドウレベルでのエラー抑制
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Console.errorのインターセプト（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const message = args.join(' ');
      if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return; // ResizeObserverエラーを無視
      }
      originalConsoleError.apply(console, args);
    };
  }

  return () => {
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
};

// すぐに実行（クリーンアップ関数は将来の拡張用に保持）
setupGlobalResizeObserverErrorSuppression();

// エラーバウンダリーコンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>
            <h1>⚠️ アプリケーションエラー</h1>
            <p>OnCall Proの読み込み中にエラーが発生しました</p>
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>エラー詳細</summary>
              <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '5px' }}>
                {this.state.error?.toString()}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🔄 再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ローディング表示
const LoadingSpinner = () => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
    <LoadingProgress
      title="OnCall Pro"
      steps={[
        'アプリケーションを初期化中',
        '認証システムを準備中',
        'ユーザープロファイルを確認中',
        '画面を読み込み中'
      ]}
      duration={3000}
    />
  </div>
);

function App() {
  const [user] = useAuthState(auth);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <ProtectedRoute>
              <Layout>
                <Header />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/schedule-with-permissions" element={<ScheduleWithPermissions />} />
                  <Route path="/permission-demo" element={<PermissionDemo />} />
                  <Route path="/staff" element={<Staff />} />
                  {/* 管理者専用ルート */}
                  <Route element={<RequireRole role="admin" />}>
                    <Route path="/admin" element={<div>管理者専用ページ</div>} />
                  </Route>
                </Routes>
              </Layout>
            </ProtectedRoute>
          </Suspense>
          <ToastContainer />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;