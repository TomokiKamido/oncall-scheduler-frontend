#!/usr/bin/env node

console.log('\n🔥 Firebase Console での手動アカウント作成ガイド');
console.log('='.repeat(60));
console.log('');
console.log('📱 LINEブラウザでのテスト用アカウントを作成します');
console.log('');

console.log('1️⃣ Firebase Authentication に移動:');
console.log('   🌐 https://console.firebase.google.com/project/new-roster-project/authentication/users');
console.log('');

console.log('2️⃣ 以下の3つのテストアカウントを手動で作成:');
console.log('');

console.log('🔧 管理者アカウント:');
console.log('   📧 Email: admin@oncall-scheduler.com');
console.log('   🔑 Password: AdminPass123!');
console.log('   👤 表示名: システム管理者');
console.log('');

console.log('👨‍💼 所属長アカウント:');
console.log('   📧 Email: manager@oncall-scheduler.com');
console.log('   🔑 Password: ManagerPass123!');
console.log('   👤 表示名: 田中所属長');
console.log('');

console.log('👨‍💻 スタッフアカウント:');
console.log('   📧 Email: staff@oncall-scheduler.com');
console.log('   🔑 Password: StaffPass123!');
console.log('   👤 表示名: 佐藤スタッフ');
console.log('');

console.log('3️⃣ アカウント作成後の設定:');
console.log('   ✅ 各アカウントでアプリにログインすると自動的にプロファイル作成');
console.log('   ✅ 初回ログイン時はデフォルトで "staff" 権限が設定されます');
console.log('');

console.log('4️⃣ 管理者権限の手動設定:');
console.log('   🌐 Firebase Console > Firestore Database に移動');
console.log('   📂 userProfiles コレクションを開く');
console.log('   🔍 admin@oncall-scheduler.com のドキュメントを見つける');
console.log('   ✏️  role フィールドを "staff" から "admin" に変更');
console.log('   ✏️  department フィールドを "システム管理部" に設定');
console.log('');

console.log('5️⃣ 所属長権限の手動設定:');
console.log('   🔍 manager@oncall-scheduler.com のドキュメントを見つける');
console.log('   ✏️  role フィールドを "staff" から "manager" に変更');
console.log('   ✏️  department フィールドを "医療部" に設定');
console.log('');

console.log('6️⃣ スタッフ権限の手動設定:');
console.log('   🔍 staff@oncall-scheduler.com のドキュメントを見つける');
console.log('   ✏️  role フィールドは "staff" のまま');
console.log('   ✏️  department フィールドを "医療部" に設定');
console.log('');

console.log('🌐 テスト用アプリURL:');
console.log('   https://new-roster-project.web.app');
console.log('');

console.log('🔍 DebugOverlay でのテスト項目:');
console.log('   ✅ 認証状態（isAuthenticated）');
console.log('   ✅ ユーザー情報（email, displayName）');
console.log('   ✅ プロファイル情報（role, department）');
console.log('   ✅ 権限レベル別ダッシュボード表示');
console.log('   ✅ ヘッダーの役割表示');
console.log('');

console.log('⚡ 各権限レベルでテストする項目:');
console.log('   🔧 管理者: 全機能アクセス可能');
console.log('   👨‍💼 所属長: 勤務表作成、部署管理機能');
console.log('   👨‍💻 スタッフ: 勤務希望提出、スケジュール確認のみ');
console.log('');
console.log('='.repeat(60));
