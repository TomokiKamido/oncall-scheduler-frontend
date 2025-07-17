import React from 'react';
import { useCustomClaimsContext } from '../../hooks/useCustomClaims';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';

/**
 * Custom Claims システムのテスト・デバッグ用コンポーネント
 */
const CustomClaimsDebug: React.FC = () => {
  const [user] = useAuthState(auth);
  const { claims, loading, error, refreshClaims } = useCustomClaimsContext();

  if (!user) {
    return (
      <div style={{ padding: '20px', border: '2px solid #ffa500', borderRadius: '8px', margin: '20px' }}>
        <h3>🔐 Custom Claims Debug</h3>
        <p>❌ ユーザーがログインしていません</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '2px solid #4CAF50', borderRadius: '8px', margin: '20px' }}>
      <h3>🔑 Custom Claims Debug Panel</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>👤 ユーザー情報</h4>
        <ul>
          <li><strong>UID:</strong> {user.uid}</li>
          <li><strong>Email:</strong> {user.email}</li>
          <li><strong>Display Name:</strong> {user.displayName || 'N/A'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>🎯 Claims 状態</h4>
        <ul>
          <li><strong>Loading:</strong> {loading ? '✅ 取得中' : '❌ 完了'}</li>
          <li><strong>Error:</strong> {error ? `❌ ${error.message}` : '✅ なし'}</li>
        </ul>
      </div>

      {claims && (
        <div style={{ marginBottom: '15px' }}>
          <h4>🔑 Custom Claims データ</h4>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {JSON.stringify(claims, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4>🚀 操作</h4>
        <button 
          onClick={refreshClaims}
          style={{
            padding: '8px 16px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 Claims を強制更新
        </button>
        
        <button 
          onClick={() => {
            console.log('🔍 Current User:', user);
            console.log('🔑 Current Claims:', claims);
            console.log('📊 Claims Loading:', loading);
            console.log('❌ Claims Error:', error);
          }}
          style={{
            padding: '8px 16px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📝 コンソールに出力
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>💡 Tips:</p>
        <ul>
          <li>Claims の更新は約 55-60 分間隔で自動実行されます</li>
          <li>手動更新は「Claims を強制更新」ボタンで実行できます</li>
          <li>roleRequests コレクションでロール変更を申請できます</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomClaimsDebug;
