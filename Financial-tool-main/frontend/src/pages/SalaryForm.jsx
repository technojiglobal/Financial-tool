import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function SalaryForm() {
    const { empId } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [form, setForm] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        amount_paid: '',
        salary_month: new Date().toISOString().slice(0, 7),
        total_working_days: '22',
        days_attended: '22',
        status: 'paid',
        note: ''
    });
    const [loading, setLoading] = useState(false);
    const manualAmount = useRef(false); // track if user manually edited amount

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

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

    // Compute processed salary based on attendance
    const baseSalary = Number(employee?.salary_per_month || 0);
    const totalDays = Math.max(1, Number(form.total_working_days) || 1);
    const daysAttended = Math.min(totalDays, Math.max(0, Number(form.days_attended) || 0));
    const perDaySalary = baseSalary / totalDays;
    const processedSalary = Math.round(perDaySalary * daysAttended * 100) / 100;
    const absentDays = totalDays - daysAttended;
    const deduction = Math.round((baseSalary - processedSalary) * 100) / 100;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.addSalaryPayment(empId, {
                ...form,
                month: form.salary_month,
                date: form.payment_date,
                total_working_days: form.total_working_days,
                days_attended: form.days_attended,
                processed_salary: processedSalary
            });
            navigate('/salaries');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    // Auto-fill amount when days change (only if user hasn't manually edited the amount)
    const handleDaysChange = (key, val) => {
        const newForm = { ...form, [key]: val };
        const newTotalDays = Math.max(1, Number(key === 'total_working_days' ? val : newForm.total_working_days) || 1);
        const newDaysAttended = Math.min(newTotalDays, Math.max(0, Number(key === 'days_attended' ? val : newForm.days_attended) || 0));
        const newProcessed = Math.round((baseSalary / newTotalDays) * newDaysAttended * 100) / 100;
        // Only auto-fill amount if user hasn't manually edited it, and status is not pending
        if (!manualAmount.current && newForm.status !== 'pending') {
            newForm.amount_paid = String(newProcessed);
        }
        setForm(newForm);
    };

    // Handle manual amount change
    const handleAmountChange = (val) => {
        manualAmount.current = true; // user is now manually controlling the amount
        setForm({ ...form, amount_paid: val });
    };

    // Compute pending for this payment
    const amountPaid = Number(form.amount_paid || 0);
    const paymentPending = form.status === 'pending'
        ? processedSalary
        : Math.max(0, processedSalary - amountPaid);

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
                            Base monthly salary: <strong>{fmt(employee.salary_per_month)}</strong> &nbsp;|&nbsp; Total paid: <span style={{ color: 'var(--success)' }}>{fmt(employee.total_paid)}</span>
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

                        {/* Attendance Section */}
                        <div className="form-section-title" style={{ marginTop: 24 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', marginRight: 8 }}></span>
                            Attendance Details
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Total Working Days *</label>
                                <input type="number" min="1" max="31" className="form-control" value={form.total_working_days}
                                    onChange={e => handleDaysChange('total_working_days', e.target.value)} required placeholder="e.g. 22" />
                            </div>
                            <div className="form-group">
                                <label>Days Employee Attended *</label>
                                <input type="number" min="0" max={form.total_working_days || 31} className="form-control" value={form.days_attended}
                                    onChange={e => handleDaysChange('days_attended', e.target.value)} required placeholder="e.g. 20" />
                            </div>
                        </div>

                        {/* Salary Calculation Summary */}
                        {employee && (
                            <div style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                border: '1px solid #bae6fd', borderRadius: 12,
                                padding: '16px 20px', marginBottom: 20, marginTop: 4
                            }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0369a1', marginBottom: 10 }}>
                                    💰 Salary Calculation
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 20px', fontSize: '0.84rem' }}>
                                    <div style={{ color: 'var(--text-secondary)' }}>
                                        Per Day Salary: <strong style={{ color: '#0369a1' }}>{fmt(perDaySalary)}</strong>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>
                                        Days Attended: <strong>{daysAttended}</strong> / {totalDays}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>
                                        Processed Salary: <strong style={{ color: '#059669', fontSize: '1rem' }}>{fmt(processedSalary)}</strong>
                                    </div>
                                    {absentDays > 0 && (
                                        <div style={{ color: '#dc2626' }}>
                                            Absence Deduction ({absentDays} day{absentDays > 1 ? 's' : ''}): <strong>-{fmt(deduction)}</strong>
                                        </div>
                                    )}
                                </div>
                                {absentDays > 0 && (
                                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 8, fontStyle: 'italic' }}>
                                        ℹ️ Absence deduction is not added to pending amount. Only unpaid processed salary is tracked as pending.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label>Amount Paid {form.status !== 'pending' ? '*' : ''}</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                                    <input type="number" min="0" step="any" className="form-control" style={{ paddingLeft: 32, opacity: form.status === 'pending' ? 0.5 : 1 }}
                                        value={form.amount_paid} onChange={e => handleAmountChange(e.target.value)}
                                        required={form.status !== 'pending'} disabled={form.status === 'pending'} placeholder="e.g. 25000" />
                                </div>
                                {form.status === 'pending' && (
                                    <span style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: 4, display: 'block' }}>
                                        ℹ️ Amount is ₹0 because status is set to Pending. Processed salary ({fmt(processedSalary)}) will be added to pending.
                                    </span>
                                )}
                                {form.status !== 'pending' && processedSalary > 0 && amountPaid < processedSalary && amountPaid > 0 && (
                                    <span style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4, display: 'block' }}>
                                        ⚠️ Paying {fmt(amountPaid)} is less than processed salary {fmt(processedSalary)}. The difference (<strong>{fmt(paymentPending)}</strong>) will be added to pending.
                                    </span>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select className="form-control" value={form.status} onChange={e => {
                                    const newStatus = e.target.value;
                                    manualAmount.current = false; // reset manual flag on status change
                                    setForm(f => ({
                                        ...f,
                                        status: newStatus,
                                        amount_paid: newStatus === 'pending' ? '0' : String(processedSalary)
                                    }));
                                }}>
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
