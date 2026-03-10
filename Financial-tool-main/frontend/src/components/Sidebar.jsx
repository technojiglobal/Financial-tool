import { NavLink } from 'react-router-dom';

export default function Sidebar({ user, onLogout }) {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon">T</div>
                    <div>
                        <div className="logo-text">Technoji Global</div>
                        <div className="logo-subtitle">Business Manager</div>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Main</div>
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📊</span> Dashboard
                </NavLink>

                <div className="nav-section-label">Finance</div>
                <NavLink to="/payments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">💳</span> Client Payments
                </NavLink>
                <NavLink to="/salaries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">👥</span> Salaries
                </NavLink>
                <NavLink to="/expenses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📋</span> Other Expenses
                </NavLink>
                <NavLink to="/profit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📈</span> Profit
                </NavLink>
                <NavLink to="/debts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">💰</span> Debt Ledger
                </NavLink>

                <div className="nav-section-label">Tools</div>
                <NavLink to="/reminders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🔔</span> Reminders
                </NavLink>
                <NavLink to="/documents" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📄</span> Documents
                </NavLink>

                {user?.role === 'admin' && (
                    <>
                        <div className="nav-section-label">Admin</div>
                        <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon">⚙️</span> User Management
                        </NavLink>
                        <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon">📊</span> Admin Panel
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={onLogout}>
                    <span className="nav-icon">🚪</span> Logout
                </button>
            </div>
        </div>
    );
}
