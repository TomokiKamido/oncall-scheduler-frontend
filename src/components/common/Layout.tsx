import { ReactNode } from 'react';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>OnCall Pro</h4>
            <p>効率的なオンコール管理システム</p>
          </div>
          <div className="footer-section">
            <h4>機能</h4>
            <ul>
              <li>スケジュール管理</li>
              <li>チーム管理</li>
              <li>アラート設定</li>
              <li>分析・レポート</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>サポート</h4>
            <ul>
              <li>ヘルプセンター</li>
              <li>API ドキュメント</li>
              <li>お問い合わせ</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 OnCall Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;