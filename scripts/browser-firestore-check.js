// Firestore直接確認スクリプト
// ブラウザのコンソールで実行可能

console.log('🔍 Firestore直接確認スクリプト開始');

// Firebase設定を確認
console.log('Firebase設定:', {
  projectId: window.firebase?.app()?.options?.projectId || 'Not loaded',
  authDomain: window.firebase?.app()?.options?.authDomain || 'Not loaded'
});

// 認証状態を確認
if (window.firebase?.auth()?.currentUser) {
  const user = window.firebase.auth().currentUser;
  console.log('現在のユーザー:', {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified
  });
  
  // Firestoreからユーザープロファイルを取得
  window.firebase.firestore()
    .collection('userProfiles')
    .get()
    .then(snapshot => {
      console.log('Firestoreクエリ結果:', {
        size: snapshot.size,
        empty: snapshot.empty
      });
      
      snapshot.forEach(doc => {
        console.log('ユーザー:', {
          id: doc.id,
          data: doc.data()
        });
      });
    })
    .catch(error => {
      console.error('Firestoreクエリエラー:', error);
    });
} else {
  console.warn('ユーザーがログインしていません');
}
