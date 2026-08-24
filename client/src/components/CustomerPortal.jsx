import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatPKR = (amount) => {
  const val = parseFloat(amount) || 0;
  return `Rs. ${val.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'assigned':
      return 'bg-blue-100 text-blue-805 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
    case 'accepted':
      return 'bg-cyan-100 text-cyan-805 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800';
    case 'on_the_way':
    case 'on the way':
      return 'bg-purple-105 bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800';
    case 'in_progress':
    case 'in progress':
      return 'bg-amber-105 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    case 'completed':
    case 'resolved':
      return 'bg-emerald-105 bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-450 dark:border-emerald-900';
    case 'pending':
      return 'bg-slate-105 bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800';
    case 'rejected':
      return 'bg-red-105 bg-red-105 bg-red-100 text-red-805 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-slate-105 bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800';
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
          type: 'warning'
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

  return (
    <div className={`flex min-h-screen font-sans w-full selection:bg-cyan-500 overflow-x-hidden relative theme-transition ${activeTheme === 'dark' ? 'dark bg-[#080d16] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Dynamic theme style overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .theme-transition, .theme-transition *, .theme-transition aside, .theme-transition main, .theme-transition header, .theme-transition div {
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease !important;
        }
      `}} />

      {/* Sidebar navigation */}
      <aside className="w-[280px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1220] hidden lg:flex flex-col h-screen sticky top-0 z-40 shrink-0">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-650 flex items-center justify-center shadow-lg">
              <span className="text-white text-xs">🌐</span>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-slate-900 dark:text-white block">Customer Portal</span>
              <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono tracking-widest block uppercase mt-0.5">Self Service</span>
            </div>
          </div>
        </div>

        {/* Sidebar tabs */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                activeTab === item.id 
                  ? 'bg-cyan-50 text-cyan-800 border-l-2 border-cyan-500 dark:bg-slate-900 dark:text-cyan-400 dark:border-cyan-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900/50 dark:hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-605 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300 transition-all duration-150"
          >
            <span className="text-base">🚪</span>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Header toolbar */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1220] py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">Customer Dashboard</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-light">Service plan summary, invoicing history, and technical complaints.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme switcher */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#111827] text-slate-600 dark:text-slate-400 transition-colors flex items-center"
              >
                <span className="text-lg">{activeTheme === 'light' ? '☀️' : '🌙'}</span>
              </button>
              
              {showThemeDropdown && (
                <div className="absolute right-0 mt-2.5 w-36 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 text-xs">
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
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-[#0f172a] transition-colors flex items-center justify-between ${
                        themePreference === t.mode ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8.5 h-8.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/20 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-extrabold text-xs">
                {(profile?.full_name || user?.name || 'ME').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-none">{profile?.full_name || user?.name}</span>
                <span className="text-[8px] text-slate-505 text-slate-500 dark:text-slate-500 uppercase tracking-widest font-extrabold block mt-0.5">SUBSCRIBER</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-6 space-y-6">
          
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500 dark:text-slate-500">Loading subscriber services...</div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">{error}</div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'Dashboard' && (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* Top Welcome Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 gap-4 shadow-sm">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{getGreeting()}, {profile?.full_name || user?.name} 👋</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Here's your internet service overview.</p>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { 
                        label: "Current Package", 
                        val: dashboardData?.packageName || 'No Active Package', 
                        sub: dashboardData?.speedMbps ? `${dashboardData.speedMbps} Mbps` : 'N/A', 
                        icon: '🌐' 
                      },
                      { 
                        label: "Service Status", 
                        val: dashboardData?.accountStatus ? (dashboardData.accountStatus.charAt(0).toUpperCase() + dashboardData.accountStatus.slice(1)) : 'Active', 
                        color: dashboardData?.accountStatus === 'suspended' ? 'text-amber-500 font-bold' : (dashboardData?.accountStatus === 'inactive' ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'), 
                        sub: 'Status',
                        icon: '⚡' 
                      },
                      { 
                        label: "Current Bill", 
                        val: formatPKR(dashboardData?.currentBill), 
                        sub: billing.length > 0 && dashboardData?.currentBill > 0 ? `Due: ${new Date(billing[0].due_date).toLocaleDateString()}` : 'No dues pending',
                        color: dashboardData?.currentBill > 0 ? 'text-rose-550 text-rose-600 font-black dark:text-rose-400' : 'text-slate-900 dark:text-white',
                        icon: '💳' 
                      },
                      { 
                        label: "Open Complaints", 
                        val: dashboardData?.openComplaintsCount || 0, 
                        sub: 'Active tickets',
                        icon: '🚨' 
                      },
                      { 
                        label: "Service Requests", 
                        val: dashboardData?.pendingRequestsCount || 0, 
                        sub: 'Pending requests',
                        icon: '🛠️' 
                      }
                    ].map((card, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 transition-all duration-200 flex flex-col justify-between h-28 shadow-sm">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-bold">
                          <span>{card.label}</span>
                          <span>{card.icon}</span>
                        </div>
                        <div className="space-y-1">
                          <div className={`font-black text-xs md:text-sm ${card.color || 'text-slate-900 dark:text-white'} truncate`}>{card.val}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-semibold">{card.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Plan Detail */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Subscribed Plan</h3>
                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        <div>🌐 <strong className="text-slate-800 dark:text-slate-300">Plan Name:</strong> {service?.package_name || 'No Active Package'}</div>
                        <div>⚡ <strong className="text-slate-800 dark:text-slate-300">Connection Speed:</strong> {service?.speed_mbps || 0} Mbps</div>
                        <div>💳 <strong className="text-slate-800 dark:text-slate-300">Monthly Billing:</strong> {service?.monthly_price ? formatPKR(service.monthly_price) : 'Rs. 0'}</div>
                        <div>📅 <strong className="text-slate-800 dark:text-slate-300">Installation Date:</strong> {service?.installation_date ? new Date(service.installation_date).toLocaleDateString() : 'N/A'}</div>
                        <button
                          onClick={() => setActiveTab('Service')}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-[10px] uppercase transition-colors"
                        >
                          View Plan Details
                        </button>
                      </div>
                    </div>

                    {/* Quick Ticket Action */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Submit Quick Complaint</h3>
                      <form onSubmit={handleComplaintSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={complaintForm.complaint_type}
                            onChange={(e) => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] border border-slate-300 dark:border-[#1e293b] text-xs text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="Speed Issue">Speed Issue</option>
                            <option value="Cabling/Physical Issue">Cabling/Physical Issue</option>
                            <option value="Billing/Invoicing">Billing/Invoicing</option>
                            <option value="Routing/Config">Routing/Config</option>
                            <option value="Frequent Disconnection">Disconnection</option>
                            <option value="Other">Other</option>
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Subject summary..."
                            value={complaintForm.subject}
                            onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] border border-slate-300 dark:border-[#1e293b] text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                        <textarea
                          required
                          placeholder="Describe the technical issue in detail..."
                          value={complaintForm.description}
                          onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] border border-slate-300 dark:border-[#1e293b] text-xs text-slate-900 dark:text-white h-16 resize-none focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] uppercase transition-colors"
                        >
                          {submitting ? 'Filing Ticket...' : 'File Support Ticket'}
                        </button>
                      </form>
                    </div>
                  </div>

                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'Profile' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 max-w-xl mx-auto space-y-6 animate-fade-in-up shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Profile Details</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Review and update details of your customer billing account.</p>
                  </div>

                  {/* Profile info details block */}
                  <div className="flex items-center space-x-4 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {profile?.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">{profile?.full_name}</span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono block mt-1 uppercase">{profile?.customer_code}</span>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 block">Customer ID (Read Only)</label>
                        <input
                          type="text"
                          disabled
                          value={profile?.id || ''}
                          className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 block">CNIC Number (Read Only)</label>
                        <input
                          type="text"
                          disabled
                          value={profile?.cnic || ''}
                          className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 text-slate-600 dark:text-slate-400 block">Subscriber Full Name *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1e293b] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 block">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1e293b] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 block">Registered Email *</label>
                        <input
                          type="email"
                          required
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1e293b] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 block">Service Delivery Address *</label>
                      <textarea
                        required
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1e293b] h-16 resize-none focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors"
                    >
                      {submitting ? 'Updating settings...' : 'Save Profile Settings'}
                    </button>
                  </form>
                </div>
              )}

              {/* Service Details Tab */}
              {activeTab === 'Service' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 max-w-xl mx-auto space-y-6 animate-fade-in-up shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Internet Connection</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Details of your active bandwidth plans, installation and billing parameters.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-xs bg-slate-50 dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-200 dark:border-[#1e293b]">
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
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-450 dark:border-emerald-900' 
                          : 'bg-amber-105 bg-amber-100 text-amber-800 border-amber-250 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900'
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

              {/* Service Requests Tab */}
              {activeTab === 'Requests' && (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* Submission Form Card */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm max-w-xl mx-auto">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">File Technical / Service Request</h3>
                    <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 uppercase">Request Category</label>
                        <select
                          value={requestForm.request_type}
                          onChange={(e) => setRequestForm({ ...requestForm, request_type: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-[#080d16] border border-slate-350 border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white focus:outline-none"
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
                        <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 uppercase">Brief Description</label>
                        <textarea
                          required
                          value={requestForm.description}
                          onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                          placeholder="Provide details about speed requirements, installation parameters..."
                          className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-[#080d16] border border-slate-350 border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white h-24 focus:outline-none resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors"
                      >
                        {submitting ? 'Submitting request...' : 'File Service Request'}
                      </button>
                    </form>
                  </div>

                  {/* Requests History List */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Service Request Logs</h3>
                    {requests.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {requests.map((req) => (
                          <div key={req.id} className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] flex justify-between items-center shadow-sm">
                            <div className="space-y-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded bg-slate-105 bg-slate-100 dark:bg-slate-900 text-[10px] font-mono font-bold text-slate-800 dark:text-slate-300">REQ-{req.id}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{req.task_type}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{req.description}</p>
                              <div className="text-[9px] text-slate-500 dark:text-slate-500">
                                Filed on: {new Date(req.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                                req.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950 dark:text-emerald-450 dark:border-emerald-900' :
                                req.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-250 dark:bg-red-950 dark:text-red-405 dark:border-red-900' :
                                'bg-blue-100 text-blue-800 border-blue-250 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-500 dark:text-slate-500 italic text-xs">No service requests filed yet.</div>
                    )}
                  </div>

                </div>
              )}

              {/* Complaints Tab */}
              {activeTab === 'Complaints' && (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* Submission Form Card */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm max-w-xl mx-auto">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">File Support / Complaint Ticket</h3>
                    <form onSubmit={handleComplaintSubmit} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 uppercase">Complaint Category</label>
                          <select
                            value={complaintForm.complaint_type}
                            onChange={(e) => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-[#080d16] border border-slate-350 border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white focus:outline-none"
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
                          <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 uppercase">Priority level</label>
                          <select
                            value={complaintForm.priority}
                            onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-[#080d16] border border-slate-350 border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent Priority</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 uppercase">Subject</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Fiber link red indicator light flashing"
                          value={complaintForm.subject}
                          onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-[#080d16] border border-slate-350 border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 uppercase">Problem Description</label>
                        <textarea
                          required
                          value={complaintForm.description}
                          onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                          placeholder="Describe the disconnection frequency, power fluctuations, error messages, etc."
                          className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-[#080d16] border border-slate-350 border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white h-24 focus:outline-none resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors"
                      >
                        {submitting ? 'Filing Complaint...' : 'File Support Ticket'}
                      </button>
                    </form>
                  </div>

                  {/* Complaints Log List */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Support Tickets Log</h3>
                    {complaints.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {complaints.map((comp) => (
                          <div 
                            key={comp.id} 
                            onClick={() => viewComplaintDetails(comp.id)}
                            className="p-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#0f172a] dark:hover:bg-[#111827]/40 border border-slate-200 dark:border-[#1e293b] flex justify-between items-center cursor-pointer shadow-sm transition-all"
                          >
                            <div className="space-y-1.5 max-w-[70%]">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[10px] font-mono font-bold text-slate-800 dark:text-slate-300">CMP-{comp.id}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{parseCleanSubject(comp.subject)}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">{comp.description}</p>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1 font-medium">
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
                                comp.status === 'resolved' || comp.status === 'closed' ? 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950 dark:text-emerald-450 dark:border-emerald-900' :
                                'bg-purple-100 text-purple-800 border-purple-250 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900'
                              }`}>
                                {comp.status}
                              </span>
                              <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">Track Updates &rarr;</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-505 text-slate-500 italic text-xs">No active support tickets found.</div>
                    )}
                  </div>

                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'History' || activeTab === 'Billing' ? (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm animate-fade-in-up">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Billing Invoices</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Review historical billing cycles and payment validation status.</p>
                  </div>

                  {/* Balance details */}
                  {dashboardData?.currentBill > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 text-xs flex items-center justify-between shadow-inner">
                      <div>
                        <strong className="block text-sm">Overdue Payment Notice</strong>
                        <p className="mt-0.5">Please settle your outstanding amount of {formatPKR(dashboardData.currentBill)} to ensure active high-speed connection.</p>
                      </div>
                      <span className="text-lg font-black">{formatPKR(dashboardData.currentBill)}</span>
                    </div>
                  )}

                  {billing.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-xs shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827] text-slate-600 dark:text-slate-400 font-bold uppercase text-[9px]">
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
                            <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#111827]/40 transition-colors">
                              <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">INV-{inv.id}</td>
                              <td className="p-3 font-medium">{inv.billing_month}</td>
                              <td className="p-3 font-semibold">{formatPKR(inv.amount)}</td>
                              <td className="p-3 text-slate-500 dark:text-slate-450">{new Date(inv.due_date).toLocaleDateString()}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                  inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-450 dark:border-emerald-900' : 'bg-rose-105 bg-rose-100 text-rose-800 border-rose-250 dark:bg-rose-950/40 dark:text-rose-450 dark:border-rose-900'
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
                    <div className="py-12 text-center text-slate-505 text-slate-500 italic text-xs">No billing history found.</div>
                  )}
                </div>
              ) : null}

              {/* Notifications Tab */}
              {activeTab === 'Notifications' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm animate-fade-in-up">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">My Portal Notifications</h3>
                  {notificationsList.length > 0 ? (
                    <div className="space-y-2">
                      {notificationsList.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-colors ${
                            notif.type === 'critical' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50' :
                            notif.type === 'warning' ? 'bg-amber-50 border-amber-250 dark:bg-amber-950/20 dark:border-amber-900/50' :
                            'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/10 dark:border-cyan-900/30'
                          }`}
                        >
                          <span className="text-lg">🔔</span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">{notif.title}</span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{notif.message}</p>
                            <span className="text-[8px] text-slate-500 dark:text-slate-500 mt-1 block">{notif.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-500 italic text-xs">No notifications.</div>
                  )}
                </div>
              )}

              {/* Change Password Tab */}
              {activeTab === 'Password' && (
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-6 animate-fade-in-up shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Change Portal Password</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Configure a strong password to protect your customer portal dashboard.</p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 block">Current Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1e293b] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 block">New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1e293b] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-655 text-slate-600 dark:text-slate-400 block">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#080d16] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1e293b] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase transition-colors"
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

      {/* Complaint Detail Timeline Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-xs text-slate-900 dark:text-white">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Track Ticket Updates</h4>
                {selectedComplaint && (
                  <p className="text-[10px] text-slate-500 mt-0.5">Ticket ID: CMP-{selectedComplaint.id}</p>
                )}
              </div>
              <button 
                onClick={() => { setShowComplaintModal(false); setSelectedComplaint(null); setComplaintHistory([]); }}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {detailsLoading || !selectedComplaint ? (
              <div className="py-10 text-center text-slate-500">Loading timeline...</div>
            ) : (
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Complaint ID:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">CMP-{selectedComplaint.id}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Category (Type):</span>
                      <strong className="text-slate-900 dark:text-white">{parseComplaintType(selectedComplaint.subject)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Priority:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        selectedComplaint.priority === 'high' || selectedComplaint.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400'
                      }`}>{selectedComplaint.priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${getStatusBadge(selectedComplaint.status)}`}>
                        {selectedComplaint.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Created Date:</span>
                      <span className="text-slate-750 text-slate-700 dark:text-slate-300 font-medium">{new Date(selectedComplaint.created_at).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Last Updated:</span>
                      <span className="text-slate-750 text-slate-700 dark:text-slate-300 font-medium">{new Date(selectedComplaint.updated_at || selectedComplaint.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">Subject:</span>
                    <strong className="text-slate-905 text-slate-900 dark:text-white block text-sm font-bold">{parseCleanSubject(selectedComplaint.subject)}</strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">Description:</span>
                    <p className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-850 leading-relaxed text-slate-750 text-slate-700 dark:text-slate-300">
                      {selectedComplaint.description}
                    </p>
                  </div>
                </div>

                {/* Timeline display */}
                <div className="space-y-3.5 pt-2">
                  <h5 className="font-bold text-[10px] tracking-wider uppercase text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-1.5">Action History & Updates</h5>
                  {complaintHistory.length > 0 ? (
                    <div className="space-y-3 pl-3.5 border-l-2 border-slate-200 dark:border-slate-800 relative">
                      {complaintHistory.map((step, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <span className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-505 bg-cyan-500 border border-white dark:border-slate-900" />
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold uppercase text-cyan-600 dark:text-cyan-400">{step.status}</span>
                            <span className="text-slate-500">{new Date(step.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-705 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded border border-slate-150 dark:border-slate-850">
                            {step.comment}
                          </p>
                          {step.employee_name && (
                            <span className="text-[9px] text-slate-500 block">Representative: {step.employee_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500 italic text-[11px]">No workflow action history logged yet. Ticket is pending review.</div>
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
