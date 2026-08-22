import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatPKR = (amount) => {
  const val = parseFloat(amount) || 0;
  return `Rs. ${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * AnimatedNumber counts up from 0 to the target value smoothly.
 */
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 650; // ms
    const stepTime = Math.max(Math.floor(duration / end), 16);
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration / stepTime));
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function AdminDashboard({ user, onLogoutSuccess }) {
  const [stats, setStats] = useState({ totalCustomers: 0, activeCustomers: 0, pendingBills: 0, openComplaints: 0 });
  const [charts, setCharts] = useState({ customerGrowth: [], monthlyRevenue: [] });
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [toastMessage, setToastMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const navigate = useNavigate();

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

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const reqOpts = { method: 'GET', credentials: 'include', headers };

      const [statsRes, chartsRes, paymentsRes, complaintsRes] = await Promise.all([
        fetch('http://localhost:5000/api/dashboard/stats', reqOpts),
        fetch('http://localhost:5000/api/dashboard/charts', reqOpts),
        fetch('http://localhost:5000/api/dashboard/recent-payments', reqOpts),
        fetch('http://localhost:5000/api/dashboard/recent-complaints', reqOpts)
      ]);

      if (!statsRes.ok || !chartsRes.ok || !paymentsRes.ok || !complaintsRes.ok) {
        throw new Error('Failed to load operational dashboard metrics.');
      }

      const [statsData, chartsData, paymentsData, complaintsData] = await Promise.all([
        statsRes.json(),
        chartsRes.json(),
        paymentsRes.json(),
        complaintsRes.json()
      ]);

      setStats(statsData);
      setCharts(chartsData);
      setRecentPayments(paymentsData);
      setRecentComplaints(complaintsData);
      
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(currentTime);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  // Helper values to render SVGs
  const maxGrowth = Math.max(...(charts.customerGrowth || []).map(d => d.count), 5);
  const maxRevenue = Math.max(...(charts.monthlyRevenue || []).map(d => d.revenue), 1000);

  // loading state skeletons
  if (loading) {
    return (
      <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans w-full">
        <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md hidden md:flex flex-col h-screen sticky top-0">
          <div className="p-6 border-b border-slate-900">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 animate-pulse" />
              <div className="w-24 h-4 bg-slate-900 rounded animate-pulse" />
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-full h-11 bg-slate-900/50 rounded-xl animate-pulse" />
            ))}
          </nav>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-slate-900 bg-slate-950/40 py-5 px-6 md:px-8 flex justify-between items-center">
            <div className="w-48 h-6 bg-slate-900 rounded animate-pulse" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 animate-pulse" />
          </header>
          <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="shimmer-loader h-28 rounded-2xl opacity-20" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="shimmer-loader h-64 rounded-2xl opacity-20" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="shimmer-loader h-72 rounded-2xl opacity-20" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

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
      <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md hidden md:flex flex-col h-screen sticky top-0 z-40">
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg">
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
                  ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/5 border border-cyan-500/20 text-cyan-400'
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
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header bar */}
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4 md:hidden">
            {/* Small screen brand indicator */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm uppercase text-white">ISP Admin</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Operational Dashboard</h1>
          
          {/* User profile widget */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{user?.name || 'Administrator'}</p>
              <p className="text-slate-500 text-xs mt-0.5 tracking-wider uppercase">{user?.role || 'admin'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-600/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-sm shadow-md">
              {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            {/* Small screen logout button */}
            <button onClick={handleLogout} className="md:hidden p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Dashboard Grid Container */}
        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl w-full mx-auto fade-in-up">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900/60">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">System Metrics</h2>
              <p className="text-xs text-slate-500">Real-time indicators fetched directly from Neon database</p>
            </div>
            {lastUpdated && (
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 bg-slate-900/30 px-3 py-1.5 rounded-lg border border-slate-900">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Last updated: {lastUpdated}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/30 text-red-300 text-sm flex items-center space-x-3 shadow-md animate-pulse">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* 3. 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Customers */}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Customers</p>
                  <h3 className="text-3xl font-black text-white leading-none">
                    <AnimatedNumber value={stats.totalCustomers} />
                  </h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center text-cyan-400 shadow-md group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 font-medium">Provisioned database clients</p>
            </div>

            {/* Card 2: Active Customers */}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Active Customers</p>
                  <h3 className="text-3xl font-black text-white leading-none">
                    <AnimatedNumber value={stats.activeCustomers} />
                  </h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center text-emerald-400 shadow-md group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-emerald-500/80 mt-3 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Service running active</span>
              </p>
            </div>

            {/* Card 3: Pending Bills */}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Pending Bills</p>
                  <h3 className="text-3xl font-black text-white leading-none">
                    <AnimatedNumber value={stats.pendingBills} />
                  </h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-950/40 border border-amber-800/30 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-amber-500/80 mt-3 font-semibold flex items-center space-x-1">
                <span>Requires payment action</span>
              </p>
            </div>

            {/* Card 4: Open Complaints */}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Open Complaints</p>
                  <h3 className="text-3xl font-black text-white leading-none">
                    <AnimatedNumber value={stats.openComplaints} />
                  </h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-rose-950/40 border border-rose-800/30 flex items-center justify-center text-rose-400 shadow-md group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 font-medium">Unresolved support tickets</p>
            </div>

          </div>

          {/* 4. Charting Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Customer Growth — Line Chart */}
            <div className="p-6 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Customer Growth</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">Customer profiles provisioned over the last 6 months</p>
              </div>
              
              <div className="relative h-48 w-full flex items-center justify-center">
                {charts.customerGrowth && charts.customerGrowth.length > 0 ? (
                  <svg viewBox="0 0 500 200" className="w-full h-full text-cyan-500">
                    {/* Grid lines */}
                    <line x1="50" y1="30" x2="480" y2="30" stroke="#101827" strokeDasharray="3,3" />
                    <line x1="50" y1="95" x2="480" y2="95" stroke="#101827" strokeDasharray="3,3" />
                    <line x1="50" y1="160" x2="480" y2="160" stroke="#101827" strokeDasharray="3,3" />
                    
                    {/* Axes */}
                    <line x1="50" y1="20" x2="50" y2="165" stroke="#1e293b" />
                    <line x1="50" y1="165" x2="480" y2="165" stroke="#1e293b" />

                    {/* Y-axis Labels */}
                    <text x="35" y="35" fill="#475569" fontSize="9" textAnchor="end">{maxGrowth}</text>
                    <text x="35" y="100" fill="#475569" fontSize="9" textAnchor="end">{Math.round(maxGrowth / 2)}</text>
                    <text x="35" y="165" fill="#475569" fontSize="9" textAnchor="end">0</text>

                    {/* Trend path mapping */}
                    {(() => {
                      const points = charts.customerGrowth.map((d, index) => {
                        const x = 50 + (index * (430 / 5));
                        const y = 160 - (d.count / maxGrowth) * 130;
                        return { x, y, label: d.month_label.split(' ')[0] };
                      });

                      const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                      const fillD = `${pathD} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`;

                      return (
                        <>
                          <path d={fillD} fill="url(#cyan-gradient)" opacity="0.1" />
                          <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" className="animate-chart-line" />
                          {points.map((p, i) => (
                            <g key={i} className="group/dot">
                              <circle cx={p.x} cy={p.y} r="3.5" className="fill-slate-950 stroke-cyan-500 stroke-2 hover:r-5 cursor-pointer transition-all duration-200" />
                              <text x={p.x} y="185" fill="#475569" fontSize="9" textAnchor="middle">{p.label}</text>
                            </g>
                          ))}
                          <defs>
                            <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="currentColor" />
                              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border border-slate-900 bg-slate-950/20 rounded-2xl p-6">
                    <svg className="w-8 h-8 text-slate-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs text-slate-500 font-medium">No customer data available yet.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Revenue — Bar Chart */}
            <div className="p-6 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Monthly Revenue</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">Completed payments sum grouped by month</p>
              </div>
              
              <div className="relative h-48 w-full flex items-center justify-center">
                {charts.monthlyRevenue && charts.monthlyRevenue.length > 0 ? (
                  <svg viewBox="0 0 500 200" className="w-full h-full text-indigo-500">
                    {/* Grid lines */}
                    <line x1="50" y1="30" x2="480" y2="30" stroke="#101827" strokeDasharray="3,3" />
                    <line x1="50" y1="95" x2="480" y2="95" stroke="#101827" strokeDasharray="3,3" />
                    <line x1="50" y1="160" x2="480" y2="160" stroke="#101827" strokeDasharray="3,3" />
                    
                    {/* Axes */}
                    <line x1="50" y1="20" x2="50" y2="165" stroke="#1e293b" />
                    <line x1="50" y1="165" x2="480" y2="165" stroke="#1e293b" />

                    {/* Y-axis Labels */}
                    <text x="35" y="35" fill="#475569" fontSize="9" textAnchor="end">Rs. {maxRevenue.toLocaleString()}</text>
                    <text x="35" y="100" fill="#475569" fontSize="9" textAnchor="end">Rs. {Math.round(maxRevenue / 2).toLocaleString()}</text>
                    <text x="35" y="165" fill="#475569" fontSize="9" textAnchor="end">Rs. 0</text>

                    {/* Bar columns */}
                    {(() => {
                      const barWidth = 24;
                      const points = charts.monthlyRevenue.map((d, index) => {
                        const x = 70 + (index * (410 / 5)) - (barWidth / 2);
                        const height = (d.revenue / maxRevenue) * 130;
                        const y = 160 - height;
                        return { x, y, w: barWidth, h: Math.max(height, 2), label: d.month_label.split(' ')[0] };
                      });

                      return (
                        <>
                          {points.map((p, i) => (
                            <g key={i}>
                              <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="3" className="fill-indigo-600/20 hover:fill-indigo-500/60 stroke-indigo-500/20 hover:stroke-indigo-400/40 stroke cursor-pointer transition-all duration-200 animate-chart-bar" />
                              <text x={p.x + p.w / 2} y="185" fill="#475569" fontSize="9" textAnchor="middle">{p.label}</text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border border-slate-900 bg-slate-950/20 rounded-2xl p-6">
                    <svg className="w-8 h-8 text-slate-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-slate-500 font-medium">No payment data available yet.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 5. Lists & Telemetry Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recent Payments Table */}
            <div className="p-6 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-6 flex flex-col">
              <div>
                <h3 className="text-lg font-bold text-white">Recent Payments</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">Latest account transaction logs</p>
              </div>
              
              <div className="overflow-x-auto flex-grow">
                {recentPayments.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3.5 pl-2">Customer</th>
                        <th className="pb-3.5">Method</th>
                        <th className="pb-3.5">Amount</th>
                        <th className="pb-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((p) => (
                        <tr key={p.id} className="border-b border-slate-950/20 table-row-hover text-slate-300">
                          <td className="py-3.5 pl-2 font-semibold text-white">{p.customer_name}</td>
                          <td className="py-3.5 text-slate-400 uppercase tracking-wide text-[10px]">{p.payment_method}</td>
                          <td className="py-3.5 font-bold text-slate-200">{formatPKR(p.amount)}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              p.status === 'completed' || p.status === 'Paid' 
                                ? 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400' 
                                : 'bg-amber-950/40 border border-amber-800/30 text-amber-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-2 border border-slate-900 bg-slate-950/10 rounded-xl">
                    <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-xs font-medium italic text-slate-500">No recent transactions recorded in database.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Complaints Table */}
            <div className="p-6 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-6 flex flex-col">
              <div>
                <h3 className="text-lg font-bold text-white">Recent Complaints</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">Latest support tickets generated by customers</p>
              </div>
              
              <div className="overflow-x-auto flex-grow">
                {recentComplaints.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3.5 pl-2">Subject</th>
                        <th className="pb-3.5">Customer</th>
                        <th className="pb-3.5">Priority</th>
                        <th className="pb-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentComplaints.map((c) => (
                        <tr key={c.id} className="border-b border-slate-950/20 table-row-hover text-slate-300">
                          <td className="py-3.5 pl-2 font-semibold text-white truncate max-w-[150px]" title={c.subject}>{c.subject}</td>
                          <td className="py-3.5 text-slate-350">{c.customer_name}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              c.priority === 'high' || c.priority === 'urgent'
                                ? 'bg-red-950/40 border border-red-800/30 text-red-400' 
                                : 'bg-slate-900 border border-slate-800 text-slate-400'
                            }`}>
                              {c.priority}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              c.status === 'pending' ? 'bg-amber-955/30 border border-amber-800/30 text-amber-400' :
                              c.status === 'in_progress' ? 'bg-blue-950/40 border border-blue-800/30 text-blue-400' :
                              c.status === 'resolved' ? 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400' :
                              'bg-slate-900 border border-slate-800 text-slate-500'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-2 border border-slate-900 bg-slate-950/10 rounded-xl">
                    <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs font-medium italic text-slate-500">No open complaint tickets recorded in database.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 6. Network Integration Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div>
                <h3 className="text-lg font-bold text-white">Network Integration</h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">Real-time bandwidth utilization, optical signals, and system telemetry monitoring</p>
              </div>
              <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-blue-950/30 border border-blue-900/30 text-blue-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-400 pulse-subtle" />
                <span>Setup Required</span>
              </div>
            </div>

            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3.5 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-950/20 border border-blue-900/20 flex items-center justify-center text-blue-400 shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-white text-sm">Network Integration: Not Connected</h4>
                <p className="text-xs text-slate-500 font-light leading-relaxed">
                  Setup Required — Network telemetry will appear once the ISP network integration is connected.
                </p>
                <div className="pt-3 flex flex-wrap justify-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="px-2 py-0.5 rounded border border-slate-900 bg-slate-950/20">MikroTik APIS</span>
                  <span className="px-2 py-0.5 rounded border border-slate-900 bg-slate-950/20">RADIUS Auth</span>
                  <span className="px-2 py-0.5 rounded border border-slate-900 bg-slate-950/20">SNMP Bridges</span>
                  <span className="px-2 py-0.5 rounded border border-slate-900 bg-slate-950/20">NAS Telemetry</span>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}

export default AdminDashboard;
