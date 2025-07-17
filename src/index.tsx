import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// デバッグ用のコンソール出力
console.log('🚀 OnCall Pro - アプリケーション起動開始');
console.log('React Version:', React.version);

// React 17用の安全なレンダリング
const rootElement = document.getElementById('root');

console.log('Root element found:', !!rootElement);

if (rootElement) {
  console.log('✅ Root element は正常に見つかりました');
  
  try {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      rootElement
    );
    console.log('✅ ReactDOM.render が正常に実行されました');
  } catch (error) {
    console.error('❌ ReactDOM.render でエラーが発生:', error);
    
    // フォールバック表示
    rootElement.innerHTML = `
      <div style="
        padding: 40px;
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div>
          <h1>⚠️ OnCall Pro - 初期化エラー</h1>
          <p>アプリケーションの初期化中にエラーが発生しました</p>
          <details style="margin-top: 20px; text-align: left;">
            <summary>エラー詳細</summary>
            <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; white-space: pre-wrap;">
              ${error}
            </pre>
          </details>
          <button onclick="window.location.reload()" style="
            margin-top: 20px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">
            🔄 再読み込み
          </button>
        </div>
      </div>
    `;
  }
} else {
  console.error('❌ Root element が見つかりません');
  
  // フォールバック表示をbodyに直接追加
  document.body.innerHTML = `
    <div style="
      padding: 40px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div>
        <h1>❌ OnCall Pro - 要素エラー</h1>
        <p>Root要素が見つかりません</p>
        <p>HTMLファイルに &lt;div id="root"&gt;&lt;/div&gt; が必要です</p>
        <button onclick="window.location.reload()" style="
          margin-top: 20px;
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">
          🔄 再読み込み
        </button>
      </div>
    </div>
  `;
}

// 追加のデバッグ情報
console.log('🔍 環境情報:');
console.log('User Agent:', navigator.userAgent);
console.log('Current URL:', window.location.href);
console.log('Document Ready State:', document.readyState);