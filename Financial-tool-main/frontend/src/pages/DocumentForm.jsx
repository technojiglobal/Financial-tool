import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

const NEXT_DOC_TYPE = {
    'Proposal': 'Agreement',
    'Agreement': 'Invoice',
    'Invoice': 'No due',
};

export default function DocumentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        client_name: '',
        project_name: '',
        date: new Date().toISOString().split('T')[0],
        doc_type: 'Proposal',
        status: 'Not Sent',
        reminder_days: 7,
        notes: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});

    useEffect(() => {
        if (isEdit) {
            api.getDocuments().then(docs => {
                const doc = docs.find(d => d.id === +id);
                if (doc) {
                    setForm({
                        client_name: doc.client_name || '',
                        project_name: doc.project_name || '',
                        date: doc.date || '',
                        doc_type: doc.doc_type || 'Proposal',
                        status: doc.status || 'Not Sent',
                        reminder_days: doc.reminder_days || 7,
                        notes: doc.notes || '',
                    });
                } else {
                    setError('Document not found');
                }
            }).catch(() => setError('Failed to load document'));
        }
    }, [id, isEdit]);

    const validate = () => {
        if (!form.client_name.trim()) return 'Client name is required';
        if (!form.project_name.trim()) return 'Project name is required';
        if (!form.date) return 'Date is required';
        const d = new Date(form.date);
        const maxFuture = new Date();
        maxFuture.setFullYear(maxFuture.getFullYear() + 1);
        if (d > maxFuture) return 'Date seems too far in the future';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await api.updateDocument(id, form);
            } else {
                await api.createDocument(form);
            }
            navigate('/documents');
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updates = { [name]: name === 'reminder_days' ? Number(value) : value };
        // Reset reminder_days when switching to 'No due' (final step — no reminders)
        if (name === 'doc_type' && value === 'No due') {
            updates.reminder_days = 0;
        }
        setForm({ ...form, ...updates });
        setTouched({ ...touched, [name]: true });
        if (error) setError('');
    };

    const getFieldError = (field) => {
        if (!touched[field]) return null;
        if (field === 'client_name' && !form.client_name.trim()) return 'Required';
        if (field === 'project_name' && !form.project_name.trim()) return 'Required';
        return null;
    };

    const nextType = NEXT_DOC_TYPE[form.doc_type];

    return (
        <div className="form-page">
            <div className="form-page-header">
                <div className="breadcrumb">
                    <Link to="/documents">Documents</Link>
                    <span className="separator">›</span>
                    <span>{isEdit ? 'Edit Document' : 'New Document'}</span>
                </div>
                <h2>{isEdit ? '✏️ Edit Document' : '📄 New Document'}</h2>
                <p>{isEdit ? 'Update the document details below.' : 'Create a new document entry to track proposals, agreements, and invoices.'}</p>
            </div>

            {error && (
                <div style={{
                    background: 'var(--danger-light)', color: 'var(--danger)',
                    padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8
                }}>
                    <span>⚠️</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-card-body">
                        <div className="form-section-title">Document Details</div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Client Name *</label>
                                <input
                                    name="client_name"
                                    className="form-control"
                                    value={form.client_name}
                                    onChange={handleChange}
                                    onBlur={() => setTouched({ ...touched, client_name: true })}
                                    required
                                    placeholder="e.g. Acme Corp, TechStart Inc"
                                    style={getFieldError('client_name') ? { borderColor: 'var(--danger)' } : undefined}
                                />
                                {getFieldError('client_name') && <small style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{getFieldError('client_name')}</small>}
                            </div>
                            <div className="form-group">
                                <label>Project Name *</label>
                                <input
                                    name="project_name"
                                    className="form-control"
                                    value={form.project_name}
                                    onChange={handleChange}
                                    onBlur={() => setTouched({ ...touched, project_name: true })}
                                    required
                                    placeholder="e.g. Website Redesign, Mobile App"
                                    style={getFieldError('project_name') ? { borderColor: 'var(--danger)' } : undefined}
                                />
                                {getFieldError('project_name') && <small style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{getFieldError('project_name')}</small>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date *</label>
                                <input name="date" type="date" className="form-control" value={form.date} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Document Type</label>
                                <select name="doc_type" className="form-control" value={form.doc_type} onChange={handleChange}>
                                    <option value="Proposal">📋 Proposal</option>
                                    <option value="Agreement">📝 Agreement</option>
                                    <option value="Invoice">🧾 Invoice</option>
                                    <option value="No due">✓ No due</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                                    borderRadius: 8, border: `2px solid ${form.status === 'Not Sent' ? 'var(--warning)' : 'var(--gray-200)'}`,
                                    background: form.status === 'Not Sent' ? 'var(--warning-light)' : 'transparent',
                                    cursor: 'pointer', flex: 1, transition: 'all 0.2s'
                                }}>
                                    <input type="radio" name="status" value="Not Sent" checked={form.status === 'Not Sent'} onChange={handleChange} style={{ display: 'none' }} />
                                    <span>⏳</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Not Sent</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Draft or pending</div>
                                    </div>
                                </label>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                                    borderRadius: 8, border: `2px solid ${form.status === 'Sent' ? 'var(--success)' : 'var(--gray-200)'}`,
                                    background: form.status === 'Sent' ? 'var(--success-light)' : 'transparent',
                                    cursor: 'pointer', flex: 1, transition: 'all 0.2s'
                                }}>
                                    <input type="radio" name="status" value="Sent" checked={form.status === 'Sent'} onChange={handleChange} style={{ display: 'none' }} />
                                    <span>✅</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Sent</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivered to client</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Reminder Days — shown for all types except No due, when status is Sent */}
                        {nextType && form.status === 'Sent' && (
                            <div style={{ marginTop: 8 }}>
                                <div className="form-group">
                                    <label>Remind After (days) *</label>
                                    <input
                                        name="reminder_days"
                                        type="number"
                                        min="1"
                                        max="365"
                                        className="form-control"
                                        value={form.reminder_days}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. 7"
                                        style={{ maxWidth: 160 }}
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        Number of days after which the system will auto-remind
                                    </small>
                                </div>
                                <div style={{
                                    background: 'var(--primary-lighter)', padding: '10px 14px',
                                    borderRadius: 8, fontSize: '0.82rem', color: 'var(--primary)', marginTop: 8
                                }}>
                                    💡 After <strong>{form.reminder_days || '?'} days</strong>, the system will auto-remind to send <strong>{nextType}</strong> for this client.
                                </div>
                            </div>
                        )}

                        {form.doc_type === 'No due' && form.status === 'Sent' && (
                            <div style={{
                                background: 'var(--success-light)', padding: '10px 14px',
                                borderRadius: 8, fontSize: '0.82rem', color: '#047857', marginTop: 8
                            }}>
                                ✅ No due is the final step — no further reminders will be sent.
                            </div>
                        )}
                    </div>
                    <div className="form-card-footer">
                        <Link to="/documents" className="btn btn-outline">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? '⏳ Saving...' : isEdit ? 'Update Document' : 'Create Document'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
