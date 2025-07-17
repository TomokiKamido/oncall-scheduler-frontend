import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

/**
 * Custom Claims テスト用のロール申請コンポーネント
 */
const TestRoleRequest: React.FC = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const createTestRoleRequest = async (role: 'admin' | 'manager' | 'staff') => {
    if (!user) {
      setMessage('❌ ログインが必要です');
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const roleRequestData = {
        role: role,
        chiefOf: role === 'manager' ? ['dept_001'] : [],
        hosp: 'テスト病院',
        requestedBy: user.uid,
        requestedAt: serverTimestamp(),
        status: 'approved' // テスト用なので即座に承認
      };

      // roleRequests/{uid} に直接書き込む（Cloud Functionsトリガー用）
      const docRef = doc(db, 'roleRequests', user.uid);
      await setDoc(docRef, roleRequestData);
      
      setMessage(`✅ ${role} ロール申請が作成されました！ (UID: ${user.uid})`);
      console.log('🎉 ロール申請作成完了:', user.uid, roleRequestData);

    } catch (error) {
      console.error('❌ ロール申請作成エラー:', error);
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', border: '2px solid #f44336', borderRadius: '8px', margin: '20px' }}>
        <h3>🧪 Custom Claims テスト</h3>
        <p>❌ ログインが必要です</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '2px solid #2196F3', borderRadius: '8px', margin: '20px' }}>
      <h3>🧪 Custom Claims テスト</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <p><strong>現在のユーザー:</strong> {user.email}</p>
        <p><strong>UID:</strong> {user.uid}</p>
      </div>

      {message && (
        <div style={{ 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          background: message.startsWith('✅') ? '#e8f5e8' : '#ffeaea',
          border: message.startsWith('✅') ? '1px solid #4CAF50' : '1px solid #f44336'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4>🔧 ロール申請テスト</h4>
        <p>以下のボタンでロール変更を申請できます：</p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => createTestRoleRequest('staff')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳' : '👤'} スタッフに変更
          </button>
          
          <button 
            onClick={() => createTestRoleRequest('manager')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳' : '👨‍💼'} 所属長に変更
          </button>
          
          <button 
            onClick={() => createTestRoleRequest('admin')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳' : '👑'} 管理者に変更
          </button>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>💡 操作手順:</p>
        <ol>
          <li>上記ボタンでロール申請を作成</li>
          <li>Cloud Function が Firestore トリガーで実行</li>
          <li>Custom Claims が自動更新</li>
          <li>60秒後に Custom Claims Debug Panel で確認</li>
          <li>ログアウト→再ログインで権限が維持されることを確認</li>
        </ol>
      </div>
    </div>
  );
};

export default TestRoleRequest;
