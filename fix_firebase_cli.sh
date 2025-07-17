#!/bin/bash

# Firebase CLI エラー解消スクリプト
# 目的: "/usr/local/bin/firebase: line 2: use strict: command not found" エラーを修正
# 作成日: 2025年6月23日

set -e  # エラー時に即座に終了

echo "🔧 Firebase CLI エラー解消スクリプト開始"
echo "==============================================="

# 問題のあるファイルパス
BROKEN_FIREBASE="/usr/local/bin/firebase"

# 現在のFirebase CLI状態を確認
echo "📋 現在のFirebase CLI状態確認..."

# 1. 問題ファイルの存在確認
if [ -f "$BROKEN_FIREBASE" ]; then
    echo "⚠️  問題のファイルが存在: $BROKEN_FIREBASE"
    
    # ファイルの最初の数行を確認してNode.jsファイルかチェック
    if head -5 "$BROKEN_FIREBASE" | grep -q "use strict"; then
        echo "❌ 不正なNode.jsファイルを検出（use strictエラーの原因）"
        NEEDS_FIX=true
    else
        echo "✅ ファイルは存在するが、Node.jsファイルではない"
        NEEDS_FIX=false
    fi
else
    echo "ℹ️  $BROKEN_FIREBASE は存在しません"
    NEEDS_FIX=false
fi

# 2. 正しいFirebase CLIパスを探す
echo "🔍 正しいFirebase CLIパスを検索中..."

# npm/yarn経由のFirebase CLIを探す
CORRECT_FIREBASE=""

# npmのグローバルパスを確認
if command -v npm >/dev/null 2>&1; then
    NPM_PREFIX=$(npm config get prefix 2>/dev/null || echo "")
    if [ -n "$NPM_PREFIX" ] && [ -f "$NPM_PREFIX/bin/firebase" ]; then
        CORRECT_FIREBASE="$NPM_PREFIX/bin/firebase"
        echo "✅ npm経由のFirebase CLIを発見: $CORRECT_FIREBASE"
    fi
fi

# yarnのグローバルパスを確認
if [ -z "$CORRECT_FIREBASE" ] && command -v yarn >/dev/null 2>&1; then
    YARN_PREFIX=$(yarn global bin 2>/dev/null || echo "")
    if [ -n "$YARN_PREFIX" ] && [ -f "$YARN_PREFIX/firebase" ]; then
        CORRECT_FIREBASE="$YARN_PREFIX/firebase"
        echo "✅ yarn経由のFirebase CLIを発見: $CORRECT_FIREBASE"
    fi
fi

# npxでの実行可能性を確認
if [ -z "$CORRECT_FIREBASE" ] && command -v npx >/dev/null 2>&1; then
    if npx firebase --version >/dev/null 2>&1; then
        CORRECT_FIREBASE="npx firebase"
        echo "✅ npx経由でFirebase CLIが利用可能"
    fi
fi

# パッケージ内のfirebase-toolsを確認
PACKAGE_FIREBASE="./node_modules/.bin/firebase"
if [ -z "$CORRECT_FIREBASE" ] && [ -f "$PACKAGE_FIREBASE" ]; then
    CORRECT_FIREBASE="$PACKAGE_FIREBASE"
    echo "✅ ローカルパッケージのFirebase CLIを発見: $CORRECT_FIREBASE"
fi

# 3. 修正が必要かどうか判断
if [ "$NEEDS_FIX" = "true" ]; then
    echo "🛠️  修正を実行します..."
    
    # バックアップ作成
    echo "💾 問題ファイルのバックアップ作成中..."
    BACKUP_FILE="${BROKEN_FIREBASE}.backup_$(date +%Y%m%d_%H%M%S)"
    sudo cp "$BROKEN_FIREBASE" "$BACKUP_FILE"
    echo "✅ バックアップ作成完了: $BACKUP_FILE"
    
    # 問題ファイルを削除
    echo "🗑️  問題ファイルを削除中..."
    sudo rm -f "$BROKEN_FIREBASE"
    echo "✅ 問題ファイル削除完了"
    
    # 正しいFirebase CLIへのシンボリックリンクを作成
    if [ -n "$CORRECT_FIREBASE" ] && [ "$CORRECT_FIREBASE" != "npx firebase" ]; then
        echo "🔗 正しいFirebase CLIへのシンボリックリンク作成中..."
        sudo ln -sf "$CORRECT_FIREBASE" "$BROKEN_FIREBASE"
        echo "✅ シンボリックリンク作成完了"
    else
        echo "ℹ️  シンボリックリンクは作成せず、npx firebase を推奨"
    fi
    
else
    echo "✅ 修正は不要です"
fi

# 4. 動作確認
echo "🧪 Firebase CLI動作確認..."

# 複数の方法でテスト
TEST_PASSED=false

# /usr/local/bin/firebase でテスト
if [ -f "$BROKEN_FIREBASE" ]; then
    echo "📝 /usr/local/bin/firebase でテスト..."
    if "$BROKEN_FIREBASE" --version >/dev/null 2>&1; then
        VERSION=$("$BROKEN_FIREBASE" --version)
        echo "✅ 成功: $VERSION"
        TEST_PASSED=true
    else
        echo "❌ /usr/local/bin/firebase でエラー"
    fi
fi

# firebase コマンドでテスト
if ! $TEST_PASSED && command -v firebase >/dev/null 2>&1; then
    echo "📝 firebase コマンドでテスト..."
    if firebase --version >/dev/null 2>&1; then
        VERSION=$(firebase --version)
        echo "✅ 成功: $VERSION"
        TEST_PASSED=true
    else
        echo "❌ firebase コマンドでエラー"
    fi
fi

# npx firebase でテスト
if ! $TEST_PASSED && command -v npx >/dev/null 2>&1; then
    echo "📝 npx firebase でテスト..."
    if npx firebase --version >/dev/null 2>&1; then
        VERSION=$(npx firebase --version)
        echo "✅ 成功: $VERSION"
        TEST_PASSED=true
    else
        echo "❌ npx firebase でエラー"
    fi
fi

# 5. 結果報告
echo "==============================================="
if $TEST_PASSED; then
    echo "🎉 Firebase CLI エラー解消完了！"
    echo "✅ Firebase CLIが正常に動作しています"
    
    # 推奨される使用方法を表示
    echo ""
    echo "💡 推奨される使用方法:"
    if [ -f "$BROKEN_FIREBASE" ]; then
        echo "   firebase --version"
    else
        echo "   npx firebase --version"
    fi
    
else
    echo "⚠️  Firebase CLIの問題が完全には解決されていません"
    echo "🔧 手動での対応が必要な可能性があります"
    echo ""
    echo "💡 代替案:"
    echo "   - npx firebase [コマンド] を使用"
    echo "   - npm install -g firebase-tools で再インストール"
fi

echo "==============================================="
echo "🏁 スクリプト実行完了"
