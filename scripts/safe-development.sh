#!/bin/bash

# 安全な開発フロー用スクリプト

echo "=== 安全な開発フロー ==="

# 1. 現在の状態をバックアップ
backup_component() {
    local component_path=$1
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_path="${component_path}.backup_${timestamp}"
    
    if [ -f "$component_path" ]; then
        cp "$component_path" "$backup_path"
        echo "✅ バックアップ作成: $backup_path"
    fi
}

# 2. TypeScriptエラーチェック
check_typescript() {
    echo "🔍 TypeScriptエラーチェック中..."
    if npm run build > /dev/null 2>&1; then
        echo "✅ TypeScriptエラーなし"
        return 0
    else
        echo "❌ TypeScriptエラーあり"
        npm run build
        return 1
    fi
}

# 3. 段階的な機能追加フロー
safe_feature_add() {
    local feature_name=$1
    
    echo "🚀 機能追加開始: $feature_name"
    
    # バックアップ作成
    backup_component "src/components/schedule/AdvancedAssignmentScheduler.tsx"
    
    # ベースライン確認
    if ! check_typescript; then
        echo "❌ ベースラインにエラーがあります。修正してから続行してください。"
        return 1
    fi
    
    echo "✅ 安全に機能追加を開始できます"
    echo "📝 次のステップ:"
    echo "   1. 小さな変更を加える"
    echo "   2. npm run build でチェック"
    echo "   3. 問題があれば即座にロールバック"
    echo "   4. 成功したら次の変更へ"
}

# 使用例
if [ "$1" = "prepare" ]; then
    safe_feature_add "$2"
elif [ "$1" = "check" ]; then
    check_typescript
else
    echo "使用法:"
    echo "  $0 prepare [機能名] - 機能追加の準備"
    echo "  $0 check - TypeScriptエラーチェック"
fi
