import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Salaries() {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    // Month/Year picker
    const now = new Date();
    const [selMonth, setSelMonth] = useState(now.getMonth());
    const [selYear, setSelYear] = useState(now.getFullYear());
    const curMonth = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;

    // View payment history
    const [viewEmp, setViewEmp] = useState(null);

    const load = () => api.getEmployees().then(setEmployees).catch(console.error);
    useEffect(() => { load(); }, []);

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

    const handleDelete = (id) => {
        setConfirmModal({
            open: true, title: 'Delete Employee', message: 'Delete this employee and all salary records? This cannot be undone.',
            onConfirm: async () => { setConfirmModal(m => ({ ...m, open: false })); try { await api.deleteEmployee(id); load(); } catch (err) { alert(err.message); } }
        });
    };

    const handleDeleteSalary = (id) => {
        setConfirmModal({
            open: true, title: 'Delete Salary Payment', message: 'Delete this salary payment? This cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(m => ({ ...m, open: false }));
                try {
                    await api.deleteSalaryPayment(id);
                    const updated = await api.getEmployees();
                    setEmployees(updated);
                    if (viewEmp) {
                        const refreshed = updated.find(e => e.id === viewEmp.id);
                        setViewEmp(refreshed || null);
                    }
                } catch (err) { alert(err.message); }
            }
        });
    };

    const getInitials = (name) => {
        const parts = (name || '').split(' ');
        return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (name || 'U').slice(0, 2).toUpperCase();
    };

    const avatarColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
    const getColor = (id) => avatarColors[(id || 0) % avatarColors.length];

    // Per-employee calculations for the selected month
    const getEmpMonthData = (emp) => {
        const monthly = Number(emp.salary_per_month || 0);
        const payments = (emp.salary_payments || []).filter(sp => {
            const m = (sp.salary_month || sp.month || '').slice(0, 7);
            return m === curMonth;
        });
        const paid = payments.reduce((s, sp) => s + (sp.status === 'pending' ? 0 : Number(sp.amount_paid || 0)), 0);
        // Pending: if status="pending", full processed_salary is pending
        // If status="paid" but amount_paid < processed_salary, difference is pending
        const pending = payments.reduce((s, sp) => {
            const processed = (sp.processed_salary !== undefined && sp.processed_salary !== null) 
                ? Number(sp.processed_salary) 
                : monthly;
            const paidAmt = Number(sp.amount_paid || 0);
            if (sp.status === 'pending') return s + processed;
            if (processed > 0) return s + Math.max(0, processed - paidAmt);
            return s;
        }, 0);
        // Get attendance info from the latest payment for this month
        const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;
        const daysWorked = latestPayment ? Number(latestPayment.days_attended || 0) : null;
        const totalWorkingDays = latestPayment ? Number(latestPayment.total_working_days || 0) : null;
        return { monthly, paid, pending, payments, daysWorked, totalWorkingDays };
    };

    // Filter + search
    const filteredEmployees = employees.filter(emp => {
        const { pending, payments } = getEmpMonthData(emp);
        if (filter === 'fully_paid' && !(pending === 0 && payments.length > 0)) return false;
        if (filter === 'pending' && !(pending > 0)) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!(emp.name || '').toLowerCase().includes(q) && !(emp.employee_code || '').toLowerCase().includes(q)) return false;
        }
        return true;
    });

    // Summary stats
    const totalActual = employees.reduce((s, e) => s + Number(e.salary_per_month || 0), 0);
    const totalPaid = employees.reduce((s, e) => s + getEmpMonthData(e).paid, 0);
    const totalPending = employees.reduce((s, e) => s + getEmpMonthData(e).pending, 0);

    // Years range
    const years = [];
    for (let y = 1990; y <= 2100; y++) years.push(y);

    return (
        <div className="animate-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Comprehensive Salary Ledger</h2>
                <Link to="/salaries/new" className="btn btn-primary">+ Add Employee</Link>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Total Employees', value: employees.length, icon: '👥', color: '#6366f1', bg: '#EEF2FF' },
                    { label: 'Total Actual Salary', value: fmt(totalActual), icon: '🏦', color: '#715FF1', bg: '#F0ECFF' },
                    { label: 'Total Salary Paid', value: fmt(totalPaid), icon: '✅', color: '#10B981', bg: '#D1FAE5' },
                    { label: 'Total Pending Amount', value: fmt(totalPending), icon: '📋', color: '#EF4444', bg: '#FEE2E2' },
                ].map((c, i) => (
                    <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `3px solid ${c.color}` }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px', marginBottom: 4 }}>{c.label}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: c.color }}>{c.value}</div>
                        </div>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{c.icon}</div>
                    </div>
                ))}
            </div>

            {/* Controls: Search + Month/Year + Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>🔍</span>
                    <input className="form-control" style={{ paddingLeft: 36 }} placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Month/Year */}
                <div style={{ display: 'flex', gap: 6 }}>
                    <select className="form-control" style={{ width: 'auto', minWidth: 130 }} value={selMonth} onChange={e => setSelMonth(+e.target.value)}>
                        {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select className="form-control" style={{ width: 'auto', minWidth: 90 }} value={selYear} onChange={e => setSelYear(+e.target.value)}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    {[['all', 'All'], ['fully_paid', 'Fully Paid'], ['pending', 'Pending']].map(([key, label]) => (
                        <button key={key} className={`filter-tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
                    ))}
                </div>
            </div>

            {/* Salary Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Role</th>
                                <th>Days Worked</th>
                                <th>Actual Salary</th>
                                <th>Paid Salary</th>
                                <th>Pending Salary</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr><td colSpan={7}>
                                    <div className="empty-state">
                                        <div className="empty-icon">👥</div>
                                        <h3>No employees found</h3>
                                        <p>{search ? 'Try a different search term.' : 'Add your first employee to start tracking salaries.'}</p>
                                    </div>
                                </td></tr>
                            ) : filteredEmployees.map(emp => {
                                const { monthly, paid, pending, daysWorked, totalWorkingDays } = getEmpMonthData(emp);
                                return (
                                    <tr key={emp.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%', background: getColor(emp.id),
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                                                }}>{getInitials(emp.name)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{emp.name}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emp.employee_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{emp.role || emp.department || '—'}</td>
                                        <td style={{ fontSize: '0.85rem', fontWeight: 600, color: daysWorked !== null ? (daysWorked < totalWorkingDays ? '#F59E0B' : '#10B981') : 'var(--text-muted)' }}>
                                            {daysWorked !== null ? `${daysWorked} / ${totalWorkingDays}` : '—'}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{fmt(monthly)}</td>
                                        <td style={{ fontWeight: 600, color: '#10B981' }}>{fmt(paid)}</td>
                                        <td style={{ fontWeight: 600, color: pending > 0 ? '#EF4444' : '#10B981' }}>{fmt(pending)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <Link to={`/salaries/${emp.id}/details`} className="btn btn-sm btn-outline" title="View History" style={{ padding: '4px 8px' }}>👁️</Link>
                                                <Link to={`/salaries/${emp.id}/edit`} className="btn btn-sm btn-secondary" title="Edit" style={{ padding: '4px 8px' }}>✏️</Link>
                                                <Link to={`/salaries/${emp.id}/pay`} className="btn btn-sm btn-success" title="Pay Salary" style={{ padding: '4px 8px', fontSize: '0.85rem' }}>+</Link>
                                                <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(emp.id)} style={{ padding: '4px 8px' }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing {filteredEmployees.length} of {employees.length} employees · {MONTH_NAMES[selMonth]} {selYear}
            </div>

            {/* Payment History Modal */}
            {viewEmp && (() => {
                const { monthly, paid, pending, payments } = getEmpMonthData(viewEmp);
                const allPayments = (viewEmp.salary_payments || []).sort((a, b) => (b.date || b.payment_date || '').localeCompare(a.date || a.payment_date || ''));
                const totalAllPaid = allPayments.reduce((s, sp) => s + (sp.status === 'pending' ? 0 : Number(sp.amount_paid || 0)), 0);
                const totalAllPending = allPayments.reduce((s, sp) => {
                    const processed = (sp.processed_salary !== undefined && sp.processed_salary !== null) 
                        ? Number(sp.processed_salary) 
                        : Number(viewEmp.salary_per_month || 0);
                    const paidAmt = Number(sp.amount_paid || 0);
                    if (sp.status === 'pending') return s + processed;
                    if (processed > 0) return s + Math.max(0, processed - paidAmt);
                    return s;
                }, 0);

                const formatMonth = (m) => {
                    if (!m) return '—';
                    try {
                        const [y, mo] = m.split('-');
                        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${mNames[parseInt(mo) - 1]} ${y}`;
                    } catch { return m; }
                };

                return (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.2s ease'
                    }} onClick={() => setViewEmp(null)}>
                        <div style={{
                            background: '#fff', borderRadius: 20, width: '90%', maxWidth: 720, maxHeight: '85vh', overflow: 'auto',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.25s ease'
                        }} onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--gray-200)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: '50%', background: getColor(viewEmp.id),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontWeight: 700, fontSize: '0.95rem'
                                        }}>{getInitials(viewEmp.name)}</div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Payment History</h3>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {viewEmp.name} · {viewEmp.employee_code} {viewEmp.role ? ` · ${viewEmp.role}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setViewEmp(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                                </div>
                            </div>

                            {/* Summary */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '20px 28px' }}>
                                {[
                                    { label: 'Total Actual Salary', value: fmt(monthly), color: '#715FF1', icon: '🏦' },
                                    { label: 'Total Paid', value: fmt(totalAllPaid), color: '#10B981', icon: '✅' },
                                    { label: 'Current Pending', value: fmt(totalAllPending), color: totalAllPending > 0 ? '#EF4444' : '#10B981', icon: '📋' },
                                ].map((c, i) => (
                                    <div key={i} style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.3px', marginBottom: 4 }}>{c.label}</div>
                                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: c.color }}>{c.value}</div>
                                        </div>
                                        <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Transaction History */}
                            <div style={{ padding: '0 28px 24px' }}>
                                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 12 }}>Transaction History</h4>

                                {allPayments.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payments recorded yet</div>
                                ) : (
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Salary Month</th>
                                                    <th>Payment Date</th>
                                                    <th>Amount Paid</th>
                                                    <th>Payment Notes</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allPayments.map(sp => (
                                                    <tr key={sp.id}>
                                                        <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                            {formatMonth(sp.salary_month || sp.month)}
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>
                                                            📅 {sp.payment_date || sp.date || '—'}
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: '#10B981' }}>{fmt(sp.amount_paid)}</td>
                                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.note || '—'}</td>
                                                        <td>
                                                            <button className="btn btn-sm btn-danger" style={{ padding: '2px 8px' }} onClick={() => handleDeleteSalary(sp.id)}>🗑️</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

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
