import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientPayments from './pages/ClientPayments';
import ProjectForm from './pages/ProjectForm';
import PaymentForm from './pages/PaymentForm';
import Salaries from './pages/Salaries';
import EmployeeForm from './pages/EmployeeForm';
import SalaryForm from './pages/SalaryForm';
import EmployeeDetail from './pages/EmployeeDetail';
import Expenses from './pages/Expenses';
import ExpenseForm from './pages/ExpenseForm';
import Profit from './pages/Profit';
import Reminders from './pages/Reminders';
import ReminderForm from './pages/ReminderForm';
import UserManagement from './pages/UserManagement';
import UserForm from './pages/UserForm';
import AdminPanel from './pages/AdminPanel';
import Documents from './pages/Documents';
import DocumentForm from './pages/DocumentForm';
import DebtLedger from './pages/DebtLedger';
import Layout from './components/Layout';

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Wrap({ user, onLogout, children }) {
  return (
    <ProtectedRoute user={user}>
      <Layout user={user} onLogout={onLogout}>{children}</Layout>
    </ProtectedRoute>
  );
}

function AdminWrap({ user, onLogout, children }) {
  return (
    <AdminRoute user={user}>
      <Layout user={user} onLogout={onLogout}>{children}</Layout>
    </AdminRoute>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  });

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />

        {/* Dashboard */}
        <Route path="/" element={<Wrap user={user} onLogout={handleLogout}><Dashboard /></Wrap>} />

        {/* Client Payments */}
        <Route path="/payments" element={<Wrap user={user} onLogout={handleLogout}><ClientPayments /></Wrap>} />
        <Route path="/payments/new" element={<Wrap user={user} onLogout={handleLogout}><ProjectForm /></Wrap>} />
        <Route path="/payments/:id/edit" element={<Wrap user={user} onLogout={handleLogout}><ProjectForm /></Wrap>} />
        <Route path="/payments/:projectId/pay" element={<Wrap user={user} onLogout={handleLogout}><PaymentForm /></Wrap>} />
        <Route path="/payments/edit/:paymentId" element={<Wrap user={user} onLogout={handleLogout}><PaymentForm /></Wrap>} />

        {/* Salaries */}
        <Route path="/salaries" element={<Wrap user={user} onLogout={handleLogout}><Salaries /></Wrap>} />
        <Route path="/salaries/new" element={<Wrap user={user} onLogout={handleLogout}><EmployeeForm /></Wrap>} />
        <Route path="/salaries/:id/edit" element={<Wrap user={user} onLogout={handleLogout}><EmployeeForm /></Wrap>} />
        <Route path="/salaries/:empId/pay" element={<Wrap user={user} onLogout={handleLogout}><SalaryForm /></Wrap>} />
        <Route path="/salaries/:empId/details" element={<Wrap user={user} onLogout={handleLogout}><EmployeeDetail /></Wrap>} />

        {/* Expenses */}
        <Route path="/expenses" element={<Wrap user={user} onLogout={handleLogout}><Expenses /></Wrap>} />
        <Route path="/expenses/new" element={<Wrap user={user} onLogout={handleLogout}><ExpenseForm /></Wrap>} />
        <Route path="/expenses/:id/edit" element={<Wrap user={user} onLogout={handleLogout}><ExpenseForm /></Wrap>} />

        {/* Profit */}
        <Route path="/profit" element={<Wrap user={user} onLogout={handleLogout}><Profit /></Wrap>} />

        {/* Reminders */}
        <Route path="/reminders" element={<Wrap user={user} onLogout={handleLogout}><Reminders /></Wrap>} />
        <Route path="/reminders/new" element={<Wrap user={user} onLogout={handleLogout}><ReminderForm /></Wrap>} />
        <Route path="/reminders/:id/edit" element={<Wrap user={user} onLogout={handleLogout}><ReminderForm /></Wrap>} />

        {/* Documents */}
        <Route path="/documents" element={<Wrap user={user} onLogout={handleLogout}><Documents /></Wrap>} />
        <Route path="/documents/new" element={<Wrap user={user} onLogout={handleLogout}><DocumentForm /></Wrap>} />
        <Route path="/documents/:id/edit" element={<Wrap user={user} onLogout={handleLogout}><DocumentForm /></Wrap>} />

        {/* Debt Ledger */}
        <Route path="/debts" element={<Wrap user={user} onLogout={handleLogout}><DebtLedger /></Wrap>} />

        {/* Admin - Users */}
        <Route path="/users" element={<AdminWrap user={user} onLogout={handleLogout}><UserManagement /></AdminWrap>} />
        <Route path="/users/new" element={<AdminWrap user={user} onLogout={handleLogout}><UserForm /></AdminWrap>} />
        <Route path="/admin" element={<AdminWrap user={user} onLogout={handleLogout}><AdminPanel /></AdminWrap>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
