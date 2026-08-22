import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatPKR = (amount) => {
  const val = parseFloat(amount) || 0;
  return `Rs. ${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

function EmployeePortal({ user, onLogoutSuccess }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();

  // Modals & Forms States
  const [selectedItem, setSelectedItem] = useState(null); // Selected task or complaint for details
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState('complaint'); // 'complaint' or 'task'
  const [reportForm, setReportForm] = useState({
    problem_found: '',
    work_performed: '',
    solution: '',
    equipment_used: '',
    additional_notes: ''
  });

  const [editProfileForm, setEditProfileForm] = useState({ phone: '', address: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  // History filters states
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState('all'); // 'all' | 'task' | 'complaint'
  const [historyFilterPriority, setHistoryFilterPriority] = useState('all'); // 'all' | 'low' | 'medium' | 'high' | 'urgent'

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        onLogoutSuccess();
        navigate('/employee/login');
      }
    } catch (err) {
      onLogoutSuccess();
      navigate('/employee/login');
    }
  };

  const loadPortalData = async () => {
    setLoading(true);
    setError('');
    try {
      const reqOpts = { credentials: 'include' };
      
      // 1. Load profile details
      const profileRes = await fetch('http://localhost:5000/api/employee/profile', reqOpts);
      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          onLogoutSuccess();
          navigate('/employee/login');
          return;
        }
        throw new Error('Failed to load employee profile.');
      }
      const profileData = await profileRes.json();
      setProfile(profileData);
      setEditProfileForm({ phone: profileData.phone || '', address: profileData.address || '' });

      // 2. Fetch assigned complaints
      const complaintsRes = await fetch('http://localhost:5000/api/employee/complaints', reqOpts);
      if (complaintsRes.ok) {
        const complaintsData = await complaintsRes.json();
        setComplaints(complaintsData);
      }

      // 3. Fetch assigned tasks
      const tasksRes = await fetch('http://localhost:5000/api/employee/tasks', reqOpts);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      // 4. Fetch completed work history
      const historyRes = await fetch('http://localhost:5000/api/employee/work-history', reqOpts);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

      // 5. Fetch notifications list
      const notificationsRes = await fetch('http://localhost:5000/api/employee/notifications', reqOpts);
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData);
      }

      // 6. Fetch unread notification counts
      const unreadRes = await fetch('http://localhost:5000/api/employee/notifications/unread-count', reqOpts);
      if (unreadRes.ok) {
        const countData = await unreadRes.json();
        setUnreadCount(countData.count);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    if (newStatus === 'resolved') {
      // Prompt work report logging before resolving
      setReportType('complaint');
      setSelectedItem(complaints.find(c => c.id === complaintId));
      setReportForm({ problem_found: '', work_performed: '', solution: '', equipment_used: '', additional_notes: '' });
      setShowReportForm(true);
      return;
    }

    if (!window.confirm(`Are you sure you want to change complaint status to '${newStatus.toUpperCase()}'?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/employee/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update status.');
      }

      showToast(`Complaint status updated to '${newStatus.toUpperCase()}'`);
      loadPortalData();
      setSelectedItem(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (newStatus === 'completed') {
      // Prompt work report logging before completing
      setReportType('task');
      setSelectedItem(tasks.find(t => t.id === taskId));
      setReportForm({ problem_found: '', work_performed: '', solution: '', equipment_used: '', additional_notes: '' });
      setShowReportForm(true);
      return;
    }

    if (!window.confirm(`Are you sure you want to change task status to '${newStatus.toUpperCase()}'?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/employee/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update status.');
      }

      showToast(`Task status updated to '${newStatus.toUpperCase()}'`);
      loadPortalData();
      setSelectedItem(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitWorkReport = async (e) => {
    e.preventDefault();

    if (!reportForm.problem_found || !reportForm.work_performed || !reportForm.solution) {
      alert('Please fill out Problem Found, Work Performed, and Solution.');
      return;
    }

    try {
      const payload = {
        problem_found: reportForm.problem_found,
        work_performed: reportForm.work_performed,
        solution: reportForm.solution,
        equipment_used: reportForm.equipment_used,
        additional_notes: reportForm.additional_notes
      };

      if (reportType === 'complaint') {
        payload.complaint_id = selectedItem.id;
      } else {
        payload.task_id = selectedItem.id;
      }

      // 1. Submit work report
      const reportRes = await fetch('http://localhost:5000/api/employee/work-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!reportRes.ok) {
        const err = await reportRes.json();
        throw new Error(err.error || 'Failed to log work report.');
      }

      // 2. Resolve/Complete the ticket
      const statusUrl = reportType === 'complaint'
        ? `http://localhost:5000/api/employee/complaints/${selectedItem.id}/status`
        : `http://localhost:5000/api/employee/tasks/${selectedItem.id}/status`;
      
      const newStatusVal = reportType === 'complaint' ? 'resolved' : 'completed';

      const statusRes = await fetch(statusUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatusVal, comment: `Job completed. Report: ${reportForm.solution}` }),
        credentials: 'include'
      });

      if (!statusRes.ok) {
        throw new Error('Work report saved, but failed to close the assignment status.');
      }

      showToast(`Work report saved and ${reportType.toUpperCase()} marked as ${newStatusVal.toUpperCase()}`);
      setShowReportForm(false);
      setSelectedItem(null);
      loadPortalData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkNotificationsAsRead = async () => {
    try {
      await fetch('http://localhost:5000/api/employee/notifications/mark-read', {
        method: 'POST',
        credentials: 'include'
      });
      loadPortalData();
      showToast('All notifications marked as read.');
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProfileForm),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save changes.');
      }

      showToast('Profile information updated successfully.');
      setIsEditingProfile(false);
      loadPortalData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/employee/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to change password.');
      }

      showToast('Password changed successfully.');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  // Filtered History
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.customer_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
                          item.work_type?.toLowerCase().includes(historySearch.toLowerCase()) ||
                          item.description?.toLowerCase().includes(historySearch.toLowerCase());
    
    const matchesType = historyFilterType === 'all' || item.type === historyFilterType;
    const matchesPriority = historyFilterPriority === 'all' || item.priority === historyFilterPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  // Count active complaints/tasks
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
  const activeTasks = tasks.filter(t => t.status !== 'completed').length;

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
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full h-11 bg-slate-900/50 rounded-xl animate-pulse" />
            ))}
          </nav>
        </aside>
        <div className="flex-grow flex flex-col min-w-0">
          <header className="border-b border-slate-900 bg-slate-950/40 py-5 px-6 md:px-8 flex justify-between items-center">
            <div className="w-48 h-6 bg-slate-900 rounded animate-pulse" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 animate-pulse" />
          </header>
          <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer-loader h-28 rounded-2xl opacity-20" />
              ))}
            </div>
            <div className="w-full h-64 shimmer-loader rounded-3xl opacity-20" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans w-full selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Toast Messages */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-400 text-sm shadow-xl flex items-center space-x-3 animate-fade-in ring-1 ring-cyan-500/25">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md hidden md:flex flex-col h-screen sticky top-0 z-40">
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">Staff Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          
          <button
            onClick={() => setActiveTab('Dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'Dashboard'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
            }`}
          >
            <span>💻</span>
            <span>My Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('Complaints')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'Complaints'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
            }`}
          >
            <span>🎫</span>
            <span>My Complaints</span>
            {complaints.filter(c => c.status !== 'resolved').length > 0 && (
              <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
                {complaints.filter(c => c.status !== 'resolved').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('Tasks')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'Tasks'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
            }`}
          >
            <span>🛠️</span>
            <span>Technical Tasks</span>
            {activeTasks > 0 && (
              <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-indigo-950 border border-indigo-850 text-indigo-400 font-bold">
                {activeTasks}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('History')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'History'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
            }`}
          >
            <span>📜</span>
            <span>Work History</span>
          </button>

          <button
            onClick={() => setActiveTab('Notifications')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'Notifications'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
            }`}
          >
            <span>🔔</span>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-red-950 border border-red-800 text-red-400 font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('Profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'Profile'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
            }`}
          >
            <span>👤</span>
            <span>My Profile</span>
          </button>

        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 border border-transparent transition-all"
          >
            <span>🚪</span>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Header bar */}
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm uppercase text-white">Staff Portal</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">
            {activeTab === 'Dashboard' && 'My Workspace'}
            {activeTab === 'Complaints' && 'Assigned Complaints'}
            {activeTab === 'Tasks' && 'Technical Task Directory'}
            {activeTab === 'History' && 'Completed Work Audits'}
            {activeTab === 'Notifications' && 'Notifications Broadcast'}
            {activeTab === 'Profile' && 'Account Settings'}
          </h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{profile?.full_name || user?.name}</p>
              <p className="text-cyan-505 text-cyan-400 text-xs mt-0.5 tracking-wider uppercase">{profile?.designation || 'Technician'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-650/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-sm">
              {(profile?.full_name || user?.name)?.slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <button onClick={handleLogout} className="md:hidden p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
              <span>🚪</span>
            </button>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto fade-in-up">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* ==============================================
              TAB 1: WORKSPACE DASHBOARD
              ============================================== */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Summary stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Assigned Complaints</span>
                  <span className="text-2xl font-black text-white">{complaints.length}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Pending Tickets</span>
                  <span className="text-2xl font-black text-amber-400">{pendingComplaints}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">In Progress</span>
                  <span className="text-2xl font-black text-cyan-400">{inProgressComplaints}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900/40 border-slate-900 flex flex-col space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Resolved Today</span>
                  <span className="text-2xl font-black text-emerald-450 text-emerald-450">{resolvedComplaints}</span>
                </div>

                <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Technical Tasks</span>
                  <span className="text-2xl font-black text-indigo-400">{tasks.filter(t => t.status !== 'completed').length}</span>
                </div>

              </div>

              {/* Roster & Feed Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Complaints */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Recent Complaints</h3>
                    <button onClick={() => setActiveTab('Complaints')} className="text-cyan-400 text-xs font-semibold hover:underline">View All</button>
                  </div>

                  <div className="space-y-2">
                    {complaints.slice(0, 4).map(c => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/30 border border-slate-900 flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-white block">{c.subject}</span>
                          <span className="text-slate-500 text-[10px] font-medium block">Customer: {c.customer_name}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                            c.priority === 'urgent' || c.priority === 'high' ? 'bg-red-950/30 text-red-400' : 'bg-slate-900 text-slate-400'
                          }`}>{c.priority}</span>
                          <span className="text-cyan-400 font-semibold block text-[10px] uppercase">{c.status}</span>
                        </div>
                      </div>
                    ))}

                    {complaints.length === 0 && (
                      <div className="py-8 text-center text-slate-600 italic text-xs">No complaints currently assigned.</div>
                    )}
                  </div>
                </div>

                {/* Recent Tasks */}
                <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Technical Tasks</h3>
                    <button onClick={() => setActiveTab('Tasks')} className="text-indigo-400 text-xs font-semibold hover:underline">View All</button>
                  </div>

                  <div className="space-y-2">
                    {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(t => (
                      <div key={t.id} className="p-3 rounded-xl bg-slate-950/30 border border-slate-900 text-xs">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-200">{t.task_type}</span>
                          <span className="text-indigo-400 font-semibold text-[10px] uppercase">{t.status}</span>
                        </div>
                        <p className="text-slate-500 text-[10px] mt-1">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Immediate'}</p>
                      </div>
                    ))}

                    {tasks.filter(t => t.status !== 'completed').length === 0 && (
                      <div className="py-8 text-center text-slate-600 italic text-xs">No pending installation/repair tasks.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Warnings and notifications brief */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* High Priority Alerts */}
                <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-4">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">Action Required Alerts</h3>
                  <div className="space-y-2.5">
                    {complaints.filter(c => c.priority === 'urgent' && c.status !== 'resolved').map(c => (
                      <div key={c.id} className="p-3 rounded-xl bg-red-955/20 border border-red-900/35 text-red-400 text-xs flex items-center justify-between">
                        <span>⚠️ Urgent Complaint: "{c.subject}" requires service status update.</span>
                        <button onClick={() => { setSelectedItem(c); setActiveTab('Complaints'); }} className="underline font-bold text-[10px] uppercase hover:text-white">Resolve</button>
                      </div>
                    ))}
                    {complaints.filter(c => c.priority === 'urgent' && c.status !== 'resolved').length === 0 && (
                      <div className="p-4 rounded-xl bg-emerald-955/15 border border-emerald-900/25 text-emerald-450 text-xs text-center font-semibold">
                        ✅ No urgent priority tickets pending action.
                      </div>
                    )}
                  </div>
                </div>

                {/* Notifications Brief */}
                <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Latest Notifications</h3>
                    <button onClick={() => setActiveTab('Notifications')} className="text-slate-455 text-slate-500 text-xs font-semibold hover:underline">View All</button>
                  </div>
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map(n => (
                      <div key={n.id} className="p-3 rounded-xl bg-slate-950/30 border border-slate-900 text-xs">
                        <span className="font-bold text-white block">{n.title}</span>
                        <span className="text-slate-500 text-[10px] block mt-0.5">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="py-6 text-center text-slate-600 italic text-xs">No notifications.</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==============================================
              TAB 2: COMPLAINTS REGISTER
              ============================================== */}
          {activeTab === 'Complaints' && (
            <div className="space-y-6 animate-fade-in">
              <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 font-bold uppercase">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Address</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length > 0 ? (
                      complaints.map(c => (
                        <tr key={c.id} className="border-b border-slate-950/20 text-slate-300 hover:bg-slate-900/10">
                          <td className="py-3.5 px-4 font-mono">CMP-{c.id}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{c.subject}</td>
                          <td className="py-3.5 px-4">{c.customer_name}</td>
                          <td className="py-3.5 px-4">{c.customer_phone}</td>
                          <td className="py-3.5 px-4 truncate max-w-[150px]" title={c.customer_address}>{c.customer_address}</td>
                          <td className="py-3.5 px-4 uppercase">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              c.priority === 'urgent' || c.priority === 'high' ? 'bg-red-955/20 text-red-400' : 'bg-slate-900 text-slate-400'
                            }`}>{c.priority}</span>
                          </td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-cyan-400">{c.status}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedItem(c)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 transition-colors"
                            >
                              Manage Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-600 italic">No complaint tickets currently assigned to your account.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 3: TECHNICAL TASKS
              ============================================== */}
          {activeTab === 'Tasks' && (
            <div className="space-y-6 animate-fade-in">
              <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 font-bold uppercase">
                      <th className="py-3 px-4">Task ID</th>
                      <th className="py-3 px-4">Task Type</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Service Address</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length > 0 ? (
                      tasks.map(t => (
                        <tr key={t.id} className="border-b border-slate-950/20 text-slate-300 hover:bg-slate-900/10">
                          <td className="py-3.5 px-4 font-mono">TSK-{t.id}</td>
                          <td className="py-3.5 px-4 font-bold text-white">{t.task_type}</td>
                          <td className="py-3.5 px-4">{t.customer_name}</td>
                          <td className="py-3.5 px-4">{t.customer_phone}</td>
                          <td className="py-3.5 px-4 truncate max-w-[150px]" title={t.customer_address}>{t.customer_address}</td>
                          <td className="py-3.5 px-4 uppercase">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              t.priority === 'urgent' || t.priority === 'high' ? 'bg-red-955/20 text-red-400' : 'bg-slate-900 text-slate-400'
                            }`}>{t.priority}</span>
                          </td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-indigo-400">{t.status}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedItem(t)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 transition-colors"
                            >
                              Manage Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-600 italic">No installation or restoration tasks currently assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 4: WORK HISTORY AUDITS
              ============================================== */}
          {activeTab === 'History' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Filter controls glass panel */}
              <div className="p-4 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search by customer name or description..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="w-40">
                  <select
                    value={historyFilterType}
                    onChange={(e) => setHistoryFilterType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="task">Technical Tasks</option>
                    <option value="complaint">Complaint Tickets</option>
                  </select>
                </div>

                <div className="w-40">
                  <select
                    value={historyFilterPriority}
                    onChange={(e) => setHistoryFilterPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* History Audits Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 font-bold uppercase">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Job Type</th>
                      <th className="py-3 px-4">Description / Subject</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Final Status</th>
                      <th className="py-3 px-4 text-right">Completed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-950/20 text-slate-300 hover:bg-slate-900/10">
                          <td className="py-3.5 px-4 font-mono">{item.type === 'task' ? `TSK-${item.id}` : `CMP-${item.id}`}</td>
                          <td className="py-3.5 px-4 font-bold text-white capitalize">{item.type} ({item.work_type})</td>
                          <td className="py-3.5 px-4 max-w-[200px] truncate" title={item.description}>{item.description}</td>
                          <td className="py-3.5 px-4">{item.customer_name}</td>
                          <td className="py-3.5 px-4 uppercase">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              item.priority === 'urgent' || item.priority === 'high' ? 'bg-red-955/20 text-red-400' : 'bg-slate-900 text-slate-400'
                            }`}>{item.priority}</span>
                          </td>
                          <td className="py-3.5 px-4 uppercase">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 border border-emerald-800/30 text-emerald-400">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-500">{new Date(item.completed_date).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-600 italic">No completed work records matching filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ==============================================
              TAB 5: NOTIFICATIONS CENTER
              ============================================== */}
          {activeTab === 'Notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">Unread notifications count: {unreadCount}</p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkNotificationsAsRead}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-850 text-cyan-405 text-cyan-400 font-bold text-xs transition-colors"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              <div className="space-y-3 max-w-3xl">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border flex items-start space-x-3.5 transition-all ${
                      n.is_read
                        ? 'bg-slate-900/10 border-slate-900 opacity-60'
                        : 'bg-cyan-955/5 bg-slate-900/30 border-cyan-500/10 shadow shadow-cyan-500/5'
                    }`}
                  >
                    <div className="text-lg shrink-0 pt-0.5">🔔</div>
                    <div className="flex-grow space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span className="font-bold text-white text-xs leading-none">{n.title}</span>
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed font-light">{n.message}</p>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="py-14 text-center text-slate-655 italic text-xs">No notifications are logged.</div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 6: PROFILE & PASSWORD CONFIG
              ============================================== */}
          {activeTab === 'Profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              
              {/* Profile Details Card */}
              <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 space-y-6">
                <div>
                  <h3 className="font-black text-white text-base">Profile Details</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Read-only structural parameters and self-managed contacts</p>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Contact Phone</label>
                      <input
                        type="text"
                        value={editProfileForm.phone}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Residential Address</label>
                      <textarea
                        value={editProfileForm.address}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500 h-20 resize-none"
                        required
                      />
                    </div>
                    <div className="pt-2 flex space-x-2">
                      <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl">Save Info</button>
                      <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 rounded-xl">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="pt-2 flex items-center justify-between border-b border-slate-850/60 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center text-white font-bold text-lg">
                          {profile?.full_name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{profile?.full_name}</h4>
                          <span className="text-[10px] text-cyan-400 uppercase font-semibold">{profile?.designation}</span>
                        </div>
                      </div>
                      <button onClick={() => setIsEditingProfile(true)} className="px-3.5 py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-cyan-405 text-cyan-400 rounded-xl font-bold">Edit Details</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Employee Code</span>
                        <span className="text-white font-mono mt-0.5 block">{profile?.employee_code}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Office Email</span>
                        <span className="text-white mt-0.5 block">{profile?.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Contact Phone</span>
                        <span className="text-slate-200 mt-0.5 block">{profile?.phone || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">CNIC Identifier</span>
                        <span className="text-slate-200 font-mono mt-0.5 block">{profile?.cnic || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Address</span>
                        <span className="text-slate-200 mt-0.5 block">{profile?.address || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Portal Access Tier</span>
                        <span className="text-indigo-400 mt-0.5 uppercase font-bold block">ROLE: {profile?.role}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Config Card */}
              <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 space-y-6">
                <div>
                  <h3 className="font-black text-white text-base">Change Password</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Reset your staff account portal login password</p>
                </div>

                {passwordError && (
                  <div className="p-3.5 rounded-xl bg-red-955/20 border border-red-900/35 text-red-400 text-xs">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Secure Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 text-white font-bold hover:shadow hover:shadow-cyan-500/10 hover:scale-[1.01] transition-all"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ==============================================
          MODAL 1: ASSIGNED ITEM DETAILS & PROGRESSIONS
          ============================================== */}
      {selectedItem && !showReportForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[550px] max-w-full rounded-[26px] bg-slate-900 border border-slate-800 p-6 shadow-2xl relative space-y-5 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-850/60">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                  {selectedItem.task_type ? `TECHNICAL TASK // TSK-${selectedItem.id}` : `COMPLAINT TICKET // CMP-${selectedItem.id}`}
                </span>
                <h3 className="font-extrabold text-white text-lg mt-0.5">
                  {selectedItem.task_type || selectedItem.subject}
                </h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-455 text-slate-500 hover:text-white font-bold text-lg">✕</button>
            </div>

            {/* Content Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              
              <div className="col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Customer Detail</span>
                <span className="text-white block mt-0.5 font-semibold">{selectedItem.customer_name}</span>
                <span className="text-slate-400 block mt-0.5">{selectedItem.customer_phone}</span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Service Address Location</span>
                <span className="text-slate-300 block mt-0.5 leading-relaxed">{selectedItem.customer_address}</span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Description / Notes</span>
                <p className="text-slate-350 block mt-1 leading-relaxed max-h-24 overflow-y-auto pr-1 select-text bg-slate-950/20 p-2.5 rounded-xl border border-slate-850">
                  {selectedItem.description}
                </p>
              </div>

              {selectedItem.admin_notes && (
                <div className="col-span-2">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Admin Manager Notes</span>
                  <p className="text-slate-350 block mt-1 leading-relaxed bg-slate-950/25 p-2.5 rounded-xl border border-slate-850">
                    {selectedItem.admin_notes}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned / Created Date</span>
                <span className="text-slate-350 block mt-0.5">{new Date(selectedItem.created_at).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Task Due Date</span>
                <span className="text-slate-350 block mt-0.5">{selectedItem.due_date ? new Date(selectedItem.due_date).toLocaleDateString() : 'Immediate Target'}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Priority Tier</span>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  selectedItem.priority === 'urgent' || selectedItem.priority === 'high' ? 'bg-red-955/20 text-red-400' : 'bg-slate-900 text-slate-400'
                }`}>{selectedItem.priority}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Status State</span>
                <span className="text-white block mt-0.5 uppercase font-bold text-cyan-400">{selectedItem.status}</span>
              </div>

            </div>

            {/* Actions / Status changes progression */}
            <div className="pt-4 border-t border-slate-850/60 flex flex-wrap gap-2 items-center justify-between">
              
              <span className="text-[10px] font-bold text-slate-500 uppercase">Change Progression Status:</span>
              
              <div className="flex gap-2">
                {/* Complaint Status Transitions */}
                {selectedItem.subject && (
                  <>
                    {selectedItem.status === 'pending' && (
                      <button onClick={() => handleUpdateComplaintStatus(selectedItem.id, 'on_the_way')} className="px-3.5 py-2 bg-blue-955/20 hover:bg-blue-900 border border-blue-800 text-blue-400 text-xs font-bold rounded-xl transition-all">On the Way</button>
                    )}
                    {(selectedItem.status === 'pending' || selectedItem.status === 'in_progress') && (
                      <button onClick={() => handleUpdateComplaintStatus(selectedItem.id, 'in_progress')} className="px-3.5 py-2 bg-cyan-955/20 hover:bg-cyan-900 border border-cyan-800 text-cyan-405 text-cyan-400 text-xs font-bold rounded-xl transition-all">In Progress</button>
                    )}
                    {selectedItem.status !== 'resolved' && (
                      <button onClick={() => handleUpdateComplaintStatus(selectedItem.id, 'resolved')} className="px-3.5 py-2 bg-emerald-955/20 hover:bg-emerald-900 border border-emerald-800 text-emerald-450 text-xs font-bold rounded-xl transition-all">Mark Resolved</button>
                    )}
                  </>
                )}

                {/* Task Status Transitions */}
                {selectedItem.task_type && (
                  <>
                    {selectedItem.status === 'assigned' && (
                      <button onClick={() => handleUpdateTaskStatus(selectedItem.id, 'on_the_way')} className="px-3.5 py-2 bg-blue-955/20 hover:bg-blue-900 border border-blue-800 text-blue-400 text-xs font-bold rounded-xl transition-all">On the Way</button>
                    )}
                    {(selectedItem.status === 'assigned' || selectedItem.status === 'on_the_way' || selectedItem.status === 'in_progress') && (
                      <button onClick={() => handleUpdateTaskStatus(selectedItem.id, 'in_progress')} className="px-3.5 py-2 bg-cyan-955/20 hover:bg-cyan-900 border border-cyan-800 text-cyan-405 text-cyan-400 text-xs font-bold rounded-xl transition-all">In Progress</button>
                    )}
                    {selectedItem.status !== 'completed' && (
                      <button onClick={() => handleUpdateTaskStatus(selectedItem.id, 'completed')} className="px-3.5 py-2 bg-emerald-955/20 hover:bg-emerald-900 border border-emerald-800 text-emerald-450 text-xs font-bold rounded-xl transition-all">Mark Completed</button>
                    )}
                  </>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==============================================
          MODAL 2: WORK REPORT SUBMISSIONS
          ============================================== */}
      {showReportForm && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[520px] max-w-full rounded-[26px] bg-slate-900 border border-slate-800 p-6 shadow-2xl relative space-y-5 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-850/60">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">WORK COMPLETION REPORT</span>
                <h3 className="font-extrabold text-white text-lg mt-0.5">
                  Log report for: {selectedItem.task_type || selectedItem.subject}
                </h3>
              </div>
              <button onClick={() => { setShowReportForm(false); setSelectedItem(null); }} className="text-slate-455 text-slate-500 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmitWorkReport} className="space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Problem Found / Diagnostic</label>
                <textarea
                  placeholder="Describe the root issue (e.g., broken fiber splice joint, faulty ONU signal level)..."
                  value={reportForm.problem_found}
                  onChange={(e) => setReportForm({ ...reportForm, problem_found: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Work Performed / Operations</label>
                <textarea
                  placeholder="Describe details of work done (e.g., respliced customer drop cable, replaced adapter)..."
                  value={reportForm.work_performed}
                  onChange={(e) => setReportForm({ ...reportForm, work_performed: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Resolution / Final Output</label>
                <input
                  type="text"
                  placeholder="Final state (e.g., ONU RX signal stabilized at -21dBm, connection online)"
                  value={reportForm.solution}
                  onChange={(e) => setReportForm({ ...reportForm, solution: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Used Equipment / Materials</label>
                <input
                  type="text"
                  placeholder="Materials used (e.g., 1x ONU, 10m Cat6 Cable, 2x RJ45)"
                  value={reportForm.equipment_used}
                  onChange={(e) => setReportForm({ ...reportForm, equipment_used: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Additional Notes</label>
                <input
                  type="text"
                  placeholder="Additional technician observations..."
                  value={reportForm.additional_notes}
                  onChange={(e) => setReportForm({ ...reportForm, additional_notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:brightness-105 active:scale-[0.99] transition-all"
                >
                  Submit & Resolve Job
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReportForm(false); setSelectedItem(null); }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default EmployeePortal;
