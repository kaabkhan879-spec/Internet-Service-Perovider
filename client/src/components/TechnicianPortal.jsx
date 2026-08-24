import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TechnicianPortal({ user, onLogoutSuccess }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tasks, setTasks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Work Report form states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null); // holds task or complaint to complete
  const [reportForm, setReportForm] = useState({
    problem_found: '',
    work_performed: '',
    solution: '',
    equipment_used: '',
    additional_notes: ''
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Theme states
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('isp-employee-theme') || 'auto';
  });
  const [activeTheme, setActiveTheme] = useState('dark');

  // Load all required data
  const loadPortalData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch Profile
      const profRes = await fetch('http://localhost:5000/api/employee/profile', {
        method: 'GET',
        credentials: 'include'
      });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
      }

      // 2. Fetch Tasks (Jobs)
      const tasksRes = await fetch('http://localhost:5000/api/employee/tasks', {
        method: 'GET',
        credentials: 'include'
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      // 3. Fetch Complaints
      const compRes = await fetch('http://localhost:5000/api/employee/complaints', {
        method: 'GET',
        credentials: 'include'
      });
      if (compRes.ok) {
        const compData = await compRes.json();
        setComplaints(compData);
      }

      // 4. Fetch Work History
      const historyRes = await fetch('http://localhost:5000/api/employee/work-history', {
        method: 'GET',
        credentials: 'include'
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setWorkHistory(historyData);
      }

      // 5. Fetch Notifications
      const notifRes = await fetch('http://localhost:5000/api/employee/notifications', {
        method: 'GET',
        credentials: 'include'
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }

    } catch (err) {
      setError('Connection to server failed. Please check backend connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  // Evaluate Theme settings dynamically
  useEffect(() => {
    const evaluateTheme = () => {
      const savedPref = localStorage.getItem('isp-employee-theme');
      if (themePreference === 'light') {
        setActiveTheme('light');
      } else if (themePreference === 'dark') {
        setActiveTheme('dark');
      } else {
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!savedPref) {
          setActiveTheme(systemPrefersDark ? 'dark' : 'light');
        } else {
          const hour = new Date().getHours();
          if (hour >= 6 && hour < 18) {
            setActiveTheme('light');
          } else {
            setActiveTheme('dark');
          }
        }
      }
    };
    evaluateTheme();
  }, [themePreference]);

  // Logout routine
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/employee/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn("Logout endpoint unreachable.");
    }
    onLogoutSuccess();
    navigate('/employee/login');
  };

  // Status transitions transitions
  const handleUpdateStatus = async (job, nextStatus) => {
    const endpoint = job.task_type
      ? `http://localhost:5000/api/employee/tasks/${job.id}/status`
      : `http://localhost:5000/api/employee/complaints/${job.id}/status`;

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
        credentials: 'include'
      });

      if (response.ok) {
        loadPortalData();
      } else {
        alert('Failed to update status on the server.');
      }
    } catch (err) {
      alert('Network error updating job status.');
    }
  };

  // Complete Work Report submit
  const handleCompleteWorkReport = async (e) => {
    e.preventDefault();
    if (!reportForm.problem_found.trim() || !reportForm.work_performed.trim() || !reportForm.solution.trim()) {
      alert('Problem Found, Work Performed and Solution fields are required.');
      return;
    }

    setSubmittingReport(true);
    try {
      // 1. Submit work report
      const payload = {
        problem_found: reportForm.problem_found,
        work_performed: reportForm.work_performed,
        solution: reportForm.solution,
        equipment_used: reportForm.equipment_used,
        additional_notes: reportForm.additional_notes
      };

      if (selectedJob.task_type) {
        payload.task_id = selectedJob.id;
      } else {
        payload.complaint_id = selectedJob.id;
      }

      const reportResponse = await fetch('http://localhost:5000/api/employee/work-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        throw new Error(errorData.error || 'Failed to submit work report.');
      }

      // 2. Mark the status as completed / resolved
      const nextStatus = selectedJob.task_type ? 'completed' : 'resolved';
      const statusEndpoint = selectedJob.task_type
        ? `http://localhost:5000/api/employee/tasks/${selectedJob.id}/status`
        : `http://localhost:5000/api/employee/complaints/${selectedJob.id}/status`;

      const statusResponse = await fetch(statusEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, comment: `Work report filed: ${reportForm.solution}` }),
        credentials: 'include'
      });

      if (statusResponse.ok) {
        setShowReportModal(false);
        setReportForm({ problem_found: '', work_performed: '', solution: '', equipment_used: '', additional_notes: '' });
        loadPortalData();
      } else {
        alert('Work report saved, but failed to update status to completed.');
      }

    } catch (err) {
      alert(err.message || 'Error processing completion report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Merge tasks and complaints for pipeline display
  const allAssignedJobs = [
    ...tasks.map(t => ({ ...t, job_id: `TSK-${t.id}`, display_type: t.task_type, is_task: true })),
    ...complaints.map(c => ({ ...c, job_id: `CMP-${c.id}`, display_type: 'Customer Complaint', is_task: false }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Roster counters
  const activeJobsList = allAssignedJobs.filter(j => j.status !== 'completed' && j.status !== 'resolved');
  const statCounts = {
    todayJobs: activeJobsList.length,
    pending: allAssignedJobs.filter(j => j.status === 'assigned' || j.status === 'pending').length,
    inProgress: allAssignedJobs.filter(j => j.status === 'in_progress').length,
    completed: allAssignedJobs.filter(j => j.status === 'completed' || j.status === 'resolved').length
  };

  // Schedule grouping
  const getGroupedSchedule = () => {
    const todayStr = new Date().toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    const todayList = [];
    const tomorrowList = [];
    const upcomingList = [];

    activeJobsList.forEach(job => {
      const jobDate = new Date(job.due_date || job.created_at);
      const jobDateStr = jobDate.toDateString();

      if (jobDateStr === todayStr) {
        todayList.push(job);
      } else if (jobDateStr === tomorrowStr) {
        tomorrowList.push(job);
      } else {
        upcomingList.push(job);
      }
    });

    return { todayList, tomorrowList, upcomingList };
  };

  const { todayList, tomorrowList, upcomingList } = getGroupedSchedule();

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'Jobs', label: 'My Jobs', icon: '🔧' },
    { id: 'Schedule', label: 'My Schedule', icon: '📅' },
    { id: 'Customers', label: 'Customers', icon: '👤' },
    { id: 'History', label: 'Work History', icon: '🛠️' },
    { id: 'Notifications', label: 'Notifications', icon: '🔔' },
    { id: 'Profile', label: 'My Profile', icon: '👤' }
  ];

  return (
    <div className={`flex min-h-screen font-sans w-full selection:bg-cyan-500 overflow-x-hidden relative theme-transition ${activeTheme === 'light' ? 'bg-[#f8fafc] text-[#1e293b] light-theme' : 'bg-[#030712] text-[#f3f4f6] selection:text-[#030712]'}`}>
      
      {/* Dynamic theme style sheet overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .theme-transition, .theme-transition *, .theme-transition aside, .theme-transition main, .theme-transition header, .theme-transition div {
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .light-theme {
          --background: #f8fafc;
          --foreground: #1e293b;
          --card: #ffffff;
          --card-foreground: #1e293b;
          --border: #e2e8f0;
          --muted: #f1f5f9;
          --muted-foreground: #475569;
          --primary: #0284c7;
          --success: #15803d;
          --warning: #b45309;
          --danger: #b91c1c;
        }
        .light-theme aside {
          background-color: var(--card) !important;
          border-color: var(--border) !important;
        }
        .light-theme aside * {
          color: var(--foreground) !important;
        }
        .light-theme aside nav button {
          color: var(--muted-foreground) !important;
        }
        .light-theme aside nav button:hover {
          background-color: var(--muted) !important;
        }
        .light-theme aside nav button.bg-slate-900 {
          background-color: var(--muted) !important;
          color: var(--primary) !important;
        }
        .light-theme header {
          background-color: var(--card) !important;
          border-color: var(--border) !important;
        }
        .light-theme header * {
          color: var(--foreground) !important;
        }
        .light-theme .bg-[#090d16]/20,
        .light-theme .bg-[#090d16]/30,
        .light-theme .bg-[#090d16],
        .light-theme .bg-[#070b14]/50,
        .light-theme .bg-slate-900,
        .light-theme .bg-[#030712]/50,
        .light-theme .bg-slate-950/20 {
          background-color: var(--card) !important;
          border-color: var(--border) !important;
          color: var(--foreground) !important;
        }
        .light-theme .text-white, .light-theme h2, .light-theme h3, .light-theme h4, .light-theme strong {
          color: var(--foreground) !important;
        }
        .light-theme .text-slate-400, .light-theme .text-slate-500, .light-theme p {
          color: var(--muted-foreground) !important;
        }
        .light-theme .border-[#111827], .light-theme .border-slate-800 {
          border-color: var(--border) !important;
        }
        .light-theme input, .light-theme textarea, .light-theme select {
          background-color: var(--card) !important;
          border-color: var(--border) !important;
          color: var(--foreground) !important;
        }
        .light-theme .bg-emerald-950 {
          background-color: #d1fae5 !important;
          color: var(--success) !important;
          border-color: #a7f3d0 !important;
        }
        .light-theme .bg-blue-955,
        .light-theme .bg-blue-950 {
          background-color: #dbeafe !important;
          color: var(--primary) !important;
          border-color: #bfdbfe !important;
        }
        .light-theme .bg-amber-955/20,
        .light-theme .bg-amber-950 {
          background-color: #fef3c7 !important;
          color: var(--warning) !important;
          border-color: #fde68a !important;
        }
      `}} />

      {/* Sidebar navigation */}
      <aside className="w-[280px] border-r border-[#111827] bg-[#070b15]/90 backdrop-blur-md hidden lg:flex flex-col h-screen sticky top-0 z-40 shrink-0">
        <div className="p-6 border-b border-[#111827] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xs">🔧</span>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-white block">Technician Portal</span>
              <span className="text-[9px] text-cyan-400 font-mono tracking-widest block uppercase mt-0.5">Field Ops</span>
            </div>
          </div>
        </div>

        {/* Sidebar Tabs */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                activeTab === item.id 
                  ? 'bg-slate-900 text-cyan-400 border-l-2 border-cyan-400' 
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#111827]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all duration-150"
          >
            <span className="text-base">🚪</span>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Header toolbar */}
        <header className="border-b border-[#111827] bg-[#030712]/80 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div>
            <h1 className="text-base md:text-lg font-bold text-white uppercase tracking-wider">Technician Workcenter</h1>
            <p className="text-[10px] text-slate-500 font-light">Assigned tasks pipeline, service logs, and field reports.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme switcher */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="p-2 rounded-xl hover:bg-slate-900 text-slate-400 transition-colors flex items-center"
              >
                <span className="text-lg">{activeTheme === 'light' ? '☀️' : '🌙'}</span>
              </button>
              
              {showThemeDropdown && (
                <div className="absolute right-0 mt-2.5 w-36 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs">
                  {[
                    { mode: 'auto', label: '⚙️ Automatic' },
                    { mode: 'light', label: '☀️ Light Mode' },
                    { mode: 'dark', label: '🌙 Dark Mode' }
                  ].map((t) => (
                    <button
                      key={t.mode}
                      onClick={() => {
                        setThemePreference(t.mode);
                        setShowThemeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-850 transition-colors flex items-center justify-between ${
                        themePreference === t.mode ? 'text-cyan-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-xs">
                {(profile?.full_name || user?.name || 'ME').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-white block leading-none">{profile?.full_name || user?.name || 'Mehmood'}</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-extrabold block mt-0.5">TECHNICIAN</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow p-6 space-y-6">
          
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500">Loading workcenter pipeline...</div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-800 text-red-400 text-xs">{error}</div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'Dashboard' && (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* Top Welcome Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl bg-gradient-to-r from-slate-900/20 to-slate-950/10 border border-[#111827] gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white">Good evening, {profile?.full_name?.split(' ')[0] || user?.name || 'Mehmood'} 👋</h2>
                      <p className="text-xs text-slate-400">Here’s your field work overview for today.</p>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Today's Jobs", val: statCounts.todayJobs, color: 'hover:border-cyan-500/20', icon: '📋' },
                      { label: "Pending Jobs", val: statCounts.pending, color: 'hover:border-blue-500/20', icon: '👍' },
                      { label: "In Progress", val: statCounts.inProgress, color: 'hover:border-amber-500/20', icon: '⚡' },
                      { label: "Completed", val: statCounts.completed, color: 'hover:border-emerald-500/20', icon: '✅' }
                    ].map((card, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-[#090d16]/30 border border-slate-800/80 transition-all duration-200 flex flex-col justify-between h-24">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 tracking-wider uppercase font-bold">
                          <span>{card.label}</span>
                          <span>{card.icon}</span>
                        </div>
                        <div className="text-2xl font-black text-white">{card.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* MY ASSIGNED JOBS */}
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">My Assigned Jobs</h3>
                    {activeJobsList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeJobsList.map((job) => (
                          <div key={job.id} className="p-4 rounded-xl bg-[#070b14]/50 border border-slate-850 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[9px] font-bold text-white">{job.job_id}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-extrabold ${
                                  job.priority === 'high' || job.priority === 'urgent' ? 'bg-red-950 text-red-400' : 'bg-slate-900 text-slate-400'
                                }`}>{job.priority}</span>
                              </div>
                              <div>
                                <span className="text-sm font-bold text-white block">{job.display_type}</span>
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{job.description}</p>
                              </div>
                              <div className="text-[10px] text-slate-500 space-y-1">
                                <div>👤 <strong>Customer:</strong> {job.customer_name} ({job.customer_phone})</div>
                                <div>📍 <strong>Location:</strong> {job.customer_address}</div>
                                <div>📅 <strong>Scheduled:</strong> {new Date(job.due_date || job.created_at).toLocaleString()}</div>
                                <div>⏳ <strong>Status:</strong> <span className="uppercase text-cyan-400 font-semibold">{job.status}</span></div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                              {/* Workflow transition actions */}
                              {job.status === 'assigned' && (
                                <button
                                  onClick={() => handleUpdateStatus(job, 'accepted')}
                                  className="flex-grow px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-755 text-white font-bold text-[10px] uppercase tracking-wider"
                                >
                                  Accept Job
                                </button>
                              )}
                              {job.status === 'accepted' && (
                                <button
                                  onClick={() => handleUpdateStatus(job, 'on_the_way')}
                                  className="flex-grow px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider"
                                >
                                  Mark On The Way
                                </button>
                              )}
                              {(job.status === 'accepted' || job.status === 'on_the_way') && (
                                <button
                                  onClick={() => handleUpdateStatus(job, 'in_progress')}
                                  className="flex-grow px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-755 text-slate-950 font-black text-[10px] uppercase tracking-wider"
                                >
                                  Start Job / In Progress
                                </button>
                              )}
                              {job.status === 'in_progress' && (
                                <button
                                  onClick={() => { setSelectedJob(job); setShowReportModal(true); }}
                                  className="flex-grow px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider animate-pulse"
                                >
                                  Complete Job
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-500 italic text-xs">No active technical jobs assigned to you.</div>
                    )}
                  </div>

                </div>
              )}

              {/* Jobs Tab */}
              {activeTab === 'Jobs' && (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4 animate-fade-in-up">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">My Assigned Jobs Pipeline</h3>
                  {allAssignedJobs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {allAssignedJobs.map((job) => (
                        <div key={job.id} className="p-4 rounded-xl bg-[#070b14]/50 border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[9px] font-bold text-white">{job.job_id}</span>
                              <span className="text-xs font-bold text-white">{job.display_type}</span>
                            </div>
                            <p className="text-[10px] text-slate-400">{job.description}</p>
                            <div className="text-[9px] text-slate-500">
                              <span>👤 {job.customer_name}</span> | <span>📍 {job.customer_address}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 self-stretch md:self-auto justify-between border-t md:border-t-0 pt-2 md:pt-0">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                              job.status === 'completed' || job.status === 'resolved' ? 'bg-emerald-950 text-emerald-450' : 'bg-slate-900 text-slate-400'
                            }`}>{job.status}</span>
                            
                            {job.status === 'in_progress' && (
                              <button
                                onClick={() => { setSelectedJob(job); setShowReportModal(true); }}
                                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-505 italic text-xs">No jobs found in your roster.</div>
                  )}
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'Schedule' && (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-6 animate-fade-in-up">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">My Schedule</h3>
                  
                  {/* Today */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-cyan-400 text-xs border-b border-slate-800 pb-1">📅 TODAY</h4>
                    {todayList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {todayList.map(j => (
                          <div key={j.id} className="p-3 rounded-lg bg-slate-950/20 border border-slate-850 text-xs">
                            <span className="font-bold text-white block">{j.display_type}</span>
                            <span className="text-slate-500 block mt-1">Customer: {j.customer_name}</span>
                            <span className="text-slate-500 block truncate">Location: {j.customer_address}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No tasks scheduled for today.</p>
                    )}
                  </div>

                  {/* Tomorrow */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-300 text-xs border-b border-slate-800 pb-1">📅 TOMORROW</h4>
                    {tomorrowList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tomorrowList.map(j => (
                          <div key={j.id} className="p-3 rounded-lg bg-slate-950/20 border border-slate-850 text-xs">
                            <span className="font-bold text-white block">{j.display_type}</span>
                            <span className="text-slate-500 block mt-1">Customer: {j.customer_name}</span>
                            <span className="text-slate-500 block truncate">Location: {j.customer_address}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No tasks scheduled for tomorrow.</p>
                    )}
                  </div>

                  {/* Upcoming */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-350 text-xs border-b border-slate-800 pb-1">📅 UPCOMING</h4>
                    {upcomingList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {upcomingList.map(j => (
                          <div key={j.id} className="p-3 rounded-lg bg-slate-950/20 border border-slate-850 text-xs">
                            <span className="font-bold text-white block">{j.display_type}</span>
                            <span className="text-slate-500 block mt-1">Customer: {j.customer_name}</span>
                            <span className="text-slate-500 block truncate">Location: {j.customer_address}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No upcoming tasks scheduled.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Customers Tab */}
              {activeTab === 'Customers' && (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4 animate-fade-in-up">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">Associated Customer Directory</h3>
                  {activeJobsList.length > 0 ? (
                    <div className="space-y-3">
                      {activeJobsList.map((job, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#070b14]/50 border border-slate-850 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{job.customer_name}</span>
                            <span className="text-[9px] text-cyan-400 font-bold uppercase">{job.display_type}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-550 text-slate-400">
                            <div>📞 <strong>Phone:</strong> {job.customer_phone}</div>
                            <div>📍 <strong>Service Address:</strong> {job.customer_address}</div>
                            <div>📦 <strong>Internet Speed:</strong> 50 Mbps Fiber</div>
                            <div>📝 <strong>Job Details:</strong> {job.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 italic text-xs">No active customers in pipeline.</div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'History' && (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4 animate-fade-in-up">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">Work Report History</h3>
                  {workHistory.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#030712]/50 text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold uppercase text-[9px]">
                            <th className="p-3">Job ID</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Work Performed</th>
                            <th className="p-3">Solution</th>
                            <th className="p-3">Equipment</th>
                            <th className="p-3">Completed Date</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workHistory.map((report, idx) => (
                            <tr key={idx} className="border-b border-slate-850 text-slate-300">
                              <td className="p-3 font-mono font-bold text-white">{report.type === 'task' ? `TSK-${report.id}` : `CMP-${report.id}`}</td>
                              <td className="p-3">{report.customer_name}</td>
                              <td className="p-3 truncate max-w-xs">{report.work_performed}</td>
                              <td className="p-3">{report.solution}</td>
                              <td className="p-3">{report.equipment_used || 'None'}</td>
                              <td className="p-3 text-slate-500">{report.completed_date ? new Date(report.completed_date).toLocaleDateString() : 'N/A'}</td>
                              <td className="p-3 text-right">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold uppercase text-[9px]">Completed</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 italic text-xs">No completed jobs found.</div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'Notifications' && (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4 animate-fade-in-up">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">My Notifications</h3>
                  {notifications.length > 0 ? (
                    <div className="space-y-2">
                      {notifications.map((notif, idx) => (
                        <div key={idx} className={`p-3.5 rounded-xl border border-slate-850 flex items-start space-x-3 ${notif.is_read ? 'opacity-60' : 'bg-slate-900/10'}`}>
                          <span className="text-lg">🔔</span>
                          <div>
                            <span className="font-bold text-white block text-xs">{notif.title}</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{notif.message}</p>
                            <span className="text-[8px] text-slate-500 mt-1 block">{new Date(notif.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 italic text-xs">No notifications.</div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'Profile' && (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 max-w-xl mx-auto space-y-4 animate-fade-in-up">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">My Profile Details</h3>
                  {profile && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center space-x-4 pb-3 border-b border-slate-800/50">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {profile.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">{profile.name}</span>
                          <span className="text-[10px] text-cyan-400 font-mono block mt-1 uppercase">{profile.employee_code}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Work Email</span>
                          <span className="font-medium text-white">{profile.email}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Phone Number</span>
                          <span className="font-medium text-white">{profile.phone}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Designation</span>
                          <span className="font-medium text-white">{profile.designation}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Status</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-450 font-bold uppercase text-[9px] inline-block mt-0.5">Active</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </>
          )}

        </main>
      </div>

      {/* Completion Work Report Form Modal */}
      {showReportModal && selectedJob && (
        <div className="fixed inset-0 z-55 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 text-xs">
            <div className="pb-2 border-b border-slate-850">
              <h4 className="font-extrabold text-white text-sm">Submit Work Report ({selectedJob.job_id})</h4>
              <p className="text-[10px] text-slate-500">Provide completion parameters to resolve the job ticket.</p>
            </div>
            
            <form onSubmit={handleCompleteWorkReport} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Problem Found *</label>
                <textarea
                  required
                  value={reportForm.problem_found}
                  onChange={(e) => setReportForm({ ...reportForm, problem_found: e.target.value })}
                  placeholder="Record issues discovered on-site..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-white h-16 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Work Performed *</label>
                <textarea
                  required
                  value={reportForm.work_performed}
                  onChange={(e) => setReportForm({ ...reportForm, work_performed: e.target.value })}
                  placeholder="Details of cabling, routing config, splicer power..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-white h-16 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Solution *</label>
                <input
                  type="text"
                  required
                  value={reportForm.solution}
                  onChange={(e) => setReportForm({ ...reportForm, solution: e.target.value })}
                  placeholder="Fiber link restored, router configured, etc."
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Equipment Used</label>
                <input
                  type="text"
                  value={reportForm.equipment_used}
                  onChange={(e) => setReportForm({ ...reportForm, equipment_used: e.target.value })}
                  placeholder="Fiber patch cord, GPON ONU serial..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Additional Notes</label>
                <textarea
                  value={reportForm.additional_notes}
                  onChange={(e) => setReportForm({ ...reportForm, additional_notes: e.target.value })}
                  placeholder="Optional extra comments..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-white h-12 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-705 text-white font-bold"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
