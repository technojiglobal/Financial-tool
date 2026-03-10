import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function UserForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.register(form);
            navigate('/users');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="form-page">
            <div className="form-page-header">
                <div className="breadcrumb">
                    <Link to="/users">User Management</Link>
                    <span className="separator">›</span>
                    <span>Create User</span>
                </div>
                <h2>Create New User</h2>
                <p>Add a new user who can access the business management portal.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-card-body">
                        {error && (
                            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 20 }}>{error}</div>
                        )}

                        <div className="form-section-title">Account Details</div>
                        <div className="form-group">
                            <label>Username *</label>
                            <input className="form-control" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="e.g. johndoe" />
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="user@example.com" />
                        </div>

                        <div className="form-section-title">Security</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Password *</label>
                                <div className="password-wrapper">
                                    <input type={showPw ? 'text' : 'password'} className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Choose a strong password" />
                                    <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} title={showPw ? 'Hide password' : 'Show password'}>
                                        {showPw ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="form-card-footer">
                        <Link to="/users" className="btn btn-outline">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
