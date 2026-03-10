import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const load = () => api.getUsers().then(setUsers).catch(console.error);
    useEffect(() => { load(); }, []);

    const handleRevoke = async (id) => {
        try {
            await api.revokeUser(id); load();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            open: true, title: 'Delete User', message: 'Permanently delete this user? This cannot be undone.',
            onConfirm: async () => { setConfirmModal(m => ({ ...m, open: false })); try { await api.deleteUser(id); load(); } catch (err) { alert(err.message); } }
        });
    };

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="animate-in">
            <div className="page-actions">
                <h2 style={{ flex: 1, fontSize: '1.2rem', fontWeight: 700 }}>User Management</h2>
                <Link to="/users/new" className="btn btn-primary">+ Create User</Link>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                                    <td style={{ fontWeight: 600 }}>
                                        {u.username}
                                        {u.id === currentUser.id && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: 8 }}>(you)</span>}
                                    </td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className="badge" style={{
                                            background: u.role === 'admin' ? 'var(--primary-light)' : 'var(--gray-100)',
                                            color: u.role === 'admin' ? 'var(--primary)' : 'var(--gray-500)'
                                        }}>{u.role}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${u.is_active ? 'badge-active' : 'badge-revoked'}`}>
                                            {u.is_active ? 'Active' : 'Revoked'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.created_at?.split('T')[0]}</td>
                                    <td className="actions-cell">
                                        {u.id !== currentUser.id && (
                                            <>
                                                <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => handleRevoke(u.id)}>
                                                    {u.is_active ? '🚫 Revoke' : '✅ Restore'}
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>🗑️</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(m => ({ ...m, open: false }))} />
        </div>
    );
}
