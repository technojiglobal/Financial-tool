import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

export default function Layout({ children, user, onLogout }) {
    return (
        <div className="app-layout">
            <Sidebar user={user} onLogout={onLogout} />
            <div className="main-content">
                <div className="page-header">
                    <h1>Technoji Global Business Manager</h1>
                    <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <NotificationBell />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.username}</span>
                        <div className="avatar">{user?.username?.charAt(0)?.toUpperCase()}</div>
                    </div>
                </div>
                <div className="page-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
