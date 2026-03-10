import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function SalaryForm() {
    const { empId } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [form, setForm] = useState({ payment_date: new Date().toISOString().split('T')[0], amount_paid: '', salary_month: new Date().toISOString().slice(0, 7), status: 'paid', note: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.getEmployees().then(employees => {
            const e = employees.find(e => e.id === +empId);
            if (e) setEmployee(e);
            else setEmployee({ _notFound: true });
        }).catch(() => setEmployee({ _notFound: true }));
    }, [empId]);

    if (employee && employee._notFound) {
        return (
            <div className="form-page">
                <div className="empty-state">
                    <div className="empty-icon">⚠️</div>
                    <h3>Employee not found</h3>
                    <p>The employee you're trying to pay does not exist.</p>
                    <Link to="/salaries" className="btn btn-primary">Back to Salaries</Link>
                </div>
            </div>
        );
    }

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.addSalaryPayment(empId, { ...form, month: form.salary_month, date: form.payment_date });
            navigate('/salaries');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="form-page">
            <div className="form-page-header">
                <div className="breadcrumb">
                    <Link to="/salaries">Salaries</Link>
                    <span className="separator">›</span>
                    <span>Pay Salary</span>
                </div>
                <h2>Record Salary Payment</h2>
                <p>Record a salary payment for this employee.</p>
            </div>

            {employee && (
                <div className="info-banner">
                    <span>👤</span>
                    <div>
                        <strong>{employee.name}</strong> ({employee.employee_code})<br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Monthly salary: <strong>{fmt(employee.salary_per_month)}</strong> &nbsp;|&nbsp; Total paid: <span style={{ color: 'var(--success)' }}>{fmt(employee.total_paid)}</span>
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
                                <label>Salary Month *</label>
                                <input type="month" className="form-control" value={form.salary_month} onChange={e => setForm({ ...form, salary_month: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Payment Date *</label>
                                <input type="date" className="form-control" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Amount Paid *</label>
                                <input type="number" min="1" step="any" className="form-control" value={form.amount_paid} onChange={e => setForm({ ...form, amount_paid: e.target.value })} required placeholder="e.g. 25000" />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Note</label>
                            <textarea className="form-control" rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Any comments about this payment..." />
                        </div>
                    </div>
                    <div className="form-card-footer">
                        <Link to="/salaries" className="btn btn-outline">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Record Payment'}</button>
                    </div>
                </div>
            </form>
        </div>
    );
}
