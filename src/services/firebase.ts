import firebaseConfig, { auth, db } from '../config/firebase';

// Firebase初期化ログ
console.log('🔥 Firebase初期化開始:', firebaseConfig.projectId);
console.log('🔥 Firebase Auth初期化完了');

// 設定済みのauth, dbをエクスポート
export { auth, db };
