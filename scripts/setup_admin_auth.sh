#!/bin/bash

# Firebase Admin SDK 認証設定スクリプト
# 目的: GOOGLE_APPLICATION_CREDENTIALS環境変数の設定補助
# 作成日: 2025年6月23日

set -e

echo "🔐 Firebase Admin SDK 認証設定"
echo "=========================================="

PROJECT_ID="new-roster-project"

echo "📋 認証設定の確認..."

# 現在の設定状況を確認
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "✅ GOOGLE_APPLICATION_CREDENTIALS が設定されています: $GOOGLE_APPLICATION_CREDENTIALS"
    
    if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        echo "✅ サービスアカウントキーファイルが存在します"
        
        # キーファイルの内容を簡単に検証
        if jq empty "$GOOGLE_APPLICATION_CREDENTIALS" 2>/dev/null; then
            echo "✅ サービスアカウントキーファイルは有効なJSONです"
        else
            echo "⚠️  サービスアカウントキーファイルのJSONが無効です"
        fi
    else
        echo "❌ サービスアカウントキーファイルが見つかりません"
    fi
else
    echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS が設定されていません"
    echo ""
    echo "🔧 認証設定が必要です"
    echo ""
    echo "以下の手順で設定してください："
    echo "1. Firebase Console → プロジェクト設定 → サービスアカウント"
    echo "2. 'Firebase Admin SDK' → '新しい秘密鍵の生成'"
    echo "3. ダウンロードしたJSONファイルを安全な場所に保存"
    echo "4. 環境変数を設定："
    echo "   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json"
    echo ""
    echo "または、一時的にファイルパスを指定してください："
    read -p "サービスアカウントキーファイルのパス (Enter でスキップ): " KEY_PATH
    
    if [ -n "$KEY_PATH" ] && [ -f "$KEY_PATH" ]; then
        echo "✅ 一時的に設定します: $KEY_PATH"
        export GOOGLE_APPLICATION_CREDENTIALS="$KEY_PATH"
        echo "export GOOGLE_APPLICATION_CREDENTIALS=\"$KEY_PATH\"" >> ~/.zshrc
        echo "✅ ~/.zshrc に追加しました（再起動後に有効）"
    else
        echo "⚠️  設定をスキップしました"
        exit 1
    fi
fi

# Firebase Admin SDK のテスト
echo ""
echo "🧪 Firebase Admin SDK 接続テスト..."

# テスト用のNodeスクリプトを作成して実行
cat > /tmp/test_admin_sdk.js << 'EOF'
const admin = require('firebase-admin');

async function testAdminSDK() {
    try {
        // 環境変数からの認証情報を使用
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: 'new-roster-project'
        });
        
        // Auth サービスのテスト
        const auth = admin.auth();
        const listUsersResult = await auth.listUsers(1);
        
        console.log('✅ Firebase Admin SDK 接続成功');
        console.log(`✅ ユーザー数: ${listUsersResult.users.length}件以上`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Firebase Admin SDK 接続エラー:', error.message);
        process.exit(1);
    }
}

testAdminSDK();
EOF

if node /tmp/test_admin_sdk.js; then
    echo "🎉 Firebase Admin SDK の設定が完了しました！"
else
    echo "❌ Firebase Admin SDK の接続に失敗しました"
    echo "認証設定を確認してください"
    exit 1
fi

# 一時ファイルをクリーンアップ
rm -f /tmp/test_admin_sdk.js

echo "=========================================="
echo "🏁 認証設定スクリプト完了"
