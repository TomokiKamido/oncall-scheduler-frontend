#!/bin/bash

# Firebase Admin SDK 管理者権限付与メインスクリプト
# 目的: 環境確認 → 認証設定 → UID入力 → 管理者権限付与までの全自動化
# 方式: Firebase Admin SDK (GOOGLE_APPLICATION_CREDENTIALS)
# 作成日: 2025年6月23日

set -e

echo "👑 Firebase Admin SDK - 管理者権限付与システム"
echo "=============================================="

# プロジェクト設定
PROJECT_ID="new-roster-project"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. 環境確認
echo "📋 環境確認中..."

# Node.js確認
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js が見つかりません"
    echo "Node.js をインストールしてください: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
echo "✅ Node.js: v$NODE_VERSION"

# npm確認
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm が見つかりません"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm: v$NPM_VERSION"

# firebase-admin パッケージ確認
echo "📦 firebase-admin パッケージ確認中..."
if [ -d "node_modules/firebase-admin" ]; then
    ADMIN_VERSION=$(node -p "require('./node_modules/firebase-admin/package.json').version" 2>/dev/null || echo "不明")
    echo "✅ firebase-admin: v$ADMIN_VERSION"
else
    echo "⚠️  firebase-admin パッケージが見つかりません"
    echo "インストール中..."
    npm install firebase-admin
    echo "✅ firebase-admin インストール完了"
fi

# 2. Firebase プロジェクト確認
echo ""
echo "🔍 Firebase プロジェクト確認中..."

# Firebase CLI でプロジェクト確認
if command -v npx >/dev/null 2>&1; then
    CURRENT_PROJECT=$(npx firebase use 2>/dev/null | grep "Now using project" | awk '{print $4}' || echo "")
    if [ "$CURRENT_PROJECT" = "$PROJECT_ID" ]; then
        echo "✅ 正しいプロジェクトが選択されています: $PROJECT_ID"
    else
        echo "⚠️  プロジェクトを設定中..."
        npx firebase use "$PROJECT_ID"
        echo "✅ プロジェクト設定完了: $PROJECT_ID"
    fi
else
    echo "ℹ️  Firebase CLI経由での確認をスキップ"
fi

# 3. 認証設定確認
echo ""
echo "🔐 認証設定確認中..."

if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS が設定されていません"
    echo ""
    echo "認証設定を実行しますか？ (y/N)"
    read -r SETUP_AUTH
    
    if [[ "$SETUP_AUTH" =~ ^[Yy]$ ]]; then
        if [ -f "$SCRIPT_DIR/setup_admin_auth.sh" ]; then
            chmod +x "$SCRIPT_DIR/setup_admin_auth.sh"
            "$SCRIPT_DIR/setup_admin_auth.sh"
        else
            echo "❌ 認証設定スクリプトが見つかりません: $SCRIPT_DIR/setup_admin_auth.sh"
            exit 1
        fi
    else
        echo "❌ 認証設定が必要です"
        echo "手動で設定してください："
        echo "export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json"
        exit 1
    fi
else
    echo "✅ GOOGLE_APPLICATION_CREDENTIALS: $GOOGLE_APPLICATION_CREDENTIALS"
    
    if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        echo "✅ サービスアカウントキーファイル存在確認"
    else
        echo "❌ サービスアカウントキーファイルが見つかりません"
        exit 1
    fi
fi

# 4. Admin SDK 接続テスト
echo ""
echo "🧪 Firebase Admin SDK 接続テスト中..."

# 簡単なテストを実行
TEST_RESULT=$(node -e "
const admin = require('firebase-admin');
(async () => {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: '$PROJECT_ID'
        });
        const auth = admin.auth();
        await auth.listUsers(1);
        console.log('CONNECTION_SUCCESS');
    } catch (error) {
        console.log('CONNECTION_ERROR:' + error.message);
        process.exit(1);
    }
})();
" 2>&1)

if echo "$TEST_RESULT" | grep -q "CONNECTION_SUCCESS"; then
    echo "✅ Firebase Admin SDK 接続成功"
else
    echo "❌ Firebase Admin SDK 接続失敗"
    echo "エラー: $TEST_RESULT"
    exit 1
fi

# 5. UID入力
echo ""
echo "=============================================="
echo "🎯 管理者権限付与の準備完了"
echo ""
echo "管理者権限を付与するユーザーのUIDを入力してください："
echo "（例: XYoLPR9Q9zPWJdyw0sjQA2qcg8q2）"
echo ""
read -p "UID: " TARGET_UID

# UID入力チェック
if [ -z "$TARGET_UID" ]; then
    echo "❌ UIDが入力されていません"
    exit 1
fi

# UID形式の簡単なチェック
if [[ ! "$TARGET_UID" =~ ^[A-Za-z0-9]{20,}$ ]]; then
    echo "⚠️  UIDの形式が正しくない可能性があります"
    echo "続行しますか？ (y/N)"
    read -r CONTINUE_ANYWAY
    
    if [[ ! "$CONTINUE_ANYWAY" =~ ^[Yy]$ ]]; then
        echo "処理を中止しました"
        exit 1
    fi
fi

# 6. 最終確認
echo ""
echo "🔍 実行前最終確認"
echo "------------------------------------------"
echo "プロジェクトID: $PROJECT_ID"
echo "対象UID: $TARGET_UID"
echo "実行内容: Custom Claims に role:'admin' を設定"
echo "------------------------------------------"
echo ""
echo "この設定を実行しますか？ (y/N)"
read -r FINAL_CONFIRM

if [[ ! "$FINAL_CONFIRM" =~ ^[Yy]$ ]]; then
    echo "処理を中止しました"
    exit 1
fi

# 7. 管理者権限付与実行
echo ""
echo "🛠️  管理者権限付与実行中..."
echo "=============================================="

if [ -f "$SCRIPT_DIR/set_admin_claims.js" ]; then
    node "$SCRIPT_DIR/set_admin_claims.js" "$TARGET_UID"
    EXIT_CODE=$?
else
    echo "❌ 管理者権限付与スクリプトが見つかりません: $SCRIPT_DIR/set_admin_claims.js"
    exit 1
fi

# 8. 結果確認
echo ""
echo "=============================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "🎉 管理者権限付与が完了しました！"
    echo ""
    echo "✅ 結果:"
    echo "   - UID: $TARGET_UID"
    echo "   - 権限: admin"
    echo "   - Custom Claims: 更新済み"
    echo "   - Firestore記録: 完了"
    echo ""
    echo "💡 注意:"
    echo "   - ユーザーは再ログインが必要な場合があります"
    echo "   - フロントエンドでの権限反映まで少し時間がかかることがあります"
else
    echo "❌ 管理者権限付与に失敗しました"
    echo "ログを確認して問題を解決してください"
fi

echo "=============================================="
echo "🏁 スクリプト実行完了"
