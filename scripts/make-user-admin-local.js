const fs = require('fs');
const path = require('path');

/**
 * ローカル環境専用：指定されたメールアドレスのユーザーを管理者にする
 * @param {string} email - 管理者にするユーザーのメールアドレス
 */
function makeUserAdminLocal(email) {
  try {
    console.log(`🔧 ローカル環境でユーザー "${email}" を管理者に設定中...`);
    
    // users.json ファイルを読み込み
    const usersFilePath = path.join(__dirname, '..', 'users.json');
    
    if (!fs.existsSync(usersFilePath)) {
      console.error('❌ users.json ファイルが見つかりません');
      return;
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const user = usersData.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ ユーザー "${email}" が見つかりません`);
      console.log('📝 登録されているユーザー一覧:');
      usersData.users.forEach(u => {
        console.log(`  - ${u.email} (ID: ${u.localId})`);
      });
      return;
    }
    
    console.log(`✅ ユーザーが見つかりました: ${user.localId}`);
    
    // data ディレクトリを作成（存在しない場合）
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // profiles ディレクトリを作成（存在しない場合）
    const profilesDir = path.join(dataDir, 'profiles');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    
    // プロファイルファイルのパス
    const profilePath = path.join(profilesDir, `${user.localId}.json`);
    
    // 既存のプロファイルがあれば読み込み
    let existingProfile = {};
    if (fs.existsSync(profilePath)) {
      try {
        existingProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        console.log('📝 既存のプロファイルが見つかりました、更新します');
      } catch (error) {
        console.log('⚠️  既存のプロファイルの読み込みに失敗しました、新規作成します');
      }
    }
    
    // 管理者プロファイルデータを作成
    const profileData = {
      ...existingProfile,
      uid: user.localId,
      email: email,
      displayName: existingProfile.displayName || email.split('@')[0] + '_admin',
      role: 'admin',
      department: existingProfile.department || 'システム管理部',
      managedDepartments: [], // 管理者は全部署管理可能
      isActive: true,
      createdAt: existingProfile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // プロファイルファイルを保存
    fs.writeFileSync(profilePath, JSON.stringify(profileData, null, 2));
    
    console.log('✅ 管理者プロファイルを作成/更新しました');
    console.log('');
    console.log('🎉 ローカル環境での管理者設定が完了しました！');
    console.log('');
    console.log('📋 管理者情報:');
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${user.localId}`);
    console.log(`   名前: ${profileData.displayName}`);
    console.log(`   部署: ${profileData.department}`);
    console.log(`   権限: 管理者 (admin)`);
    console.log(`   プロファイルファイル: ${profilePath}`);
    console.log('');
    console.log('💡 設定完了：このユーザーは次回ログイン時に管理者権限が適用されます');
    console.log('🔄 変更を反映するには、アプリを再読み込みしてログインし直してください');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.log('');
    console.log('🔧 トラブルシューティング:');
    console.log('1. users.json ファイルが存在することを確認');
    console.log('2. 指定したメールアドレスが正しいことを確認');
    console.log('3. ファイルの書き込み権限があることを確認');
  }
}

// コマンドライン引数からメールアドレスを取得
const args = process.argv.slice(2);
const email = args[0];

if (!email) {
  console.log('使用方法: node make-user-admin-local.js <email>');
  console.log('例: node make-user-admin-local.js llb5yyuihdx@gmail.com');
  process.exit(1);
}

// メールアドレスの基本的な検証
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ 無効なメールアドレス形式です');
  process.exit(1);
}

makeUserAdminLocal(email);

module.exports = { makeUserAdminLocal };
