import React from 'react';

/**
 * ユーザーロールを表示するバッジコンポーネント
 * - admin: 管理者 (赤色)
 * - manager: 所属長 (オレンジ色)
 * - その他: スタッフ (グレー色)
 */

// ロール型定義
type Role = 'admin' | 'manager' | 'staff' | 'unknown' | string;

// プロパティ型定義
interface RoleBadgeProps {
  /** ユーザーのロール */
  role: Role;
  /** バッジのサイズ（オプション） */
  size?: 'small' | 'medium';
  /** 追加のスタイル（オプション） */
  variant?: 'filled' | 'outlined';
}

/**
 * ロールに基づいて日本語ラベルを取得
 */
export const getRoleLabel = (role: Role): string => {
  switch (role) {
    case 'admin':
      return '管理者';
    case 'manager':
      return '所属長';
    case 'staff':
      return 'スタッフ';
    case 'unknown':
      return '不明';
    default:
      return 'スタッフ'; // デフォルトはスタッフとして扱う
  }
};

/**
 * ロールに基づいて色を取得
 */
const getRoleColor = (role: Role): string => {
  switch (role) {
    case 'admin':
      return '#f44336'; // 赤色
    case 'manager':
      return '#ff9800'; // オレンジ色
    case 'staff':
      return '#9e9e9e'; // グレー色
    default:
      return '#9e9e9e'; // デフォルトはグレー色
  }
};

/**
 * RoleBadgeコンポーネント
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role, 
  size = 'medium', 
  variant = 'filled' 
}) => {
  const label = getRoleLabel(role);
  const color = getRoleColor(role);

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: variant === 'filled' ? color : 'transparent',
    color: variant === 'filled' ? 'white' : color,
    border: variant === 'outlined' ? `1px solid ${color}` : 'none',
    borderRadius: '16px',
    padding: size === 'small' ? '2px 8px' : '4px 12px',
    fontSize: size === 'small' ? '0.75rem' : '0.875rem',
    fontWeight: 500,
    lineHeight: 1.2,
  };

  return (
    <span style={badgeStyle}>
      {label}
    </span>
  );
};

export default RoleBadge;