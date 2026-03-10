import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function ProjectForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState({ client_name: '', project_name: '', total_amount: '', amc_amount: '', email: '', phone: '', notes: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.getProjects().then(projects => {
                const p = projects.find(p => p.id === +id);
                if (p) setForm({ client_name: p.client_name, project_name: p.project_name, total_amount: p.total_amount, amc_amount: p.amc_amount || '', email: p.email || '', phone: p.phone || '', notes: p.notes || '' });
            });
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) await api.updateProject(id, form);
            else await api.createProject(form);
            navigate('/payments');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="form-page">
            <div className="form-page-header">
                <div className="breadcrumb">
                    <Link to="/payments">Client Payments</Link>
                    <span className="separator">›</span>
                    <span>{isEdit ? 'Edit Project' : 'New Project'}</span>
                </div>
                <h2>{isEdit ? 'Edit Project' : 'Add New Project'}</h2>
                <p>{isEdit ? 'Update the project details below.' : 'Enter the client and project details to start tracking payments.'}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-card-body">
                        <div className="form-section-title">Client Information</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Client Name *</label>
                                <input className="form-control" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} required placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="form-group">
                                <label>Project Name *</label>
                                <input className="form-control" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} required placeholder="e.g. Website Redesign" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Total Project Amount *</label>
                            <input type="number" min="0" step="any" className="form-control" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} required placeholder="e.g. 50000" />
                        </div>

                        <div className="form-group">
                            <label>AMC / Monthly Maintenance Amount (₹)</label>
                            <input type="number" min="0" step="any" className="form-control" value={form.amc_amount} onChange={e => setForm({ ...form, amc_amount: e.target.value })} placeholder="e.g. 5000 (Annual Maintenance Contract)" />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Annual Maintenance Contract or Monthly Maintenance charge for this project.</span>
                        </div>

                        <div className="form-section-title">Contact Details</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                            </div>
                        </div>

                        <div className="form-section-title">Additional Info</div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea className="form-control" rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional details about this project..." />
                        </div>
                    </div>

                    <div className="form-card-footer">
                        <Link to="/payments" className="btn btn-outline">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
