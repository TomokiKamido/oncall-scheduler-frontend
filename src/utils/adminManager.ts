// ⚠️ 非推奨: 管理者権限の一元管理システム
// 新しいシステムでは Custom Claims を使用してください
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// 管理者メールアドレスの定義（互換性のため保持）
const ADMIN_EMAILS = [
  'admin@oncall-scheduler.com',
  'llb5yyuihdx@gmail.com',
  'manager@oncall-scheduler.com'
];

// 管理者かどうかを判定（互換性のため保持）
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// ⚠️ 非推奨: 管理者プロファイルを強制作成
// Custom Claims システムに移行してください
export const forceAdminProfile = (user: User): UserProfile => {
  console.warn('⚠️ forceAdminProfile は非推奨です。Custom Claims システムを使用してください。');
  
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
    role: isAdminEmail(user.email || '') ? 'admin' : 'staff', // 管理者メールの場合はadminに設定
    department: '',
    managedDepartments: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  console.log(`👑 管理者プロファイル強制作成:`, profile);
  return profile;
};

// 即座にローカルストレージとFirestoreに管理者権限を保存
export const setAdminRights = async (user: User): Promise<UserProfile> => {
  const adminProfile = forceAdminProfile(user);
  
  // ローカルストレージに即座に保存
  try {
    localStorage.setItem('oncall_user_profile', JSON.stringify(adminProfile));
    sessionStorage.setItem(`admin_override_${user.uid}`, 'true');
    sessionStorage.setItem(`admin_profile_${user.uid}`, JSON.stringify(adminProfile));
    console.log(`💾 管理者権限をローカルに保存完了`);
  } catch (error) {
    console.error(`❌ ローカル保存エラー:`, error);
  }
  
  // Firestoreにも保存
  try {
    const docRef = doc(db, 'userProfiles', user.uid);
    await setDoc(docRef, adminProfile, { merge: true });
    console.log(`☁️ 管理者権限をFirestoreに保存完了`);
  } catch (error) {
    console.error(`❌ Firestore保存エラー:`, error);
  }
  
  return adminProfile;
};

// ⚠️ 非推奨: ユーザーログイン時の管理者権限チェック・設定
// Custom Claims システムに移行してください
export const checkAndSetAdminOnLogin = async (_user: User, existingProfile?: UserProfile | null): Promise<UserProfile | null> => {
  console.warn('⚠️ checkAndSetAdminOnLogin は非推奨です。Custom Claims システムを使用してください。');
  console.log('📋 Custom Claims システムでは、roleRequests コレクションを使用して権限を管理します。');
  
  // 強制的な権限設定は行わない
  return existingProfile || null;
};

// 現在のプロファイルが管理者かどうかを確認
export const verifyAdminStatus = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  
  const isAdmin = profile.role === 'admin' && 
                  profile.managedDepartments.length > 0 &&
                  isAdminEmail(profile.email);
  
  console.log(`🔍 管理者ステータス確認: ${isAdmin ? '✅' : '❌'} (role: ${profile.role}, email: ${profile.email})`);
  return isAdmin;
};

// プロファイル取得時の管理者権限強制適用
export const enforceAdminRights = async (
  user: User, 
  existingProfile: UserProfile | null,
  skipForceAdmin: boolean = false
): Promise<UserProfile> => {
  if (!isAdminEmail(user.email || '')) {
    return existingProfile || forceAdminProfile(user);
  }
  
  // 手動権限変更を尊重するため、強制適用をスキップするオプション
  if (skipForceAdmin && existingProfile) {
    console.log(`⚠️ 管理者権限強制適用をスキップ（手動設定尊重）`);
    return existingProfile;
  }
  
  console.log(`🔧 管理者権限を強制適用中...`);
  
  // 管理者メールアドレスだが非管理者権限の場合のみ強制適用
  if (!existingProfile || (existingProfile.role !== 'admin' && !existingProfile.updatedAt)) {
    console.log(`📝 初回ログインまたは権限未設定のため管理者に変更`);
    return await setAdminRights(user);
  }
  
  // 管理者だが、managedDepartmentsが不足している場合
  if (existingProfile.role === 'admin' && 
      (!existingProfile.managedDepartments || existingProfile.managedDepartments.length === 0)) {
    console.log(`📝 管理部署が不足している管理者プロファイルを修正`);
    const updatedProfile = {
      ...existingProfile,
      managedDepartments: ['dept_001', 'dept_002', 'dept_003'],
      updatedAt: new Date()
    };
    
    try {
      const docRef = doc(db, 'userProfiles', user.uid);
      await updateDoc(docRef, {
        managedDepartments: updatedProfile.managedDepartments,
        updatedAt: updatedProfile.updatedAt
      });
      localStorage.setItem('oncall_user_profile', JSON.stringify(updatedProfile));
      console.log(`✅ 管理部署を更新しました`);
    } catch (error) {
      console.error(`❌ 管理部署更新エラー:`, error);
    }
    
    return updatedProfile;
  }
  
  console.log(`✅ 既存プロファイルをそのまま使用: role=${existingProfile.role}`);
  return existingProfile;
};

// デバッグ用関数をグローバルに公開
if (typeof window !== 'undefined') {
  ((window as unknown) as Record<string, unknown>).adminManager = {
    isAdminEmail,
    forceAdminProfile,
    setAdminRights,
    verifyAdminStatus,
    enforceAdminRights,
    getAdminEmails: () => ADMIN_EMAILS,
  };
}
