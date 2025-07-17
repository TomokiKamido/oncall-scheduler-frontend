#!/bin/bash

# 管理者ロール設定スクリプト
# 目的: UID を指定して Firebase Custom Claims で role:'admin' を付与
# 作成日: 2025年6月23日

set -e  # エラー時に即座に終了

echo "👑 管理者ロール設定スクリプト開始"
echo "======================================="

# Firebase CLI の確認
FIREBASE_CMD=""
if command -v firebase >/dev/null 2>&1; then
    FIREBASE_CMD="firebase"
elif command -v npx >/dev/null 2>&1 && npx firebase --version >/dev/null 2>&1; then
    FIREBASE_CMD="npx firebase"
elif [ -f "./node_modules/.bin/firebase" ]; then
    FIREBASE_CMD="./node_modules/.bin/firebase"
else
    echo "❌ Firebase CLI が見つかりません"
    echo "💡 先に scripts/check_env.sh を実行してください"
    exit 1
fi

# 現在のプロジェクト確認
echo "📋 現在のFirebaseプロジェクト確認..."
CURRENT_PROJECT=$($FIREBASE_CMD list --only-active | grep -o 'new-roster-project\|sample-firebase-ai-app-8b195' | head -1 || echo "")

if [ -z "$CURRENT_PROJECT" ]; then
    # 別の方法でプロジェクトIDを取得
    CURRENT_PROJECT=$($FIREBASE_CMD projects:list | grep "(current)" | awk '{print $2}' | head -1 || echo "")
fi

if [ -z "$CURRENT_PROJECT" ] || [ "$CURRENT_PROJECT" = "未設定" ]; then
    echo "❌ Firebaseプロジェクトが設定されていません"
    echo "💡 先に scripts/check_env.sh を実行してプロジェクトを設定してください"
    exit 1
fi

echo "✅ 現在のプロジェクト: $CURRENT_PROJECT"

# Cloud Functions の存在確認
echo ""
echo "📋 Cloud Functions 確認..."
if [ ! -f "functions/src/setRole.ts" ]; then
    echo "❌ setRole Cloud Function が見つかりません"
    echo "💡 functions/src/setRole.ts を先に作成してください"
    exit 1
fi

echo "✅ setRole Cloud Function が確認できました"

# Functions のデプロイ状況確認
echo ""
echo "📋 Cloud Functions デプロイ状況確認..."
echo "🔄 デプロイされた関数一覧を取得中..."

FUNCTIONS_LIST=$($FIREBASE_CMD functions:list 2>/dev/null || echo "")
if echo "$FUNCTIONS_LIST" | grep -q "setRole"; then
    echo "✅ setRole 関数がデプロイされています"
    FUNCTION_DEPLOYED=true
else
    echo "⚠️  setRole 関数がデプロイされていません"
    FUNCTION_DEPLOYED=false
    
    echo ""
    echo "🚀 setRole 関数をデプロイしますか？ (y/N)"
    read -p "> " DEPLOY_CHOICE
    
    if [[ "$DEPLOY_CHOICE" =~ ^[Yy]$ ]]; then
        echo "🔄 Cloud Functions をデプロイ中..."
        echo "📝 注意: 初回デプロイには数分かかる場合があります"
        
        if $FIREBASE_CMD deploy --only functions:setRole; then
            echo "✅ setRole 関数のデプロイ完了"
            FUNCTION_DEPLOYED=true
        else
            echo "❌ setRole 関数のデプロイに失敗しました"
            echo "💡 手動でデプロイを確認してください: $FIREBASE_CMD deploy --only functions"
            exit 1
        fi
    else
        echo "⚠️  setRole 関数がデプロイされていないため、権限設定はできません"
        exit 1
    fi
fi

# UID 入力
echo ""
echo "📝 管理者権限を付与するユーザーのUIDを入力してください"
echo "💡 Firebase Console > Authentication で確認できます"
echo "💡 または空白で終了"

while true; do
    echo ""
    read -p "UID: " TARGET_UID
    
    # 空白で終了
    if [ -z "$TARGET_UID" ]; then
        echo "👋 スクリプトを終了します"
        exit 0
    fi
    
    # UID の形式チェック（基本的な検証）
    if [[ ! "$TARGET_UID" =~ ^[A-Za-z0-9]{28}$ ]] && [[ ! "$TARGET_UID" =~ ^[A-Za-z0-9_-]{20,}$ ]]; then
        echo "⚠️  UIDの形式が正しくない可能性があります"
        echo "🔧 それでも続行しますか？ (y/N)"
        read -p "> " CONTINUE_CHOICE
        
        if [[ ! "$CONTINUE_CHOICE" =~ ^[Yy]$ ]]; then
            echo "📝 正しいUIDを再入力してください"
            continue
        fi
    fi
    
    echo ""
    echo "🎯 設定内容確認"
    echo "======================================="
    echo "📋 プロジェクト: $CURRENT_PROJECT"
    echo "👤 対象UID: $TARGET_UID"
    echo "👑 付与ロール: admin"
    echo "======================================="
    echo ""
    echo "✅ この内容で管理者権限を設定しますか？ (y/N)"
    read -p "> " CONFIRM_CHOICE
    
    if [[ "$CONFIRM_CHOICE" =~ ^[Yy]$ ]]; then
        echo ""
        echo "🚀 管理者権限設定を実行中..."
        
        # Node.js Admin SDK経由でCustom Claimsを設定
        echo "📞 Firebase Admin SDK経由で権限設定中..."
        echo "🎯 対象UID: $TARGET_UID"
        echo "👑 設定ロール: admin"
        
        # Admin SDKスクリプトを実行
        if node scripts/call_set_role_admin.js "$TARGET_UID" "admin"; then
            echo "✅ 管理者権限設定完了！"
            echo ""
            echo "🎉 結果サマリー"
            echo "======================================="
            echo "👤 UID: $TARGET_UID"
            echo "👑 新しいロール: admin"
            echo "⏰ 設定時刻: $(date '+%Y-%m-%d %H:%M:%S')"
            echo "📋 プロジェクト: $CURRENT_PROJECT"
            echo "======================================="
            echo ""
            echo "💡 次のステップ:"
            echo "   1. 該当ユーザーに一度ログアウト→再ログインしてもらう"
            echo "   2. Custom Claims が反映されるまで最大60秒待つ"
            echo "   3. アプリ内で管理者権限が有効になることを確認"
            echo ""
        else
            echo "❌ 管理者権限設定に失敗しました"
            echo ""
            echo "� トラブルシューティング:"
            echo "   1. UIDが正しいか確認"
            echo "   2. Firebase プロジェクトの権限を確認"
            echo "   3. Node.js環境とfirebase-adminパッケージを確認"
            echo "   4. Firebase Console > Authentication でユーザーが存在するか確認"
            echo ""
            echo "   3. Firebase プロジェクトの権限を確認"
            echo "   4. Firebase Console > Functions でエラーログを確認"
        fi
        
        echo ""
        echo "🔄 別のユーザーの権限設定を続行しますか？ (y/N)"
        read -p "> " CONTINUE_ANOTHER
        
        if [[ ! "$CONTINUE_ANOTHER" =~ ^[Yy]$ ]]; then
            echo "👋 スクリプトを終了します"
            break
        fi
    else
        echo "❌ 権限設定をキャンセルしました"
        echo "📝 正しい情報を再入力してください"
    fi
done

echo ""
echo "🏁 管理者ロール設定スクリプト完了"
