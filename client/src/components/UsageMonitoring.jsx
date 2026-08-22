import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined) return 'Data Unavailable';
  const val = parseFloat(bytes);
  if (isNaN(val) || val < 0) return 'Data Unavailable';
  if (val === 0) return '0 Bytes';
  const k = 1024;
  const dm = 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(val) / Math.log(k));
  return parseFloat((val / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function UsageMonitoring({ user, onLogoutSuccess }) {
  const [usage, setUsage] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'Normal', 'Warning', 'High Usage', 'Limit Reached', 'Data Unavailable'
  const [viewFilter, setViewFilter] = useState('daily'); // 'daily', 'monthly'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Usage Monitoring');
  const navigate = useNavigate();

  // Modals visibility states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Focus entity states
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Refresh indicator time state
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');

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

  // Fetch usage list
  const fetchUsage = async (searchStr = '', statusVal = '', viewVal = 'daily') => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/admin/usage?view=${viewVal}`;
      const params = [];
      if (searchStr.trim()) params.push(`search=${encodeURIComponent(searchStr.trim())}`);
      if (statusVal) params.push(`status=${encodeURIComponent(statusVal)}`);
      if (params.length > 0) url += `&${params.join('&')}`;

      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load usage logs.');
      const data = await response.json();
      setUsage(data);
      setError('');
      
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err.message || 'Unable to load usage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage(search, statusFilter, viewFilter);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchUsage(val, statusFilter, viewFilter);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setViewFilter('daily');
    fetchUsage('', '', 'daily');
  };

  const handleStatusFilterChange = (statusVal) => {
    setStatusFilter(statusVal);
    fetchUsage(search, statusVal, viewFilter);
  };

  const handleViewToggleChange = (e) => {
    const val = e.target.value;
    setViewFilter(val);
    fetchUsage(search, statusFilter, val);
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

  // Open Detailed Customer Usage
  const handleOpenDetails = async (customerId) => {
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/usage/customer/${customerId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load detailed customer usage reports.');
      const data = await response.json();
      setSelectedDetails(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Monthly Usage Report Modal
  const handleOpenReport = async () => {
    setShowReportModal(true);
    setReportLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/usage/report', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to generate monthly usage reports.');
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Summary Metrics calculations driven from real database values
  const totalDownloadBytes = usage.reduce((sum, u) => sum + (u.download_bytes || 0), 0);
  const totalUploadBytes = usage.reduce((sum, u) => sum + (u.upload_bytes || 0), 0);
  const totalUsageBytes = totalDownloadBytes + totalUploadBytes;
  const averageUsageBytes = usage.length > 0 ? totalUsageBytes / usage.length : 0;
  const nearLimitCount = usage.filter(u => u.status === 'Warning' || u.status === 'High Usage' || u.status === 'Limit Reached').length;

  // Distribution categorization counts
  const normalCount = usage.filter(u => u.status === 'Normal').length;
  const warningCount = usage.filter(u => u.status === 'Warning').length;
  const highUsageCount = usage.filter(u => u.status === 'High Usage').length;
  const limitReachedCount = usage.filter(u => u.status === 'Limit Reached').length;

  // Sort top customer users for dynamic SVG area rendering
  const topUsers = [...usage]
    .filter(u => u.total_bytes !== null)
    .sort((a, b) => b.total_bytes - a.total_bytes)
    .slice(0, 7);

  // Initials Avatar generator
  const getInitials = (fullName) => {
    if (!fullName) return 'CU';
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
    <div className="flex bg-slate-955 bg-slate-950 min-h-screen text-slate-100 font-sans w-full selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-cyan-805 text-cyan-400 text-sm shadow-xl flex items-center space-x-3 animate-fade-in ring-1 ring-cyan-500/25">
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
                activeTab === item.name || item.name === 'Usage Monitoring'
                  ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400 shadow-md shadow-cyan-500/5'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
              }`}
            >
              <svg className={`w-5 h-5 transition-transform group-hover:scale-105 ${activeTab === item.name || item.name === 'Usage Monitoring' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              <span>{item.name}</span>
              {(activeTab === item.name || item.name === 'Usage Monitoring') && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-subtle" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-955/20 hover:bg-red-950/20 hover:text-red-350 border border-transparent transition-all duration-250"
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
        <header className="border-b border-slate-900 bg-slate-955/40 bg-slate-955/85 bg-slate-950/40 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm uppercase text-white">ISP Admin</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Network Analytics</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{user?.name || 'Administrator'}</p>
              <p className="text-slate-500 text-xs mt-0.5 tracking-wider uppercase">{user?.role || 'admin'}</p>
            </div>
            {/* Avatar Widget */}
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
          
          {/* Header title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-cyan-950/20 border border-cyan-800/35 flex items-center justify-center text-cyan-400 shadow-md">
                📊
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Network Analytics</h2>
                <p className="text-slate-505 text-slate-500 text-xs font-light mt-0.5">Monitor bandwidth consumption, customer usage, package limits and network utilization.</p>
              </div>
            </div>

            <button
              onClick={handleOpenReport}
              disabled={reportLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 font-bold text-white text-xs hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center space-x-2 border border-cyan-400/20 disabled:opacity-50"
            >
              {reportLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span>View Monthly Report</span>
            </button>
          </div>

          {/* Live Network Status Bar Strip */}
          <div className="p-3.5 rounded-xl bg-slate-900/10 border border-cyan-500/15 flex items-center justify-between text-xs glass-card">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="font-semibold text-slate-300">Monitoring Status:</span>
              <span className="text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-850">Active</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-slate-500">
                Last Sync: <span className="text-slate-300 font-bold">{lastUpdatedTime || '--:--'}</span>
              </div>
              <button
                onClick={() => fetchUsage(search, statusFilter, viewFilter)}
                className="p-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-colors"
                title="Refresh Analytics Logs"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Error handling block */}
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-slate-900 bg-slate-955/20 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center text-red-400 animate-pulse">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Unable to load usage logs</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-normal">
                  The bandwidth metrics ledger database fetch failed. Ensure server connection is active.
                </p>
              </div>
              <button
                onClick={() => { setError(''); fetchUsage(search, statusFilter, viewFilter); }}
                className="px-4 py-2 rounded-lg bg-red-955/20 border border-red-900/30 text-red-400 text-xs font-semibold hover:bg-red-900 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Usage Summary Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                
                {/* Total Data Usage */}
                <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Utilization</p>
                    <h4 className="text-lg font-black text-white">{formatBytes(totalUsageBytes)}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/20 border border-cyan-805/20 flex items-center justify-center text-cyan-400 shadow">
                    📊
                  </div>
                </div>

                {/* Total Download */}
                <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Download</p>
                    <h4 className="text-lg font-black text-emerald-400">↓ {formatBytes(totalDownloadBytes)}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-805/20 flex items-center justify-center text-emerald-400 shadow">
                    ▼
                  </div>
                </div>

                {/* Total Upload */}
                <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Upload</p>
                    <h4 className="text-lg font-black text-indigo-400">↑ {formatBytes(totalUploadBytes)}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/20 border border-indigo-805/20 flex items-center justify-center text-indigo-400 shadow">
                    ▲
                  </div>
                </div>

                {/* Average Usage */}
                <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Average/User</p>
                    <h4 className="text-lg font-black text-slate-300">{formatBytes(averageUsageBytes)}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-805 flex items-center justify-center text-slate-550 shadow">
                    ~
                  </div>
                </div>

                {/* Customers Near Limit */}
                <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Near Limit</p>
                    <h4 className="text-lg font-black text-red-400">{nearLimitCount}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-red-955/20 border border-red-805 flex items-center justify-center text-red-400 shadow">
                    ⚠
                  </div>
                </div>

              </div>

              {/* Bandwidth Consumption Chart & Distribution Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main WOW Bandwidth Consumption Chart (Top Customer Data Utilization) */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/10 border border-slate-900/80 glass-card space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Bandwidth Consumption</h4>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mt-0.5 tracking-wider">Top utilization users by download / upload volume</p>
                  </div>

                  {topUsers.length === 0 ? (
                    <div className="text-slate-600 italic text-[11px] py-14 text-center">
                      Usage trends will appear as more monitoring data becomes available.
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {topUsers.map((u) => {
                        const total = u.total_bytes || 0;
                        const dl = u.download_bytes || 0;
                        const ul = u.upload_bytes || 0;
                        const dlPercent = total > 0 ? (dl / total) * 100 : 0;
                        const ulPercent = total > 0 ? (ul / total) * 100 : 0;

                        return (
                          <div key={u.customer_id} className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-300 font-semibold">{u.customer_name}</span>
                              <span className="font-mono text-slate-400">Total: {formatBytes(total)}</span>
                            </div>
                            {/* Horizontal dual bars representing DL vs UL */}
                            <div className="w-full h-3 rounded bg-slate-950 overflow-hidden flex border border-slate-850">
                              <div
                                className="bg-emerald-500 h-full transition-all"
                                style={{ width: `${dlPercent}%` }}
                                title={`Download: ${formatBytes(dl)}`}
                              />
                              <div
                                className="bg-indigo-500 h-full transition-all"
                                style={{ width: `${ulPercent}%` }}
                                title={`Upload: ${formatBytes(ul)}`}
                              />
                            </div>
                            <div className="flex space-x-4 text-[9px] text-slate-500 font-mono">
                              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> <span>Download: {formatBytes(dl)} ({Math.round(dlPercent)}%)</span></span>
                              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> <span>Upload: {formatBytes(ul)} ({Math.round(ulPercent)}%)</span></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Secondary Customer Usage Distribution Card */}
                <div className="p-5 rounded-2xl bg-slate-900/10 border border-slate-900/80 glass-card flex flex-col justify-between text-xs space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Usage Distribution</h4>
                    <p className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold mt-0.5 tracking-wider">Registered usage category splits</p>
                  </div>

                  {usage.length === 0 ? (
                    <div className="text-slate-600 italic text-[11px] py-14 text-center">
                      Usage categories distribution will update dynamically.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Normal category */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Normal Usage</span>
                          <span className="text-white font-mono font-bold">{normalCount}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-900 overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ width: `${(normalCount / usage.length) * 100}%` }} />
                        </div>
                      </div>

                      {/* Warning category */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Warning State</span>
                          <span className="text-amber-450 font-mono font-bold">{warningCount}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-900 overflow-hidden">
                          <div className="bg-amber-400 h-full" style={{ width: `${(warningCount / usage.length) * 100}%` }} />
                        </div>
                      </div>

                      {/* High Usage category */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">High Usage</span>
                          <span className="text-orange-450 font-mono font-bold">{highUsageCount}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-900 overflow-hidden">
                          <div className="bg-orange-500 h-full" style={{ width: `${(highUsageCount / usage.length) * 100}%` }} />
                        </div>
                      </div>

                      {/* Limit Reached category */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Limit Reached</span>
                          <span className="text-red-400 font-mono font-bold">{limitReachedCount}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-900 overflow-hidden">
                          <div className="bg-red-500 h-full" style={{ width: `${(limitReachedCount / usage.length) * 100}%` }} />
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="border-t border-slate-900 pt-3 text-[10px] text-slate-500 leading-normal">
                    Categories evaluated automatically based on user total bytes vs package limit values.
                  </div>
                </div>

              </div>

              {/* Floating Filter Panel */}
              <div className="p-4 rounded-2xl bg-slate-900/25 border border-slate-900 backdrop-blur-md space-y-4 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  
                  {/* Search box input */}
                  <div className="relative w-full md:col-span-3">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search usage by customer name, customer code, or phone..."
                      value={search}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-605 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 transition-colors text-xs shadow-inner animate-focus"
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

                  {/* View Period select selector */}
                  <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-900">
                    <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0 tracking-wider">Period:</label>
                    <select
                      value={viewFilter}
                      onChange={handleViewToggleChange}
                      className="w-full bg-transparent text-slate-205 focus:outline-none text-xs text-white"
                    >
                      <option value="daily" className="bg-slate-950 text-white">Daily Usage</option>
                      <option value="monthly" className="bg-slate-950 text-white">Monthly Usage</option>
                    </select>
                  </div>

                </div>

                {/* Status Tab Filters (Pill Navigation style) */}
                <div className="flex flex-wrap gap-2 pt-3.5 border-t border-slate-900/50">
                  {[
                    { name: 'All Usage States', value: '' },
                    { name: 'Normal', value: 'Normal' },
                    { name: 'Warning', value: 'Warning' },
                    { name: 'High Usage', value: 'High Usage' },
                    { name: 'Limit Reached', value: 'Limit Reached' },
                    { name: 'Data Unavailable', value: 'Data Unavailable' }
                  ].map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => handleStatusFilterChange(tab.value)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                        statusFilter === tab.value
                          ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/25 text-cyan-400 font-bold shadow-md shadow-cyan-500/5'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bandwidth monitoring table directory */}
              <div className="rounded-2xl border border-slate-900 bg-slate-955/20 bg-slate-955/25 bg-slate-950/20 backdrop-blur-sm overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-6 space-y-3.5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="shimmer-loader h-14 rounded-xl opacity-20" />
                      ))}
                    </div>
                  ) : usage.length === 0 ? (
                    /* Dynamic Empty States (Genuine empty vs Search filter empty) */
                    search || statusFilter ? (
                      <div className="py-20 text-center max-w-md mx-auto space-y-4 animate-fade-in">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-550 mx-auto">
                          🔍
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-sm">No matching usage records</h4>
                          <p className="text-xs text-slate-500">Try changing your search or usage-state filters.</p>
                        </div>
                        <button
                          onClick={handleClearFilters}
                          className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-355 text-slate-350 text-xs font-semibold hover:text-white transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <div className="py-24 text-center max-w-md mx-auto space-y-6 animate-fade-in">
                        <div className="relative w-16 h-16 rounded-full bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-center text-cyan-400 mx-auto">
                          <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-md pulse-subtle" />
                          📊
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-white text-base">No usage data available</h4>
                          <p className="text-xs text-slate-505 text-slate-500 leading-relaxed">
                            Customer bandwidth usage will appear here once monitoring data is available.
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-4 px-4">Customer</th>
                          <th className="py-4 px-4">Plan Package</th>
                          <th className="py-4 px-4">Download</th>
                          <th className="py-4 px-4">Upload</th>
                          <th className="py-4 px-4">Total Usage</th>
                          <th className="py-4 px-4">Usage Limit</th>
                          <th className="py-4 px-4">Limit Percentage</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4">Last Updated</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage.map((u) => (
                          <tr key={u.customer_id} className="border-b border-slate-950/60 table-row-hover text-slate-300">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                {/* initials avatars */}
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr border flex items-center justify-center font-bold text-xs shadow-md transition-transform duration-200 hover:scale-105 ${getAvatarColorClass(u.customer_name)}`}>
                                  {getInitials(u.customer_name)}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm">{u.customer_name}</div>
                                  <div className="text-slate-500 font-light text-[10px] tracking-wider uppercase mt-0.5 font-mono">{u.customer_code}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-300 font-medium">{u.package_name}</td>
                            <td className="py-4 px-4 text-slate-350 font-mono">↓ {u.download_bytes !== null ? formatBytes(u.download_bytes) : '-'}</td>
                            <td className="py-4 px-4 text-slate-350 font-mono">↑ {u.upload_bytes !== null ? formatBytes(u.upload_bytes) : '-'}</td>
                            <td className="py-4 px-4 text-white font-bold font-mono">{u.total_bytes !== null ? formatBytes(u.total_bytes) : 'Data Unavailable'}</td>
                            <td className="py-4 px-4 text-slate-350 font-medium">
                              {u.package_limit_gb ? `${u.package_limit_gb} GB` : 'Unlimited'}
                            </td>
                            <td className="py-4 px-4">
                              {u.usage_percentage !== null ? (
                                <div className="space-y-1.5 w-28">
                                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                    <span>{u.usage_percentage}%</span>
                                  </div>
                                  <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-350 ${
                                        u.usage_percentage >= 100
                                          ? 'bg-red-500'
                                          : u.usage_percentage >= 90
                                          ? 'bg-orange-500'
                                          : u.usage_percentage >= 80
                                          ? 'bg-amber-400'
                                          : 'bg-cyan-500'
                                      }`}
                                      style={{ width: `${Math.min(u.usage_percentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600 font-light">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center w-fit space-x-1.5 ${
                                u.status === 'Normal'
                                  ? 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400'
                                  : u.status === 'Warning'
                                  ? 'bg-amber-955/30 border border-amber-800/30 text-amber-400'
                                  : u.status === 'High Usage'
                                  ? 'bg-orange-955/30 border border-orange-800/30 text-orange-400 animate-pulse'
                                  : u.status === 'Limit Reached'
                                  ? 'bg-red-955/35 border border-red-800/30 text-red-400 animate-pulse'
                                  : 'bg-slate-900 border border-slate-800 text-slate-550'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${
                                  u.status === 'Normal' ? 'bg-emerald-400' :
                                  u.status === 'Warning' ? 'bg-amber-400 pulse-subtle' :
                                  u.status === 'High Usage' ? 'bg-orange-400' :
                                  u.status === 'Limit Reached' ? 'bg-red-450' : 'bg-slate-550'
                                }`} />
                                <span>{u.status}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-450">
                              {u.last_updated ? new Date(u.last_updated).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleOpenDetails(u.customer_id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 hover:text-cyan-305 transition-all duration-200 hover:scale-105 active:scale-95"
                                title="View Customer Usage details"
                              >
                                Details
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

      {/* 3. MODAL: Single Customer Usage Details */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 relative animate-fade-in">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-white">Bandwidth Detail Sheet</h3>
                <p className="text-slate-500 text-[10px] font-light mt-0.5">Real-time daily vs monthly utilization breakdowns.</p>
              </div>
              <button onClick={() => { setShowDetailsModal(false); setSelectedDetails(null); }} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {detailsLoading || !selectedDetails ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-slate-550 text-slate-500 font-bold uppercase tracking-wider">Syncing details records...</span>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                
                {/* Profile header */}
                <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-none">{selectedDetails.customer.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">{selectedDetails.customer.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold leading-none">Subscribed Plan</p>
                      <p className="text-cyan-405 text-cyan-400 font-bold text-xs mt-1">{selectedDetails.customer.package_name}</p>
                    </div>
                  </div>
                </div>

                {/* Warning message alerts */}
                {selectedDetails.monthly && selectedDetails.monthly.percentage !== null && (
                  <div>
                    {selectedDetails.monthly.percentage >= 100 ? (
                      <div className="p-3.5 rounded-xl bg-red-955/20 border border-red-900/30 text-red-400 font-bold leading-relaxed">
                        ⚠️ Limit Reached: Customer has reached the package data limit.
                      </div>
                    ) : selectedDetails.monthly.percentage >= 90 ? (
                      <div className="p-3.5 rounded-xl bg-orange-955/20 border border-orange-900/30 text-orange-400 font-bold leading-relaxed">
                        ⚠️ High Usage: Customer has used {selectedDetails.monthly.percentage}% of the package data limit.
                      </div>
                    ) : selectedDetails.monthly.percentage >= 80 ? (
                      <div className="p-3.5 rounded-xl bg-amber-955/25 border border-amber-900/30 text-amber-400 font-bold leading-relaxed">
                        ⚠️ Warning: Customer has used {selectedDetails.monthly.percentage}% of the package data limit.
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Bandwidth progress limit bar if applicable */}
                {selectedDetails.monthly && selectedDetails.monthly.percentage !== null ? (
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      <span>Monthly Allocation Consumed</span>
                      <span className="font-mono text-white">{selectedDetails.monthly.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-850">
                      <div
                        className={`h-full rounded-full ${
                          selectedDetails.monthly.percentage >= 100
                            ? 'bg-red-500'
                            : selectedDetails.monthly.percentage >= 90
                            ? 'bg-orange-500'
                            : selectedDetails.monthly.percentage >= 80
                            ? 'bg-amber-400'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.min(selectedDetails.monthly.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between font-bold uppercase tracking-wider text-[10px] text-slate-405 text-slate-400">
                    <span>Monthly Limit:</span>
                    <span className="text-white">
                      {selectedDetails.customer.package_limit_gb ? `${selectedDetails.customer.package_limit_gb} GB` : 'Unlimited'}
                    </span>
                  </div>
                )}

                {/* Sub-summaries: Daily vs Monthly */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Daily metrics */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-855 border-slate-900 space-y-2 text-xs">
                    <h5 className="font-bold text-cyan-400 uppercase tracking-wider text-[9px]">Today's Usage</h5>
                    {selectedDetails.today ? (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between"><span className="text-slate-500">Download:</span><span className="text-white font-medium">{formatBytes(selectedDetails.today.download_bytes)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Upload:</span><span className="text-white font-medium">{formatBytes(selectedDetails.today.upload_bytes)}</span></div>
                        <div className="flex justify-between font-bold border-t border-slate-900 pt-1.5"><span className="text-slate-400">Total:</span><span className="text-white">{formatBytes(selectedDetails.today.total_bytes)}</span></div>
                      </div>
                    ) : (
                      <p className="text-slate-655 italic py-4 text-center">Usage data is not available.</p>
                    )}
                  </div>

                  {/* Monthly metrics */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-855 border-slate-900 space-y-2 text-xs">
                    <h5 className="font-bold text-indigo-400 uppercase tracking-wider text-[9px]">Monthly Usage</h5>
                    {selectedDetails.monthly ? (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between"><span className="text-slate-500">Download:</span><span className="text-white font-medium">{formatBytes(selectedDetails.monthly.download_bytes)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Upload:</span><span className="text-white font-medium">{formatBytes(selectedDetails.monthly.upload_bytes)}</span></div>
                        <div className="flex justify-between font-bold border-t border-slate-900 pt-1.5"><span className="text-slate-405 text-slate-400">Total:</span><span className="text-white">{formatBytes(selectedDetails.monthly.total_bytes)}</span></div>
                      </div>
                    ) : (
                      <p className="text-slate-655 italic py-4 text-center">Usage data is not available.</p>
                    )}
                  </div>

                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL: Monthly Usage Report Display */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-955/70 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto relative scrollbar-thin">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-white">Monthly Bandwidth Report</h3>
                <p className="text-[10px] text-slate-505 text-slate-500 mt-0.5 uppercase font-bold tracking-wider">Current Month Billing Period</p>
              </div>
              <button onClick={() => { setShowReportModal(false); setReportData([]); }} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-slate-505 text-slate-500 font-bold uppercase tracking-wider">Generating report summary...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto rounded-xl border border-slate-855 border-slate-900">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-400 font-bold uppercase">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Package</th>
                        <th className="py-3 px-4">Download</th>
                        <th className="py-3 px-4">Upload</th>
                        <th className="py-3 px-4">Total Usage</th>
                        <th className="py-3 px-4">Usage Limit</th>
                        <th className="py-3 px-4">Percentage</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.length > 0 ? (
                        reportData.map((r) => (
                          <tr key={r.customer_id} className="border-b border-slate-950/20 text-slate-300 hover:bg-slate-905/10">
                            <td className="py-3 px-4 font-bold text-white">{r.customer_name} ({r.customer_code})</td>
                            <td className="py-3 px-4">{r.package_name}</td>
                            <td className="py-3 px-4">{r.download_bytes !== null ? formatBytes(r.download_bytes) : '-'}</td>
                            <td className="py-3 px-4">{r.upload_bytes !== null ? formatBytes(r.upload_bytes) : '-'}</td>
                            <td className="py-3 px-4 font-bold text-white">{r.total_bytes !== null ? formatBytes(r.total_bytes) : 'Data Unavailable'}</td>
                            <td className="py-3 px-4 font-medium">{r.package_limit_gb ? `${r.package_limit_gb} GB` : 'Unlimited'}</td>
                            <td className="py-3 px-4 font-mono">{r.usage_percentage !== null ? `${r.usage_percentage}%` : '-'}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                r.status === 'Normal' ? 'bg-emerald-950/40 text-emerald-400' : r.status === 'Data Unavailable' ? 'bg-slate-900 text-slate-500' : 'bg-red-950/40 text-red-400'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-655 italic">No data entries available to compile reports.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold hover:text-white transition-colors"
                  >
                    Print Report
                  </button>
                  <button
                    onClick={() => { setShowReportModal(false); setReportData([]); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default UsageMonitoring;
