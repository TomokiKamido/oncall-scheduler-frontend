# 🔧 Render設定更新手順 (重要)

## ❌ 現在の問題
Renderが古いビルドコマンド `cd web && npm install && npm run build` を使用しているため、デプロイが失敗しています。

## ✅ 解決方法: ダッシュボードで設定更新

### Step 1: Renderダッシュボードにアクセス
1. [Render Dashboard](https://dashboard.render.com/) にアクセス
2. 既存のサイト「oncall-scheduler-frontend」を選択

### Step 2: 設定画面を開く
1. サイトページで「**Settings**」タブをクリック
2. 「**Build & Deploy**」セクションを探す

### Step 3: ビルドコマンドを修正
現在の設定を以下に変更:

**❌ 現在（間違い）:**
```
Build Command: cd web && npm install && npm run build
Publish Directory: web/out
```

**✅ 正しい設定:**
```
Build Command: npm install && npm run build
Publish Directory: build
```

### Step 4: 設定を保存
1. 「**Save Changes**」をクリック
2. 「**Manual Deploy**」または「**Deploy Latest Commit**」をクリック

## 🚀 代替案: 手動アップロード

設定更新が困難な場合:

1. ローカルの `build/` フォルダをzip化
2. Render で「New Static Site」→「Upload Files」
3. zipファイルをアップロード

## 📊 確認事項

**最新コミット:** `3c35336` (Fix build errors)  
**ビルド済み:** ✅ `build/` フォルダ準備完了  
**GitHub更新済み:** ✅ 最新コードプッシュ完了  

## 💡 重要ポイント

- これはReactアプリ（Create React App）です
- Next.jsではないので `web/` ディレクトリは不要
- 出力は `build/` ディレクトリです

設定更新後、約2-3分でデプロイが完了します。
