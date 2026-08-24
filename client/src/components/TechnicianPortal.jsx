import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TechnicianPortal({ user, onLogoutSuccess }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tasks, setTasks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Dialog and update states
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [submittingProblem, setSubmittingProblem] = useState(false);

  // Theme states
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('isp-employee-theme') || 'auto';
  });
  const [activeTheme, setActiveTheme] = useState('dark');

  // Load profile data and tasks on mount
  const loadPortalData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load Profile
      const profRes = await fetch('http://localhost:5000/api/employee/profile', {
        method: 'GET',
        credentials: 'include'
      });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
      }

      // Load Assigned Tasks (Jobs)
      const tasksRes = await fetch('http://localhost:5000/api/employee/tasks', {
        method: 'GET',
        credentials: 'include'
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      // Load Assigned Complaints
      const compRes = await fetch('http://localhost:5000/api/employee/complaints', {
        method: 'GET',
        credentials: 'include'
      });
      if (compRes.ok) {
        const compData = await compRes.json();
        setComplaints(compData);
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

  // Theme checks
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
    const interval = setInterval(evaluateTheme, 15000);
    return () => clearInterval(interval);
  }, [themePreference]);

  useEffect(() => {
    localStorage.setItem('isp-employee-theme', themePreference);
  }, [themePreference]);

  // Logouts
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

  // Status transition cycles: Assigned -> Accepted -> On The Way -> In Progress -> Completed
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'assigned': return 'accepted';
      case 'accepted': return 'on_the_way';
      case 'on_the_way': return 'in_progress';
      case 'in_progress': return 'completed';
      default: return null;
    }
  };

  const handleUpdateTaskStatus = async (taskId, nextStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employee/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
        credentials: 'include'
      });
      if (response.ok) {
        // Reload tasks data dynamically
        loadPortalData();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      alert('Network error updating task status.');
    }
  };

  // Notes submission
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const response = await fetch(`http://localhost:5000/api/employee/tasks/${selectedTask.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedTask.status, admin_notes: newNote }),
        credentials: 'include'
      });
      if (response.ok) {
        setShowNotesModal(false);
        setNewNote('');
        loadPortalData();
      } else {
        alert('Failed to add note.');
      }
    } catch (err) {
      alert('Network error writing note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Report Problem
  const handleReportProblem = async (e) => {
    e.preventDefault();
    if (!problemDescription.trim()) return;
    setSubmittingProblem(true);
    try {
      const response = await fetch(`http://localhost:5000/api/employee/tasks/${selectedTask.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending', admin_notes: `PROBLEM REPORT: ${problemDescription}` }),
        credentials: 'include'
      });
      if (response.ok) {
        setShowProblemModal(false);
        setProblemDescription('');
        loadPortalData();
      } else {
        alert('Failed to report problem.');
      }
    } catch (err) {
      alert('Network error reporting problem.');
    } finally {
      setSubmittingProblem(false);
    }
  };

  // Task Statistics counts
  const statCounts = {
    assigned: tasks.filter(t => t.status === 'assigned').length,
    accepted: tasks.filter(t => t.status === 'accepted').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length
  };

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'Jobs', label: 'My Assigned Jobs', icon: '🔧' },
    { id: 'Schedule', label: 'My Schedule', icon: '📅' },
    { id: 'Customers', label: 'Customer Details', icon: '👥' },
    { id: 'Inventory', label: 'Equipment / Inventory', icon: '📦' },
    { id: 'Profile', label: 'My Profile', icon: '👤' }
  ];

  return (
    <div className={`flex min-h-screen font-sans w-full selection:bg-cyan-500 overflow-x-hidden relative theme-transition ${activeTheme === 'light' ? 'bg-[#f8fafc] text-[#1e293b] light-theme' : 'bg-[#030712] text-[#f3f4f6] selection:text-[#030712]'}`}>
      
      {/* Dynamic theme style overrides */}
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
        .light-theme .bg-slate-955/20,
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
        .light-theme input, .light-theme textarea {
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

      {/* Sidebar Navigation */}
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

        {/* Navigation list */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-155 relative group ${
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
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all"
          >
            <span className="text-base">🚪</span>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header navbar */}
        <header className="border-b border-[#111827] bg-[#030712]/80 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div>
            <h1 className="text-base md:text-lg font-bold text-white uppercase tracking-wider">Technician Workcenter</h1>
            <p className="text-[10px] text-slate-500 font-light">Assigned tasks pipeline, service logs, and field reports.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme selector */}
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
                        themePreference === t.mode ? 'text-cyan-405 font-bold' : 'text-slate-300'
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
            <div className="p-4 rounded-xl bg-red-955/20 border border-red-800 text-red-400 text-xs">{error}</div>
          ) : (
            <>
              {/* Dashboard Content */}
              {activeTab === 'Dashboard' && (
                <div className="space-y-6 animate-fade-in-up">
                  
                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Assigned Jobs", val: statCounts.assigned, color: 'hover:border-cyan-500/20', icon: '📋' },
                      { label: "Accepted", val: statCounts.accepted, color: 'hover:border-blue-500/20', icon: '👍' },
                      { label: "In Progress", val: statCounts.inProgress, color: 'hover:border-amber-500/20', icon: '⚡' },
                      { label: "Completed", val: statCounts.completed, color: 'hover:border-emerald-500/20', icon: '✅' }
                    ].map((card, i) => (
                      <div key={i} className={`p-4 rounded-2xl bg-[#090d16]/30 border border-slate-800/80 ${card.color} transition-all duration-200 flex flex-col justify-between h-24`}>
                        <div className="flex justify-between items-center text-[10px] text-slate-505 tracking-wider uppercase font-bold">
                          <span>{card.label}</span>
                          <span>{card.icon}</span>
                        </div>
                        <div className="text-2xl font-black text-white">{card.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Two column layouts */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Left List of Tasks */}
                    <div className="xl:col-span-2 p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4">
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">My Current Job Pipeline</h3>
                      {tasks.length > 0 ? (
                        <div className="space-y-3">
                          {tasks.slice(0, 4).map((task) => (
                            <div key={task.id} className="p-4 rounded-xl bg-[#070b14]/50 border border-slate-800/40 hover:border-slate-800 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-0.5 rounded bg-slate-909 bg-slate-900 border border-slate-800 font-mono text-[9px] font-bold text-white">JOB-{task.id}</span>
                                  <span className="text-xs font-bold text-white">{task.task_type}</span>
                                </div>
                                <p className="text-slate-400 text-[11px] font-light leading-relaxed max-w-md">{task.description}</p>
                                <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3">
                                  <span>👤 {task.customer_name}</span>
                                  <span>📍 {task.customer_address}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 self-stretch md:self-auto justify-end">
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                  task.status === 'completed' ? 'bg-emerald-950 text-emerald-450' :
                                  task.status === 'in_progress' ? 'bg-amber-950 text-amber-450' : 'bg-blue-950 text-blue-450'
                                }`}>
                                  {task.status}
                                </span>
                                
                                {getNextStatus(task.status) && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(task.id, getNextStatus(task.status))}
                                    className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-semibold hover:bg-cyan-900 transition-all uppercase"
                                  >
                                    Move to {getNextStatus(task.status)}
                                  </button>
                                )}

                                <button
                                  onClick={() => { setSelectedTask(task); setShowNotesModal(true); }}
                                  className="p-1 rounded hover:bg-slate-909 text-slate-400"
                                  title="Add Notes"
                                >
                                  📝
                                </button>
                                <button
                                  onClick={() => { setSelectedTask(task); setShowProblemModal(true); }}
                                  className="p-1 rounded hover:bg-slate-909 text-red-400"
                                  title="Report Problem"
                                >
                                  ⚠️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-500 italic text-xs">No active tasks assigned to you today.</div>
                      )}
                    </div>

                    {/* Right column schedule */}
                    <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4">
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">Today's Schedule</h3>
                      {tasks.filter(t => t.status !== 'completed').length > 0 ? (
                        <div className="space-y-3">
                          {tasks.filter(t => t.status !== 'completed').map((task, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-950/20 border border-slate-800/40 flex items-start space-x-2">
                              <span className="text-sm">📍</span>
                              <div>
                                <span className="text-xs font-bold text-white block">{task.customer_name}</span>
                                <span className="text-[10px] text-slate-500 block">{task.customer_address}</span>
                                <span className="text-[9px] text-cyan-400 block mt-1 uppercase font-bold">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-505 italic text-xs">Schedule cleared for today.</div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Jobs Tab */}
              {activeTab === 'Jobs' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-sm">Assigned Tasks Log</h3>
                    </div>
                    {tasks.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
                              <th className="p-3">Job ID</th>
                              <th className="p-3">Task Type</th>
                              <th className="p-3">Customer</th>
                              <th className="p-3">Location</th>
                              <th className="p-3">Due Date</th>
                              <th className="p-3">Priority</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((task) => (
                              <tr key={task.id} className="border-b border-slate-800/40 text-slate-300">
                                <td className="p-3 font-mono font-bold text-white">JOB-{task.id}</td>
                                <td className="p-3">{task.task_type}</td>
                                <td className="p-3">{task.customer_name}</td>
                                <td className="p-3 truncate max-w-xs">{task.customer_address}</td>
                                <td className="p-3">{new Date(task.due_date).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-extrabold ${
                                    task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-950 text-red-400' : 'bg-slate-900 text-slate-400'
                                  }`}>
                                    {task.priority}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                    task.status === 'completed' ? 'bg-emerald-950 text-emerald-450' : 'bg-blue-950 text-blue-450'
                                  }`}>
                                    {task.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right flex justify-end space-x-1.5">
                                  {getNextStatus(task.status) && (
                                    <button
                                      onClick={() => handleUpdateTaskStatus(task.id, getNextStatus(task.status))}
                                      className="px-2 py-0.5 rounded bg-cyan-955 text-cyan-400 border border-cyan-800 text-[10px] font-bold"
                                    >
                                      Move
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-500 italic">No tasks found.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'Schedule' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Roster & Time Schedules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tasks.map((task, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[#070b14]/50 border border-slate-800/40 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-cyan-400 font-bold font-mono">DUE: {new Date(task.due_date).toLocaleDateString()}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                              task.status === 'completed' ? 'bg-emerald-950 text-emerald-450' : 'bg-slate-900 text-slate-400'
                            }`}>{task.status}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{task.task_type}</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">Customer: {task.customer_name}</span>
                            <span className="text-[10px] text-slate-500 block truncate">Address: {task.customer_address}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Customers Details Tab */}
              {activeTab === 'Customers' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Assigned Customers Registry</h3>
                    <div className="space-y-3">
                      {tasks.map((task, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[#070b14]/50 border border-slate-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <span className="text-xs font-bold text-white block">{task.customer_name}</span>
                            <span className="text-[10px] text-slate-505 block mt-1">📞 Contact Number: {task.customer_phone}</span>
                            <span className="text-[10px] text-slate-505 block">📍 Address Details: {task.customer_address}</span>
                          </div>
                          <a
                            href={`tel:${task.customer_phone}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-909 border border-slate-800 text-[10px] font-bold text-cyan-400 hover:bg-slate-850"
                          >
                            📞 Call Customer
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'Inventory' && (
                <div className="space-y-6 animate-fade-in-up text-xs text-slate-400">
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider text-left">Assigned Equipment & Inventory</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { name: "GPON Fiber ONUs", count: 4, type: "Broadband CPE" },
                        { name: "CAT6 Ethernet Cable", count: "150m", type: "Media Access" },
                        { name: "Fiber Splicing Toolkits", count: 1, type: "Operational Gear" },
                        { name: "Dual-band WiFi Routers", count: 3, type: "Home Networking" }
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#070b14]/50 border border-slate-800/40 flex flex-col justify-between h-24">
                          <div>
                            <span className="font-bold text-white block">{item.name}</span>
                            <span className="text-[9px] text-slate-500 block mt-1">{item.type}</span>
                          </div>
                          <span className="text-lg font-black text-cyan-400">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'Profile' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-slate-800 space-y-4 max-w-xl mx-auto">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider text-left">Technician Profile Settings</h3>
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
                            <span className="text-[10px] text-slate-500 block">Registration Date</span>
                            <span className="font-medium text-white">{new Date(profile.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </>
          )}

        </main>
      </div>

      {/* Add Job Notes Modal */}
      {showNotesModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[450px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h4 className="font-extrabold text-white text-sm">Add Job Work Notes (JOB-{selectedTask.id})</h4>
            <form onSubmit={handleAddNote} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Operational Comments</label>
                <textarea
                  required
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record optical power readings, splicer parameters, or details..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-white h-24 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold"
                >
                  {submittingNote ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Problem Modal */}
      {showProblemModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-955/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[450px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h4 className="font-extrabold text-white text-sm">Report Problem (JOB-{selectedTask.id})</h4>
            <form onSubmit={handleReportProblem} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Problem Description</label>
                <textarea
                  required
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe optical fiber damage, missing hardware or equipment, or client issues..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white h-24 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProblemModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProblem}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-750 text-white font-bold"
                >
                  {submittingProblem ? 'Reporting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
