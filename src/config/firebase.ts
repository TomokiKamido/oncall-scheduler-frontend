import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

// Firebase設定 (New Roster Projectの実際の設定値)
const firebaseConfig = {
  apiKey: "AIzaSyCM7frdZRzNXxDOtqalWYtdG-EIZyoL5Qc",
  authDomain: "new-roster-project.firebaseapp.com",
  projectId: "new-roster-project",
  storageBucket: "new-roster-project.firebasestorage.app",
  messagingSenderId: "364640737580",
  appId: "1:364640737580:web:66b7b2840ec557ba79b489",
  measurementId: "G-BDFBZGTJ5J"
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// 認証とFirestoreの初期化
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// 開発環境でFunctionsエミュレータに接続
// 環境変数 REACT_APP_USE_EMULATOR=true でエミュレータを強制使用
const useEmulator = process.env.NODE_ENV === 'development' || process.env.REACT_APP_USE_EMULATOR === 'true';

if (useEmulator) {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Functions: エミュレータに接続 (localhost:5001)');
  } catch (error) {
    console.warn('⚠️ Functions: エミュレータ接続エラー:', error);
  }
} else {
  console.log('🚀 Functions: プロダクション環境に接続');
}

// Firestoreのネットワーク接続を強制的に有効化
export const forceFirestoreOnline = async () => {
  try {
    await enableNetwork(db);
    console.log('🔥 Firestore: ネットワーク接続を有効化');
    return true;
  } catch (error) {
    console.error('❌ Firestore: ネットワーク有効化エラー:', error);
    return false;
  }
};

// Firestoreの接続状態を確認
export const checkFirestoreConnection = async () => {
  try {
    // 軽量なテスト操作を実行
    await import('firebase/firestore').then(({ doc, getDoc }) => 
      getDoc(doc(db, '__test__', 'connection'))
    );
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
};

// Firebase Functions の呼び出し関数
export const callSyncAuthUsers = httpsCallable(functions, 'syncAuthUsers');
export const callGetAllAuthUsers = httpsCallable(functions, 'getAllAuthUsers');

export default firebaseConfig;
