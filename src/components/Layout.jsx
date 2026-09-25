import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';

export default function Layout({ children, searchPlaceholder }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Topbar placeholder={searchPlaceholder} />
        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
}
