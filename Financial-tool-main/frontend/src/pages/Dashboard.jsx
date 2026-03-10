import { useState, useEffect } from 'react';
import { api } from '../api';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Dashboard() {
    const now = new Date();
    const [selYear, setSelYear] = useState(now.getFullYear());
    const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadDashboard = () => {
        setLoading(true);
        api.getDashboard(selYear, selMonth).then(setData).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { loadDashboard(); }, [selYear, selMonth]);

    if (loading && !data) return <div className="empty-state"><p>Loading dashboard...</p></div>;
    if (!data) return <div className="empty-state"><p>Failed to load dashboard</p></div>;

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    const monthLabel = `${MONTH_NAMES[selMonth - 1]} ${selYear}`;

    const years = [];
    for (let y = 1990; y <= 2100; y++) years.push(y);

    const selectStyle = {
        appearance: 'none',
        WebkitAppearance: 'none',
        background: 'rgba(255,255,255,0.12)',
        border: '1.5px solid rgba(255,255,255,0.3)',
        color: '#fff',
        padding: '10px 36px 10px 16px',
        borderRadius: 12,
        fontSize: '0.9rem',
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
        outline: 'none',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        transition: 'all 0.25s ease',
    };

    return (
        <div className="animate-in">
            {/* Overdue Alert */}
            {data.overdue_documents > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e',
                    padding: '14px 20px', borderRadius: 14, marginBottom: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.88rem', fontWeight: 500, border: '1px solid #fbbf24',
                    boxShadow: '0 2px 12px rgba(251, 191, 36, 0.15)'
                }}>
                    <span>🔔 <strong>{data.overdue_documents}</strong> overdue document{data.overdue_documents > 1 ? 's' : ''} need{data.overdue_documents === 1 ? 's' : ''} follow-up</span>
                    <a href="/documents" style={{ color: '#92400e', fontWeight: 600, textDecoration: 'none', background: 'rgba(146, 64, 14, 0.1)', padding: '5px 14px', borderRadius: 8 }}>View →</a>
                </div>
            )}

            {/* ── Hero Profit Section ── */}
            <div style={{
                background: 'linear-gradient(135deg, #0F0035 0%, #1A0955 25%, #2D1B69 50%, #6247E5 80%, #8B6CF6 100%)',
                borderRadius: 24, padding: '32px 36px 28px', marginBottom: 28, color: '#fff',
                boxShadow: '0 16px 48px rgba(113, 95, 241, 0.3), 0 4px 12px rgba(0,0,0,0.1)',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Decorative Orbs */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,108,246,0.3) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(98,71,229,0.2) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', top: 20, left: '50%', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />
                {/* Subtle grid pattern */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 10px',
                                fontSize: '1.1rem', lineHeight: 1
                            }}>📊</div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                                {monthLabel}
                            </h2>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.55, fontWeight: 400 }}>
                            Financial overview • Select month & year to explore
                        </p>
                    </div>

                    {/* Glassmorphic Pickers */}
                    <div style={{
                        display: 'flex', gap: 10, background: 'rgba(255,255,255,0.06)',
                        padding: '8px 10px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.5, display: 'block', marginBottom: 3, paddingLeft: 2 }}>Month</label>
                            <select value={selMonth} onChange={e => setSelMonth(+e.target.value)} style={{ ...selectStyle, minWidth: 150 }}>
                                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1} style={{ color: '#1A0955', background: '#fff' }}>{m}</option>)}
                            </select>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.5, display: 'block', marginBottom: 3, paddingLeft: 2 }}>Year</label>
                            <select value={selYear} onChange={e => setSelYear(+e.target.value)} style={{ ...selectStyle, minWidth: 110 }}>
                                {years.map(y => <option key={y} value={y} style={{ color: '#1A0955', background: '#fff' }}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Profit Cards */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
                    marginTop: 28, position: 'relative', zIndex: 1
                }}>
                    <ProfitTile emoji="💰" label="Revenue" value={fmt(data.month_revenue)} accent="#60A5FA" />
                    <ProfitTile emoji="👥" label="Salaries" value={fmt(data.month_salaries)} accent="#FBBF24" />
                    <ProfitTile emoji="📋" label="Expenses" value={fmt(data.month_expenses)} accent="#F87171" />
                    <ProfitTile
                        emoji={data.month_net_profit >= 0 ? '📈' : '📉'}
                        label="Net Profit"
                        value={fmt(data.month_net_profit)}
                        accent={data.month_net_profit >= 0 ? '#34D399' : '#F87171'}
                        sub={`${data.month_margin || 0}% margin`}
                        highlight
                    />
                </div>
            </div>

            {/* ── Overview Stats ── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28
            }}>
                <OverviewCard icon="📁" label="Total Projects" value={data.active_projects} gradient="linear-gradient(135deg, #715FF1, #9B85FF)" />
                <OverviewCard icon="🏦" label="Outstanding" value={fmt(data.total_outstanding)} gradient="linear-gradient(135deg, #F59E0B, #FBBF24)" />
                <OverviewCard icon="👥" label="Employees" value={`${data.employees_paid_this_month || 0}/${data.total_employees || 0} paid`} gradient="linear-gradient(135deg, #10B981, #34D399)" />
                <OverviewCard icon="📄" label="Overdue Docs" value={data.overdue_documents || 0} gradient="linear-gradient(135deg, #7C53FF, #A78BFA)" />
            </div>

            {/* ── Recent Tables ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <TableCard title="💳 Recent Payments" empty="No recent payments">
                    {data.recent_payments?.length > 0 && (
                        <table className="data-table">
                            <thead><tr><th>Client</th><th>Project</th><th>Amount</th><th>Date</th></tr></thead>
                            <tbody>
                                {data.recent_payments.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 500 }}>{p.client_name}</td>
                                        <td>{p.project_name}</td>
                                        <td className="amount-positive">{fmt(p.paid_amount)}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </TableCard>

                <TableCard title="⏰ Upcoming Reminders" empty="No upcoming reminders">
                    {data.upcoming_reminders?.length > 0 && (
                        <table className="data-table">
                            <thead><tr><th>Description</th><th>Date</th><th>Time</th></tr></thead>
                            <tbody>
                                {data.upcoming_reminders.map((r) => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 500 }}>{r.description}</td>
                                        <td>{r.date}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{r.time || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </TableCard>
            </div>

            <TableCard title="🧾 Recent Expenses" empty="No recent expenses" style={{ marginTop: 20 }}>
                {data.recent_expenses?.length > 0 && (
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
                        <tbody>
                            {data.recent_expenses.map((e) => (
                                <tr key={e.id}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{e.date}</td>
                                    <td style={{ fontWeight: 500 }}>{e.description}</td>
                                    <td><span className="badge badge-pending">{e.category}</span></td>
                                    <td className="amount-negative">{fmt(e.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </TableCard>
        </div>
    );
}


/* ── Sub-components ── */

function ProfitTile({ emoji, label, value, accent, sub, highlight }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '20px 18px', textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative', overflow: 'hidden'
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.15)`;
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            }}
        >
            {/* Accent glow */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 3, borderRadius: 3, background: accent, opacity: 0.6 }} />
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.55, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: highlight ? '1.6rem' : '1.35rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</div>
            {sub && <div style={{ fontSize: '0.72rem', opacity: 0.45, marginTop: 6 }}>{sub}</div>}
        </div>
    );
}

function OverviewCard({ icon, label, value, gradient }) {
    return (
        <div style={{
            background: '#fff', borderRadius: 16, padding: '22px 20px',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
            display: 'flex', alignItems: 'center', gap: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative', overflow: 'hidden'
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
        >
            <div style={{
                width: 52, height: 52, borderRadius: 14, background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
        </div>
    );
}

function TableCard({ title, empty, children, style = {} }) {
    const hasData = children && children.props && children.props.children;
    return (
        <div className="card" style={{ borderRadius: 16, overflow: 'hidden', ...style }}>
            <div className="card-header" style={{
                borderBottom: '2px solid var(--primary-light)',
                background: 'var(--primary-lighter)',
                padding: '14px 20px'
            }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
            </div>
            <div className="card-body" style={{ padding: hasData ? 0 : undefined }}>
                {hasData ? children : <div className="empty-state"><p>{empty}</p></div>}
            </div>
        </div>
    );
}
