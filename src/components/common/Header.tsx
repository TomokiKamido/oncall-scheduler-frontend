import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, Users, BarChart3, Bell, Settings, LogOut, User, Shield, UserCheck, Briefcase } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, permission, role, permissions } = useAuthContext();

  const handleLogout = async () => {
    try {
      // ログアウト処理
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../../config/firebase');
      await signOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // 役割に応じたアイコンと表示名を取得
  const getRoleDisplay = () => {
    if (!permission) return { icon: User, label: 'ユーザー', color: '#666' };
    
    switch (role) {
      case 'admin':
        return { icon: Shield, label: '管理者', color: '#e53e3e' };
      case 'manager':
        return { icon: Briefcase, label: 'マネージャー', color: '#3182ce' };
      case 'staff':
      default:
        return { icon: UserCheck, label: 'スタッフ', color: '#38a169' };
    }
  };

  const roleDisplay = getRoleDisplay();
  const RoleIcon = roleDisplay.icon;

  // 権限に応じたナビゲーションアイテムの動的生成
  const getNavItems = () => {
    const items = [
      { path: '/', label: 'ダッシュボード', icon: BarChart3 } // 常に表示
    ];

    // スケジュールタブ：管理者・マネージャーのみ
    if (permissions.canCreateSchedules || permissions.canEditSchedules) {
      items.push({ path: '/schedule', label: 'スケジュール', icon: Calendar });
    }

    // スタッフタブ：管理者・マネージャーのみ
    if (permissions.canManageStaff) {
      items.push({ path: '/staff', label: 'スタッフ', icon: Users });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <Calendar size={28} />
            </div>
            <span className="logo-text">OnCall Pro</span>
          </Link>
        </div>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="header-right">
          <div className="user-info">
            <RoleIcon size={20} style={{ color: roleDisplay.color }} />
            <div className="user-details">
              <span className="user-name">{permission?.displayName || user?.email}</span>
              <span className="user-role" style={{ color: roleDisplay.color }}>
                {roleDisplay.label}
              </span>
            </div>
            {permission?.department && (
              <span className="user-department">{permission.department}</span>
            )}
          </div>
          
          <button className="icon-button">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
          
          <button className="icon-button">
            <Settings size={20} />
          </button>
          
          <button 
            className="icon-button logout-button"
            onClick={handleLogout}
            title="ログアウト"
          >
            <LogOut size={20} />
          </button>
          
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;