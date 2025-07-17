const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
  projectId: "new-roster-project",
  // 他の設定は不要（functionsのみ使用）
};

async function setAdminViaCallable() {
  try {
    console.log('🔧 Firebase App 初期化...');
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app, 'asia-northeast1');
    
    console.log('📞 setAdminBatch Callable Function 呼び出し...');
    const setAdminBatch = httpsCallable(functions, 'setAdminBatch');
    
    const result = await setAdminBatch({
      uids: ['XYoLPR9Q9zPWJdyw0sjQA2qcg8q2'],
      role: 'admin'
    });
    
    console.log('✅ Callable Function 結果:', result.data);
    console.log('🎉 管理者権限設定完了！');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.error('詳細:', error);
  }
}

setAdminViaCallable();
