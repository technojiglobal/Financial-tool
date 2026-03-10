import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function ReminderForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState({ description: '', date: new Date().toISOString().split('T')[0], time: '09:00' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.getReminders().then(reminders => {
                const r = reminders.find(r => r.id === +id);
                if (r) setForm({ description: r.description, date: r.date, time: r.time || '' });
            });
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) await api.updateReminder(id, form);
            else await api.createReminder(form);
            navigate('/reminders');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="form-page">
            <div className="form-page-header">
                <div className="breadcrumb">
                    <Link to="/reminders">Reminders</Link>
                    <span className="separator">›</span>
                    <span>{isEdit ? 'Edit Reminder' : 'New Reminder'}</span>
                </div>
                <h2>{isEdit ? 'Edit Reminder' : 'Create New Reminder'}</h2>
                <p>{isEdit ? 'Update the reminder details below.' : 'Set a reminder so you never miss important deadlines.'}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-card-body">
                        <div className="form-section-title">Reminder Details</div>
                        <div className="form-group">
                            <label>Description *</label>
                            <input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="e.g. Follow up with client about invoice" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Date *</label>
                                <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <input type="time" className="form-control" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                            </div>
                        </div>

                    </div>
                    <div className="form-card-footer">
                        <Link to="/reminders" className="btn btn-outline">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Reminder' : 'Create Reminder'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
