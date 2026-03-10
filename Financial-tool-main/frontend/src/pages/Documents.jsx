import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const NEXT_DOC_TYPE = {
    'Proposal': 'Agreement',
    'Agreement': 'Invoice',
    'Invoice': 'No due',
};

export default function Documents() {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const load = () => {
        setLoading(true);
        api.getDocuments()
            .then(setDocs)
            .catch(err => alert(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleDelete = (id) => {
        setConfirmModal({
            open: true, title: 'Delete Document', message: 'Delete this document? This cannot be undone.',
            onConfirm: async () => { setConfirmModal(m => ({ ...m, open: false })); try { await api.deleteDocument(id); load(); } catch (err) { alert(err.message); } }
        });
    };

    const filtered = docs.filter(d => {
        const matchesSearch = !search ||
            (d.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.project_name || '').toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === 'all' ||
            (filter === 'overdue' && d.reminder_due) ||
            (filter === 'sent' && d.status === 'Sent') ||
            (filter === 'not_sent' && d.status === 'Not Sent');

        return matchesSearch && matchesFilter;
    });

    const overdueCount = docs.filter(d => d.reminder_due).length;

    const getReminderInfo = (doc) => {
        const nextType = NEXT_DOC_TYPE[doc.doc_type];
        if (!nextType) return null; // No due — no reminder
        if (doc.status !== 'Sent') return null;

        const reminderDays = doc.reminder_days || 0;
        if (reminderDays <= 0) return { label: '⚠️ No reminder set', cls: 'badge-default' };

        if (doc.auto_reminder_sent) {
            return { label: `✅ Auto-reminded → ${nextType}`, cls: 'badge-success' };
        }
        if (doc.reminder_due) {
            return { label: `⏰ ${doc.days_since_sent}d overdue → send ${nextType}`, cls: 'badge-danger' };
        }
        if (doc.days_since_sent > 0) {
            return { label: `📅 ${doc.days_since_sent}/${reminderDays}d → ${nextType}`, cls: 'badge-info' };
        }
        return { label: `📅 Sent today → remind in ${reminderDays}d for ${nextType}`, cls: 'badge-info' };
    };

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2>Documents</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Follow-up reminders: Proposal → Agreement → Invoice → No Due
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/documents/new" className="btn btn-primary">+ New Document</Link>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="🔍 Search client or project..."
                    className="form-control"
                    style={{ maxWidth: 280, flex: 1 }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                    {[
                        { val: 'all', label: 'All' },
                        { val: 'sent', label: 'Sent' },
                        { val: 'not_sent', label: 'Not Sent' },
                        { val: 'overdue', label: `Overdue (${overdueCount})` },
                    ].map(f => (
                        <button
                            key={f.val}
                            onClick={() => setFilter(f.val)}
                            className={`btn btn-sm ${filter === f.val ? 'btn-primary' : 'btn-outline'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Project</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Follow-up</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No documents found</td></tr>
                            ) : filtered.map(d => {
                                const reminderInfo = getReminderInfo(d);
                                return (
                                    <tr key={d.id}>
                                        <td><strong>{d.client_name}</strong></td>
                                        <td>{d.project_name}</td>
                                        <td><span className={`badge ${d.doc_type === 'Proposal' ? 'badge-info' : d.doc_type === 'Agreement' ? 'badge-primary' : d.doc_type === 'Invoice' ? 'badge-warning' : 'badge-success'}`}>{d.doc_type}</span></td>
                                        <td>{d.date}</td>
                                        <td>
                                            <span className={`badge ${d.status === 'Sent' ? 'badge-success' : 'badge-default'}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td>
                                            {reminderInfo ? (
                                                <span className={`badge ${reminderInfo.cls}`} style={{ fontSize: '0.72rem' }}>
                                                    {reminderInfo.label}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {d.doc_type === 'No due' && d.status === 'Sent' ? '✅ Complete' : '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <Link to={`/documents/${d.id}/edit`} className="btn btn-sm btn-outline">✏️</Link>
                                                <button
                                                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                                                    className="btn btn-sm btn-outline"
                                                    title="View actions"
                                                >
                                                    📋
                                                </button>
                                                <button onClick={() => handleDelete(d.id)} className="btn btn-sm btn-danger">🗑️</button>
                                            </div>

                                            {/* Expanded Actions */}
                                            {expandedId === d.id && d.actions && d.actions.length > 0 && (
                                                <div style={{
                                                    marginTop: 8, padding: '8px 12px', background: '#fff',
                                                    borderRadius: 8, fontSize: '0.78rem', border: '1px solid var(--border)',
                                                }}>
                                                    <strong style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Activity Log:</strong>
                                                    {d.actions.slice(0, 5).map((a, i) => (
                                                        <div key={i} style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                                                            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{a.date}</span>
                                                            <span>{a.action}</span>
                                                            <span style={{ color: 'var(--text-muted)' }}>by {a.user}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(m => ({ ...m, open: false }))} />
        </div>
    );
}
