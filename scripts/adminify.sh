#!/bin/bash

# Firebase 管理者権限付与 一発スクリプト
# 目的# ❂ UID入力またはコマンドライン引数
echo ""
echo "======================================="
echo "🎯 管理者権限付与の対象ユーザー設定"

# コマンドライン引数チェック
if [ -n "$1" ]; then
    TARGET_UID="$1"
    echo "✅ UIDをコマンドライン引数から取得: $TARGET_UID"
else
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
fiし、UIDを入力してrole:adminを付与する
# 対象: macOS/Linux（Windows の場合は WSL を使用）
# 作成日: 2025年6月23日

set -e

echo "👑 Firebase 管理者権限付与 一発スクリプト"
echo "======================================="

# プロジェクト設定
PROJECT_ID="new-roster-project"

# ❶ 環境変数設定（サービスアカウントキー）
echo "🔐 サービスアカウントキー設定中..."

# プロジェクトルートから相対パスでキーファイルを参照
SERVICE_KEY_PATH="$(pwd)/secure_keys/serviceAccountKey.json"

if [ ! -f "$SERVICE_KEY_PATH" ]; then
    echo "❌ サービスアカウントキーファイルが見つかりません: $SERVICE_KEY_PATH"
    echo "💡 以下の場所にファイルを配置してください:"
    echo "   $(pwd)/secure_keys/serviceAccountKey.json"
    exit 1
fi

# 環境変数を設定
export GOOGLE_APPLICATION_CREDENTIALS="$SERVICE_KEY_PATH"
echo "✅ GOOGLE_APPLICATION_CREDENTIALS 設定完了: $SERVICE_KEY_PATH"

# firebase-admin パッケージ確認
echo ""
echo "📦 firebase-admin パッケージ確認中..."
if [ ! -d "node_modules/firebase-admin" ]; then
    echo "⚠️  firebase-admin パッケージが見つかりません"
    echo "インストール中..."
    npm install firebase-admin
    echo "✅ firebase-admin インストール完了"
else
    echo "✅ firebase-admin パッケージ確認済み"
fi

# ❷ UID入力
echo ""
echo "======================================="
echo "🎯 管理者権限付与の対象ユーザー設定"
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

# 最終確認
echo ""
echo "🔍 実行前最終確認"
echo "--------------------------------------"
echo "プロジェクトID: $PROJECT_ID"
echo "対象UID: $TARGET_UID"
echo "実行内容: Custom Claims に role:'admin' を設定"
echo "--------------------------------------"
echo ""
echo "この設定を実行しますか？ (y/N)"
read -r FINAL_CONFIRM

if [[ ! "$FINAL_CONFIRM" =~ ^[Yy]$ ]]; then
    echo "処理を中止しました"
    exit 1
fi

# ❸ Node.js ワンライナーで管理者権限付与
echo ""
echo "🛠️  管理者権限付与実行中..."
echo "======================================="

# Firebase Admin SDK を使用してCustom Claimsを設定
NODE_RESULT=$(node -e "
const admin = require('firebase-admin');

(async () => {
    try {
        // Firebase Admin SDK 初期化
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: '$PROJECT_ID'
        });

        const auth = admin.auth();
        const uid = '$TARGET_UID';

        // ユーザー存在確認
        try {
            const userRecord = await auth.getUser(uid);
            console.log('ユーザー確認: ' + userRecord.email);
        } catch (error) {
            console.log('ERROR:ユーザーが見つかりません: ' + uid);
            process.exit(1);
        }

        // Custom Claims を設定
        await auth.setCustomUserClaims(uid, { role: 'admin' });
        console.log('SUCCESS:管理者権限付与完了');

        // 設定確認
        const userRecord = await auth.getUser(uid);
        console.log('確認済みClaims: ' + JSON.stringify(userRecord.customClaims));

    } catch (error) {
        console.log('ERROR:' + error.message);
        process.exit(1);
    }
})();
" 2>&1)

# 結果判定
if echo "$NODE_RESULT" | grep -q "SUCCESS:"; then
    echo ""
    echo "🎉 管理者権限付与が完了しました！"
    echo ""
    echo "✅ 結果:"
    echo "   - UID: $TARGET_UID"
    echo "   - 権限: admin"
    echo "   - Custom Claims: 更新済み"
    echo ""
    echo "$NODE_RESULT" | grep -E "(ユーザー確認|確認済みClaims):"
    echo ""
    echo "💡 注意:"
    echo "   - ユーザーは再ログインが必要な場合があります"
    echo "   - フロントエンドでの権限反映まで少し時間がかかることがあります"
else
    echo "❌ 管理者権限付与に失敗しました"
    echo ""
    echo "エラー詳細:"
    echo "$NODE_RESULT"
    exit 1
fi

echo ""
echo "======================================="
echo "🏁 スクリプト実行完了"
