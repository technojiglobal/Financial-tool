import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export default function EditSalaryModal({ employee, onClose, onUpdated }) {
    const [form, setForm] = useState({
        salary_per_month: '',
        working_days: '22',
        salary_breakdown: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (employee) {
            setForm({
                salary_per_month: employee.salary_per_month || '',
                working_days: employee.working_days || '22',
                salary_breakdown: employee.salary_breakdown || ''
            });
        }
    }, [employee]);

    // Escape key to close
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!employee) return null;

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

    const totalPaid = Number(employee.total_paid || 0);
    const monthly = Number(employee.salary_per_month || 0);
    const pending = Math.max(0, monthly - totalPaid);

    const getInitials = (name) => {
        const parts = (name || '').trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase();
        return 'U?';
    };

    const avatarColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
    const getColor = (id) => avatarColors[(id || 0) % avatarColors.length];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Only send the fields the backend expects — avoid spreading salary_payments, _id, total_paid etc.
            await api.updateEmployee(employee.id, {
                name: employee.name,
                employee_code: employee.employee_code,
                email: employee.email || '',
                phone: employee.phone || '',
                role: employee.role || '',
                department: employee.department || '',
                employee_type: employee.employee_type || 'Full-time',
                date_joined: employee.date_joined || '',
                monthly_leaves: employee.monthly_leaves || 0,
                yearly_leaves: employee.yearly_leaves || 0,
                salary_per_month: form.salary_per_month,
                working_days: form.working_days,
                salary_breakdown: form.salary_breakdown
            });
            if (onUpdated) onUpdated();
            onClose();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.2s ease'
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: 20, width: '90%', maxWidth: 560,
                boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.25s ease',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '24px 28px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%', background: getColor(employee.id),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '0.85rem'
                        }}>{getInitials(employee.name)}</div>
                        <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>Edit Employee Salary</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.3px' }}>
                                {employee.name} • {employee.employee_code}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer',
                        color: 'var(--text-muted)', lineHeight: 1, padding: 4
                    }}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '0 28px 24px' }}>

                        {/* Current Paid / Pending boxes */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                            <div style={{
                                padding: '14px 18px', borderRadius: 12,
                                background: '#FFFBEB', border: '1px solid #FDE68A'
                            }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#D97706', marginBottom: 4 }}>Current Paid</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#D97706' }}>{fmt(totalPaid)}</div>
                            </div>
                            <div style={{
                                padding: '14px 18px', borderRadius: 12,
                                background: '#FEF2F2', border: '1px solid #FECACA'
                            }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#EF4444', marginBottom: 4 }}>Current Pending</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#EF4444' }}>{fmt(pending)}</div>
                            </div>
                        </div>

                        {/* Salary + Working Days row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-secondary)', marginBottom: 6 }}>Actual Monthly Salary</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                                    <input
                                        type="number" min="0" step="any"
                                        className="form-control" style={{ paddingLeft: 32 }}
                                        value={form.salary_per_month}
                                        onChange={e => setForm({ ...form, salary_per_month: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-secondary)', marginBottom: 6 }}>No. of Working Days</label>
                                <input
                                    type="number" min="1" max="31"
                                    className="form-control"
                                    value={form.working_days}
                                    onChange={e => setForm({ ...form, working_days: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Salary Breakdown */}
                        <div style={{ marginBottom: 4 }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-secondary)', marginBottom: 6 }}>Salary Structure (Breakdown)</label>
                            <textarea
                                className="form-control" rows={5}
                                value={form.salary_breakdown}
                                onChange={e => setForm({ ...form, salary_breakdown: e.target.value })}
                                placeholder={"Basic: 40000\nHRA: 15000\nSpecial Allowance: 10000\nConveyance: 10000"}
                                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.6 }}
                            />
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, display: 'block', fontStyle: 'italic' }}>
                                Enter each component on a new line for proper breakdown in payslips.
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '16px 28px', borderTop: '1px solid var(--gray-200)',
                        display: 'flex', justifyContent: 'flex-end', gap: 12
                    }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn" disabled={loading} style={{
                            background: '#EF4444', color: '#fff', border: 'none',
                            padding: '10px 28px', borderRadius: 10, fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                        }}>
                            {loading ? 'Updating...' : 'Update Salary'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
