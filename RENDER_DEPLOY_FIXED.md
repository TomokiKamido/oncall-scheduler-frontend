# 🚀 Render デプロイ手順 (修正版)

## ❌ 前回のエラー原因
```
bash: line 1: cd: web: No such file or directory
```

**問題**: ビルドコマンドが `cd web && npm install && npm run build` だったが、これはNext.jsプロジェクト用の設定で、実際のプロジェクトはReactアプリです。

## ✅ 正しい設定

### Render Dashboard での設定
1. [Render Dashboard](https://dashboard.render.com/) にアクセス
2. 「New Static Site」を選択
3. GitHub リポジトリを接続: `https://github.com/TomokiKamido/oncall-scheduler-frontend`
4. ブランチ: `clean-main`

### ビルド設定 (修正済み)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`
- **Node Version**: 18.x (推奨)

### 自動設定オプション
`render.yaml` ファイルが修正済みなので、Renderは自動的に正しい設定を検出します。

## 🔄 再デプロイ手順

1. Render ダッシュボードで失敗したデプロイを確認
2. 「Retry Deploy」をクリック
3. または「Manual Deploy」→「Deploy latest commit」

## 📊 予想される結果

- ✅ ビルド成功 (約2-3分)
- ✅ React アプリが正常にデプロイ
- ✅ URL: `https://oncall-scheduler-frontend.onrender.com` (Renderが自動生成)

## 🔍 デプロイ確認コマンド

リポジトリの最新状態確認:
```bash
git log --oneline -3
```

現在のコミット: `0146bb2` (Fix Render build settings for React app)

## 📝 技術詳細

**プロジェクト種類**: Create React App (CRA) with TypeScript
**フレームワーク**: React 18.x
**ビルドツール**: Craco
**出力ディレクトリ**: `build/` (Next.jsの `out/` ではない)

これで正常にデプロイされるはずです！🎉
