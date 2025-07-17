import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { isAdminEmail } from '../utils/adminManager'; // 管理者メール判定をインポート

/**
 * ユーザーの role を取得するカスタムフック
 * - ログインが変化するたびに ID トークンを強制リフレッシュ（リトライ機能付き）
 * - role が無い場合は管理者メールなら 'admin'、そうでなければ 'unknown' を返す
 */
export function useRole() {
  const [role, setRole] = useState<string>('unknown');
  const [loading, setLoading] = useState(true);

  // IDトークン取得のリトライ関数
  const getIdTokenWithRetry = async (user: User, maxRetries = 3): Promise<string> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 IDトークン取得試行 ${attempt}/${maxRetries}...`);
        const idTokenResult = await user.getIdTokenResult(true);
        const role = (idTokenResult.claims.role as string) || (isAdminEmail(user.email || '') ? 'admin' : 'unknown');
        console.log('✅ IDトークン取得成功:', { role, claims: idTokenResult.claims });
        return role;
      } catch (error) {
        console.warn(`⚠️  IDトークン取得失敗 (試行 ${attempt}/${maxRetries}):`, error);
        if (attempt === maxRetries) {
          console.error('❌ IDトークン取得の全試行が失敗しました');
          return isAdminEmail(user.email || '') ? 'admin' : 'unknown';
        }
        // 次の試行前に少し待機
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return isAdminEmail(user.email || '') ? 'admin' : 'unknown';
  };

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('ℹ️  ユーザーがログアウトしました');
        setRole('unknown');
        setLoading(false);
        return;
      }
      
      console.log('👤 ユーザーログイン検出:', user.uid);
      
      try {
        // 1. ユーザー情報をリロード（最新のCustom Claims取得のため）
        console.log('🔄 ユーザー情報リロード中...');
        await user.reload();
        console.log('✅ ユーザー情報リロード完了');
        
        // 2. IDトークンを強制リフレッシュしてrole取得
        const userRole = await getIdTokenWithRetry(user);
        console.log('[role-debug]', userRole);
        setRole(userRole);
        setLoading(false);
        
      } catch (error) {
        console.error('❌ ユーザー情報リロードエラー:', error);
        // リロードに失敗してもIDトークン取得は試行する
        const userRole = await getIdTokenWithRetry(user);
        console.log('[role-debug]', userRole);
        setRole(userRole);
        setLoading(false);
      }
    });
  }, []);

  return { role, loading };
}
