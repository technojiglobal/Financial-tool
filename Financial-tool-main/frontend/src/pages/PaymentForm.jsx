import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function PaymentForm() {
    const { projectId, paymentId } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(paymentId);
    const [project, setProject] = useState(null);
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], paid_amount: '', note: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.getProjects().then(projects => {
            if (isEdit) {
                // Find the project that contains this payment
                for (const p of projects) {
                    const pay = (p.payments || []).find(py => py.id === +paymentId);
                    if (pay) {
                        setProject(p);
                        setForm({ date: pay.date || '', paid_amount: pay.paid_amount || '', note: pay.note || '' });
                        break;
                    }
                }
            } else {
                const p = projects.find(p => p.id === +projectId);
                if (p) setProject(p);
            }
        });
    }, [projectId, paymentId, isEdit]);

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await api.updatePayment(paymentId, form);
            } else {
                await api.addPayment(projectId, form);
            }
            navigate('/payments');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="form-page">
            <div className="form-page-header">
                <div className="breadcrumb">
                    <Link to="/payments">Client Payments</Link>
                    <span className="separator">›</span>
                    <span>{isEdit ? 'Edit Payment' : 'Record Payment'}</span>
                </div>
                <h2>{isEdit ? 'Edit Payment' : 'Record Payment'}</h2>
                <p>{isEdit ? 'Update the payment details below.' : 'Add a new payment for this project.'}</p>
            </div>

            {project && (
                <div className="info-banner">
                    <span>💳</span>
                    <div>
                        <strong>{project.project_name}</strong> — {project.client_name}<br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Total: {fmt(project.total_amount)} &nbsp;|&nbsp; Paid: <span style={{ color: 'var(--success)' }}>{fmt(project.total_paid)}</span> &nbsp;|&nbsp; Balance: <span style={{ color: 'var(--danger)' }}>{fmt(project.balance)}</span>
                        </span>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-card-body">
                        <div className="form-section-title">Payment Details</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Payment Date *</label>
                                <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Amount Paid *</label>
                                <input type="number" min="1" step="any" className="form-control" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })} required placeholder="e.g. 10000" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Note</label>
                            <textarea className="form-control" rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Payment method, reference number, etc." />
                        </div>
                    </div>
                    <div className="form-card-footer">
                        <Link to="/payments" className="btn btn-outline">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Payment' : 'Record Payment'}</button>
                    </div>
                </div>
            </form>
        </div>
    );
}
