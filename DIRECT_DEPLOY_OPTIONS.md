# Render直接デプロイ手順

GitHubリポジトリがない場合のRender直接デプロイ方法：

## 方法1: GitHub新規リポジトリ作成
1. GitHubで新しいリポジトリを作成
2. 以下のコマンドでリモートを追加:
```bash
git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git
git push -u origin main
```

## 方法2: Render Manual Deploy（推奨）
1. [Render Dashboard](https://dashboard.render.com/) にアクセス
2. "New Static Site" を選択
3. "Connect a repository" の代わりに "Deploy without Git" を選択
4. 以下のファイルをzipでアップロード:
   - `web/out/` フォルダの中身をzip化
   - または手動でファイルをアップロード

## 方法3: Vercel直接デプロイ（既存設定活用）
現在Vercelで動作している設定をそのまま活用:
```bash
cd web
npx vercel --prod
```

## 推奨: GitHub連携でRenderデプロイ
最もスムーズなのはGitHub連携です。新しいリポジトリを作成するか、既存のリポジトリのURLを教えてください。

## 現在の準備状況
✅ 静的ファイル生成済み（`web/out/`）
✅ ビルド設定完了
✅ Render設定ファイル準備済み（`render.yaml`）
