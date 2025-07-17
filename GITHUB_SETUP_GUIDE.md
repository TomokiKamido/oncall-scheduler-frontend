# GitHub接続とデプロイ手順

## 1. GitHub リポジトリ作成（手動操作）
ブラウザで以下を実行してください：
1. https://github.com にアクセス
2. 右上の「+」→「New repository」
3. Repository name: `oncall-scheduler-frontend`
4. Public/Private を選択
5. 「Create repository」をクリック

## 2. 作成後に実行するコマンド
GitHubで作成したリポジトリのURLを使用：

```bash
# メインブランチに切り替え
git checkout -b main

# リモートリポジトリを追加（URLは作成したリポジトリのものに置き換え）
git remote add origin https://github.com/YOUR_USERNAME/oncall-scheduler-frontend.git

# または SSH の場合
git remote add origin git@github.com:YOUR_USERNAME/oncall-scheduler-frontend.git

# プッシュ
git push -u origin main
```

## 3. Render設定
GitHubプッシュ後：
1. https://dashboard.render.com にアクセス
2. 「New」→「Static Site」
3. 「Connect a repository」→ 作成したリポジトリを選択
4. 設定値：
   - **Build Command**: `cd web && npm install && npm run build`
   - **Publish Directory**: `web/out`
   - **Node Version**: 18.x
5. 「Create Static Site」でデプロイ開始

## 現在の準備状況
✅ ローカルコミット完了
✅ 静的ファイル生成済み
✅ Render設定準備完了
⏳ GitHubリポジトリ作成待ち
