import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../components/ConfirmModal';

const CATEGORIES = ['All', 'Rent', 'Software', 'Marketing', 'Travel', 'Utilities', 'Other'];

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [filter, setFilter] = useState('All');
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

    const load = () => {
        const cat = filter === 'All' ? '' : filter;
        api.getExpenses(cat).then(setExpenses).catch(console.error);
    };

    useEffect(() => { load(); }, [filter]);

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const handleDelete = (id) => {
        setConfirmModal({
            open: true, title: 'Delete Expense', message: 'Delete this expense? This cannot be undone.',
            onConfirm: async () => { setConfirmModal(m => ({ ...m, open: false })); try { await api.deleteExpense(id); load(); } catch (err) { alert(err.message || 'Failed to delete expense'); } }
        });
    };

    return (
        <div className="animate-in">
            <div className="page-actions">
                <h2 style={{ flex: 1, fontSize: '1.2rem', fontWeight: 700 }}>Other Expenses</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: 12 }}>
                    Total: <strong className="amount-negative">{fmt(totalExpenses)}</strong>
                </span>
                <Link to="/expenses/new" className="btn btn-primary">+ Add Expense</Link>
            </div>

            <div className="filter-group" style={{ marginBottom: 16 }}>
                {CATEGORIES.map(c => (
                    <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
                ))}
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(exp => (
                                <tr key={exp.id}>
                                    <td>{exp.date}</td>
                                    <td style={{ fontWeight: 500 }}>{exp.description}</td>
                                    <td><span className="badge badge-pending">{exp.category}</span></td>
                                    <td className="amount-negative">{fmt(exp.amount)}</td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{exp.notes}</td>
                                    <td className="actions-cell">
                                        <Link to={`/expenses/${exp.id}/edit`} className="btn btn-sm btn-secondary">✏️</Link>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(exp.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📋</div><h3>No expenses yet</h3><p>Track your company expenses here.</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(m => ({ ...m, open: false }))} />
        </div>
    );
}
