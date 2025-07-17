import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { useAuthState } from 'react-firebase-hooks/auth';
// import { auth } from './config/firebase';
import { AuthProvider } from './contexts/AuthContext';
import { RequireRole } from './router/roleGuard';
import LoadingProgress from './components/common/LoadingProgress';
import ToastContainer from './components/common/ToastContainer';
// New v0.dev components
import StaffDashboard from './components/staff-dashboard';

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
  // const [user] = useAuthState(auth); // 未使用のためコメントアウト

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <div className="flex h-screen bg-gray-100">
            <Routes>
              {/* Default dashboard route - directs to role-based dashboard */}
              <Route path="/" element={<StaffDashboard />} />
              
              {/* Staff routes */}
              <Route path="/staff" element={<StaffDashboard />} />
              
              {/* Manager routes */}
              <Route element={<RequireRole role="manager" />}>
                <Route path="/manager" element={<div>Manager Dashboard</div>} />
              </Route>
              
              {/* Admin routes */}
              <Route element={<RequireRole role="admin" />}>
                <Route path="/admin" element={<div>Admin Dashboard</div>} />
              </Route>
            </Routes>
          </div>
        </Suspense>
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;