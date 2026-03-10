import { useState, useEffect } from 'react';
import { api } from '../api';

const fmt = (n) => `₹${(+n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split('T')[0];

const STATUS_COLORS = {
    Paid: { bg: '#dcfce7', color: '#16a34a' },
    Partial: { bg: '#fef9c3', color: '#ca8a04' },
    Overdue: { bg: '#fee2e2', color: '#dc2626' },
    Pending: { bg: '#dbeafe', color: '#2563eb' },
};

export default function DebtLedger() {
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState('');

    // Modal states
    const [viewDebt, setViewDebt] = useState(null);
    const [editDebt, setEditDebt] = useState(null); // null = closed, {} = new, {...} = editing
    const [payDebt, setPayDebt] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmDeletePayment, setConfirmDeletePayment] = useState(null);

    // Form states
    const [debtForm, setDebtForm] = useState({});
    const [payForm, setPayForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const load = async () => {
        try {
            setLoading(true);
            const data = await api.getDebts();
            setDebts(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = debts.filter(d => {
        const q = search.toLowerCase();
        const matchSearch = !q || d.pay_to?.toLowerCase().includes(q) || d.reason?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q);
        const matchMonth = !monthFilter || d.date?.startsWith(monthFilter);
        return matchSearch && matchMonth;
    });

    // Summary stats
    const totalDebts = debts.length;
    const totalAmount = debts.reduce((s, d) => s + (d.total_amount || 0), 0);
    const totalPaid = debts.reduce((s, d) => s + (d.paid_amount || 0), 0);
    const totalPending = debts.reduce((s, d) => s + (d.pending_amount || 0), 0);

    // Month options
    const months = [...new Set(debts.map(d => d.date?.slice(0, 7)).filter(Boolean))].sort().reverse();

    // ---- Handlers ----
    const openAdd = () => {
        setDebtForm({ date: today(), due_date: '', interest: 0 });
        setEditDebt({});
        setFormError('');
    };
    const openEdit = (d) => {
        setDebtForm({ ...d });
        setEditDebt(d);
        setFormError('');
    };
    const saveDebt = async () => {
        setFormError('');
        if (!debtForm.pay_to?.trim()) return setFormError('Pay To is required');
        if (!debtForm.total_amount || +debtForm.total_amount <= 0) return setFormError('Total amount must be > 0');
        setSaving(true);
        try {
            if (editDebt.id) {
                await api.updateDebt(editDebt.id, debtForm);
            } else {
                await api.createDebt(debtForm);
            }
            setEditDebt(null);
            await load();
        } catch (e) {
            setFormError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteDebt = async () => {
        setSaving(true);
        try {
            await api.deleteDebt(confirmDelete.id);
            setConfirmDelete(null);
            await load();
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const openPay = (d) => {
        setPayDebt(d);
        setPayForm({ amount: '', date: today(), interest: d.interest || 0, description: '' });
        setFormError('');
    };
    const savePayment = async () => {
        setFormError('');
        if (!payForm.amount || +payForm.amount <= 0) return setFormError('Amount must be > 0');
        setSaving(true);
        try {
            await api.addDebtPayment(payDebt.id, payForm);
            setPayDebt(null);
            if (viewDebt) {
                const updated = await api.getDebts();
                const fresh = updated.find(d => d.id === viewDebt.id);
                if (fresh) setViewDebt(fresh);
                setDebts(updated);
            } else {
                await load();
            }
        } catch (e) {
            setFormError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const deletePayment = async () => {
        setSaving(true);
        try {
            await api.deleteDebtPayment(confirmDeletePayment.id);
            setConfirmDeletePayment(null);
            const updated = await api.getDebts();
            if (viewDebt) {
                const fresh = updated.find(d => d.id === viewDebt.id);
                if (fresh) setViewDebt(fresh);
            }
            setDebts(updated);
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary, #1e293b)' }}>
                Debt Ledger Overview
            </h1>

            {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { icon: '💳', label: 'Total Debts', value: totalDebts, plain: true },
                    { icon: '📋', label: 'Total Amount', value: fmt(totalAmount) },
                    { icon: '✅', label: 'Total Paid', value: fmt(totalPaid), green: true },
                    { icon: '⏳', label: 'Total Pending', value: fmt(totalPending), orange: true },
                ].map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: c.green ? '#16a34a' : c.orange ? '#d97706' : '#1e293b' }}>
                            {c.plain ? c.value : c.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
                <input
                    placeholder="🔍 Search person or company..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}
                />
                <select
                    value={monthFilter}
                    onChange={e => setMonthFilter(e.target.value)}
                    style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}
                >
                    <option value="">All Months</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button
                    onClick={openAdd}
                    style={{ padding: '10px 20px', background: 'var(--primary, #6366f1)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                    + Add Debt
                </button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No debts found.{!debts.length && ' Click "+ Add Debt" to get started.'}</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['DATE', 'PAY TO', 'REASON', 'TOTAL AMOUNT', 'RECURRING INTEREST', 'PAID', 'PENDING', 'DUE DATE', 'STATUS', 'ACTIONS'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((d, i) => {
                                const sc = STATUS_COLORS[d.status] || STATUS_COLORS.Pending;
                                return (
                                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '14px 16px', color: '#475569' }}>{d.date || '—'}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{d.pay_to}</div>
                                            {d.email && <div style={{ fontSize: 12, color: '#94a3b8' }}>{d.email}</div>}
                                            {d.phone && <div style={{ fontSize: 12, color: '#94a3b8' }}>{d.phone}</div>}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#475569' }}>{d.reason || '—'}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{fmt(d.total_amount)}</td>
                                        <td style={{ padding: '14px 16px', color: '#475569' }}>{d.interest || 0}</td>
                                        <td style={{ padding: '14px 16px', color: '#16a34a', fontWeight: 600 }}>{fmt(d.paid_amount)}</td>
                                        <td style={{ padding: '14px 16px', color: d.pending_amount > 0 ? '#d97706' : '#16a34a', fontWeight: 600 }}>{fmt(d.pending_amount)}</td>
                                        <td style={{ padding: '14px 16px', color: '#475569' }}>{d.due_date || '—'}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>{d.status}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button title="View Details" onClick={() => setViewDebt(d)} style={iconBtn('#6366f1')}>👁</button>
                                                <button title="Edit" onClick={() => openEdit(d)} style={iconBtn('#3b82f6')}>✏️</button>
                                                <button title="Add Payment" onClick={() => openPay(d)} style={iconBtn('#16a34a')}>➕</button>
                                                <button title="Delete" onClick={() => setConfirmDelete(d)} style={iconBtn('#ef4444')}>🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <div style={{ padding: '12px 0', color: '#64748b', fontSize: 13 }}>
                Showing {filtered.length} of {debts.length} entries
            </div>

            {/* ========== DEBT DETAILS MODAL ========== */}
            {viewDebt && (
                <Modal onClose={() => setViewDebt(null)} title="Debt Details" subtitle={`Case ID: #DL-${String(viewDebt.id).padStart(5, '0')}-${viewDebt.pay_to?.slice(0, 2).toUpperCase()}`}>
                    <Section icon="👤" title="Person Details">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Field label="NAME" value={viewDebt.pay_to} />
                            <Field label="EMAIL" value={viewDebt.email} />
                            <Field label="PHONE NUMBER" value={viewDebt.phone} />
                            <Field label="REASON" value={viewDebt.reason} />
                        </div>
                        {viewDebt.description && <Field label="DESCRIPTION" value={viewDebt.description} style={{ marginTop: 12 }} />}
                    </Section>
                    <Section icon="💰" title="Debt Summary">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            <SummaryCard label="TOTAL AMOUNT" value={fmt(viewDebt.total_amount)} />
                            <SummaryCard label="PAID AMOUNT" value={fmt(viewDebt.paid_amount)} color="#16a34a" bg="#dcfce7" />
                            <SummaryCard label="PENDING" value={fmt(viewDebt.pending_amount)} color="#d97706" bg="#fef9c3" />
                            <div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>DUE DATE</div>
                                <div style={{ fontWeight: 700 }}>{viewDebt.due_date || '—'}</div>
                                <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[viewDebt.status]?.bg, color: STATUS_COLORS[viewDebt.status]?.color }}>{viewDebt.status}</span>
                            </div>
                        </div>
                    </Section>
                    <Section icon="🔄" title="Transaction History">
                        {(!viewDebt.payments || viewDebt.payments.length === 0) ? (
                            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No payments recorded yet.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        {['DATE', 'PAYMENT AMOUNT', 'DESCRIPTION', 'RECURRING INTEREST', 'DUE DATE', 'ACTION'].map(h => (
                                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewDebt.payments.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 12px', color: '#475569' }}>{p.date}</td>
                                            <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 700 }}>{fmt(p.amount)}</td>
                                            <td style={{ padding: '10px 12px', color: '#475569' }}>{p.description || '—'}</td>
                                            <td style={{ padding: '10px 12px', color: '#475569' }}>{p.interest || '—'}</td>
                                            <td style={{ padding: '10px 12px', color: '#475569' }}>{p.due_date || '—'}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <button onClick={() => setConfirmDeletePayment(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <button
                            onClick={() => openPay(viewDebt)}
                            style={{ marginTop: 12, padding: '8px 16px', background: 'var(--primary, #6366f1)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >
                            + Add Payment
                        </button>
                    </Section>
                </Modal>
            )}

            {/* ========== ADD / EDIT DEBT MODAL ========== */}
            {editDebt !== null && (
                <Modal onClose={() => setEditDebt(null)} title={editDebt.id ? 'Edit Debt' : 'Add Debt'}>
                    {formError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{formError}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <FormField label="Pay To" required>
                            <input value={debtForm.pay_to || ''} onChange={e => setDebtForm(f => ({ ...f, pay_to: e.target.value }))} placeholder="Company or Person name" style={inputStyle} />
                        </FormField>
                        <FormField label="Total Amount" required>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                <span style={{ padding: '10px 12px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', color: '#64748b' }}>₹</span>
                                <input type="number" min="0" value={debtForm.total_amount || ''} onChange={e => setDebtForm(f => ({ ...f, total_amount: e.target.value }))} style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }} />
                            </div>
                        </FormField>
                        <FormField label="Recurring Interest">
                            <input type="number" min="0" step="0.01" value={debtForm.interest || ''} onChange={e => setDebtForm(f => ({ ...f, interest: e.target.value }))} style={inputStyle} placeholder="0.00" />
                        </FormField>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <FormField label="Date">
                                <input type="date" value={debtForm.date || ''} onChange={e => setDebtForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                            </FormField>
                            <FormField label="Due Date">
                                <input type="date" value={debtForm.due_date || ''} onChange={e => setDebtForm(f => ({ ...f, due_date: e.target.value }))} style={inputStyle} />
                            </FormField>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <FormField label="Email Address">
                                <input type="email" value={debtForm.email || ''} onChange={e => setDebtForm(f => ({ ...f, email: e.target.value }))} placeholder="billing@company.com" style={inputStyle} />
                            </FormField>
                            <FormField label="Phone Number">
                                <input value={debtForm.phone || ''} onChange={e => setDebtForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" style={inputStyle} />
                            </FormField>
                        </div>
                        <FormField label="Reason">
                            <input value={debtForm.reason || ''} onChange={e => setDebtForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Office supply replenishment" style={inputStyle} />
                        </FormField>
                        <FormField label="Description">
                            <textarea value={debtForm.description || ''} onChange={e => setDebtForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details about the debt..." style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
                        </FormField>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                        <button onClick={() => setEditDebt(null)} style={cancelBtn}>Cancel</button>
                        <button onClick={saveDebt} disabled={saving} style={primaryBtn}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </Modal>
            )}

            {/* ========== ADD PAYMENT MODAL ========== */}
            {payDebt && (
                <Modal onClose={() => setPayDebt(null)} title="Add Payment">
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 24, marginBottom: 16, fontSize: 13 }}>
                        <div><span style={{ color: '#64748b' }}>PAY TO </span><strong>{payDebt.pay_to}</strong></div>
                        <div><span style={{ color: '#64748b' }}>TOTAL AMOUNT </span><strong>{fmt(payDebt.total_amount)}</strong></div>
                        <div><span style={{ color: '#64748b' }}>PENDING </span><strong style={{ color: '#d97706' }}>{fmt(payDebt.pending_amount)}</strong></div>
                    </div>
                    {formError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{formError}</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <FormField label="Payment Amount" required>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                    <span style={{ padding: '10px 12px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', color: '#64748b' }}>₹</span>
                                    <input type="number" min="0" value={payForm.amount || ''} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }} />
                                </div>
                            </FormField>
                            <FormField label="Payment Date">
                                <input type="date" value={payForm.date || ''} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                            </FormField>
                        </div>
                        <FormField label="Recurring Interest">
                            <input type="number" min="0" step="0.01" value={payForm.interest || ''} onChange={e => setPayForm(f => ({ ...f, interest: e.target.value }))} style={inputStyle} placeholder="5.00" />
                        </FormField>
                        <FormField label="Description / Notes">
                            <textarea value={payForm.description || ''} onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))} placeholder="Add any details about this transaction..." style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
                        </FormField>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                        <button onClick={() => setPayDebt(null)} style={cancelBtn}>Cancel</button>
                        <button onClick={savePayment} disabled={saving} style={primaryBtn}>{saving ? 'Saving...' : 'Save Payment'}</button>
                    </div>
                </Modal>
            )}

            {/* ========== CONFIRM DELETE DEBT ========== */}
            {confirmDelete && (
                <Modal onClose={() => setConfirmDelete(null)} title="Delete Debt">
                    <p style={{ color: '#475569', marginBottom: 20 }}>
                        Are you sure you want to delete the debt for <strong>{confirmDelete.pay_to}</strong>? This will also delete all payment records.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button onClick={() => setConfirmDelete(null)} style={cancelBtn}>Cancel</button>
                        <button onClick={deleteDebt} disabled={saving} style={{ ...primaryBtn, background: '#ef4444' }}>{saving ? 'Deleting...' : 'Delete'}</button>
                    </div>
                </Modal>
            )}

            {/* ========== CONFIRM DELETE PAYMENT ========== */}
            {confirmDeletePayment && (
                <Modal onClose={() => setConfirmDeletePayment(null)} title="Delete Payment">
                    <p style={{ color: '#475569', marginBottom: 20 }}>
                        Delete payment of <strong>{fmt(confirmDeletePayment.amount)}</strong>? This cannot be undone.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button onClick={() => setConfirmDeletePayment(null)} style={cancelBtn}>Cancel</button>
                        <button onClick={deletePayment} disabled={saving} style={{ ...primaryBtn, background: '#ef4444' }}>{saving ? 'Deleting...' : 'Delete'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ---- Helper Components ----
function Modal({ onClose, title, subtitle, children }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{title}</h2>
                        {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ padding: '20px 24px' }}>{children}</div>
            </div>
        </div>
    );
}

function Section({ icon, title, children }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
                <span>{icon}</span>{title}
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>{children}</div>
        </div>
    );
}

function Field({ label, value, style }) {
    return (
        <div style={style}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ color: '#1e293b', fontWeight: 500 }}>{value || '—'}</div>
        </div>
    );
}

function SummaryCard({ label, value, color = '#1e293b', bg = '#fff' }) {
    return (
        <div style={{ background: bg, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
        </div>
    );
}

function FormField({ label, required, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            {children}
        </div>
    );
}

// ---- Style helpers ----
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' };
const primaryBtn = { padding: '10px 24px', background: 'var(--primary, #6366f1)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const cancelBtn = { padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const iconBtn = (color) => ({ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.8, padding: 4 });
