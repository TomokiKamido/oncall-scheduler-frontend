import StaffDashboard from './components/staff-dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">OnCall Pro - スタッフダッシュボード</h1>
        <StaffDashboard />
      </div>
    </div>
  );
}

export default App;
