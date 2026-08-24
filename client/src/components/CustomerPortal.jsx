import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatPKR = (amount) => {
  const val = parseFloat(amount) || 0;
  return `Rs. ${val.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'assigned':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
    case 'accepted':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-450 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
    case 'on_the_way':
    case 'on the way':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
    case 'in_progress':
    case 'in progress':
      return 'bg-amber-500/10 text-amber-605 dark:text-amber-450 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
    case 'completed':
    case 'resolved':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
    case 'pending':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
    case 'rejected':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
  }
};

export default function CustomerPortal({ user, onLogoutSuccess }) {
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const parseComplaintType = (subj) => {
    const match = (subj || '').match(/^\[(.*?)\]/);
    return match ? match[1] : 'General Support';
  };

  const parseCleanSubject = (subj) => {
    return (subj || '').replace(/^\[.*?\]\s*/, '');
  };

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dashboard & details states
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [service, setService] = useState(null);
  const [billing, setBilling] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [requests, setRequests] = useState([]);

  // Modal / Detail states
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Forms states
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', email: '', address: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '', priority: 'medium', complaint_type: 'Speed Issue' });
  const [requestForm, setRequestForm] = useState({ request_type: 'Package Change', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Theme states
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('isp-employee-theme') || 'auto';
  });
  const [activeTheme, setActiveTheme] = useState('dark');
  const navigate = useNavigate();

  // Load all required data
  const loadPortalData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch Dashboard context
      const dashRes = await fetch('http://localhost:5000/api/customer/dashboard', { credentials: 'include' });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboardData(dashData);
      }

      // 2. Fetch Profile
      const profRes = await fetch('http://localhost:5000/api/customer/profile', { credentials: 'include' });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
        setProfileForm({
          full_name: profData.full_name,
          phone: profData.phone,
          email: profData.email,
          address: profData.address || ''
        });
      }

      // 3. Fetch Service
      const servRes = await fetch('http://localhost:5000/api/customer/service', { credentials: 'include' });
      if (servRes.ok) {
        const servData = await servRes.json();
        setService(servData);
      }

      // 4. Fetch Billing
      const billRes = await fetch('http://localhost:5000/api/customer/billing', { credentials: 'include' });
      if (billRes.ok) {
        const billData = await billRes.json();
        setBilling(billData);
      }

      // 5. Fetch Complaints
      const compRes = await fetch('http://localhost:5000/api/customer/complaints', { credentials: 'include' });
      if (compRes.ok) {
        const compData = await compRes.json();
        setComplaints(compData);
      }

      // 6. Fetch Service Requests
      const reqRes = await fetch('http://localhost:5000/api/customer/service-requests', { credentials: 'include' });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData);
      }

    } catch (err) {
      setError('Connection to server failed. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  // Theme Sync effect
  useEffect(() => {
    const evaluateTheme = () => {
      const savedPref = localStorage.getItem('isp-employee-theme') || themePreference;
      if (savedPref === 'light') {
        setActiveTheme('light');
      } else if (savedPref === 'dark') {
        setActiveTheme('dark');
      } else {
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActiveTheme(systemPrefersDark ? 'dark' : 'light');
      }
    };
    evaluateTheme();
  }, [themePreference]);

  // Logout routine
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn("Logout endpoint unreachable.");
    }
    onLogoutSuccess();
    navigate('/customer/login');
  };

  // Submit Profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      alert('Profile details updated successfully.');
      loadPortalData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Password update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/customer/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');

      alert('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/customer/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to file complaint.');

      alert('Complaint submitted successfully.');
      setComplaintForm({ subject: '', description: '', priority: 'medium', complaint_type: 'Speed Issue' });
      loadPortalData();
      setActiveTab('Complaints');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Service Request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/customer/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit service request.');

      alert('Service request filed successfully.');
      setRequestForm({ request_type: 'Package Change', description: '' });
      loadPortalData();
      setActiveTab('Requests');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // View Specific Complaint history updates
  const viewComplaintDetails = async (id) => {
    setDetailsLoading(true);
    setShowComplaintModal(true);
    try {
      const res = await fetch(`http://localhost:5000/api/customer/complaints/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load complaint logs.');
      const data = await res.json();
      setSelectedComplaint(data.complaint);
      setComplaintHistory(data.history);
    } catch (err) {
      alert(err.message);
      setShowComplaintModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Dynamic system notifications resolved from real data
  const getDynamicNotifications = () => {
    const list = [];
    if (dashboardData) {
      if (dashboardData.currentBill > 0) {
        list.push({
          id: 'bill_due',
          title: 'Outstanding Invoice Due',
          message: `Your current outstanding balance is ${formatPKR(dashboardData.currentBill)}. Please make a payment to avoid service interruption.`,
          date: new Date().toLocaleDateString(),
          type: 'critical'
        });
      }
      if (dashboardData.accountStatus === 'suspended') {
        list.push({
          id: 'suspended_alert',
          title: 'Account Service Suspended',
          message: 'Your high-speed link is currently suspended due to overdue billing invoices. Service will auto-resume upon payment clearance.',
          date: new Date().toLocaleDateString(),
          type: 'critical'
        });
      }
    }
    list.push({
      id: 'welcome_notice',
      title: 'Portal Ready',
      message: 'Welcome to your new Customer Self-Service Portal! Track bills, file service tickets, and update profile context dynamically.',
      date: new Date(profile?.installation_date || new Date()).toLocaleDateString(),
      type: 'info'
    });
    return list;
  };

  const notificationsList = getDynamicNotifications();

  // Unified Activity Feed compiler
  const getActivityFeed = () => {
    const feed = [];
    complaints.slice(0, 3).forEach(c => {
      feed.push({
        type: 'Complaint Filed',
        title: parseCleanSubject(c.subject),
        date: c.created_at,
        status: c.status,
        color: c.status === 'resolved' ? 'emerald' : 'cyan'
      });
    });
    requests.slice(0, 3).forEach(r => {
      feed.push({
        type: 'Service Request',
        title: r.task_type,
        date: r.created_at,
        status: r.status,
        color: r.status === 'completed' ? 'emerald' : 'amber'
      });
    });
    billing.slice(0, 3).forEach(b => {
      feed.push({
        type: 'Billing Invoice',
        title: `Issued for ${b.billing_month}`,
        date: b.due_date,
        status: b.status,
        color: b.status === 'paid' ? 'emerald' : 'rose'
      });
    });
    return feed.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  };

  const recentActivities = getActivityFeed();

  // Sidebar navigation mapping
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'Service', label: 'My Internet', icon: '🌐' },
    { id: 'Requests', label: 'Service Requests', icon: '🛠️' },
    { id: 'Complaints', label: 'Complaints', icon: '🚨' },
    { id: 'Billing', label: 'Billing & Payments', icon: '💳' },
    { id: 'Profile', label: 'My Profile', icon: '👤' },
    { id: 'Notifications', label: 'Notifications', icon: '🔔' },
    { id: 'Password', label: 'Change Password', icon: '🔐' }
  ];

  // Render skeletons during initial loading state
  const renderSkeletons = () => (
    <div className="space-y-6 animate-pulse p-6">
      {/* Hero skeleton */}
      <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800 w-full" />
      
      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>

      {/* Sub-panels skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen font-sans w-full selection:bg-cyan-500 overflow-x-hidden relative theme-transition ${
      activeTheme === 'dark' 
        ? 'dark bg-[#050914] text-slate-100' 
        : 'bg-[#F5F7FB] text-slate-900'
    }`}>
      
      {/* Theme Transition Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .theme-transition, .theme-transition *, .theme-transition aside, .theme-transition main, .theme-transition header, .theme-transition div {
          transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}} />

      {/* 1. Desktop Sidebar */}
      <aside className="w-[260px] border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-[#080D18] hidden lg:flex flex-col h-screen sticky top-0 z-40 shrink-0">
        <div className="p-5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-650 flex items-center justify-center shadow-md shadow-cyan-500/10">
              <span className="text-white text-xs">🌐</span>
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white block">CUSTOMER PORTAL</span>
              <span className="text-[8px] text-cyan-600 dark:text-cyan-400 font-bold tracking-widest block uppercase mt-0.5">Self Service Hub</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav menu links */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${
                activeTab === item.id 
                  ? 'bg-cyan-50 dark:bg-slate-900 text-cyan-600 dark:text-cyan-450 border-l-[3px] border-cyan-500 dark:border-cyan-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
              
              {/* Highlight dot if notifications has count */}
              {item.id === 'Notifications' && notificationsList.length > 0 && (
                <span className="absolute right-4 w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
              )}
            </button>
          ))}
        </nav>

        {/* Logout section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-300 transition-colors duration-150"
          >
            <span className="text-base leading-none">🚪</span>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-[260px] bg-white dark:bg-[#080D18] border-r border-slate-200 dark:border-slate-900 flex flex-col h-full p-4 relative animate-slide-in-left">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-800 dark:hover:text-white"
            >
              ✕
            </button>

            <div className="py-4 border-b border-slate-100 dark:border-slate-900 flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white text-xs">🌐</div>
              <span className="font-extrabold text-xs text-slate-909 text-slate-900 dark:text-white">CUSTOMER PORTAL</span>
            </div>

            <nav className="flex-grow space-y-1 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === item.id 
                      ? 'bg-cyan-50 dark:bg-slate-900 text-cyan-600 dark:text-cyan-455 border-l-[3px] border-cyan-500' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-900 mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                <span>🚪</span>
                <span>Logout Session</span>
              </button>
            </div>
          </div>
          <div className="flex-grow" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* 3. Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
        
        {/* Top Header */}
        <header className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-[#080D18] py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center space-x-3">
            {/* Hamburger for mobile */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 lg:hidden focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {activeTab === 'Dashboard' && 'Account Dashboard'}
                {activeTab === 'Service' && 'My Internet Connection'}
                {activeTab === 'Requests' && 'Technical Requests'}
                {activeTab === 'Complaints' && 'Support Tickets'}
                {activeTab === 'Billing' && 'Billing & Invoicing'}
                {activeTab === 'Profile' && 'Account Settings'}
                {activeTab === 'Notifications' && 'System Notifications'}
                {activeTab === 'Password' && 'Security Configuration'}
              </h1>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-light mt-0.5 hidden sm:block">
                {activeTab === 'Dashboard' && 'ISP self-service profile status, billing, and action tiles.'}
                {activeTab === 'Service' && 'Details of active bandwidth profiles, packages, and installation parameters.'}
                {activeTab === 'Requests' && 'Manage your installation, package change, or speed upgrade logs.'}
                {activeTab === 'Complaints' && 'Report issues or track active complaints workflow updates.'}
                {activeTab === 'Billing' && 'Check invoices, past payment receipts, and balance statuses.'}
                {activeTab === 'Profile' && 'Configure and save your account contact parameters.'}
                {activeTab === 'Notifications' && 'Alert warnings, system upgrades, and service status notifications.'}
                {activeTab === 'Password' && 'Change portal password credentials for active session lock.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme switcher */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors flex items-center"
              >
                <span className="text-base">{activeTheme === 'light' ? '☀️' : '🌙'}</span>
              </button>
              
              {showThemeDropdown && (
                <div className="absolute right-0 mt-2.5 w-36 rounded-2xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 text-xs">
                  {[
                    { mode: 'auto', label: '⚙️ Automatic' },
                    { mode: 'light', label: '☀️ Light Mode' },
                    { mode: 'dark', label: '🌙 Dark Mode' }
                  ].map((t) => (
                    <button
                      key={t.mode}
                      onClick={() => {
                        localStorage.setItem('isp-employee-theme', t.mode);
                        setThemePreference(t.mode);
                        setShowThemeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors flex items-center justify-between ${
                        themePreference === t.mode ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick notifications icon */}
            <button 
              onClick={() => setActiveTab('Notifications')}
              className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 relative"
            >
              <span className="text-base">🔔</span>
              {notificationsList.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              )}
            </button>

            {/* Customer Avatar & Badge */}
            <div className="flex items-center space-x-2 border-l border-slate-100 dark:border-slate-900 pl-4">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-[11px]">
                {(profile?.full_name || user?.name || 'ME').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block">{profile?.full_name || user?.name}</span>
                <span className="text-[7.5px] tracking-wider uppercase font-black text-cyan-600 dark:text-cyan-400">SUBSCRIBER</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-6 space-y-6">
          
          {loading ? (
            renderSkeletons()
          ) : error ? (
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs flex justify-between items-center max-w-xl mx-auto shadow-sm">
              <span>Unable to load your service information.</span>
              <button 
                onClick={loadPortalData}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-[9px] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* ==================== A. DASHBOARD TAB ==================== */}
              {activeTab === 'Dashboard' && (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* Dashboard Premium Hero Banner */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 gap-4 shadow-sm hover:shadow transition-shadow relative overflow-hidden">
                    <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-1.5 z-10">
                      <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                        {getGreeting()}, {profile?.full_name || user?.name} 👋
                      </h2>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          dashboardData?.accountStatus === 'suspended' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                        }`} />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {dashboardData?.accountStatus === 'suspended' ? 'Service Suspended' : 'Service Active'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">•</span>
                        <span className="text-[10px] text-slate-550 dark:text-slate-400 font-medium">Your connection details and actions look good.</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#0E1626] border border-slate-200/50 dark:border-slate-800 p-3.5 rounded-2xl flex items-center space-x-3 shrink-0 z-10 shadow-inner">
                      <span className="text-xl">🌐</span>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-450 dark:text-slate-550 block font-bold">CURRENT PLAN</span>
                        <span className="text-xs font-extrabold text-slate-905 text-slate-900 dark:text-white block mt-0.5">{dashboardData?.packageName || 'N/A'}</span>
                        <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-semibold">{dashboardData?.speedMbps || 0} Mbps Bandwidth</span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Column Metrics Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { 
                        label: "Current Package", 
                        val: dashboardData?.packageName || 'No Active Package', 
                        sub: dashboardData?.speedMbps ? `${dashboardData.speedMbps} Mbps` : 'N/A', 
                        icon: '🌐',
                        status: 'green'
                      },
                      { 
                        label: "Service Status", 
                        val: dashboardData?.accountStatus ? (dashboardData.accountStatus.charAt(0).toUpperCase() + dashboardData.accountStatus.slice(1)) : 'Active', 
                        color: dashboardData?.accountStatus === 'suspended' ? 'text-amber-500' : 'text-emerald-500', 
                        sub: dashboardData?.accountStatus === 'suspended' ? 'Suspension Alert' : 'Connected successfully',
                        icon: '⚡',
                        status: dashboardData?.accountStatus === 'suspended' ? 'amber' : 'green'
                      },
                      { 
                        label: "Current Bill", 
                        val: formatPKR(dashboardData?.currentBill), 
                        sub: billing.length > 0 && dashboardData?.currentBill > 0 ? `Due: ${new Date(billing[0].due_date).toLocaleDateString()}` : 'No dues pending',
                        color: dashboardData?.currentBill > 0 ? 'text-rose-500 font-extrabold' : 'text-slate-900 dark:text-white',
                        icon: '💳',
                        status: dashboardData?.currentBill > 0 ? 'red' : 'green'
                      },
                      { 
                        label: "Open Complaints", 
                        val: dashboardData?.openComplaintsCount || 0, 
                        sub: 'Active tickets',
                        icon: '🚨',
                        status: dashboardData?.openComplaintsCount > 0 ? 'amber' : 'green'
                      },
                      { 
                        label: "Service Requests", 
                        val: dashboardData?.pendingRequestsCount || 0, 
                        sub: 'Pending requests',
                        icon: '🛠️',
                        status: dashboardData?.pendingRequestsCount > 0 ? 'blue' : 'green'
                      }
                    ].map((card, i) => (
                      <div 
                        key={i} 
                        className="p-4 rounded-2xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between h-28 shadow-sm group"
                      >
                        <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-bold">
                          <span>{card.label}</span>
                          <span className="group-hover:scale-110 transition-transform">{card.icon}</span>
                        </div>
                        <div className="space-y-1">
                          <div className={`font-black text-xs md:text-sm ${card.color || 'text-slate-900 dark:text-white'} truncate`}>{card.val}</div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              card.status === 'green' ? 'bg-emerald-500' :
                              card.status === 'amber' ? 'bg-amber-500' :
                              card.status === 'red' ? 'bg-rose-500' : 'bg-blue-500'
                            }`} />
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate font-semibold">{card.sub}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main Hero & Quick Actions Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Visual Plan Card */}
                    <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute right-0 bottom-0 opacity-[0.02] dark:opacity-[0.02] pointer-events-none scale-150">🌐</div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-extrabold block">MY INTERNET SERVICE</span>
                            <h3 className="font-black text-slate-900 dark:text-white text-base md:text-lg mt-1">{service?.package_name || 'No Active Package'}</h3>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            service?.service_status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}>
                            ● {service?.service_status || 'inactive'}
                          </span>
                        </div>
                        
                        {/* Speed Progress Bar */}
                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span>Connection Bandwidth Limit</span>
                            <span className="text-slate-900 dark:text-white">{service?.speed_mbps || 0} Mbps / 100 Mbps max</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.max(10, service?.speed_mbps || dashboardData?.speedMbps || 10))}%` }} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-105 dark:border-slate-900 mt-4">
                        <div>
                          <span className="text-slate-500 dark:text-slate-500 block text-[9px] font-bold uppercase tracking-wider">Monthly price</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{service?.monthly_price ? formatPKR(service.monthly_price) : 'Rs. 0'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-505 block text-[9px] font-bold uppercase tracking-wider">Installation Date</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{service?.installation_date ? new Date(service.installation_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('Service')}
                        className="mt-4 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#0E1626] dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wide transition-all border border-slate-200 dark:border-slate-800"
                      >
                        View Plan Details →
                      </button>
                    </div>

                    {/* Quick Action Tiles */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-extrabold block">QUICK ACTIONS</span>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm mt-1">Portal Shortcuts</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 flex-grow my-3">
                        {[
                          { title: "Report Issue", icon: "🚨", color: "text-rose-500 bg-rose-500/5 border-rose-500/10", tab: "Complaints" },
                          { title: "Change Plan", icon: "🛠️", color: "text-cyan-500 bg-cyan-500/5 border-cyan-500/10", tab: "Requests" },
                          { title: "View Bills", icon: "💳", color: "text-blue-500 bg-blue-500/5 border-blue-500/10", tab: "Billing" },
                          { title: "My Internet", icon: "🌐", color: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10", tab: "Service" }
                        ].map((act, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTab(act.tab)}
                            className="p-3.5 rounded-2xl bg-white dark:bg-[#0E1626]/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center hover:-translate-y-0.5 hover:shadow-sm transition-all"
                          >
                            <span className="text-xl mb-1.5">{act.icon}</span>
                            <span className="font-bold text-[10px] text-slate-800 dark:text-slate-200">{act.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Complaints filing & Unified Activity Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Fast complaint form */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm">
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm">Need Help?</h3>
                        <p className="text-[10px] text-slate-500 mt-1">Report an internet issue and our support team will handle it.</p>
                      </div>

                      <form onSubmit={handleComplaintSubmit} className="space-y-3.5 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Issue Type</label>
                            <select
                              value={complaintForm.complaint_type}
                              onChange={(e) => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/80"
                            >
                              <option value="Speed Issue">Speed Issue</option>
                              <option value="Cabling/Physical Issue">Cable Issue</option>
                              <option value="Billing/Invoicing">Billing Issue</option>
                              <option value="Routing/Config">Config Issue</option>
                              <option value="Frequent Disconnection">Disconnection</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Priority</label>
                            <select
                              value={complaintForm.priority}
                              onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/80"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Subject</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Connection dropping every few minutes"
                            value={complaintForm.subject}
                            onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/80"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Description</label>
                          <textarea
                            required
                            placeholder="Provide details of the problem..."
                            value={complaintForm.description}
                            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white h-16 resize-none focus:outline-none focus:border-cyan-500/80"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors text-[10px] tracking-wider"
                        >
                          {submitting ? 'Submitting Complaint...' : 'Submit Complaint →'}
                        </button>
                      </form>
                    </div>

                    {/* Unified Activity Feed */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm">Recent Activity</h3>
                        <p className="text-[10px] text-slate-500 mt-1">Real-time status updates of billing cycles, requests, and tickets.</p>
                      </div>

                      {recentActivities.length > 0 ? (
                        <div className="space-y-3.5 my-2 flex-grow overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
                          {recentActivities.map((act, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#0E1626]/40 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-900/50">
                              <div className="space-y-1 max-w-[75%]">
                                <span className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-500 block">{act.type}</span>
                                <span className="font-bold text-slate-905 text-slate-900 dark:text-white block text-[11px] truncate">{act.title}</span>
                                <span className="text-[8px] text-slate-500 block mt-0.5">{new Date(act.date).toLocaleDateString()}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                act.status === 'resolved' || act.status === 'completed' || act.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : (act.status === 'unpaid' || act.status === 'overdue' || act.status === 'rejected'
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                                      : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20')
                              }`}>{act.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center flex-grow flex flex-col items-center justify-center space-y-3">
                          <span className="text-slate-500 dark:text-slate-500 italic text-[11px]">No recent activity. Everything looks good right now.</span>
                          <button 
                            onClick={() => setActiveTab('Complaints')}
                            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-[10px] text-slate-705 dark:text-slate-350 border border-slate-200 dark:border-slate-800 uppercase font-bold"
                          >
                            Report an Issue
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

              {/* ==================== B. PROFILE TAB ==================== */}
              {activeTab === 'Profile' && (
                <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 max-w-xl mx-auto space-y-6 animate-fade-in-up shadow-sm">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Profile Details</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Review and update details of your customer billing account.</p>
                  </div>

                  {/* Profile info details block */}
                  <div className="flex items-center space-x-4 pb-4 border-b border-slate-100 dark:border-slate-900">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm">
                      {profile?.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{profile?.full_name || 'N/A'}</h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 block">System Account: {profile?.customer_code || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Profile update form */}
                  <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Contact Phone</label>
                        <input
                          type="text"
                          required
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-955 dark:bg-slate-950 text-slate-905 text-slate-900 dark:text-white border border-slate-250 dark:border-slate-800 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Email Address</label>
                        <input
                          type="email"
                          required
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-955 dark:bg-slate-950 text-slate-905 text-slate-900 dark:text-white border border-slate-250 dark:border-slate-800 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Physical Address</label>
                      <textarea
                        required
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-955 dark:bg-slate-955 dark:bg-slate-950 text-slate-905 text-slate-900 dark:text-white border border-slate-250 dark:border-slate-800 h-16 resize-none focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors"
                    >
                      {submitting ? 'Updating settings...' : 'Save Profile Settings'}
                    </button>
                  </form>
                </div>
              )}

              {/* ==================== C. SERVICE DETAILS TAB ==================== */}
              {activeTab === 'Service' && (
                <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 max-w-xl mx-auto space-y-6 animate-fade-in-up shadow-sm">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Internet Connection</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Details of your active bandwidth plans, installation and billing parameters.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-xs bg-slate-50 dark:bg-[#0E1626]/80 p-5 rounded-2xl border border-slate-250 dark:border-slate-800">
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Customer Name:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{profile?.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Customer ID:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{profile?.customer_code || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Internet Package:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{service?.package_name || 'No Active Plan Assigned'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Internet Speed:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{service?.speed_mbps || 0} Mbps</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Monthly Charges:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{service?.monthly_price ? formatPKR(service.monthly_price) : 'Rs. 0'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Service Status:</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        service?.service_status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {service?.service_status || 'inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Installation Date:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {profile?.installation_date ? new Date(profile.installation_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Activation Date:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {service?.start_date ? new Date(service.start_date).toLocaleDateString() : (profile?.installation_date ? new Date(profile.installation_date).toLocaleDateString() : 'N/A')}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Next Billing Date:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-cyan-600 dark:text-cyan-400">
                        {billing.length > 0 && billing[0].status === 'paid' 
                          ? new Date(new Date(billing[0].due_date).setMonth(new Date(billing[0].due_date).getMonth() + 1)).toLocaleDateString()
                          : (billing.length > 0 ? new Date(billing[0].due_date).toLocaleDateString() : 'N/A')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== D. SERVICE REQUESTS TAB ==================== */}
              {activeTab === 'Requests' && (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* Request Form */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm max-w-xl mx-auto">
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">File Technical / Service Request</h3>
                    <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Request Category</label>
                        <select
                          value={requestForm.request_type}
                          onChange={(e) => setRequestForm({ ...requestForm, request_type: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="New Service Request">New Service Request</option>
                          <option value="Package Upgrade">Package Upgrade</option>
                          <option value="Package Change">Package Change</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Installation Request">Installation Request</option>
                          <option value="Other Service Request">Other Service Request</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Description</label>
                        <textarea
                          required
                          value={requestForm.description}
                          onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                          placeholder="Provide details about package speed requirements or relocation details..."
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-555 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-905 text-slate-900 dark:text-white h-24 focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors"
                      >
                        {submitting ? 'Submitting request...' : 'File Service Request'}
                      </button>
                    </form>
                  </div>

                  {/* Requests History List */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm">
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Service Request Logs</h3>
                    {requests.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {requests.map((req) => (
                          <div key={req.id} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#0E1626] dark:hover:bg-[#111827]/40 border border-slate-200 dark:border-slate-850 flex justify-between items-center transition-colors shadow-inner">
                            <div className="space-y-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-950 text-[10px] font-mono font-bold text-slate-805 text-slate-800 dark:text-slate-400">REQ-{req.id}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{req.task_type}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{req.description}</p>
                              <div className="text-[9px] text-slate-505 text-slate-500">
                                Filed on: {new Date(req.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                                req.status === 'completed' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' :
                                req.status === 'rejected' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-450 border-rose-500/20' :
                                'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-500 dark:text-slate-550 italic text-xs">
                        No active service requests
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ==================== E. COMPLAINTS TAB ==================== */}
              {activeTab === 'Complaints' && (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* Support Form */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm max-w-xl mx-auto">
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">File Support / Complaint Ticket</h3>
                    <form onSubmit={handleComplaintSubmit} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Category</label>
                          <select
                            value={complaintForm.complaint_type}
                            onChange={(e) => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-slate-555 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-905 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="Speed Issue">Speed Issue</option>
                            <option value="Cabling/Physical Issue">Cabling/Physical Issue</option>
                            <option value="Billing/Invoicing">Billing/Invoicing</option>
                            <option value="Routing/Config">Routing/Config</option>
                            <option value="Frequent Disconnection">Frequent Disconnection</option>
                            <option value="Other">Other Support</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Priority</label>
                          <select
                            value={complaintForm.priority}
                            onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-slate-555 bg-slate-50 dark:bg-slate-955 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-905 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent Priority</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Subject</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Red light flashing on optical network terminal"
                          value={complaintForm.subject}
                          onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-555 bg-slate-50 dark:bg-slate-955 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-905 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Problem Description</label>
                        <textarea
                          required
                          value={complaintForm.description}
                          onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                          placeholder="Describe the problem, errors or disconnection intervals in detail..."
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-555 bg-slate-50 dark:bg-slate-955 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-905 text-slate-900 dark:text-white h-24 focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors"
                      >
                        {submitting ? 'Filing Complaint...' : 'File Support Ticket'}
                      </button>
                    </form>
                  </div>

                  {/* Complaints Log List */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm">
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Support Tickets Log</h3>
                    {complaints.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {complaints.map((comp) => (
                          <div 
                            key={comp.id} 
                            onClick={() => viewComplaintDetails(comp.id)}
                            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#0E1626] dark:hover:bg-[#111827]/40 border border-slate-200 dark:border-slate-850 flex justify-between items-center cursor-pointer transition-colors shadow-inner"
                          >
                            <div className="space-y-1.5 max-w-[70%]">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-950 text-[10px] font-mono font-bold text-slate-805 text-slate-800 dark:text-slate-400">CMP-{comp.id}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{parseCleanSubject(comp.subject)}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">{comp.description}</p>
                              <div className="text-[9px] text-slate-505 text-slate-500 flex flex-wrap gap-x-2 gap-y-1 font-medium">
                                <span>Category: <span className="font-semibold text-cyan-600 dark:text-cyan-400">{parseComplaintType(comp.subject)}</span></span>
                                <span>•</span>
                                <span>Filed: {new Date(comp.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Updated: {new Date(comp.updated_at || comp.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Priority: <span className="font-bold uppercase">{comp.priority}</span></span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                                comp.status === 'resolved' || comp.status === 'closed' 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' 
                                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                              }`}>
                                {comp.status}
                              </span>
                              <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">Track Updates &rarr;</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                        <span className="text-slate-500 dark:text-slate-500 italic text-[11px]">No active complaints</span>
                        <button 
                          onClick={() => setActiveTab('Dashboard')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase text-[9px]"
                        >
                          Report an Issue
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ==================== F. BILLING TAB ==================== */}
              {(activeTab === 'History' || activeTab === 'Billing') && (
                <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm animate-fade-in-up">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Billing Invoices</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Review historical billing cycles and payment validation status.</p>
                  </div>

                  {/* Overdue Payment notice alert box */}
                  {dashboardData?.currentBill > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 text-xs flex items-center justify-between shadow-inner">
                      <div>
                        <strong className="block text-sm">Overdue Payment Notice</strong>
                        <p className="mt-0.5">Please settle your outstanding amount of {formatPKR(dashboardData.currentBill)} to ensure active high-speed connection.</p>
                      </div>
                      <span className="text-lg font-black">{formatPKR(dashboardData.currentBill)}</span>
                    </div>
                  )}

                  {billing.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-[#0B1220] text-xs shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-[#0E1626] text-slate-600 dark:text-slate-400 font-bold uppercase text-[9px]">
                            <th className="p-3">Invoice/Bill ID</th>
                            <th className="p-3">Billing Period</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Payment Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billing.map((inv) => (
                            <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-900/80 text-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0E1626]/40 transition-colors">
                              <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">INV-{inv.id}</td>
                              <td className="p-3 font-semibold">{inv.billing_month}</td>
                              <td className="p-3 font-extrabold">{formatPKR(inv.amount)}</td>
                              <td className="p-3 text-slate-500 dark:text-slate-450">{new Date(inv.due_date).toLocaleDateString()}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                  inv.status === 'paid' 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' 
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="p-3 text-right text-slate-500 dark:text-slate-450 font-medium">
                                {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-505 italic text-xs">
                      No billing history
                    </div>
                  )}
                </div>
              )}

              {/* ==================== G. NOTIFICATIONS TAB ==================== */}
              {activeTab === 'Notifications' && (
                <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 space-y-4 shadow-sm animate-fade-in-up max-w-xl mx-auto">
                  <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Portal Notifications</h3>
                  {notificationsList.length > 0 ? (
                    <div className="space-y-2.5">
                      {notificationsList.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3.5 rounded-2xl border flex items-start space-x-3 transition-colors ${
                            notif.type === 'critical' ? 'bg-rose-500/5 border-rose-500/10 text-rose-400' :
                            notif.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-amber-400' :
                            'bg-cyan-500/5 border-cyan-500/10 text-cyan-400'
                          }`}
                        >
                          <span className="text-base">🔔</span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">{notif.title}</span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-350 mt-0.5 leading-relaxed">{notif.message}</p>
                            <span className="text-[8px] text-slate-400 mt-1 block">{notif.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-505 text-slate-500 italic text-xs">
                      No notifications
                    </div>
                  )}
                </div>
              )}

              {/* ==================== H. CHANGE PASSWORD TAB ==================== */}
              {activeTab === 'Password' && (
                <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-900 max-w-md mx-auto space-y-6 animate-fade-in-up shadow-sm">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">Change Portal Password</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Configure a strong password to protect your customer portal dashboard.</p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Current Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-250 dark:border-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-250 dark:border-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-250 dark:border-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors"
                    >
                      {submitting ? 'Updating password...' : 'Update Portal Password'}
                    </button>
                  </form>
                </div>
              )}

            </>
          )}

        </main>
      </div>

      {/* Workflow Tracking Detail Modal (No white card leak, fits light/dark perfectly) */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-3xl bg-white dark:bg-[#0B1220] border border-slate-250 dark:border-slate-850 p-6 shadow-2xl space-y-4 text-xs text-slate-900 dark:text-white relative animate-fade-in-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
              <div>
                <h4 className="font-extrabold text-sm text-slate-905 text-slate-900 dark:text-white uppercase tracking-wider">Track Ticket Updates</h4>
                {selectedComplaint && (
                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">Ticket ID: CMP-{selectedComplaint.id}</p>
                )}
              </div>
              <button 
                onClick={() => { setShowComplaintModal(false); setSelectedComplaint(null); setComplaintHistory([]); }}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {detailsLoading || !selectedComplaint ? (
              <div className="py-10 text-center text-slate-505 text-slate-500 animate-pulse">Loading timeline...</div>
            ) : (
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-250 dark:border-slate-800 text-[10px]">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-bold">Complaint ID:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">CMP-{selectedComplaint.id}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-bold">Category (Type):</span>
                      <strong className="text-slate-900 dark:text-white">{parseComplaintType(selectedComplaint.subject)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-bold">Priority:</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        selectedComplaint.priority === 'high' || selectedComplaint.priority === 'urgent'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                      }`}>{selectedComplaint.priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-bold">Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${getStatusBadge(selectedComplaint.status)}`}>
                        {selectedComplaint.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-bold">Created Date:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-bold">Last Updated:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{new Date(selectedComplaint.updated_at || selectedComplaint.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[9px] uppercase font-bold tracking-wider">Subject:</span>
                    <strong className="text-slate-900 dark:text-white block text-xs font-bold leading-snug">{parseCleanSubject(selectedComplaint.subject)}</strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[9px] uppercase font-bold tracking-wider">Description:</span>
                    <p className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850 leading-relaxed text-slate-700 dark:text-slate-300">
                      {selectedComplaint.description}
                    </p>
                  </div>
                </div>

                {/* Timeline display */}
                <div className="space-y-3.5 pt-2">
                  <h5 className="font-bold text-[9px] tracking-wider uppercase text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-1.5">Action History & Updates</h5>
                  {complaintHistory.length > 0 ? (
                    <div className="space-y-3.5 pl-3.5 border-l-2 border-slate-200 dark:border-slate-800 relative ml-2">
                      {complaintHistory.map((step, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white dark:border-[#0B1220]" />
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold uppercase text-cyan-600 dark:text-cyan-400">{step.status}</span>
                            <span className="text-slate-500 text-[9px]">{new Date(step.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-955/20 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                            {step.comment}
                          </p>
                          {step.employee_name && (
                            <span className="text-[8px] text-slate-500 block">Representative: {step.employee_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500 italic text-[10px]">No workflow action history logged yet. Ticket is pending review.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
