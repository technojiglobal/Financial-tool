import { useState, useEffect } from 'react';
import { api } from '../api';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Profit() {
    const now = new Date();
    const [period, setPeriod] = useState('monthly');
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Year range: 1990 to 2100
    const years = [];
    for (let y = 1990; y <= 2100; y++) years.push(y);

    const load = () => {
        setLoading(true);
        api.getProfit(period, year).then(setData).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, [period, year]);

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const totals = data?.data?.reduce((acc, d) => ({
        income: acc.income + d.total_income,
        salaries: acc.salaries + d.total_salaries,
        expenses: acc.expenses + d.total_expenses,
        profit: acc.profit + d.net_profit,
    }), { income: 0, salaries: 0, expenses: 0, profit: 0 }) || { income: 0, salaries: 0, expenses: 0, profit: 0 };

    const overallMargin = totals.income > 0 ? ((totals.profit / totals.income) * 100).toFixed(1) : '0.0';

    return (
        <div className="animate-in">
            {/* Header with controls */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 24, flexWrap: 'wrap', gap: 12
            }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    📊 Profit & Loss
                </h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="profit-tab-group">
                        <button className={`profit-tab ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
                        <button className={`profit-tab ${period === 'quarterly' ? 'active' : ''}`} onClick={() => setPeriod('quarterly')}>Quarterly</button>
                    </div>
                    <select
                        className="form-control"
                        style={{
                            width: 120, fontWeight: 600, background: 'var(--primary-lighter)',
                            border: '2px solid var(--primary-light)', borderRadius: 10, color: 'var(--primary)',
                            cursor: 'pointer'
                        }}
                        value={year}
                        onChange={e => setYear(+e.target.value)}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Annual Summary Cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24
            }}>
                <SummaryCard icon="💰" label={`Revenue (${year})`} value={fmt(totals.income)} color="#715FF1" bg="linear-gradient(135deg, #F0ECFF, #E1DDFC)" />
                <SummaryCard icon="👥" label={`Total Salaries (${year})`} value={fmt(totals.salaries)} color="#F59E0B" bg="linear-gradient(135deg, #FEF3C7, #FDE68A)" />
                <SummaryCard icon="📋" label={`Total Expenses (${year})`} value={fmt(totals.expenses)} color="#EF4444" bg="linear-gradient(135deg, #FEE2E2, #FECACA)" />
                <SummaryCard
                    icon={totals.profit >= 0 ? '📈' : '📉'}
                    label={`Net Profit — ${overallMargin}%`}
                    value={fmt(totals.profit)}
                    color={totals.profit >= 0 ? '#059669' : '#EF4444'}
                    bg={totals.profit >= 0 ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' : 'linear-gradient(135deg, #FEE2E2, #FECACA)'}
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="empty-state"><p>Loading...</p></div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Revenue</th>
                                    <th>Total Salaries</th>
                                    <th>Total Expenses</th>
                                    <th>Net Profit</th>
                                    <th>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.data?.map((row, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{row.label}</td>
                                        <td className="amount-positive">{fmt(row.total_income)}</td>
                                        <td>{fmt(row.total_salaries)}</td>
                                        <td>{fmt(row.total_expenses)}</td>
                                        <td style={{ color: row.net_profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{fmt(row.net_profit)}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block', padding: '3px 12px', borderRadius: 20,
                                                fontSize: '0.82rem', fontWeight: 600,
                                                background: row.profit_margin >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
                                                color: row.profit_margin >= 0 ? '#047857' : 'var(--danger)'
                                            }}>
                                                {row.profit_margin}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ icon, label, value, color, bg }) {
    return (
        <div style={{
            background: bg, borderRadius: 16, padding: '22px 20px',
            border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
        >
            <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
        </div>
    );
}
