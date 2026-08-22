import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function EmployeeManagement({ user, onLogoutSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // '', 'Employee', 'Technician'
  const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Employees');
  const navigate = useNavigate();

  // Modals visibility states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Focus entity states
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Forms state controls
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', cnic: '', address: '', designation: '', role: 'Employee', password: '', status: 'active' });
  const [editForm, setEditForm] = useState({ id: '', full_name: '', email: '', phone: '', cnic: '', address: '', designation: '', role: 'Employee', status: 'active' });
  const [passwordForm, setPasswordForm] = useState({ id: '', password: '', confirmPassword: '' });
  const [actionLoading, setActionLoading] = useState(false);
  
  // Validation errors state
  const [validationError, setValidationError] = useState('');

  // Sidebar navigation options (12 items)
  const sidebarItems = [
    { name: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z' },
    { name: 'Customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Packages', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Billing', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Employees', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { name: 'Complaints', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { name: 'Usage Monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' },
    { name: 'Network Monitoring', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Reports', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
    { name: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  // Fetch employees
  const fetchEmployees = async (searchStr = '') => {
    setLoading(true);
    try {
      const url = searchStr ? `http://localhost:5000/api/admin/employees?search=${encodeURIComponent(searchStr)}` : 'http://localhost:5000/api/admin/employees';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load employee roster.');
      const data = await response.json();
      setEmployees(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchEmployees(val);
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    fetchEmployees('');
  };

  const handleSidebarClick = (name) => {
    if (name === 'Dashboard') {
      navigate('/admin');
    } else if (name === 'Customers') {
      navigate('/admin/customers');
    } else if (name === 'Packages') {
      navigate('/admin/packages');
    } else if (name === 'Billing') {
      navigate('/admin/billing');
    } else if (name === 'Employees') {
      navigate('/admin/employees');
    } else if (name === 'Complaints') {
      navigate('/admin/complaints');
    } else if (name === 'Usage Monitoring') {
      navigate('/admin/usage');
    } else if (name === 'Payments') {
      navigate('/admin/payments');
    } else {
      setToastMessage(`"${name}" module is pending development in the next phase.`);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        onLogoutSuccess();
        navigate('/admin/login');
      }
    } catch (err) {
      onLogoutSuccess();
      navigate('/admin/login');
    }
  };

  // Status Toggles
  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    if (newStatus === 'inactive') {
      const confirmDeactivate = window.confirm(`Are you sure you want to deactivate ${emp.full_name}? They will be blocked from logging in immediately.`);
      if (!confirmDeactivate) return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/employees/${emp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      if (response.ok) {
        fetchEmployees(search);
        if (showViewModal && employeeDetails?.employee?.id === emp.id) {
          fetchEmployeeDetails(emp.id);
        }
        
        setToastMessage(`Status for ${emp.full_name} updated successfully!`);
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('[StatusToggle] Error:', err.message);
    }
  };

  // Add Employee Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!addForm.full_name.trim()) return setValidationError('Full Name is required.');
    if (!addForm.email.trim()) return setValidationError('Email Address is required.');
    if (!addForm.password) return setValidationError('Login Password is required.');

    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to provision employee.');

      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', phone: '', cnic: '', address: '', designation: '', role: 'Employee', password: '', status: 'active' });
      fetchEmployees(search);
      
      setToastMessage('Employee profile created successfully!');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Employee Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!editForm.full_name.trim()) return setValidationError('Full Name is required.');
    if (!editForm.email.trim()) return setValidationError('Email Address is required.');

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/employees/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update employee profile.');

      setShowEditModal(false);
      fetchEmployees(search);
      
      setToastMessage('Employee details updated successfully!');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Change Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!passwordForm.password) return setValidationError('Password cannot be empty.');
    if (passwordForm.password !== passwordForm.confirmPassword) {
      return setValidationError('Passwords do not match.');
    }

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/employees/${passwordForm.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm.password }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update employee password.');

      setShowPasswordModal(false);
      setPasswordForm({ id: '', password: '', confirmPassword: '' });
      
      setToastMessage('Password reset completed successfully!');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch Specific Details
  const fetchEmployeeDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/employees/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load employee details ledger.');
      const data = await response.json();
      setEmployeeDetails(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenView = (id) => {
    setShowViewModal(true);
    fetchEmployeeDetails(id);
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmployee(emp);
    setValidationError('');
    setEditForm({
      id: emp.id,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone || '',
      cnic: emp.cnic || '',
      address: emp.address || '',
      designation: emp.designation || '',
      role: emp.role || 'Employee',
      status: emp.status
    });
    setShowEditModal(true);
  };

  const handleOpenPasswordModal = (emp) => {
    setValidationError('');
    setPasswordForm({
      id: emp.id,
      password: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  // Summary Metrics calculations driven from real database values
  const totalEmployees = employees.length;
  const activeStaff = employees.filter(e => e.status === 'active').length;
  const inactiveStaff = employees.filter(e => e.status === 'inactive').length;
  const adminManagers = employees.filter(e => 
    e.role?.toLowerCase() === 'admin' || 
    e.designation?.toLowerCase().includes('manager') || 
    e.designation?.toLowerCase().includes('lead')
  ).length;

  // Visual insights for staff roles
  const employeesCount = employees.filter(e => e.role === 'Employee').length;
  const techniciansCount = employees.filter(e => e.role === 'Technician').length;

  // Filter application
  const filteredEmployees = employees.filter(e => {
    if (roleFilter && e.role !== roleFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  // Initials generator helper
  const getInitials = (fullName) => {
    if (!fullName) return 'EM';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  };

  // Deterministic Avatar gradient colors based on names
  const getAvatarColorClass = (name) => {
    const colors = [
      'from-cyan-500/20 to-indigo-650/20 text-cyan-400 border-cyan-850',
      'from-purple-500/20 to-pink-650/20 text-purple-400 border-purple-850',
      'from-emerald-500/20 to-teal-650/20 text-emerald-400 border-emerald-850',
      'from-amber-500/20 to-orange-650/20 text-amber-450 border-amber-850'
    ];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans w-full selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-400 text-sm shadow-xl flex items-center space-x-3 animate-fade-in ring-1 ring-cyan-500/25">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-955/80 bg-slate-950/80 backdrop-blur-md hidden md:flex flex-col h-screen sticky top-0 z-40">
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-650 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">ISP Management</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleSidebarClick(item.name)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                activeTab === item.name || item.name === 'Employees'
                  ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400 shadow-md shadow-cyan-500/5'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
              }`}
            >
              <svg className={`w-5 h-5 transition-transform group-hover:scale-105 ${activeTab === item.name || item.name === 'Employees' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              <span>{item.name}</span>
              {(activeTab === item.name || item.name === 'Employees') && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-subtle" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-955/20 hover:bg-red-950/20 hover:text-red-300 border border-transparent transition-all duration-250"
          >
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Header bar */}
        <header className="border-b border-slate-900 bg-slate-955/40 bg-slate-955/80 bg-slate-950/40 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm uppercase text-white">ISP Admin</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Staff Management</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{user?.name || 'Administrator'}</p>
              <p className="text-slate-500 text-xs mt-0.5 tracking-wider uppercase">{user?.role || 'admin'}</p>
            </div>
            {/* Avatar Ring */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-650/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-sm shadow-md ring-1 ring-cyan-500/25">
                {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <button onClick={handleLogout} className="md:hidden p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto fade-in-up">
          
          {/* Header controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-cyan-950/20 border border-cyan-800/35 flex items-center justify-center text-cyan-400 shadow-md">
                👥
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                  <span>Staff Management</span>
                </h2>
                <p className="text-slate-500 text-xs font-light mt-0.5">Provision employee accounts, assign system designations, and control portal statuses.</p>
              </div>
            </div>
            
            <button
              onClick={() => { setValidationError(''); setShowAddModal(true); }}
              disabled={actionLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 font-bold text-white text-xs hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center space-x-2 border border-cyan-400/20 disabled:opacity-50"
            >
              {actionLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              )}
              <span>Add Employee</span>
            </button>
          </div>

          {/* Error handling recovery block */}
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-slate-900 bg-slate-955/20 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center text-red-400 animate-pulse">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Unable to load employees</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-normal">
                  The employees roster database query failed. Ensure server connection is active.
                </p>
              </div>
              <button
                onClick={() => { setError(''); fetchEmployees(search); }}
                className="px-4 py-2 rounded-lg bg-red-955/20 border border-red-900/30 text-red-400 text-xs font-semibold hover:bg-red-900 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Premium Staff Metrics Summary Rows & Visual Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                
                {/* 4 Summary Cards */}
                <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  {/* Total Employees */}
                  <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Employees</p>
                      <h4 className="text-xl font-black text-white">{totalEmployees}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/20 border border-cyan-805/20 flex items-center justify-center text-cyan-400 shadow">
                      👥
                    </div>
                  </div>

                  {/* Active Staff */}
                  <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Active Staff</p>
                      <h4 className="text-xl font-black text-white">{activeStaff}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-805/20 flex items-center justify-center text-emerald-400 shadow">
                      ✓
                    </div>
                  </div>

                  {/* Inactive Staff */}
                  <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Inactive Staff</p>
                      <h4 className="text-xl font-black text-white">{inactiveStaff}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-805 flex items-center justify-center text-slate-500 shadow">
                      ○
                    </div>
                  </div>

                  {/* Admin / Managers */}
                  <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Admin / Managers</p>
                      <h4 className="text-xl font-black text-white text-indigo-400">{adminManagers}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/20 border border-indigo-805/20 flex items-center justify-center text-indigo-400 shadow">
                      🛡
                    </div>
                  </div>

                </div>

                {/* Role Distribution Insights */}
                <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex flex-col justify-between glass-card text-xs">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Role Breakdown</p>
                  
                  {totalEmployees < 3 ? (
                    <div className="text-slate-600 italic text-[11px] py-4 text-center">
                      Staff insights will appear as employee records are added.
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Employee ({employeesCount})</span>
                        <span>Technician ({techniciansCount})</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex border border-slate-900">
                        <div
                          className="bg-indigo-500 h-full transition-all"
                          style={{ width: `${(employeesCount / totalEmployees) * 100}%` }}
                        />
                        <div
                          className="bg-cyan-500 h-full transition-all"
                          style={{ width: `${(techniciansCount / totalEmployees) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Advanced Search & Filtering floating card container */}
              <div className="p-4 rounded-2xl bg-slate-900/25 border border-slate-900 backdrop-blur-md space-y-4 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  
                  {/* Search box input */}
                  <div className="relative w-full md:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search employees by name, email, phone, or employee ID code..."
                      value={search}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-955 bg-slate-955 bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 transition-colors text-xs shadow-inner animate-focus"
                    />
                    {search && (
                      <button
                        onClick={handleClearFilters}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-550 hover:text-white transition-colors"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* System Role Filter Dropdown */}
                  <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-900">
                    <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0 tracking-wider">Role:</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full bg-transparent text-slate-205 focus:outline-none text-xs text-white"
                    >
                      <option value="" className="bg-slate-950 text-slate-400">All Roles</option>
                      <option value="Employee" className="bg-slate-950 text-white">Employee</option>
                      <option value="Technician" className="bg-slate-950 text-white">Technician</option>
                    </select>
                  </div>

                  {/* Roster Status Filter Dropdown */}
                  <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-900">
                    <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0 tracking-wider">Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-transparent text-slate-205 focus:outline-none text-xs text-white"
                    >
                      <option value="" className="bg-slate-950 text-slate-400">All Statuses</option>
                      <option value="active" className="bg-slate-950 text-white">Active</option>
                      <option value="inactive" className="bg-slate-950 text-white">Inactive</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Employee list table directory */}
              <div className="rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-6 space-y-3.5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="shimmer-loader h-14 rounded-xl opacity-20" />
                      ))}
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    /* Dynamic Empty States (Genuine empty vs Search filter empty) */
                    employees.length === 0 ? (
                      <div className="py-24 text-center max-w-md mx-auto space-y-6 animate-fade-in">
                        <div className="relative w-16 h-16 rounded-full bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-center text-cyan-400 mx-auto">
                          <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-md pulse-subtle" />
                          📁
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-white text-base">No employees yet</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Your staff directory is empty. Add your first employee to start managing team access.
                          </p>
                        </div>
                        <button
                          onClick={() => { setValidationError(''); setShowAddModal(true); }}
                          className="px-4 py-2 rounded-xl bg-cyan-955/25 border border-cyan-800/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-900 transition-colors inline-block"
                        >
                          Add Employee
                        </button>
                      </div>
                    ) : (
                      <div className="py-20 text-center max-w-md mx-auto space-y-4 animate-fade-in">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-550 mx-auto">
                          🔍
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-sm">No matching employees</h4>
                          <p className="text-xs text-slate-500">Try changing your search or filters.</p>
                        </div>
                        <button
                          onClick={handleClearFilters}
                          className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-350 text-xs font-semibold hover:text-white transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-4 px-4">Employee Details</th>
                          <th className="py-4 px-4">Email</th>
                          <th className="py-4 px-4">Phone</th>
                          <th className="py-4 px-4">Designation</th>
                          <th className="py-4 px-4">Role</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((e) => (
                          <tr key={e.id} className="border-b border-slate-950/60 table-row-hover text-slate-300">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                {/* Elegant initials avatar chips */}
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr border flex items-center justify-center font-bold text-xs shadow-md transition-transform duration-200 hover:scale-105 ${getAvatarColorClass(e.full_name)}`}>
                                  {getInitials(e.full_name)}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm">{e.full_name}</div>
                                  <div className="text-slate-505 text-slate-500 font-light text-[10px] tracking-wider uppercase mt-0.5 font-mono">ID: #{e.id} ({e.employee_code})</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-350 font-medium">{e.email}</td>
                            <td className="py-4 px-4 text-slate-400">{e.phone || <span className="text-slate-655 text-slate-600 italic">None</span>}</td>
                            <td className="py-4 px-4 text-slate-300 font-medium">{e.designation || <span className="text-slate-655 text-slate-600 italic">Unassigned</span>}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                                e.role === 'Technician' ? 'bg-cyan-950/40 text-cyan-405 text-cyan-400 border border-cyan-900/35' : 'bg-indigo-955/30 bg-indigo-950/40 text-indigo-400 border border-indigo-900/35'
                              }`}>
                                {e.role}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center w-fit space-x-1.5 ${
                                e.status === 'active' ? 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400' : 'bg-slate-900 border border-slate-800 text-slate-550'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${e.status === 'active' ? 'bg-emerald-400 pulse-subtle' : 'bg-slate-500'}`} />
                                <span>{e.status}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenView(e.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 hover:text-cyan-305 transition-all duration-200 hover:scale-105 active:scale-95"
                                title="View Employee"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleOpenEdit(e)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-305 transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Edit Employee"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleOpenPasswordModal(e)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-amber-400 hover:text-amber-305 transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Reset Password"
                              >
                                Password
                              </button>
                              <button
                                onClick={() => handleToggleStatus(e)}
                                className={`px-2.5 py-1.5 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 ${
                                  e.status === 'active'
                                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-red-500/30 hover:text-red-400'
                                    : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-900 hover:text-emerald-305'
                                }`}
                                title={e.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
                              >
                                {e.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* 3. MODAL: Add Employee */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto relative scrollbar-thin animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-white">Add New Employee</h3>
                <p className="text-slate-500 text-[10px] font-light mt-0.5">Create an employee account and assign their system access.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/30 text-red-400 text-xs font-medium animate-pulse">
                {validationError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-5 text-xs">
              
              {/* SECTION 1: Personal Information */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Personal Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={addForm.full_name}
                      onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="text"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CNIC Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 42101-XXXXXXX-X"
                      value={addForm.cnic}
                      onChange={(e) => setAddForm({ ...addForm, cnic: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Physical Address</label>
                  <textarea
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                  />
                </div>
              </div>

              {/* SECTION 2: Employment Information */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Employment Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Field Engineer"
                      value={addForm.designation}
                      onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">System Role *</label>
                    <select
                      value={addForm.role}
                      onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Technician">Technician</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Initial Status</label>
                    <select
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Account Information */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Account Credentials</h4>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Login Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Set login credentials password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {actionLoading ? 'Provisioning...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: Edit Employee */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto relative scrollbar-thin animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Employee</h3>
                {selectedEmployee && (
                  <p className="text-slate-500 text-[10px] tracking-wider font-light mt-0.5">Modifying roster file for: {selectedEmployee.full_name}</p>
                )}
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/30 text-red-400 text-xs font-medium animate-pulse">
                {validationError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-5 text-xs">
              
              {/* SECTION 1: Personal Information */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Personal Details</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CNIC Number</label>
                    <input
                      type="text"
                      value={editForm.cnic}
                      onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Physical Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                  />
                </div>
              </div>

              {/* SECTION 2: Employment Information */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Employment Profile</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Designation</label>
                    <input
                      type="text"
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">System Role *</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Technician">Technician</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-800 text-slate-400 font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Commit Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white">Reset Staff Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/30 text-red-400 text-xs font-medium animate-pulse">
                {validationError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Set new credentials password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-955 bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm credentials password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-955 bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-800 text-slate-400 font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-650 text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: View Details */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto relative scrollbar-thin">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-white">Employee Profile File</h3>
                {employeeDetails?.employee && (
                  <p className="text-slate-500 text-[10px] tracking-wider uppercase mt-0.5">{employeeDetails.employee.employee_code}</p>
                )}
              </div>
              <button onClick={() => { setShowViewModal(false); setEmployeeDetails(null); }} className="text-slate-550 text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {detailsLoading || !employeeDetails ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-slate-505 text-slate-505 text-slate-505 text-slate-500 font-bold uppercase tracking-wider">Loading staff log ledger...</span>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                
                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-955/20 bg-slate-950/30 p-5 rounded-2xl border border-slate-850 text-xs">
                  
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-cyan-455 text-cyan-405 text-cyan-400 uppercase tracking-wider">Personal Information</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500">Name:</span>
                      <span className="col-span-2 text-white font-semibold">{employeeDetails.employee.full_name}</span>

                      <span className="text-slate-500">Email:</span>
                      <span className="col-span-2 text-slate-350 truncate">{employeeDetails.employee.email}</span>

                      <span className="text-slate-500">Phone:</span>
                      <span className="col-span-2 text-slate-300">{employeeDetails.employee.phone || 'Not supplied'}</span>

                      <span className="text-slate-500">CNIC:</span>
                      <span className="col-span-2 text-slate-300">{employeeDetails.employee.cnic || 'Not supplied'}</span>

                      <span className="text-slate-500">Address:</span>
                      <span className="col-span-2 text-slate-300 leading-tight">{employeeDetails.employee.address || 'Not supplied'}</span>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-indigo-405 text-indigo-400 uppercase tracking-wider">Employment Profile</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500">Employee ID:</span>
                      <span className="col-span-2 text-white font-mono font-bold uppercase">{employeeDetails.employee.employee_code}</span>

                      <span className="text-slate-500">Designation:</span>
                      <span className="col-span-2 text-slate-300">{employeeDetails.employee.designation || 'Staff Employee'}</span>

                      <span className="text-slate-500">Portal Role:</span>
                      <span className="col-span-2 text-slate-300">{employeeDetails.employee.role}</span>

                      <span className="text-slate-500">Status:</span>
                      <span className="col-span-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          employeeDetails.employee.status === 'active' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'
                        }`}>
                          {employeeDetails.employee.status}
                        </span>
                      </span>

                      <span className="text-slate-500">Joining Date:</span>
                      <span className="col-span-2 text-slate-300">
                        {new Date(employeeDetails.employee.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Assigned Complaints logs */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Assigned Complaints Tickets</h4>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-855 border-slate-900">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 bg-slate-955/40 text-slate-500 font-bold uppercase">
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Created Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeDetails.complaints.length > 0 ? (
                          employeeDetails.complaints.map((c) => (
                            <tr key={c.id} className="border-b border-slate-950/20 text-slate-300 hover:bg-slate-900/5">
                              <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[200px]">{c.subject}</td>
                              <td className="py-2.5 px-3 uppercase font-medium">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                                  c.priority === 'high' ? 'bg-red-955/30 text-red-400' : 'bg-slate-950 text-slate-450'
                                }`}>
                                  {c.priority}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 uppercase text-[9px] font-semibold text-cyan-400">{c.status}</td>
                              <td className="py-2.5 px-3 text-slate-505 text-slate-500 text-right">{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-slate-600 italic">No assigned complaint logs.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assigned Tasks logs */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Assigned Tasks</h4>
                  <div className="p-4 rounded-xl border border-slate-855 border-slate-900 border-dashed text-center text-slate-600 italic">
                    No system tasks assigned to this employee.
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default EmployeeManagement;
