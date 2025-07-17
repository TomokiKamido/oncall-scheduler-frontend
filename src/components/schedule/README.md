# スケジュール設定コンポーネント構造

## 📁 ファイル構成

```
src/components/schedule/
├── AdvancedAssignmentScheduler.tsx    # メインコンポーネント（ステップ管理）
├── AdvancedAssignmentScheduler.css    # 共通スタイル
├── PeriodSetupStep.tsx               # ステップ1: 期間設定
├── GroupSetupStep.tsx                # ステップ2: グループ設定
├── CustomRuleStep.tsx                # ステップ3: カスタムルール設定
├── types.ts                          # 共通型定義
└── README.md                         # このファイル
```

## 🔄 コンポーネント分離の理由

### **従来の問題**
- 1つのファイルにすべてのステップが含まれていた
- 期間設定の編集がグループ設定に影響する可能性があった
- コードの保守性が低い
- ステップごとの独立したテストが困難

### **分離後の利点**
- ✅ **独立性**: 各ステップが独立して編集可能
- ✅ **保守性**: 機能ごとにファイルが分かれて管理しやすい
- ✅ **再利用性**: 各ステップコンポーネントを他の場所でも使用可能
- ✅ **テスタビリティ**: ステップごとの単体テストが容易
- ✅ **責任分離**: 各コンポーネントが明確な責任を持つ

## 📋 コンポーネントの役割

### **AdvancedAssignmentScheduler.tsx** (メインコンポーネント)
- ステップ間の状態管理
- ナビゲーション制御
- プログレス表示
- 全体のレイアウト管理

### **PeriodSetupStep.tsx** (期間設定)
- 日付範囲の設定（カスタム/月単位）
- 入力バリデーション
- 完了状態の管理

### **GroupSetupStep.tsx** (グループ設定)
- グループの作成・削除
- スタッフの選択・管理
- グループ一覧の表示

### **CustomRuleStep.tsx** (カスタムルール設定)
- 事前定義されたルールテンプレート
- グループごとのルール設定
- プルダウンメニューでのルール選択
- 各ルール固有の設定項目

## 🔄 データフロー

```
AdvancedAssignmentScheduler (親)
├── 状態管理 (useState)
├── Props として子コンポーネントに渡す
└── コールバック関数で状態を更新

PeriodSetupStep (子)
├── Props で値を受け取り
├── onChange で親に変更を通知
└── isCompleted で完了状態を表示

GroupSetupStep (子)
├── Props で値を受け取り
├── onChange で親に変更を通知
└── isCompleted で完了状態を表示
```

## 🎯 今後の拡張

新しいステップを追加する際は：

1. **新しいステップコンポーネントを作成**
   ```tsx
   // src/components/schedule/CustomRuleStep.tsx
   export default CustomRuleStep
   ```

2. **メインコンポーネントに追加**
   ```tsx
   // AdvancedAssignmentScheduler.tsx
   {currentStep === 3 && (
     <CustomRuleStep {...props} />
   )}
   ```

3. **types.ts に型定義を追加**
   ```tsx
   // types.ts
   customRuleData: {
     // 新しいステップの型定義
   }
   ```

## 🧪 テスト戦略

各コンポーネントを独立してテスト可能：

```tsx
// PeriodSetupStep のテスト例
import { render } from '@testing-library/react';
import PeriodSetupStep from './PeriodSetupStep';

test('期間設定が正常に動作する', () => {
  // テストケース
});
```

この構造により、開発効率と保守性が大幅に向上します。
