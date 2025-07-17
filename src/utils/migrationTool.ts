// Web SDK を使用した権限移行スクリプト
// Firebase Admin SDK が利用できない場合の代替手段

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBtg6XHOPQIaDVR5_Tqq-nGl7hZKzjrYUA",
  authDomain: "new-roster-project.firebaseapp.com",
  databaseURL: "https://new-roster-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "new-roster-project",
  storageBucket: "new-roster-project.firebasestorage.app",
  messagingSenderId: "982728664828",
  appId: "1:982728664828:web:c9b3cd45b1f4e30d7b8cfe"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'asia-northeast1');

async function migrateToNewPermissionSystem() {
  console.log('🚀 新しい権限システムへの移行を開始...');
  
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('❌ ログインが必要です');
        reject(new Error('User not authenticated'));
        return;
      }

      try {
        console.log(`👤 ユーザー: ${user.email} で移行を実行`);
        
        // 1. Cloud Function を使用して権限をリセット
        console.log('🔄 Cloud Function を呼び出して権限システムをリセット...');
        const resetFunction = httpsCallable(functions, 'resetPermissionSystem');
        const result = await resetFunction();
        
        console.log('✅ Cloud Function の実行結果:', result.data);
        
        // 2. 新しい permissions コレクションを確認
        console.log('📋 新しい permissions コレクションを確認中...');
        const permissionsSnapshot = await getDocs(collection(db, 'permissions'));
        
        console.log(`📊 移行結果: ${permissionsSnapshot.size} 件の権限データを確認`);
        
        const summary = {
          admin: 0,
          manager: 0,
          staff: 0
        };
        
        permissionsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`   ${data.email}: ${data.role}`);
          summary[data.role as keyof typeof summary]++;
        });
        
        console.log('\\n🎉 移行完了！');
        console.log(`管理者: ${summary.admin}名`);
        console.log(`マネージャー: ${summary.manager}名`);
        console.log(`スタッフ: ${summary.staff}名`);
        
        resolve(result.data);
      } catch (error) {
        console.error('❌ 移行中にエラーが発生:', error);
        reject(error);
      }
    });
  });
}

// HTML インターフェース
export function createMigrationInterface() {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10000;
    min-width: 400px;
    font-family: Arial, sans-serif;
  `;
  
  container.innerHTML = `
    <h2 style="margin-top: 0; color: #333;">🔄 権限システム移行</h2>
    <p style="margin: 15px 0; color: #666;">
      新しい権限システムに移行します。<br>
      この操作により、すべてのユーザーの権限が新しいシステムに移行されます。
    </p>
    <div style="margin: 20px 0;">
      <button id="migrate-btn" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        margin-right: 10px;
      ">移行を実行</button>
      <button id="cancel-btn" style="
        background: #f44336;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
      ">キャンセル</button>
    </div>
    <div id="status" style="
      margin-top: 20px;
      padding: 10px;
      border-radius: 5px;
      background: #f5f5f5;
      display: none;
    "></div>
  `;
  
  document.body.appendChild(container);
  
  const migrateBtn = container.querySelector('#migrate-btn') as HTMLButtonElement;
  const cancelBtn = container.querySelector('#cancel-btn') as HTMLButtonElement;
  const status = container.querySelector('#status') as HTMLDivElement;
  
  migrateBtn.addEventListener('click', async () => {
    migrateBtn.disabled = true;
    migrateBtn.textContent = '移行中...';
    status.style.display = 'block';
    status.textContent = '移行を実行中です...';
    status.style.background = '#e3f2fd';
    
    try {
      await migrateToNewPermissionSystem();
      status.textContent = '✅ 移行が正常に完了しました！';
      status.style.background = '#e8f5e8';
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      status.textContent = `❌ 移行に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`;
      status.style.background = '#ffebee';
      migrateBtn.disabled = false;
      migrateBtn.textContent = '再試行';
    }
  });
  
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(container);
  });
}

// 自動実行（開発環境でのみ）
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.addEventListener('load', () => {
    // Ctrl+Shift+M で移行インターフェースを表示
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        createMigrationInterface();
      }
    });
    
    console.log('🔄 権限移行ツール: Ctrl+Shift+M で移行インターフェースを表示');
  });
}

export { migrateToNewPermissionSystem };
