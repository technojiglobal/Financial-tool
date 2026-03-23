import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import EditSalaryModal from '../components/EditSalaryModal';
import ConfirmModal from '../components/ConfirmModal';

export default function EmployeeDetail() {
    const { empId } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(false);
    const [editPayment, setEditPayment] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({ amount_paid: '', payment_date: '', note: '' });
    const [editPaymentLoading, setEditPaymentLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const load = async () => {
        try {
            const emp = await api.getEmployee(empId);
            setEmployee(emp);
        } catch (err) {
            console.error(err);
            setEmployee({ _notFound: true });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [empId]);

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

    const getInitials = (name) => {
        const parts = (name || '').trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase();
        return 'U?';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return dateStr; }
    };

    const avatarColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
    const getColor = (id) => avatarColors[(id || 0) % avatarColors.length];

    const handleEditPayment = (sp) => {
        setEditPayment(sp);
        setEditPaymentForm({
            amount_paid: sp.amount_paid || '',
            payment_date: sp.payment_date || sp.date || '',
            note: sp.note || ''
        });
    };

    const handleSavePayment = async (e) => {
        e.preventDefault();
        setEditPaymentLoading(true);
        try {
            await api.updateSalaryPayment(editPayment.id, editPaymentForm);
            setEditPayment(null);
            load();
        } catch (err) { alert(err.message); }
        finally { setEditPaymentLoading(false); }
    };

    const handleDeletePayment = (sid) => {
        setConfirmModal({
            open: true, title: 'Delete Salary Payment', message: 'Delete this salary payment? This cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(m => ({ ...m, open: false }));
                try {
                    await api.deleteSalaryPayment(sid);
                    load();
                } catch (err) { alert(err.message); }
            }
        });
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
                    <div>Loading employee details...</div>
                </div>
            </div>
        );
    }

    if (!employee || employee._notFound) {
        return (
            <div className="animate-in">
                <div className="empty-state" style={{ marginTop: 60 }}>
                    <div className="empty-icon">⚠️</div>
                    <h3>Employee not found</h3>
                    <p>The employee you're looking for does not exist.</p>
                    <Link to="/salaries" className="btn btn-primary">Back to Salary Ledger</Link>
                </div>
            </div>
        );
    }

    const allPayments = (employee.salary_payments || []).sort((a, b) =>
        (b.payment_date || b.date || '').localeCompare(a.payment_date || a.date || '')
    );
    // Use the latest payment's base_salary as the current salary (dynamic)
    const latestPayment = allPayments.length > 0 ? allPayments[0] : null;
    const monthly = latestPayment ? Number(latestPayment.base_salary || latestPayment.processed_salary || 0) : 0;
    const totalPaid = allPayments.reduce((s, sp) => {
        if (sp.status === 'pending') return s;
        return s + Number(sp.amount_paid ?? 0);
    }, 0);

    // Helper: calculate pending for a single payment
    const calcPaymentPending = (sp) => {
        const processed = Number(sp.processed_salary ?? sp.amount_paid ?? 0);
        const paidAmt = Number(sp.amount_paid ?? 0);
        if (sp.status === 'pending') return processed;
        return Math.max(0, processed - paidAmt);
    };

    const totalPending = allPayments.reduce((sum, sp) => sum + calcPaymentPending(sp), 0);

    // Running balance for table display
    const chronological = [...allPayments].reverse();
    let runningPending = 0;
    const paymentsWithBalance = chronological.map(sp => {
        const paymentPending = calcPaymentPending(sp);
        runningPending += paymentPending;
        return { ...sp, pendingBalance: runningPending, paymentPending };
    }).reverse();

    return (
        <div className="animate-in">
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Link to="/salaries" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 38, height: 38, borderRadius: 10, background: 'var(--gray-100)',
                        color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '1.1rem',
                        transition: 'all 0.15s ease', border: '1px solid var(--gray-200)'
                    }}>←</Link>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Payment History</h2>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline" onClick={() => setEditModal(true)} style={{ fontSize: '0.85rem' }}>
                        ✏️ Edit Salary
                    </button>
                    <Link to={`/salaries/${employee.id}/pay`} className="btn btn-success" style={{ fontSize: '0.85rem' }}>
                        + Record Payment
                    </Link>
                    <button onClick={handlePrint} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                        🖨️ Print Receipt
                    </button>
                </div>
            </div>

            {/* Employee Info Card */}
            <div className="card" style={{ padding: '28px 32px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%', background: getColor(employee.id),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '1.15rem', flexShrink: 0
                        }}>{getInitials(employee.name)}</div>
                        <div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 2 }}>{employee.name}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    background: '#6366f1', color: '#fff', padding: '2px 10px',
                                    borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.3px'
                                }}>{employee.employee_code}</span>
                                {employee.role && <span style={{ color: 'var(--text-secondary)' }}>| &nbsp;{employee.role}</span>}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                        <span style={{
                            display: 'inline-block', padding: '4px 14px', borderRadius: 8,
                            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
                            background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0'
                        }}>Active Employee</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                {[
                    { label: 'Total Actual Salary', value: fmt(monthly), color: '#715FF1', bg: '#F0ECFF', icon: '🏦' },
                    { label: 'Total Paid', value: fmt(totalPaid), color: '#10B981', bg: '#D1FAE5', icon: '✅' },
                    { label: 'Current Pending', value: fmt(totalPending), color: totalPending > 0 ? '#EF4444' : '#10B981', bg: totalPending > 0 ? '#FEE2E2' : '#D1FAE5', icon: '📋' },
                ].map((c, i) => (
                    <div key={i} className="card" style={{
                        padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderTop: `3px solid ${c.color}`
                    }}>
                        <div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', marginBottom: 6 }}>{c.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: c.color }}>{c.value}</div>
                        </div>
                        <div style={{
                            width: 46, height: 46, borderRadius: 14, background: c.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
                        }}>{c.icon}</div>
                    </div>
                ))}
            </div>

            {/* Transaction History */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px 14px' }}>
                    <h3 style={{
                        margin: 0, fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.5px', color: 'var(--text-secondary)'
                    }}>Transaction History</h3>
                </div>

                {allPayments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>No payments recorded yet</div>
                        <div style={{ fontSize: '0.82rem' }}>Record a salary payment to see transaction history here.</div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Salary Month</th>
                                    <th>Payment Date</th>
                                    <th>Amount Paid</th>
                                    <th>Processed Salary</th>
                                    <th>Pending</th>
                                    <th>Payment Notes</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentsWithBalance.map(sp => {
                                    const formatMonth = (m) => {
                                        if (!m) return '—';
                                        try {
                                            const [y, mo] = m.split('-');
                                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                            return `${monthNames[parseInt(mo) - 1]} ${y}`;
                                        } catch { return m; }
                                    };
                                    return (
                                    <tr key={sp.id}>
                                        <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                            {formatMonth(sp.salary_month || sp.month)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📅</span>
                                                {formatDate(sp.payment_date || sp.date)}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#10B981', fontSize: '0.92rem' }}>{fmt(sp.amount_paid)}</td>
                                        <td style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.88rem' }}>{fmt(sp.processed_salary || sp.amount_paid)}</td>
                                        <td style={{ fontWeight: 600, color: sp.paymentPending > 0 ? '#EF4444' : '#10B981', fontSize: '0.88rem' }}>{fmt(sp.paymentPending)}</td>
                                        <td style={{
                                            fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 250,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            fontStyle: sp.note ? 'normal' : 'italic'
                                        }}>{sp.note || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                                                    title="Edit Payment"
                                                    onClick={() => handleEditPayment(sp)}
                                                >✏️</button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                                                    title="Delete Payment"
                                                    onClick={() => handleDeletePayment(sp.id)}
                                                >🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Employee Additional Info */}
            {(employee.department || employee.email || employee.phone || employee.date_joined || employee.employee_type) && (
                <div className="card" style={{ padding: '22px 26px', marginTop: 20 }}>
                    <h4 style={{
                        margin: '0 0 14px', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.5px', color: 'var(--text-secondary)'
                    }}>Employee Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px 24px' }}>
                        {[
                            { label: 'Department', value: employee.department },
                            { label: 'Employee Type', value: employee.employee_type },
                            { label: 'Email', value: employee.email },
                            { label: 'Phone', value: employee.phone },
                            { label: 'Date Joined', value: employee.date_joined ? formatDate(employee.date_joined) : null },
                            { label: 'Monthly Leaves', value: (employee.monthly_leaves != null && Number(employee.monthly_leaves) > 0) ? `${employee.monthly_leaves} days` : null },
                            { label: 'Yearly Leaves', value: (employee.yearly_leaves != null && Number(employee.yearly_leaves) > 0) ? `${employee.yearly_leaves} days` : null },
                        ].filter(f => f.value).map((f, i) => (
                            <div key={i}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', marginBottom: 3 }}>{f.label}</div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</div>
                            </div>
                        ))}
                    </div>


                    {/* Edit Payment Modal */}
                    {editPayment && (
                        <div style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                            animation: 'fadeIn 0.2s ease'
                        }} onClick={() => setEditPayment(null)}>
                            <div style={{
                                background: '#fff', borderRadius: 20, width: '90%', maxWidth: 480,
                                boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.25s ease',
                                overflow: 'hidden'
                            }} onClick={e => e.stopPropagation()}>
                                <div style={{ padding: '24px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Edit Payment</h3>
                                    <button onClick={() => setEditPayment(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                                </div>
                                <form onSubmit={handleSavePayment}>
                                    <div style={{ padding: '0 28px 24px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-secondary)', marginBottom: 6 }}>Amount Paid *</label>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                                                    <input type="number" min="1" step="any" className="form-control" style={{ paddingLeft: 32 }} value={editPaymentForm.amount_paid} onChange={e => setEditPaymentForm({ ...editPaymentForm, amount_paid: e.target.value })} required />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-secondary)', marginBottom: 6 }}>Payment Date *</label>
                                                <input type="date" className="form-control" value={editPaymentForm.payment_date} onChange={e => setEditPaymentForm({ ...editPaymentForm, payment_date: e.target.value })} required />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-secondary)', marginBottom: 6 }}>Payment Note</label>
                                            <textarea className="form-control" rows={2} value={editPaymentForm.note} onChange={e => setEditPaymentForm({ ...editPaymentForm, note: e.target.value })} placeholder="Optional payment note..." />
                                        </div>
                                    </div>
                                    <div style={{ padding: '14px 28px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                        <button type="button" className="btn btn-outline" onClick={() => setEditPayment(null)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={editPaymentLoading}>{editPaymentLoading ? 'Saving...' : 'Save Changes'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Salary Modal */}
            {editModal && (
                <EditSalaryModal
                    employee={employee}
                    onClose={() => setEditModal(false)}
                    onUpdated={load}
                />
            )}

            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(m => ({ ...m, open: false }))}
            />
        </div>
    );
}
