import React, { useState, useEffect } from 'react';

interface DebugInfo {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'warning';
}

interface DebugOverlayProps {
  isVisible: boolean;
  onToggle: () => void;
}

let debugLogs: DebugInfo[] = [];

export const addDebugLog = (message: string, type: DebugInfo['type'] = 'info') => {
  const log: DebugInfo = {
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  };
  debugLogs.push(log);
  
  // 最新50件まで保持
  if (debugLogs.length > 50) {
    debugLogs = debugLogs.slice(-50);
  }
  
  // カスタムイベントを発火してUIを更新
  window.dispatchEvent(new CustomEvent('debugLogUpdate'));
};

const DebugOverlay: React.FC<DebugOverlayProps> = ({ isVisible, onToggle }) => {
  const [logs, setLogs] = useState<DebugInfo[]>([]);

  useEffect(() => {
    const updateLogs = () => setLogs([...debugLogs]);
    
    // 初期ログを設定
    updateLogs();
    
    // ログ更新イベントのリスナーを追加
    window.addEventListener('debugLogUpdate', updateLogs);
    
    return () => {
      window.removeEventListener('debugLogUpdate', updateLogs);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      zIndex: 10000,
      overflow: 'auto',
      padding: '20px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#00ff00' }}>🐛 Debug Overlay</h3>
        <button 
          onClick={onToggle}
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => {
            debugLogs = [];
            setLogs([]);
          }}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          クリア
        </button>
      </div>

      <div style={{ 
        maxHeight: 'calc(100vh - 150px)', 
        overflowY: 'auto',
        border: '1px solid #444',
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>
            ログがありません
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '5px',
                padding: '5px',
                borderLeft: `3px solid ${log.type === 'error' ? '#ff4444' : log.type === 'warning' ? '#ffaa00' : '#00aa00'}`,
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <span style={{ color: '#aaa', fontSize: '10px' }}>
                {log.timestamp}
              </span>
              <br />
              <span style={{ 
                color: log.type === 'error' ? '#ff6666' : log.type === 'warning' ? '#ffcc00' : '#66ff66' 
              }}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugOverlay;

// TypeScriptモジュール用の空のexport
export {};
