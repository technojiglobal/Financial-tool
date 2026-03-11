import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';

const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Other'];
const EMPLOYEE_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState({
        name: '', employee_code: '', email: '', phone: '',
        role: '', department: '', employee_type: 'Full-time', date_joined: '',
        monthly_leaves: '', yearly_leaves: '',
        salary_per_month: '', salary_breakdown: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.getEmployees().then(employees => {
                const e = employees.find(e => e.id === +id);
                if (e) setForm({
                    name: e.name || '', employee_code: e.employee_code || '',
                    email: e.email || '', phone: e.phone || '',
                    role: e.role || '', department: e.department || '',
                    employee_type: e.employee_type || 'Full-time',
                    date_joined: e.date_joined || '',
                    monthly_leaves: e.monthly_leaves || '', yearly_leaves: e.yearly_leaves || '',
                    salary_per_month: e.salary_per_month || '',
                    salary_breakdown: e.salary_breakdown || ''
                });
            });
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) await api.updateEmployee(id, form);
            else await api.createEmployee(form);
            navigate('/salaries');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const sectionDot = (color) => (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 8 }}></span>
    );

    return (
        <div className="form-page">
            <div className="form-page-header">
                <div className="breadcrumb">
                    <Link to="/salaries">Salaries</Link>
                    <span className="separator">›</span>
                    <span>{isEdit ? 'Edit Employee' : 'New Employee'}</span>
                </div>
                <h2>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h2>
                <p>{isEdit ? 'Update the employee details below.' : 'Complete the detailed profile, work, and leave information to add a new team member.'}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-card-body">

                        {/* Basic Information */}
                        <div className="form-section-title">{sectionDot('var(--primary)')}Basic Information</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. John Doe" />
                            </div>
                            <div className="form-group">
                                <label>Employee ID *</label>
                                <input className="form-control" value={form.employee_code} onChange={e => set('employee_code', e.target.value)} required placeholder="e.g. EMP001" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. john@company.com" />
                            </div>
                            <div className="form-group">
                                <label>Contact Number</label>
                                <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. +1 234 567 890" />
                            </div>
                        </div>

                        {/* Work Details */}
                        <div className="form-section-title" style={{ marginTop: 28 }}>{sectionDot('#F59E0B')}Work Details</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Role / Designation</label>
                                <input className="form-control" value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Senior Software Engineer" />
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <select className="form-control" value={form.department} onChange={e => set('department', e.target.value)}>
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Employee Type</label>
                                <select className="form-control" value={form.employee_type} onChange={e => set('employee_type', e.target.value)}>
                                    {EMPLOYEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date Joined</label>
                                <input type="date" className="form-control" value={form.date_joined} onChange={e => set('date_joined', e.target.value)} />
                            </div>
                        </div>

                        {/* Leave Information */}
                        <div className="form-section-title" style={{ marginTop: 28 }}>{sectionDot('#10B981')}Leave Information</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Total Monthly Leaves</label>
                                <input type="number" min="0" className="form-control" value={form.monthly_leaves} onChange={e => set('monthly_leaves', e.target.value)} placeholder="e.g. 2" />
                            </div>
                            <div className="form-group">
                                <label>Total Yearly Leaves</label>
                                <input type="number" min="0" className="form-control" value={form.yearly_leaves} onChange={e => set('yearly_leaves', e.target.value)} placeholder="e.g. 24" />
                            </div>
                        </div>

                        {/* Salary Details */}
                        <div className="form-section-title" style={{ marginTop: 28 }}>{sectionDot('#EF4444')}Salary Details</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Actual Monthly Salary *</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>₹</span>
                                    <input type="number" min="0" step="any" className="form-control" style={{ paddingLeft: 32 }} value={form.salary_per_month} onChange={e => set('salary_per_month', e.target.value)} required placeholder="e.g. 25000" />
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Salary Structure (Breakdown)</label>
                            <textarea className="form-control" rows={4} value={form.salary_breakdown} onChange={e => set('salary_breakdown', e.target.value)} placeholder={"Basic: 15000\nHRA: 5000\nSpecial Allowance: 3000\nConveyance: 2000"} />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Enter each component on a new line for proper breakdown in payslips.</span>
                        </div>
                    </div>
                    <div className="form-card-footer">
                        <Link to="/salaries" className="btn btn-outline">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
