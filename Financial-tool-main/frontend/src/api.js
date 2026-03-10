const API = (import.meta.env.DEV ? '' : 'https://expense-1-45gj.onrender.com') + '/api';

function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleResponse(res) {
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired');
    }
    const text = await res.text();
    if (!text || !text.trim()) {
        throw new Error('No response from server. Backend may be starting up — please try again in 30 seconds.');
    }
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Invalid response from server. Please try again.');
    }
    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

export const api = {
    // Auth
    login: (creds) => fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) }).then(handleResponse),
    getMe: () => fetch(`${API}/auth/me`, { headers: getHeaders() }).then(handleResponse),
    getUsers: () => fetch(`${API}/auth/users`, { headers: getHeaders() }).then(handleResponse),
    register: (data) => fetch(`${API}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    revokeUser: (id) => fetch(`${API}/auth/users/${id}/revoke`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
    deleteUser: (id) => fetch(`${API}/auth/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

    // Projects / Payments
    getProjects: () => fetch(`${API}/projects`, { headers: getHeaders() }).then(handleResponse),
    createProject: (data) => fetch(`${API}/projects`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateProject: (id, data) => fetch(`${API}/projects/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteProject: (id) => fetch(`${API}/projects/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    addPayment: (projectId, data) => fetch(`${API}/projects/${projectId}/payments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deletePayment: (id) => fetch(`${API}/payments/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    updatePayment: (id, data) => fetch(`${API}/payments/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),

    // Employees / Salaries
    getEmployees: () => fetch(`${API}/employees`, { headers: getHeaders() }).then(handleResponse),
    getEmployee: (id) => fetch(`${API}/employees/${id}`, { headers: getHeaders() }).then(handleResponse),
    createEmployee: (data) => fetch(`${API}/employees`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateEmployee: (id, data) => fetch(`${API}/employees/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteEmployee: (id) => fetch(`${API}/employees/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    addSalaryPayment: (empId, data) => fetch(`${API}/employees/${empId}/salary-payments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateSalaryPayment: (id, data) => fetch(`${API}/salary-payments/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteSalaryPayment: (id) => fetch(`${API}/salary-payments/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

    // Expenses
    getExpenses: (category) => fetch(`${API}/expenses${category ? `?category=${category}` : ''}`, { headers: getHeaders() }).then(handleResponse),
    getCategories: () => fetch(`${API}/expenses/categories`, { headers: getHeaders() }).then(handleResponse),
    createExpense: (data) => fetch(`${API}/expenses`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateExpense: (id, data) => fetch(`${API}/expenses/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteExpense: (id) => fetch(`${API}/expenses/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

    // Profit
    getProfit: (period, year, month) => {
        let url = `${API}/profit?period=${period}&year=${year}`;
        if (month) url += `&month=${month}`;
        return fetch(url, { headers: getHeaders() }).then(handleResponse);
    },

    // Reminders
    getReminders: () => fetch(`${API}/reminders`, { headers: getHeaders() }).then(handleResponse),
    createReminder: (data) => fetch(`${API}/reminders`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateReminder: (id, data) => fetch(`${API}/reminders/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteReminder: (id) => fetch(`${API}/reminders/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    triggerReminders: () => fetch(`${API}/cron/trigger`, { method: 'POST', headers: getHeaders() }).then(handleResponse),

    // Documents
    getDocuments: () => fetch(`${API}/documents`, { headers: getHeaders() }).then(handleResponse),
    createDocument: (data) => fetch(`${API}/documents`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateDocument: (id, data) => fetch(`${API}/documents/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteDocument: (id) => fetch(`${API}/documents/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    getDocActions: (id) => fetch(`${API}/documents/${id}/actions`, { headers: getHeaders() }).then(handleResponse),

    // Dashboard
    getDashboard: (year, month) => {
        let url = `${API}/dashboard`;
        const params = [];
        if (year) params.push(`year=${year}`);
        if (month) params.push(`month=${month}`);
        if (params.length) url += '?' + params.join('&');
        return fetch(url, { headers: getHeaders() }).then(handleResponse);
    },

    // Admin
    getLogs: (page = 1, action = '', entity = '') => fetch(`${API}/admin/logs?page=${page}&action=${action}&entity=${entity}`, { headers: getHeaders() }).then(handleResponse),
    downloadData: () => fetch(`${API}/admin/export/data`, { headers: getHeaders() }).then(r => { if (r.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; throw new Error('Session expired'); } if (!r.ok) throw new Error('Download failed'); return r.blob(); }).then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'technoji_business_data.xlsx'; a.click(); }),
    downloadLogs: () => fetch(`${API}/admin/export/logs`, { headers: getHeaders() }).then(r => { if (r.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; throw new Error('Session expired'); } if (!r.ok) throw new Error('Download failed'); return r.blob(); }).then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'technoji_activity_logs.xlsx'; a.click(); }),

    // Notifications
    getNotifications: () => fetch(`${API}/notifications`, { headers: getHeaders() }).then(handleResponse),
    markNotificationRead: (id) => fetch(`${API}/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),
    markAllNotificationsRead: () => fetch(`${API}/notifications/read-all`, { method: 'PUT', headers: getHeaders() }).then(handleResponse),

    // Debts
    getDebts: () => fetch(`${API}/debts`, { headers: getHeaders() }).then(handleResponse),
    createDebt: (data) => fetch(`${API}/debts`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    updateDebt: (id, data) => fetch(`${API}/debts/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteDebt: (id) => fetch(`${API}/debts/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
    addDebtPayment: (id, data) => fetch(`${API}/debts/${id}/payments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
    deleteDebtPayment: (id) => fetch(`${API}/debt-payments/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};
