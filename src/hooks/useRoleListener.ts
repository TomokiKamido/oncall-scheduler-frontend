import { useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useToast } from './useToast';

export const useRoleListener = () => {
  const { showInfo } = useToast();

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newRole = data.role;
        
        // 現在のユーザーのカスタムクレームと比較
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idTokenResult = await currentUser.getIdTokenResult();
          const currentRole = idTokenResult.claims.role;
          
          // 権限が変更された場合
          if (currentRole !== newRole) {
            try {
              // トークンをリフレッシュして新しい権限を反映
              await currentUser.getIdToken(true);
              showInfo(`権限が ${newRole} に更新されました。画面を更新しています...`);
              
              // 少し待ってから画面をリロード
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } catch (error) {
              console.error('トークンの更新に失敗:', error);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [showInfo]);
};
