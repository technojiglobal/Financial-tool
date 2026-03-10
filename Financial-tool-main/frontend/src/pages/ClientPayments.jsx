import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

export default function ClientPayments() {
    const [projects, setProjects] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const load = () => api.getProjects().then(setProjects).catch(console.error);
    useEffect(() => { load(); }, []);

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const handleDelete = (id) => {
        setConfirmModal({
            open: true, title: 'Delete Project', message: 'Delete this project and all its payments? This cannot be undone.',
            onConfirm: async () => { setConfirmModal(m => ({ ...m, open: false })); try { await api.deleteProject(id); load(); } catch (err) { alert(err.message || 'Failed to delete project'); } }
        });
    };

    const handleDeletePayment = (id) => {
        setConfirmModal({
            open: true, title: 'Delete Payment', message: 'Delete this payment? This cannot be undone.',
            onConfirm: async () => { setConfirmModal(m => ({ ...m, open: false })); try { await api.deletePayment(id); load(); } catch (err) { alert(err.message || 'Failed to delete payment'); } }
        });
    };

    const toggle = (id) => setExpanded(expanded === id ? null : id);

    return (
        <div className="animate-in">
            <div className="page-actions">
                <h2 style={{ flex: 1, fontSize: '1.2rem', fontWeight: 700 }}>Client Payments</h2>
                <Link to="/payments/new" className="btn btn-primary">+ New Project</Link>
            </div>

            <div className="project-cards">
                {projects.map(p => {
                    const isOpen = expanded === p.id;
                    const paidPercent = p.total_amount > 0 ? Math.min(100, Math.round((p.total_paid / p.total_amount) * 100)) : 0;
                    return (
                        <div key={p.id} className={`project-card ${isOpen ? 'expanded' : ''}`}>
                            {/* Collapsed summary row — always visible */}
                            <div className="project-card-summary" onClick={() => toggle(p.id)}>
                                <div className="project-card-toggle">{isOpen ? '▼' : '▶'}</div>
                                <div className="project-card-main">
                                    <div className="project-card-title">{p.client_name}</div>
                                    <div className="project-card-subtitle">
                                        {p.project_name}
                                        {Number(p.amc_amount) > 0 && <span style={{ marginLeft: 8, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>AMC: {fmt(p.amc_amount)}</span>}
                                    </div>
                                </div>
                                <div className="project-card-amounts">
                                    <div className="project-card-total">{fmt(p.total_amount)}</div>
                                    <div className="project-card-progress-wrap">
                                        <div className="project-card-progress">
                                            <div className="project-card-progress-bar" style={{ width: `${paidPercent}%` }}></div>
                                        </div>
                                        <span className="project-card-percent">{paidPercent}%</span>
                                    </div>
                                </div>
                                <div className="project-card-balance-info">
                                    <span className="amount-positive">{fmt(p.total_paid)}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>paid</span>
                                </div>
                                <div className="project-card-balance-info">
                                    <span style={{ color: p.balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(p.balance)}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>balance</span>
                                </div>
                                <div className="project-card-actions" onClick={e => e.stopPropagation()}>
                                    <Link to={`/payments/${p.id}/pay`} className="btn btn-sm btn-success">+ Paid</Link>
                                    <Link to={`/payments/${p.id}/edit`} className="btn btn-sm btn-secondary">✏️</Link>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>🗑️</button>
                                </div>
                            </div>

                            {/* Expanded details — shown only when toggled */}
                            {isOpen && (
                                <div className="project-card-details">
                                    <div className="project-card-detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Email</span>
                                            <span className="detail-value">{p.email || '—'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Phone</span>
                                            <span className="detail-value">{p.phone || '—'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Total Amount</span>
                                            <span className="detail-value">{fmt(p.total_amount)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Notes</span>
                                            <span className="detail-value">{p.notes || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Payment history */}
                                    {p.payments?.length > 0 && (
                                        <div className="payment-history">
                                            <h4 className="payment-history-title">Payment History <span className="badge badge-active">{p.payments.length}</span></h4>
                                            <div className="payment-history-list">
                                                {p.payments.map(pay => (
                                                    <div key={pay.id} className="payment-history-item">
                                                        <div className="payment-history-date">{pay.date}</div>
                                                        <div className="payment-history-amount amount-positive">{fmt(pay.paid_amount)}</div>
                                                        <div className="payment-history-note">{pay.note || '—'}</div>
                                                        <Link to={`/payments/edit/${pay.id}`} className="btn btn-sm btn-secondary">✏️</Link>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeletePayment(pay.id)}>🗑️</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {projects.length === 0 && (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-icon">💳</div>
                            <h3>No projects yet</h3>
                            <p>Add your first project to start tracking client payments.</p>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(m => ({ ...m, open: false }))} />
        </div>
    );
}
