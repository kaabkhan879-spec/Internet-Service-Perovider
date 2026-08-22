import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ComplaintsManagement({ user, onLogoutSuccess }) {
  const [complaints, setComplaints] = useState([]);
  const [employees, setEmployees] = useState([]); // Loaded for technician assignments
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'pending', 'in_progress', 'resolved', 'closed'
  const [priorityFilter, setPriorityFilter] = useState(''); // '', 'low', 'medium', 'high', 'urgent'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Complaints');
  const navigate = useNavigate();

  // Modal control states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedComplaintDetails, setSelectedComplaintDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Forms state controls
  const [assignForm, setAssignForm] = useState({ assigned_employee_id: '' });
  const [statusForm, setStatusForm] = useState({ status: '', comment: '' });
  const [commentForm, setCommentForm] = useState({ comment: '' });
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

  // Fetch complaints
  const fetchComplaints = async (searchStr = '', statusVal = '', priorityVal = '') => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/admin/complaints';
      const params = [];
      if (searchStr.trim()) params.push(`search=${encodeURIComponent(searchStr.trim())}`);
      if (statusVal) params.push(`status=${statusVal}`);
      if (priorityVal) params.push(`priority=${priorityVal}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load complaint tickets.');
      const data = await response.json();
      setComplaints(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Fetch active employees dropdown list
  const fetchActiveEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/employees', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Filters only active employees/technicians
        setEmployees(data.filter(e => e.status === 'active'));
      }
    } catch (err) {
      console.error('[Complaints] Error loading staff records:', err.message);
    }
  };

  useEffect(() => {
    fetchComplaints(search, statusFilter, priorityFilter);
    fetchActiveEmployees();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchComplaints(val, statusFilter, priorityFilter);
  };

  const handleStatusFilterChange = (statusVal) => {
    setStatusFilter(statusVal);
    fetchComplaints(search, statusVal, priorityFilter);
  };

  const handlePriorityFilterChange = (priorityVal) => {
    setPriorityFilter(priorityVal);
    fetchComplaints(search, statusFilter, priorityVal);
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

  // Fetch ticket details
  const fetchComplaintDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/complaints/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load complaint details.');
      const data = await response.json();
      setSelectedComplaintDetails(data);
      setAssignForm({ assigned_employee_id: data.complaint.assigned_employee_id || '' });
      setStatusForm({ status: data.complaint.status, comment: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenViewModal = (id) => {
    setShowViewModal(true);
    fetchComplaintDetails(id);
  };

  // Submit assign technician
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/complaints/${selectedComplaintDetails.complaint.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_employee_id: assignForm.assigned_employee_id ? parseInt(assignForm.assigned_employee_id, 10) : null }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to assign employee.');

      alert('Assignment updated successfully.');
      fetchComplaintDetails(selectedComplaintDetails.complaint.id);
      fetchComplaints(search, statusFilter, priorityFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit status transition
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/complaints/${selectedComplaintDetails.complaint.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update status.');

      alert('Status updated successfully.');
      fetchComplaintDetails(selectedComplaintDetails.complaint.id);
      fetchComplaints(search, statusFilter, priorityFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit comment updates
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentForm.comment.trim()) return alert('Comment content is empty.');

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/complaints/${selectedComplaintDetails.complaint.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save comment update.');

      setCommentForm({ comment: '' });
      fetchComplaintDetails(selectedComplaintDetails.complaint.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center shadow-lg">
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm uppercase text-white">ISP Admin</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Complaints & Support Tickets</h1>
          
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

        {/* Content Pane */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* Header title */}
          <div className="pb-4 border-b border-slate-900">
            <h2 className="text-2xl font-black text-white">Complaints Management</h2>
            <p className="text-slate-500 text-xs mt-0.5">Track customer issue reports, assign tech support employees, and resolve outages</p>
          </div>

          {/* Filtering controls */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 backdrop-blur-sm space-y-4">
            
            {/* Search and priority filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search box */}
              <div className="relative w-full md:flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search complaints by customer name, customer code, ID or subject..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-655 focus:outline-none focus:border-cyan-500 transition-colors text-xs"
                />
              </div>

              {/* Priority Dropdown selector */}
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Priority:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => handlePriorityFilterChange(e.target.value)}
                  className="w-full md:w-36 px-3 py-2 rounded-lg bg-slate-950 border border-slate-909 text-slate-350 focus:outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Status tab filters */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900/50">
              {[
                { name: 'All Complaints', value: '' },
                { name: 'Pending', value: 'pending' },
                { name: 'In Progress', value: 'in_progress' },
                { name: 'Resolved', value: 'resolved' },
                { name: 'Closed', value: 'closed' }
              ].map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => handleStatusFilterChange(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    statusFilter === tab.value
                      ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

          </div>

          {/* Table List of complaints */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Ticket ID</th>
                    <th className="py-4 px-4">Customer Name</th>
                    <th className="py-4 px-4">Subject</th>
                    <th className="py-4 px-4">Priority</th>
                    <th className="py-4 px-4">Assigned Employee</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Created Date</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500">
                        <div className="flex justify-center items-center space-x-2 animate-pulse">
                          <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Resolving complaints database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-red-400 font-medium italic">{error}</td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-655 font-medium italic">
                        No complaints found.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c.id} className="border-b border-slate-950/60 hover:bg-slate-905/10 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-400">{c.id}</td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-sm">{c.customer_name}</div>
                          <div className="text-slate-500 font-light text-[10px] tracking-wider uppercase mt-0.5">{c.customer_code}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-200 max-w-[200px] truncate">{c.subject}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            c.priority === 'urgent'
                              ? 'bg-red-950/40 text-red-400 border border-red-800/30 animate-pulse'
                              : c.priority === 'high'
                              ? 'bg-orange-950/40 text-orange-400 border border-orange-850/30'
                              : c.priority === 'medium'
                              ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {c.employee_name || <span className="text-slate-600 italic">Unassigned</span>}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.status === 'resolved'
                              ? 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400'
                              : c.status === 'closed'
                              ? 'bg-slate-900 border border-slate-800 text-slate-400'
                              : c.status === 'in_progress'
                              ? 'bg-cyan-950/40 border border-cyan-800/30 text-cyan-400'
                              : 'bg-amber-950/40 border border-amber-800/30 text-amber-400'
                          }`}>
                            {c.status === 'open' ? 'pending' : c.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleOpenViewModal(c.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            View Details
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

      {/* 3. MODAL: View details, assign technician, change status and add comment */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto relative scrollbar-thin">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-white">Complaint Ticket Sheet</h3>
                {selectedComplaintDetails?.complaint && (
                  <p className="text-slate-500 text-[10px] tracking-wider uppercase mt-0.5">Ticket ID: #{selectedComplaintDetails.complaint.id}</p>
                )}
              </div>
              <button onClick={() => { setShowViewModal(false); setSelectedComplaintDetails(null); }} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {detailsLoading || !selectedComplaintDetails ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing details timeline...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Ticket info and management (Col span 2) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Customer Information profile */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-3 text-xs">
                    <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Customer Contact Profile</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-slate-500 block">Name:</span>
                        <span className="text-white font-semibold">{selectedComplaintDetails.complaint.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Customer Code:</span>
                        <span className="text-slate-300 font-bold uppercase font-mono">{selectedComplaintDetails.complaint.customer_code}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Phone:</span>
                        <span className="text-slate-300 font-medium">{selectedComplaintDetails.complaint.customer_phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Email:</span>
                        <span className="text-slate-350 truncate block">{selectedComplaintDetails.complaint.customer_email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Complaint Description detail */}
                  <div className="p-5 rounded-xl bg-slate-950/30 border border-slate-850 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">Complaint Subject & details</h4>
                      <span className="text-slate-500 text-[10px]">{new Date(selectedComplaintDetails.complaint.created_at).toLocaleString()}</span>
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="font-bold text-white text-sm leading-snug">{selectedComplaintDetails.complaint.subject}</h5>
                      <p className="text-slate-300 leading-relaxed font-light whitespace-pre-line bg-slate-950/50 p-4 rounded-lg border border-slate-909">
                        {selectedComplaintDetails.complaint.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <div>Priority: <span className="text-white">{selectedComplaintDetails.complaint.priority}</span></div>
                      <div>Status: <span className="text-white">{selectedComplaintDetails.complaint.status === 'open' ? 'pending' : selectedComplaintDetails.complaint.status}</span></div>
                      {selectedComplaintDetails.complaint.resolved_at && (
                        <div>Resolved At: <span className="text-emerald-400">{new Date(selectedComplaintDetails.complaint.resolved_at).toLocaleDateString()}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Comments Timeline history (Preserves chronological history) */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Updates & Comment History</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                      {selectedComplaintDetails.updates.map((up) => (
                        <div key={up.id} className="p-3 rounded-lg bg-slate-950/50 border border-slate-909 text-xs space-y-1.5 relative">
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span className="font-bold text-cyan-400 uppercase">
                              {up.employee_name ? `${up.employee_name} (Staff)` : 'Administrator'}
                            </span>
                            <span>{new Date(up.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-300 font-light leading-relaxed">{up.comment}</p>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                            Status context: <span className="text-slate-400">{up.status === 'open' ? 'pending' : up.status}</span>
                          </div>
                        </div>
                      ))}

                      {selectedComplaintDetails.updates.length === 0 && (
                        <div className="py-6 text-center text-slate-600 italic text-xs">No complaint updates logged.</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Side: Actions (Col span 1) */}
                <div className="space-y-6">
                  
                  {/* Assign Technician Form */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Assign Support Technician</h4>
                    <form onSubmit={handleAssignSubmit} className="space-y-3">
                      <select
                        value={assignForm.assigned_employee_id}
                        onChange={(e) => setAssignForm({ assigned_employee_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">-- Unassigned --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.role}) - {emp.designation || 'Staff'}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 font-bold hover:bg-slate-850 transition-colors disabled:opacity-50"
                      >
                        Update Assignment
                      </button>
                    </form>
                  </div>

                  {/* Change Status Form */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Transition Ticket Status</h4>
                    <form onSubmit={handleStatusSubmit} className="space-y-3">
                      <select
                        required
                        value={statusForm.status}
                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>

                      <textarea
                        placeholder="Explain status update reason (Optional)..."
                        value={statusForm.comment}
                        onChange={(e) => setStatusForm({ ...statusForm, comment: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                      />

                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 font-bold hover:bg-slate-850 transition-colors disabled:opacity-50"
                      >
                        Apply Status Transition
                      </button>
                    </form>
                  </div>

                  {/* Add Comment Updates Form */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Add Log Comment</h4>
                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                      <textarea
                        required
                        placeholder="Add updates details or instructions..."
                        value={commentForm.comment}
                        onChange={(e) => setCommentForm({ comment: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-bold hover:bg-slate-850 transition-colors disabled:opacity-50"
                      >
                        Append Comment Update
                      </button>
                    </form>
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

export default ComplaintsManagement;
