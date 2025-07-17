# 🔥 OnCall Scheduler 権限管理システム テスト手順書

## 📋 テスト概要
Firebase Authentication + Firestore を使用した3段階権限システムのテストを行います。

---

## 🎯 テスト対象
- **管理者（Admin）**: システム全体の管理権限
- **所属長（Manager）**: 勤務表作成・部署管理権限  
- **スタッフ（Staff）**: 勤務希望提出・参照権限

---

## 🌐 テスト環境
- **アプリURL**: https://new-roster-project.web.app
- **Firebase Console**: https://console.firebase.google.com/project/new-roster-project

---

## 🔧 事前準備

### 1. Firebase Authentication でテストアカウント作成
**URL**: https://console.firebase.google.com/project/new-roster-project/authentication/users

以下の3つのアカウントを手動で作成してください：

#### 🔧 管理者アカウント
- **Email**: `admin@oncall-scheduler.com`
- **Password**: `AdminPass123!`
- **表示名**: `システム管理者`

#### 👨‍💼 所属長アカウント  
- **Email**: `manager@oncall-scheduler.com`
- **Password**: `ManagerPass123!`
- **表示名**: `田中所属長`

#### 👨‍💻 スタッフアカウント
- **Email**: `staff@oncall-scheduler.com`
- **Password**: `StaffPass123!`
- **表示名**: `佐藤スタッフ`

### 2. 初回ログイン（プロファイル自動作成）
各アカウントで一度ログインして、Firestoreにプロファイルを作成します。

### 3. Firestore での権限設定
**URL**: https://console.firebase.google.com/project/new-roster-project/firestore/data

`userProfiles` コレクションで以下を設定：

- **admin@oncall-scheduler.com**:
  - `role`: `"admin"`
  - `department`: `"システム管理部"`
  
- **manager@oncall-scheduler.com**:
  - `role`: `"manager"`  
  - `department`: `"医療部"`
  
- **staff@oncall-scheduler.com**:
  - `role`: `"staff"`
  - `department`: `"医療部"`

---

## 📱 LINEブラウザでのテスト手順

### 🐛 DebugOverlay の活用
1. アプリ画面の右上の `🐛` ボタンをタップ
2. 以下の情報を確認：
   - 認証状態（ログイン済み/未ログイン）
   - ユーザー情報（Email, UID, 表示名）
   - プロファイル情報（権限レベル, 部署, アクティブ状態）
   - アクションログ

### 🔧 管理者権限テスト
1. `admin@oncall-scheduler.com` でログイン
2. **DebugOverlay確認項目**:
   - ✅ 認証状態: ログイン済み
   - ✅ 権限レベル: 🔧 管理者
   - ✅ 部署: システム管理部
3. **ダッシュボード確認**:
   - ✅ 管理者ダッシュボードが表示される
   - ✅ ユーザー管理、システム設定等の管理機能が表示
4. **ヘッダー確認**:
   - ✅ 役割アイコンが盾マーク（Shield）
   - ✅ 「管理者」と表示
   - ✅ 部署名が表示

### 👨‍💼 所属長権限テスト
1. 一度ログアウト
2. `manager@oncall-scheduler.com` でログイン  
3. **DebugOverlay確認項目**:
   - ✅ 認証状態: ログイン済み
   - ✅ 権限レベル: 👨‍💼 所属長
   - ✅ 部署: 医療部
4. **ダッシュボード確認**:
   - ✅ 所属長ダッシュボードが表示される
   - ✅ 勤務表作成、部署スタッフ管理機能が表示
5. **ヘッダー確認**:
   - ✅ 役割アイコンがブリーフケース（Briefcase）
   - ✅ 「所属長」と表示
   - ✅ 部署名が表示

### 👨‍💻 スタッフ権限テスト
1. 一度ログアウト
2. `staff@oncall-scheduler.com` でログイン
3. **DebugOverlay確認項目**:
   - ✅ 認証状態: ログイン済み
   - ✅ 権限レベル: 👨‍💻 スタッフ
   - ✅ 部署: 医療部
4. **ダッシュボード確認**:
   - ✅ スタッフダッシュボードが表示される
   - ✅ 勤務希望提出、スケジュール確認機能が表示
5. **ヘッダー確認**:
   - ✅ 役割アイコンがユーザーチェック（UserCheck）
   - ✅ 「スタッフ」と表示
   - ✅ 部署名が表示

---

## 🔍 トラブルシューティング

### よくある問題と解決策

#### 1. ログイン画面が表示されない
- DebugOverlayで認証状態を確認
- ブラウザのキャッシュをクリア
- プライベートブラウジングモードで試行

#### 2. プロファイル情報が表示されない
- FirestoreでuserProfilesコレクションを確認
- roleフィールドが正しく設定されているか確認
- 一度ログアウト→ログインで再読み込み

#### 3. 権限レベルが反映されない
- Firebase Consoleでプロファイル設定を再確認
- アプリを完全に再読み込み（強制更新）
- DebugOverlayで実際のプロファイル情報を確認

#### 4. LINEブラウザで動作しない
- DebugOverlayでエラーログを確認
- UserAgentやCookie設定の制限を確認
- 標準ブラウザでも同様に動作するか確認

---

## 📊 期待される結果

### 各権限レベルでの表示内容

| 権限 | ダッシュボード | アイコン | 色 | 主要機能 |
|------|---------------|----------|-----|----------|
| 🔧 管理者 | AdminDashboard | Shield | 赤 | 全機能アクセス |
| 👨‍💼 所属長 | ManagerDashboard | Briefcase | 青 | 勤務表作成・部署管理 |
| 👨‍💻 スタッフ | StaffDashboard | UserCheck | 緑 | 勤務希望・参照のみ |

---

## 📝 テスト完了チェックリスト

- [ ] Firebase Authentication での3つのアカウント作成
- [ ] Firestore での権限設定完了
- [ ] 管理者権限でのログイン・ダッシュボード確認
- [ ] 所属長権限でのログイン・ダッシュボード確認  
- [ ] スタッフ権限でのログイン・ダッシュボード確認
- [ ] DebugOverlay での認証状態確認
- [ ] ヘッダーでの役割表示確認
- [ ] LINEブラウザでの動作確認
- [ ] 権限切り替え（ログアウト→ログイン）動作確認

---

## 🎉 テスト成功基準

✅ **全ての権限レベルで正常にログインできる**  
✅ **DebugOverlayで正しいプロファイル情報が表示される**  
✅ **権限に応じた異なるダッシュボードが表示される**  
✅ **ヘッダーで役割と部署が正しく表示される**  
✅ **LINEブラウザでエラーなく動作する**

---

**🚀 Happy Testing! 🚀**
