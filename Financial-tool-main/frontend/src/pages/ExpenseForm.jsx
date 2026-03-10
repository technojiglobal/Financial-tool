import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

const CATEGORIES = ['Rent', 'Software', 'Marketing', 'Travel', 'Utilities', 'Other'];

export default function ExpenseForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', category: 'Other', amount: '', notes: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.getExpenses().then(expenses => {
                const e = expenses.find(e => e.id === +id);
                if (e) setForm({ date: e.date, description: e.description, category: e.category, amount: e.amount, notes: e.notes || '' });
            });
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) await api.updateExpense(id, form);
            else await api.createExpense(form);
            navigate('/expenses');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="form-page">
            <div className="form-page-header">
                <div className="breadcrumb">
                    <Link to="/expenses">Expenses</Link>
                    <span className="separator">›</span>
                    <span>{isEdit ? 'Edit Expense' : 'New Expense'}</span>
                </div>
                <h2>{isEdit ? 'Edit Expense' : 'Add New Expense'}</h2>
                <p>{isEdit ? 'Update the expense details below.' : 'Record a new business expense.'}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-card-body">
                        <div className="form-section-title">Expense Details</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Date *</label>
                                <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
                                <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description *</label>
                            <input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="e.g. Office internet bill" />
                        </div>
                        <div className="form-group">
                            <label>Amount *</label>
                            <input type="number" min="1" step="any" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="e.g. 2500" />
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea className="form-control" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional details..." />
                        </div>
                    </div>
                    <div className="form-card-footer">
                        <Link to="/expenses" className="btn btn-outline">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Add Expense'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
