#!/bin/bash

# Node.js/Firebase CLI 環境検査・インストールスクリプト
# 作成日: 2025年6月23日

set -e  # エラー時に即座に終了

echo "🔍 Firebase環境チェックスクリプト開始"
echo "=========================================="

# 推奨バージョン
NODE_MIN_VERSION="18.0.0"
FIREBASE_MIN_VERSION="14.0.0"

# バージョン比較関数（簡易版）
version_compare() {
    local v1=$1
    local v2=$2
    
    if [[ $v1 == $v2 ]]; then
        return 0
    fi
    
    # 簡易的な数値比較（メジャーバージョンのみ）
    local major1=$(echo $v1 | cut -d. -f1)
    local major2=$(echo $v2 | cut -d. -f1)
    
    if [ $major1 -gt $major2 ]; then
        return 1  # v1 > v2
    elif [ $major1 -lt $major2 ]; then
        return 2  # v1 < v2
    else
        # メジャーバージョンが同じ場合はマイナーバージョンを比較
        local minor1=$(echo $v1 | cut -d. -f2)
        local minor2=$(echo $v2 | cut -d. -f2)
        
        if [ $minor1 -gt $minor2 ]; then
            return 1
        elif [ $minor1 -lt $minor2 ]; then
            return 2
        else
            return 0
        fi
    fi
}

# Node.js チェック
echo "📋 Node.js 環境確認..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | sed 's/v//')
    echo "✅ Node.js が見つかりました: v$NODE_VERSION"
    
    set +e  # バージョン比較でのエラー終了を一時的に無効化
    version_compare $NODE_VERSION $NODE_MIN_VERSION
    RESULT=$?
    set -e  # エラー終了を再有効化
    
    case $RESULT in
        0|1) echo "✅ Node.jsバージョンは適切です (推奨: v$NODE_MIN_VERSION 以上)" ;;
        2) echo "⚠️  Node.jsバージョンが古いです (現在: v$NODE_VERSION, 推奨: v$NODE_MIN_VERSION 以上)" ;;
    esac
else
    echo "❌ Node.js が見つかりません"
    echo ""
    echo "💡 Node.js インストール手順:"
    echo "   1. https://nodejs.org/ から最新LTS版をダウンロード"
    echo "   2. または Homebrew: brew install node"
    echo "   3. または nvm: nvm install node"
    exit 1
fi

# npm チェック
echo ""
echo "📋 npm 環境確認..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm が見つかりました: v$NPM_VERSION"
else
    echo "❌ npm が見つかりません（Node.jsと同時にインストールされるはずです）"
    exit 1
fi

# Firebase CLI チェック
echo ""
echo "📋 Firebase CLI 環境確認..."
FIREBASE_AVAILABLE=false

# グローバルインストールを確認
if command -v firebase >/dev/null 2>&1; then
    set +e  # バージョン取得でのエラー終了を一時的に無効化
    FIREBASE_VERSION=$(firebase --version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
    set -e  # エラー終了を再有効化
    echo "✅ Firebase CLI (グローバル) が見つかりました: v$FIREBASE_VERSION"
    
    set +e  # バージョン比較でのエラー終了を一時的に無効化
    version_compare $FIREBASE_VERSION $FIREBASE_MIN_VERSION
    RESULT=$?
    set -e  # エラー終了を再有効化
    
    case $RESULT in
        0|1) echo "✅ Firebase CLIバージョンは適切です (推奨: v$FIREBASE_MIN_VERSION 以上)" ;;
        2) echo "⚠️  Firebase CLIバージョンが古いです (現在: v$FIREBASE_VERSION, 推奨: v$FIREBASE_MIN_VERSION 以上)" ;;
    esac
    FIREBASE_AVAILABLE=true
fi

# npx経由を確認
if ! $FIREBASE_AVAILABLE && command -v npx >/dev/null 2>&1; then
    if npx firebase --version >/dev/null 2>&1; then
        set +e  # バージョン取得でのエラー終了を一時的に無効化
        FIREBASE_VERSION=$(npx firebase --version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
        set -e  # エラー終了を再有効化
        echo "✅ Firebase CLI (npx経由) が利用可能: v$FIREBASE_VERSION"
        FIREBASE_AVAILABLE=true
        
        set +e  # バージョン比較でのエラー終了を一時的に無効化
        version_compare $FIREBASE_VERSION $FIREBASE_MIN_VERSION
        RESULT=$?
        set -e  # エラー終了を再有効化
        case $RESULT in
            0|1) echo "✅ Firebase CLIバージョンは適切です (推奨: v$FIREBASE_MIN_VERSION 以上)" ;;
            2) echo "⚠️  Firebase CLIバージョンが古いです (現在: v$FIREBASE_VERSION, 推奨: v$FIREBASE_MIN_VERSION 以上)" ;;
        esac
    fi
fi

# ローカルパッケージを確認
if ! $FIREBASE_AVAILABLE && [ -f "./node_modules/.bin/firebase" ]; then
    if ./node_modules/.bin/firebase --version >/dev/null 2>&1; then
        FIREBASE_VERSION=$(./node_modules/.bin/firebase --version | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
        echo "✅ Firebase CLI (ローカルパッケージ) が利用可能: v$FIREBASE_VERSION"
        FIREBASE_AVAILABLE=true
    fi
fi

if ! $FIREBASE_AVAILABLE; then
    echo "❌ Firebase CLI が見つかりません"
    echo ""
    echo "💡 Firebase CLI インストール手順:"
    echo "   グローバルインストール: npm install -g firebase-tools"
    echo "   または npx で実行: npx firebase [コマンド]"
    echo ""
    echo "🔧 自動インストールを実行しますか？ (y/N)"
    read -p "> " INSTALL_CHOICE
    
    if [[ "$INSTALL_CHOICE" =~ ^[Yy]$ ]]; then
        echo "🚀 Firebase CLI をグローバルインストール中..."
        npm install -g firebase-tools
        echo "✅ Firebase CLI インストール完了"
        FIREBASE_AVAILABLE=true
    else
        echo "⚠️  手動でFirebase CLIをインストールしてください"
        exit 1
    fi
fi

# Firebase プロジェクト確認
echo ""
echo "📋 Firebase プロジェクト確認..."

# 現在のプロジェクトを確認
if $FIREBASE_AVAILABLE; then
    # firebase use を実行してプロジェクトを確認
    if command -v firebase >/dev/null 2>&1; then
        FIREBASE_CMD="firebase"
    elif command -v npx >/dev/null 2>&1; then
        FIREBASE_CMD="npx firebase"
    else
        FIREBASE_CMD="./node_modules/.bin/firebase"
    fi
    
    CURRENT_PROJECT=$($FIREBASE_CMD use 2>/dev/null | grep "Active project" | awk '{print $NF}' || echo "未設定")
    
    if [ "$CURRENT_PROJECT" != "未設定" ] && [ -n "$CURRENT_PROJECT" ]; then
        echo "✅ 現在のFirebaseプロジェクト: $CURRENT_PROJECT"
        
        # プロジェクト変更の確認
        echo ""
        echo "🔧 プロジェクトを変更しますか？ (y/N)"
        read -p "> " CHANGE_PROJECT
        
        if [[ "$CHANGE_PROJECT" =~ ^[Yy]$ ]]; then
            echo "📋 利用可能なプロジェクト一覧:"
            $FIREBASE_CMD projects:list
            echo ""
            echo "📝 使用するプロジェクトIDを入力してください:"
            read -p "> " NEW_PROJECT_ID
            
            if [ -n "$NEW_PROJECT_ID" ]; then
                echo "🔄 プロジェクトを '$NEW_PROJECT_ID' に変更中..."
                $FIREBASE_CMD use "$NEW_PROJECT_ID"
                echo "✅ プロジェクト変更完了"
            fi
        fi
    else
        echo "⚠️  Firebaseプロジェクトが設定されていません"
        echo ""
        echo "📋 利用可能なプロジェクト一覧:"
        $FIREBASE_CMD projects:list
        echo ""
        echo "📝 使用するプロジェクトIDを入力してください:"
        read -p "> " PROJECT_ID
        
        if [ -n "$PROJECT_ID" ]; then
            echo "🔄 プロジェクトを '$PROJECT_ID' に設定中..."
            $FIREBASE_CMD use "$PROJECT_ID"
            echo "✅ プロジェクト設定完了"
        else
            echo "❌ プロジェクトが設定されていません"
            exit 1
        fi
    fi
fi

# Google Application Credentials チェック
echo ""
echo "📋 Google Application Credentials 確認..."
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    if [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        echo "✅ GOOGLE_APPLICATION_CREDENTIALS が設定済み: $GOOGLE_APPLICATION_CREDENTIALS"
    else
        echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS が設定されていますが、ファイルが存在しません: $GOOGLE_APPLICATION_CREDENTIALS"
    fi
else
    echo "ℹ️  GOOGLE_APPLICATION_CREDENTIALS が未設定です"
    echo ""
    read -r -p "サービスアカウントキーファイルのパス (Enter でスキップ): " SERVICE_ACCOUNT_PATH
    
    if [ -n "$SERVICE_ACCOUNT_PATH" ]; then
        if [ -f "$SERVICE_ACCOUNT_PATH" ]; then
            export GOOGLE_APPLICATION_CREDENTIALS="$SERVICE_ACCOUNT_PATH"
            echo "✅ GOOGLE_APPLICATION_CREDENTIALS を設定しました: $SERVICE_ACCOUNT_PATH"
        else
            echo "❌ 指定されたファイルが存在しません: $SERVICE_ACCOUNT_PATH"
        fi
    else
        echo "ℹ️  GOOGLE_APPLICATION_CREDENTIALS はスキップされました"
    fi
fi

# 最終確認
echo ""
echo "🎯 環境チェック完了サマリー"
echo "=========================================="
echo "✅ Node.js: v$NODE_VERSION"
echo "✅ npm: v$NPM_VERSION"
if $FIREBASE_AVAILABLE; then
    echo "✅ Firebase CLI: v$FIREBASE_VERSION"
    FINAL_PROJECT=$($FIREBASE_CMD use 2>/dev/null | grep "Active project" | awk '{print $NF}' || echo "未設定")
    echo "✅ Firebaseプロジェクト: $FINAL_PROJECT"
else
    echo "❌ Firebase CLI: 未インストール"
fi
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "✅ Google Application Credentials: 設定済み"
else
    echo "ℹ️  Google Application Credentials: 未設定"
fi

echo ""
if $FIREBASE_AVAILABLE && [ "$FINAL_PROJECT" != "未設定" ]; then
    echo "🎉 すべての環境が正常に設定されました！"
    echo "💡 次に scripts/set_admin_role.sh を実行できます"
    echo "=========================================="
else
    echo "⚠️  一部の設定が不完全です"
    echo "🔧 手動で設定を完了してください"
    echo "=========================================="
fi
