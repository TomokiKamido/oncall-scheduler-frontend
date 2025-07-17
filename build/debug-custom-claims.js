/**
 * ブラウザコンソールで実行するCustom Claims確認用スクリプト
 */

// Firebase Auth インスタンスを取得
const auth = window.firebase?.auth();

if (!auth) {
  console.error('❌ Firebase Auth が見つかりません');
} else {
  console.log('🔍 Custom Claims テスト開始');

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log('👤 ログインユーザー:', user.uid, user.email);
      
      try {
        // ID Token を取得して Custom Claims を確認
        const idToken = await user.getIdToken(true); // force refresh
        const tokenResult = await user.getIdTokenResult(true);
        
        console.log('🔑 Custom Claims:');
        console.log(JSON.stringify(tokenResult.claims, null, 2));
        
        // 特定のclaims プロパティをチェック
        if (tokenResult.claims.role) {
          console.log(`✅ Role: ${tokenResult.claims.role}`);
        } else {
          console.log('❌ Role claim が設定されていません');
        }
        
        if (tokenResult.claims.hosp) {
          console.log(`🏥 Hospital: ${tokenResult.claims.hosp}`);
        }
        
        if (tokenResult.claims.updatedAt) {
          const updatedAt = new Date(tokenResult.claims.updatedAt);
          console.log(`⏰ Updated At: ${updatedAt.toLocaleString()}`);
        }
        
      } catch (error) {
        console.error('❌ Token 取得エラー:', error);
      }
    } else {
      console.log('❌ ユーザーがログインしていません');
    }
  });
}
