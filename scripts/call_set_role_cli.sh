#!/bin/bash

# Firebase CLI経由でsetRole関数を呼び出すスクリプト
# 引数: UID, role

set -e

TARGET_UID="$1"
TARGET_ROLE="${2:-admin}"

if [ -z "$TARGET_UID" ]; then
    echo "❌ 使用法: $0 <UID> [role]"
    exit 1
fi

echo "🎯 対象UID: $TARGET_UID"
echo "👑 設定ロール: $TARGET_ROLE"

# Firebase Functions経由でsetRole関数を呼び出し
echo "📞 setRole Cloud Function を呼び出し中..."

# Firebase Functions call コマンドを実行
if npx firebase functions:call setRole --data '{"uid":"'"$TARGET_UID"'","role":"'"$TARGET_ROLE"'"}'; then
    echo "✅ 管理者権限設定完了！"
    echo ""
    echo "🎉 結果サマリー"
    echo "======================================="
    echo "👤 UID: $TARGET_UID"
    echo "👑 設定ロール: $TARGET_ROLE"
    echo "⏰ 設定時刻: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "======================================="
    
    exit 0
else
    echo "❌ 管理者権限設定に失敗しました"
    echo ""
    echo "💡 トラブルシューティング:"
    echo "   1. UIDが正しいか確認"
    echo "   2. Cloud Function がデプロイされているか確認"
    echo "   3. Firebase プロジェクトの権限を確認"
    
    exit 1
fi
