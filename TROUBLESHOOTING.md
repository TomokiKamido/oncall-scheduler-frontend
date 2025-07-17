# 🔧 ダッシュボード読み込み問題 - トラブルシューティングガイド

## 🚨 問題の概要
ダッシュボードの読み込みが終わらない問題に対する解決策と診断方法

---

## 🔍 診断手順

### 1. DebugOverlay で状態確認
アプリの右上 `🐛` ボタンをタップして以下を確認：

#### 認証状態
- ✅ **認証状態**: ログイン済み になっているか
- ✅ **リアルタイム状態**: 認証ローディングが「完了」になっているか
- ✅ **プロファイルローディング**: 「完了」になっているか

#### プロファイル情報
- ✅ **プロファイル状態**: 読み込み完了 になっているか
- ✅ **権限レベル**: 正しい役割が表示されているか
- ✅ **部署**: 設定した部署が表示されているか

#### アクションログ
- 🔍 エラーメッセージがないか確認
- 🔍 プロファイル取得の処理ログを確認

---

## 🛠️ 解決策

### A. 20秒タイムアウト機能
- アプリに20秒のタイムアウト機能を追加済み
- タイムアウト時は「再試行」ボタンが表示される

### B. Firestore接続の確認
1. **Firebase Console** でFirestoreが有効になっているか確認
   - URL: https://console.firebase.google.com/project/new-roster-project/firestore
2. **userProfiles** コレクションが存在するか確認
3. **セキュリティルール** が正しく設定されているか確認

### C. ユーザープロファイルの手動作成
Firestoreで以下のドキュメントを手動作成：

#### パス: `userProfiles/{ユーザーUID}`
```json
{
  "uid": "ユーザーのUID",
  "email": "user@example.com",
  "displayName": "表示名",
  "role": "staff",  // または "admin", "manager"
  "department": "部署名",
  "isActive": true,
  "createdAt": "2025-06-18T12:00:00.000Z",
  "updatedAt": "2025-06-18T12:00:00.000Z"
}
```

---

## 🚨 緊急対応手順

### 1. 即座に対応が必要な場合
```bash
# アプリのキャッシュクリア
- ブラウザの再読み込み（Ctrl+F5 / Cmd+Shift+R）
- ブラウザのキャッシュ削除
- プライベートブラウジングモードで確認
```

### 2. Firebase接続テスト
```javascript
// ブラウザのコンソールで実行
console.log('Firebase Config:', window.firebase);
```

### 3. 手動でプロファイル作成
Firebase Console > Firestore で以下を実行：
1. `userProfiles` コレクションを作成
2. ログインユーザーのUIDでドキュメント作成
3. 必要なフィールドを設定

---

## 📱 LINEブラウザ特有の問題

### よくある原因
1. **Cookie制限**: LINEブラウザはCookieに制限がある
2. **LocalStorage制限**: データ保存に制限がある可能性
3. **JavaScript制限**: 一部のAPIが制限される場合がある

### 対処法
1. **標準ブラウザで確認**: SafariやChromeで同じ問題が発生するか確認
2. **キャッシュクリア**: LINEアプリの設定でブラウザキャッシュをクリア
3. **DebugOverlay活用**: 画面上でリアルタイム状況を確認

---

## 🔧 開発者向けデバッグ

### ローカル開発環境でのテスト
```bash
# 開発サーバー起動
npm start

# ブラウザで確認
http://localhost:3000
```

### Firebase Emulator使用
```bash
# Firebase Emulator Suite起動
firebase emulators:start

# エミュレーター環境でテスト
# - Authentication Emulator
# - Firestore Emulator
```

### ログ出力の詳細化
```javascript
// ブラウザコンソールで詳細ログ確認
window.addEventListener('debugLogUpdate', () => {
  console.log('Debug logs updated');
});
```

---

## 📊 パフォーマンス最適化

### 実装済み改善
- ✅ 重複API呼び出し防止
- ✅ ローディング状態の明確化
- ✅ エラーハンドリングの強化
- ✅ タイムアウト機能の追加

### 追加可能な改善
- 🔄 オフライン対応
- 🔄 プリロード機能
- 🔄 キャッシュ戦略の最適化

---

## 📞 サポート情報

### 問題が解決しない場合
1. **DebugOverlay**の内容をスクリーンショット
2. **ブラウザのコンソールログ**を確認
3. **Firebase Console**でエラーログを確認
4. **ネットワーク接続**を確認

### 確認すべき情報
- 使用ブラウザ（LINEブラウザ、Safari、Chrome等）
- デバイス情報（iOS、Android）
- エラーメッセージの詳細
- 発生タイミング（ログイン後、特定操作後等）

---

**🚀 改善されたアプリURL: https://new-roster-project.web.app**
