import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

export default function Reminders() {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const load = () => {
        setLoading(true);
        api.getReminders()
            .then(setReminders)
            .catch(err => alert(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleDelete = (id) => {
        setConfirmModal({
            open: true, title: 'Delete Reminder', message: 'Delete this reminder? This cannot be undone.',
            onConfirm: async () => { setConfirmModal(m => ({ ...m, open: false })); try { await api.deleteReminder(id); load(); } catch (err) { alert(err.message); } }
        });
    };

    const isOverdue = (r) => {
        if (r.email_sent) return false;
        const now = new Date();
        const d = new Date(r.date + (r.time ? 'T' + r.time : 'T23:59'));
        return now > d;
    };

    const getStatus = (r) => {
        if (r.email_sent) return { label: '✅ Sent', cls: 'badge-success' };
        if (isOverdue(r)) return { label: '⏰ Overdue', cls: 'badge-danger' };
        return { label: '⏳ Scheduled', cls: 'badge-info' };
    };

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2>Reminders</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Emails are sent automatically at the scheduled date &amp; time.
                    </p>
                </div>
                <Link to="/reminders/new" className="btn btn-primary">+ New Reminder</Link>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Date</th>
                                <th>Time</th>

                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reminders.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No reminders yet</td></tr>
                            ) : reminders.map(r => {
                                const status = getStatus(r);
                                return (
                                    <tr key={r.id}>
                                        <td>{r.description}</td>
                                        <td>{r.date}</td>
                                        <td>{r.time || '—'}</td>

                                        <td>
                                            <span className={`badge ${status.cls}`}>{status.label}</span>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Auto</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <Link to={`/reminders/${r.id}/edit`} className="btn btn-sm btn-outline">✏️ Edit</Link>
                                                <button onClick={() => handleDelete(r.id)} className="btn btn-sm btn-danger">🗑️</button>
                                            </div>
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
