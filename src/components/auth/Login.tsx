import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDepartments } from '../../hooks/useDepartments';
import './Login.css';

interface LoginProps {
  onLoginSuccess?: () => void;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  department: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(''); // メール未認証用
  
  // 新規登録用の状態
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    department: ''
  });
  
  const { login, register, sendEmailVerification } = useAuth();
  const { departments, isLoading: departmentsLoading } = useDepartments();

  // 部署一覧は初期化時に自動で読み込まれるため、useEffectは不要

  // フォーム入力の更新
  const updateRegisterForm = (field: keyof RegisterFormData, value: string) => {
    setRegisterForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // バリデーション
  const validateRegisterForm = (): string | null => {
    const { username, email, password, confirmPassword, displayName, department } = registerForm;
    
    if (!username.trim()) return 'ユーザーネームを入力してください';
    if (username.length < 3) return 'ユーザーネームは3文字以上で入力してください';
    if (!email.trim()) return 'メールアドレスを入力してください';
    if (!displayName.trim()) return 'ニックネームを入力してください';
    if (!department) return '所属部署を選択してください';
    if (!password) return 'パスワードを入力してください';
    if (password.length < 6) return 'パスワードは6文字以上で入力してください';
    if (password !== confirmPassword) return 'パスワードが一致しません';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isRegister) {
        // 新規登録のバリデーション
        const validationError = validateRegisterForm();
        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }
        
        console.log('🔍 新規登録開始:', registerForm.email); // デバッグ用
        await register(registerForm.email, registerForm.password, registerForm.displayName, registerForm.department);
        setSuccessMessage('アカウントが作成されました！認証メールを確認してください。');
        setShowEmailVerification(true);
      } else {
        // テスト用のデフォルト値を設定（デバッグ用）
        if (!email && !password) {
          setEmail('staff@oncall-scheduler.com');
          setPassword('password123');
          console.log('🔧 デバッグ用のデフォルト値を設定');
        }
        
        console.log('🔍 ログイン開始:', email); // デバッグ用
        console.log('🔍 パスワード長:', password.length); // デバッグ用
        
        if (!email || !password) {
          setError('メールアドレスとパスワードを入力してください。');
          setLoading(false);
          return;
        }
        
        await login(email, password);
        console.log('🔍 ログイン成功'); // デバッグ用
        onLoginSuccess?.();
      }
    } catch (error: any) {
      console.error('🔍 認証エラー詳細:', error); // デバッグ用
      const errorCode = error.code || error.message;
      
      // メール未認証の場合は専用の状態に移行
      if (errorCode === 'auth/email-not-verified') {
        setUnverifiedEmail(email);
        setShowEmailVerification(true);
        setError('');
      } else {
        setError(getErrorMessage(errorCode));
      }
    } finally {
      setLoading(false);
    }
  };

  // メール認証再送信
  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await sendEmailVerification();
      setSuccessMessage('認証メールを再送信しました。');
    } catch (error: any) {
      setError('認証メールの送信に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    console.log('🔍 ログインエラーコード:', errorCode); // デバッグ用
    
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'ユーザーが見つかりません。メールアドレスを確認してください。';
      case 'auth/wrong-password':
        return 'パスワードが間違っています。';
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に使用されています。';
      case 'auth/weak-password':
        return 'パスワードは6文字以上で入力してください。';
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません。';
      case 'auth/too-many-requests':
        return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
      case 'auth/email-not-verified':
        return 'メールアドレスが認証されていません。認証メールを確認してください。';
      case 'auth/invalid-credential':
        return 'ログイン情報が正しくありません。メールアドレスとパスワードを確認してください。';
      case 'auth/user-disabled':
        return 'このアカウントは無効化されています。管理者にお問い合わせください。';
      case 'auth/network-request-failed':
        return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
      default:
        console.log('🔍 未知のエラー:', errorCode); // デバッグ用
        return `エラーが発生しました: ${errorCode || '不明なエラー'}`;
    }
  };

  // メール認証完了画面
  if (showEmailVerification) {
    const displayEmail = unverifiedEmail || registerForm.email;
    const isUnverifiedLogin = !!unverifiedEmail;
    
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="verification-success">
            <div className="success-icon">
              {isUnverifiedLogin ? '📧' : '✅'}
            </div>
            <h2>
              {isUnverifiedLogin ? 'メール認証が必要です' : 'アカウント作成完了！'}
            </h2>
            <p>
              <strong>{displayEmail}</strong> に
              {isUnverifiedLogin ? '認証メールが送信されています。' : '認証メールを送信しました。'}
            </p>
            <p>
              メール内のリンクをクリックして、アカウント認証を完了してください。
              {isUnverifiedLogin && '認証完了後に再度ログインしてください。'}
            </p>
            
            {successMessage && (
              <div className="success-message">{successMessage}</div>
            )}
            
            <div className="verification-actions">
              <button 
                onClick={handleResendVerification}
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading ? '送信中...' : '認証メールを再送信'}
              </button>
              
              <button 
                onClick={() => {
                  setShowEmailVerification(false);
                  setIsRegister(false);
                  setUnverifiedEmail('');
                  setSuccessMessage('');
                  setError('');
                }}
                className="btn btn-primary"
              >
                ログイン画面に戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          {isRegister ? 'アカウント作成' : 'ログイン'}
        </h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister ? (
            // 新規登録フォーム
            <>
              <div className="form-group">
                <label htmlFor="username">ユーザーネーム *</label>
                <input
                  type="text"
                  id="username"
                  value={registerForm.username}
                  onChange={(e) => updateRegisterForm('username', e.target.value)}
                  required
                  placeholder="3文字以上のユーザーネーム"
                  minLength={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="register-email">メールアドレス *</label>
                <input
                  type="email"
                  id="register-email"
                  value={registerForm.email}
                  onChange={(e) => updateRegisterForm('email', e.target.value)}
                  required
                  placeholder="example@email.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="displayName">ニックネーム *</label>
                <input
                  type="text"
                  id="displayName"
                  value={registerForm.displayName}
                  onChange={(e) => updateRegisterForm('displayName', e.target.value)}
                  required
                  placeholder="表示される名前"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="department">所属部署 *</label>
                {departmentsLoading ? (
                  <div className="loading-message">部署一覧を読み込み中...</div>
                ) : (
                  <select
                    id="department"
                    value={registerForm.department}
                    onChange={(e) => updateRegisterForm('department', e.target.value)}
                    required
                    className="form-select"
                  >
                    <option value="">-- 部署を選択してください --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="register-password">パスワード *</label>
                <input
                  type="password"
                  id="register-password"
                  value={registerForm.password}
                  onChange={(e) => updateRegisterForm('password', e.target.value)}
                  required
                  placeholder="6文字以上"
                  minLength={6}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">パスワード確認 *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={registerForm.confirmPassword}
                  onChange={(e) => updateRegisterForm('confirmPassword', e.target.value)}
                  required
                  placeholder="パスワードを再入力"
                  minLength={6}
                />
              </div>
            </>
          ) : (
            // ログインフォーム
            <>
              <div className="form-group">
                <label htmlFor="email">メールアドレス</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">パスワード</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="6文字以上"
                  minLength={6}
                />
              </div>
            </>
          )}
          
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="login-button"
          >
            {loading ? '処理中...' : (isRegister ? 'アカウント作成' : 'ログイン')}
          </button>
        </form>
        
        <div className="toggle-mode">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccessMessage('');
              setUnverifiedEmail('');
              // フォームをリセット
              setEmail('');
              setPassword('');
              setRegisterForm({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                displayName: '',
                department: ''
              });
            }}
            className="toggle-button"
          >
            {isRegister ? 'ログインはこちら' : 'アカウント作成はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
