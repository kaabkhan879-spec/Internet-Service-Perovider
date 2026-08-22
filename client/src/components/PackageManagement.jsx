import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatPKR = (amount) => {
  const val = parseFloat(amount) || 0;
  return `Rs. ${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

function PackageManagement({ user, onLogoutSuccess }) {
  const [packages, setPackages] = useState([]);
  const [customers, setCustomers] = useState([]); // Loaded for package assignments
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Packages');
  const navigate = useNavigate();

  // Modals visibility states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Focus entity states
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Forms state controls
  const [addForm, setAddForm] = useState({ name: '', speed_mbps: '', monthly_price: '', data_limit_gb: '', description: '', status: 'active' });
  const [editForm, setEditForm] = useState({ id: '', name: '', speed_mbps: '', monthly_price: '', data_limit_gb: '', description: '', status: 'active' });
  const [assignForm, setAssignForm] = useState({ customer_id: '', package_id: '', start_date: new Date().toISOString().split('T')[0] });
  const [actionLoading, setActionLoading] = useState(false);

  // Sidebar navigation options (13 items)
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

  const fetchPackages = async (searchStr = '', statusVal = '') => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/admin/packages';
      const params = [];
      if (searchStr.trim()) params.push(`search=${encodeURIComponent(searchStr.trim())}`);
      if (statusVal) params.push(`status=${statusVal}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load packages details.');
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('[Packages] Error loading customers list:', err.message);
    }
  };

  useEffect(() => {
    fetchPackages(search, statusFilter);
    fetchCustomers();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchPackages(val, statusFilter);
  };

  const handleStatusFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    fetchPackages(search, val);
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
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`http://localhost:5000/api/admin/packages/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      if (response.ok) {
        fetchPackages(search, statusFilter);
      }
    } catch (err) {
      console.error('[PackageStatusToggle] Error:', err.message);
    }
  };

  // Add Package Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Input Validation
    if (!addForm.name.trim()) return alert('Package Name is required.');
    if (parseInt(addForm.speed_mbps) <= 0) return alert('Speed must be greater than 0.');
    if (parseFloat(addForm.monthly_price) < 0) return alert('Monthly price must be greater than or equal to 0.');

    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add package.');

      setShowAddModal(false);
      setAddForm({ name: '', speed_mbps: '', monthly_price: '', data_limit_gb: '', description: '', status: 'active' });
      fetchPackages(search, statusFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Package Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Input Validation
    if (!editForm.name.trim()) return alert('Package Name is required.');
    if (parseInt(editForm.speed_mbps) <= 0) return alert('Speed must be greater than 0.');
    if (parseFloat(editForm.monthly_price) < 0) return alert('Monthly price must be greater than or equal to 0.');

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/packages/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update package details.');

      setShowEditModal(false);
      fetchPackages(search, statusFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Assign Package Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.customer_id) return alert('Please select a customer.');
    if (!assignForm.package_id) return alert('Please select a package.');

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/customers/${assignForm.customer_id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: assignForm.package_id,
          start_date: assignForm.start_date
        }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to assign package to customer.');

      alert(data.message);
      setShowAssignModal(false);
      setAssignForm({ customer_id: '', package_id: '', start_date: new Date().toISOString().split('T')[0] });
      fetchPackages(search, statusFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (p) => {
    setSelectedPackage(p);
    setEditForm({
      id: p.id,
      name: p.name,
      speed_mbps: p.speed_mbps,
      monthly_price: p.monthly_price,
      data_limit_gb: p.data_limit_gb || '',
      description: p.description || '',
      status: p.status
    });
    setShowEditModal(true);
  };

  const handleOpenAssign = (packageId = '') => {
    setAssignForm({
      customer_id: '',
      package_id: packageId,
      start_date: new Date().toISOString().split('T')[0]
    });
    setShowAssignModal(true);
  };

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans w-full selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-400 text-sm shadow-xl flex items-center space-x-3 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md hidden md:flex flex-col h-screen sticky top-0 animate-fade-in">
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

        {/* Scrollable sidebar items list */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleSidebarClick(item.name)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeTab === item.name
                  ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
              }`}
            >
              <svg className={`w-5 h-5 transition-transform group-hover:scale-105 ${activeTab === item.name ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 border border-transparent transition-all duration-250"
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
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-35">
          <div className="flex items-center space-x-4 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-650 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm uppercase text-white">ISP Admin</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Packages Management</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{user?.name || 'Administrator'}</p>
              <p className="text-slate-500 text-xs mt-0.5 tracking-wider uppercase">{user?.role || 'admin'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-650/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-sm">
              {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <button onClick={handleLogout} className="md:hidden p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* Header controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-900">
            <div>
              <h2 className="text-2xl font-black text-white">Internet Service Packages</h2>
              <p className="text-slate-500 text-xs mt-0.5">Manage speed levels, prices, bandwidth configurations, and customer subscriptions</p>
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <button
                onClick={() => handleOpenAssign()}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-semibold text-cyan-400 text-xs hover:bg-slate-850 hover:text-cyan-300 transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Assign to Customer</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-655 font-semibold text-white text-xs hover:scale-[1.01] hover:shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Package</span>
              </button>
            </div>
          </div>

          {/* Filtering Area */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search packages by name or description..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-655 focus:outline-none focus:border-cyan-500 transition-colors text-xs"
              />
            </div>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full md:w-48 px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-300 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Tiers</option>
              <option value="inactive">Inactive Tiers</option>
            </select>
          </div>

          {/* Package Catalog Table */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Package Name</th>
                    <th className="py-4 px-4">Speed Limit</th>
                    <th className="py-4 px-4">Monthly Price</th>
                    <th className="py-4 px-4">Data Cap</th>
                    <th className="py-4 px-4">Customers Count</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500 animate-pulse">
                        <div className="flex justify-center items-center space-x-2">
                          <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Resolving package definitions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-red-400 font-medium italic">{error}</td>
                    </tr>
                  ) : packages.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-600 font-medium italic">
                        No service packages found in the catalog.
                      </td>
                    </tr>
                  ) : (
                    packages.map((p) => (
                      <tr key={p.id} className="border-b border-slate-950/60 hover:bg-slate-900/10 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          {p.description && <div className="text-slate-500 font-light text-[10px] truncate max-w-xs mt-0.5">{p.description}</div>}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">{p.speed_mbps} Mbps</td>
                        <td className="py-4 px-4 font-bold text-slate-200">{formatPKR(p.monthly_price)}/mo</td>
                        <td className="py-4 px-4 text-slate-350">
                          {p.data_limit_gb ? `${p.data_limit_gb} GB` : <span className="text-cyan-400 font-medium">Unlimited</span>}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-300">{p.customer_count}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'active' ? 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400' : 'bg-red-950/40 border border-red-800/30 text-red-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-350 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(p.id, p.status)}
                            className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                              p.status === 'active'
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-red-500/30 hover:text-red-400'
                                : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-900 hover:text-emerald-300'
                            }`}
                          >
                            {p.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* 3. MODAL: Add Package */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white">Create Service Package</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starter Fiber (10 Mbps)"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Speed (Mbps)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="10"
                    value={addForm.speed_mbps}
                    onChange={(e) => setAddForm({ ...addForm, speed_mbps: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monthly Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="15.00"
                    value={addForm.monthly_price}
                    onChange={(e) => setAddForm({ ...addForm, monthly_price: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data Limit (GB) - Optional</label>
                  <input
                    type="number"
                    placeholder="Unlimited if empty"
                    value={addForm.data_limit_gb}
                    onChange={(e) => setAddForm({ ...addForm, data_limit_gb: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Service package brief..."
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                />
              </div>

              <div className="pt-4 flex space-x-3">
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
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 text-white font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: Edit Package */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white">Modify Package details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Package Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Speed (Mbps)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.speed_mbps}
                    onChange={(e) => setEditForm({ ...editForm, speed_mbps: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monthly Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={editForm.monthly_price}
                    onChange={(e) => setEditForm({ ...editForm, monthly_price: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data Limit (GB) - Optional</label>
                  <input
                    type="number"
                    value={editForm.data_limit_gb}
                    onChange={(e) => setEditForm({ ...editForm, data_limit_gb: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 text-white font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Commit Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Assign Package to Customer */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white">Assign Internet Package</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              
              {/* Select Customer */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Customer</label>
                <select
                  required
                  value={assignForm.customer_id}
                  onChange={(e) => setAssignForm({ ...assignForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.customer_code}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Active Package */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Internet Package</label>
                <select
                  required
                  value={assignForm.package_id}
                  onChange={(e) => setAssignForm({ ...assignForm, package_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                >
                  {packages.filter(p => p.status === 'active').length === 0 ? (
                    <option value="">No active packages available.</option>
                  ) : (
                    <>
                      <option value="">-- Choose Package --</option>
                      {packages.filter(p => p.status === 'active').map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {formatPKR(p.monthly_price)}/mo
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Select Start Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Subscription Start Date</label>
                <input
                  type="date"
                  required
                  value={assignForm.start_date}
                  onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 text-white font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {actionLoading ? 'Assigning...' : 'Assign Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default PackageManagement;
