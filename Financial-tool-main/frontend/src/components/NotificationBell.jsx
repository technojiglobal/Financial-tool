import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const load = () => {
        api.getNotifications()
            .then(data => {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            })
            .catch(() => { });
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleMarkRead = async (id) => {
        await api.markNotificationRead(id);
        load();
    };

    const handleMarkAllRead = async () => {
        await api.markAllNotificationsRead();
        load();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'reminder': return '🔔';
            case 'document_overdue': return '📄';
            default: return '🔔';
        }
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '1.2rem', padding: '6px 10px', borderRadius: 8,
                    position: 'relative', transition: 'background 0.2s',
                    color: 'var(--text)',
                }}
                onMouseEnter={e => e.target.style.background = 'var(--gray-100)'}
                onMouseLeave={e => e.target.style.background = 'none'}
                title="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 2, right: 4,
                        background: 'var(--danger)', color: '#fff',
                        fontSize: '0.6rem', fontWeight: 700,
                        width: 16, height: 16, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 8,
                    width: 360, maxHeight: 420, overflowY: 'auto',
                    background: 'var(--bg)', border: '1px solid var(--gray-200)',
                    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    zIndex: 1000,
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '14px 16px 10px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', borderBottom: '1px solid var(--gray-200)',
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            Notifications {unreadCount > 0 && <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>({unreadCount} new)</span>}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    {notifications.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🔕</div>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>No notifications yet</p>
                        </div>
                    ) : (
                        notifications.slice(0, 20).map(n => (
                            <div
                                key={n.id}
                                onClick={() => !n.read && handleMarkRead(n.id)}
                                style={{
                                    padding: '12px 16px', display: 'flex', gap: 10,
                                    borderBottom: '1px solid var(--gray-100)',
                                    background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
                                    cursor: n.read ? 'default' : 'pointer',
                                    transition: 'background 0.15s',
                                }}
                            >
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                    background: n.type === 'document_overdue' ? 'var(--warning-light)' : 'var(--primary-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.9rem',
                                }}>
                                    {getIcon(n.type)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: n.read ? 400 : 600, fontSize: '0.83rem', marginBottom: 2 }}>
                                        {n.title}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        {n.created_at}
                                    </div>
                                </div>
                                {!n.read && (
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: 'var(--primary)', flexShrink: 0, marginTop: 4,
                                    }} />
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
