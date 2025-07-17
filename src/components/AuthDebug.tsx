import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Firebase Authentication デバッグコンポーネント
 * 開発用：Custom Claims、JWT Token、ユーザー情報を表示
 */
export const AuthDebug: React.FC = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refreshTokenAndClaims = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Token を強制リフレッシュ
      await user.getIdToken(true);
      
      // Token結果を取得
      const tokenResult = await user.getIdTokenResult();
      
      setDebugInfo({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        customClaims: tokenResult.claims,
        role: tokenResult.claims.role,
        authTime: new Date(tokenResult.authTime).toLocaleString('ja-JP'),
        issuedAtTime: new Date(tokenResult.issuedAtTime).toLocaleString('ja-JP'),
        expirationTime: new Date(tokenResult.expirationTime).toLocaleString('ja-JP'),
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      setDebugInfo({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
        <h3>🔐 Authentication Debug</h3>
        <p>ユーザーがログインしていません</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>🔐 Authentication Debug</h3>
      <button 
        onClick={refreshTokenAndClaims}
        disabled={loading}
        style={{ 
          padding: '8px 16px', 
          marginBottom: '16px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '更新中...' : 'Token & Claims 更新'}
      </button>

      <div style={{ marginBottom: '16px' }}>
        <h4>基本情報:</h4>
        <p>UID: {user.uid}</p>
        <p>Email: {user.email}</p>
        <p>Email Verified: {user.emailVerified ? 'Yes' : 'No'}</p>
      </div>

      {debugInfo && (
        <div>
          <h4>詳細情報 (最新):</h4>
          <pre style={{ 
            background: 'white', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;
