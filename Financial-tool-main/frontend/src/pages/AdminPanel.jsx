import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminPanel() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState({ data: false, logs: false });

    const loadLogs = () => {
        setLoading(true);
        api.getLogs(page, actionFilter, entityFilter).then(res => {
            setLogs(res.logs);
            setTotal(res.total);
            setPages(res.pages);
        }).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { loadLogs(); }, [page, actionFilter, entityFilter]);

    const handleDownloadData = async () => {
        setDownloading(d => ({ ...d, data: true }));
        try { await api.downloadData(); } catch (err) { alert('Download failed'); }
        finally { setDownloading(d => ({ ...d, data: false })); }
    };

    const handleDownloadLogs = async () => {
        setDownloading(d => ({ ...d, logs: true }));
        try { await api.downloadLogs(); } catch (err) { alert('Download failed'); }
        finally { setDownloading(d => ({ ...d, logs: false })); }
    };

    const actionMeta = {
        create: { color: '#10b981', bg: '#d1fae5', icon: '➕' },
        update: { color: '#f59e0b', bg: '#fef3c7', icon: '✏️' },
        delete: { color: '#ef4444', bg: '#fee2e2', icon: '🗑️' },
        login: { color: '#6366f1', bg: '#e0e7ff', icon: '🔑' },
        email: { color: '#06b6d4', bg: '#cffafe', icon: '📧' },
        revoke: { color: '#f97316', bg: '#ffedd5', icon: '🚫' },
        reactivate: { color: '#22d3ee', bg: '#cffafe', icon: '✅' },
    };

    const entityIcons = {
        project: '📁', payment: '💳', employee: '👤', salary_payment: '💰',
        expense: '📋', reminder: '🔔', user: '⚙️'
    };

    const fmtTime = (ts) => {
        if (!ts) return { date: '', time: '' };
        const d = new Date(ts + '+05:30');
        return {
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }),
            time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
        };
    };

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>📊</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Admin Panel</h2>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Data exports & activity logs</p>
                </div>
            </div>

            {/* Export Section */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                <div className="stat-card" style={{ flex: 1, minWidth: 200, cursor: 'pointer', transition: 'transform 0.15s' }} onClick={handleDownloadData}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div className="stat-label">Export All Data</div>
                    <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                        {downloading.data ? '⏳ Generating...' : '📥 Download Excel'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Projects, Payments, Employees, Salaries, Expenses</div>
                </div>
                <div className="stat-card" style={{ flex: 1, minWidth: 200, cursor: 'pointer', transition: 'transform 0.15s' }} onClick={handleDownloadLogs}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div className="stat-label">Export Activity Logs</div>
                    <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                        {downloading.logs ? '⏳ Generating...' : '📥 Download Excel'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Complete audit trail of all user actions</div>
                </div>
                <div className="stat-card" style={{ flex: 1, minWidth: 200 }}>
                    <div className="stat-label">Total Log Entries</div>
                    <div className="stat-value">{total}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>All tracked activities</div>
                </div>
            </div>

            {/* Activity Logs Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                    padding: '16px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: 12,
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>📋 Activity Logs</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select className="form-control" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }} value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
                            <option value="">All Actions</option>
                            <option value="create">➕ Create</option>
                            <option value="update">✏️ Update</option>
                            <option value="delete">🗑️ Delete</option>
                            <option value="login">🔑 Login</option>
                            <option value="email">📧 Email</option>
                            <option value="revoke">🚫 Revoke</option>
                        </select>
                        <select className="form-control" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }} value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}>
                            <option value="">All Entities</option>
                            <option value="project">📁 Projects</option>
                            <option value="payment">💳 Payments</option>
                            <option value="employee">👤 Employees</option>
                            <option value="salary_payment">💰 Salaries</option>
                            <option value="expense">📋 Expenses</option>
                            <option value="reminder">🔔 Reminders</option>
                            <option value="user">⚙️ Users</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⏳</div>
                        Loading logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                        No activity logs found
                    </div>
                ) : (
                    <>
                        <div className="table-container" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: 40, textAlign: 'center' }}>#</th>
                                        <th>Date & Time</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th style={{ minWidth: 250 }}>Details</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, idx) => {
                                        const meta = actionMeta[log.action] || { color: '#94a3b8', bg: '#f1f5f9', icon: '•' };
                                        const eIcon = entityIcons[log.entity] || '📄';
                                        const ts = fmtTime(log.timestamp);
                                        return (
                                            <tr key={log.id}>
                                                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    {(page - 1) * 50 + idx + 1}
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    <div style={{ fontWeight: 500, fontSize: '0.82rem' }}>{ts.date}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>{ts.time}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <div style={{
                                                            width: 26, height: 26, borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0
                                                        }}>
                                                            {(log.username || '?')[0].toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{log.username || '—'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '3px 10px',
                                                        borderRadius: 20,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.03em',
                                                        background: meta.bg,
                                                        color: meta.color,
                                                        border: `1px solid ${meta.color}30`
                                                    }}>
                                                        <span style={{ fontSize: '0.7rem' }}>{meta.icon}</span>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '2px 8px',
                                                        borderRadius: 6,
                                                        background: 'var(--gray-100)',
                                                        fontSize: '0.8rem',
                                                        textTransform: 'capitalize',
                                                    }}>
                                                        <span>{eIcon}</span>
                                                        {log.entity?.replace('_', ' ') || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ maxWidth: 320 }}>
                                                    <div style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        fontSize: '0.82rem',
                                                        color: 'var(--text-secondary)',
                                                    }}>
                                                        {log.details || '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <code style={{
                                                        fontSize: '0.72rem',
                                                        padding: '2px 6px',
                                                        borderRadius: 4,
                                                        background: 'var(--gray-100)',
                                                        color: 'var(--text-muted)',
                                                        fontFamily: '"Fira Code", "Cascadia Code", monospace',
                                                    }}>
                                                        {log.ip_address || '—'}
                                                    </code>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pages > 1 && (
                            <div style={{
                                padding: '12px 22px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px solid var(--border)',
                                fontSize: '0.82rem',
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total} entries
                                </span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                        ← Prev
                                    </button>
                                    <span className="btn btn-sm btn-secondary" style={{ cursor: 'default' }}>
                                        {page} / {pages}
                                    </span>
                                    <button
                                        className="btn btn-sm btn-outline"
                                        disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
