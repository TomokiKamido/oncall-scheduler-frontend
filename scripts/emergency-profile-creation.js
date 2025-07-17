// 緊急時のプロファイル作成スクリプト
// ブラウザのコンソールで実行可能

(async function createEmergencyProfile() {
  try {
    console.log('🚨 緊急プロファイル作成を開始...');
    
    // Firebase SDKがロードされているかチェック
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDKが見つかりません');
      return;
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ ユーザーがログインしていません');
      return;
    }
    
    console.log(`👤 ユーザー: ${user.email} (${user.uid})`);
    
    // プロファイルが既に存在するかチェック
    const profileDoc = await db.collection('userProfiles').doc(user.uid).get();
    
    if (profileDoc.exists()) {
      console.log('✅ プロファイルは既に存在します:', profileDoc.data());
      return;
    }
    
    // 新しいプロファイルを作成
    const profileData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: 'staff',
      department: '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('userProfiles').doc(user.uid).set(profileData);
    
    console.log('✅ 緊急プロファイルが正常に作成されました:', profileData);
    console.log('🔄 ページを再読み込みしてください');
    
  } catch (error) {
    console.error('❌ 緊急プロファイル作成エラー:', error);
  }
})();
