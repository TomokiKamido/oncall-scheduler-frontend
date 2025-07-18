# Render自動デプロイ確認手順

## 🚀 現在の状況 (2025年7月18日更新)
✅ **GitHubリポジトリ**: https://github.com/TomokiKamido/oncall-scheduler-frontend  
✅ **最新コミット**: `eee5c08` - v0.dev UI components integration  
✅ **ブランチ**: `clean-main`  
✅ **プッシュ完了**: GitHubに正常反映済み  

## 🔍 Render自動デプロイ確認手順

### 1. Render Dashboard確認
1. [Render Dashboard](https://dashboard.render.com/) にアクセス
2. 既存のサイト `oncall-scheduler-frontend` を確認
3. **Deploy Status** をチェック:
   - ✅ **Building**: デプロイ進行中
   - ✅ **Live**: デプロイ完了
   - ❌ **Failed**: エラー発生

### 2. GitHub連携状況確認
1. サイト設定 → "Connect Repository"
2. リポジトリURL: `https://github.com/TomokiKamido/oncall-scheduler-frontend`
3. ブランチ設定: `clean-main` または `main`

### 3. ビルド設定確認
現在のRender設定が正しいかチェック:

**正しい設定:**
```
Build Command: npm install && npm run build
Publish Directory: build
```

**間違った設定（修正必要）:**
```
Build Command: cd web && npm install && npm run build
Publish Directory: web/out
```

### 4. デプロイログ確認
1. サイト → "Logs" タブ
2. 最新のビルドログをチェック:
   - v0.dev components 統合の確認
   - shadcn/ui セットアップの確認
   - TypeScript エラーなしの確認

## 🔧 Render設定が間違っている場合の修正手順

### ステップ1: 設定更新
1. サイト → "Settings" → "Build & Deploy"
2. **Build Command** を `npm install && npm run build` に変更
3. **Publish Directory** を `build` に変更
4. "Save Changes" をクリック

### ステップ2: 手動デプロイ実行
1. "Manual Deploy" → "Deploy latest commit" をクリック
2. または "Clear build cache & deploy" でキャッシュクリア

## 🚨 緊急時の代替手段

4. `oncall-scheduler-v0dev-build.zip` (74KB) をアップロード

### 方法3: Vercel代替デプロイ

```bash
npx vercel --prod
```

## 📊 現在の準備完了状況

✅ **GitHubリポジトリ**: https://github.com/TomokiKamido/oncall-scheduler-frontend  
✅ **最新コミット**: `eee5c08` - v0.dev UI components integration  
✅ **ビルド成功**: 174KB main.js + 3.6KB main.css  
✅ **v0.dev統合**: StaffDashboard component 動作確認済み  
✅ **デプロイ用zip**: `oncall-scheduler-v0dev-build.zip` (74KB)  

## 🎯 次のアクション

**今すぐ確認:**

1. **[Render Dashboard](https://dashboard.render.com/)** にアクセス
2. `oncall-scheduler-frontend` サイトの状況をチェック
3. 自動デプロイが動作している場合:
   - ✅ v0.dev の新しいUIが表示される
   - ✅ StaffDashboard コンポーネントが正常動作
4. 自動デプロイが失敗している場合:
   - ⚠️ 上記の設定修正手順を実行
   - 🔄 手動デプロイまたはzip アップロード

**確認すべきポイント:**
- デプロイ時刻が最新のコミット時刻と一致するか
- ビルドログにエラーがないか  
- 新しいUIコンポーネントが正しく表示されるか
