// 初期ユーザープロファイル作成スクリプト
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';

// Firebase設定をインポート
import { db } from '../config/firebase';

export const createInitialUserProfile = async (uid: string, email: string, role: UserRole = 'staff') => {
  try {
    const userProfile = {
      uid: uid,
      displayName: email.split('@')[0], // emailからdisplayNameを生成
      email: email,
      role: role,
      department: 'ICU', // デフォルト部署
      managedDepartments: ['admin', 'manager'].includes(role) ? ['ICU'] : [],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      chiefOf: ['admin', 'manager'].includes(role) ? ['ICU'] : [],
      hosp: 'メイン病院'
    };

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, userProfile);
    
    console.log(`✅ ユーザープロファイルを作成しました: ${email} (${role})`);
    return userProfile;
  } catch (error) {
    console.error('❌ ユーザープロファイルの作成に失敗:', error);
    throw error;
  }
};

// 管理者ユーザーを作成する関数
export const createAdminUser = async (uid: string, email: string) => {
  return await createInitialUserProfile(uid, email, 'admin');
};
