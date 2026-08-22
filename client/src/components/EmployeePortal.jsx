import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  // Header UI states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Modals & Forms States
  const [selectedItem, setSelectedItem] = useState(null); // Selected task or complaint for details
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null); // Selected history record for work report view
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

  // Complaints Tab specific filter/search/pagination states
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [complaintsStatusFilter, setComplaintsStatusFilter] = useState('all'); // 'all' | 'pending' | 'on_the_way' | 'in_progress' | 'resolved'
  const [complaintsPriorityFilter, setComplaintsPriorityFilter] = useState('all'); // 'all' | 'low' | 'medium' | 'high' | 'urgent'
  const [complaintsDateFilter, setComplaintsDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [complaintsCurrentPage, setComplaintsCurrentPage] = useState(1);
  const complaintsPerPage = 8;

  // Technical Tasks Tab specific search/filter/pagination states
  const [tasksSearch, setTasksSearch] = useState('');
  const [tasksStatusFilter, setTasksStatusFilter] = useState('all'); // 'all' | 'assigned' | 'on_the_way' | 'in_progress' | 'completed'
  const [tasksTypeFilter, setTasksTypeFilter] = useState('all'); // 'all' | 'Installation' | 'Fiber Repair' | 'Router Replacement' | 'ONU/ONT Replacement' | 'Configuration' | 'Service Restoration' | 'Other'
  const [tasksPriorityFilter, setTasksPriorityFilter] = useState('all'); // 'all' | 'low' | 'medium' | 'high' | 'urgent'
  const [tasksDateFilter, setTasksDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const tasksPerPage = 8;

  // History filters states
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState('all'); // 'all' | 'task' | 'complaint' | 'Installation' | 'Fiber Repair' ...
  const [historyFilterPriority, setHistoryFilterPriority] = useState('all'); // 'all' | 'low' | 'medium' | 'high' | 'urgent'
  const [historyFilterDate, setHistoryFilterDate] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const historyPerPage = 8;

  // Mock Notifications for Testing Hub Page
  const getMockNotifications = () => [
    { 
      id: 'mock-1', 
      title: '🔧 New Technical Task Assigned', 
      message: 'You have been assigned a new maintenance task.', 
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), 
      is_read: false, 
      is_mock: true, 
      category: 'task',
      priority: 'normal'
    },
    { 
      id: 'mock-2', 
      title: '📋 Complaint Updated', 
      message: 'Complaint #CMP-1048 has been updated by the supervisor.', 
      created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(), 
      is_read: false, 
      is_mock: true, 
      category: 'complaint',
      priority: 'normal'
    },
    { 
      id: 'mock-3', 
      title: '⚡ Priority Task Action Required', 
      message: 'A high-priority technical issue requires your attention.', 
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), 
      is_read: false, 
      is_mock: true, 
      category: 'priority',
      priority: 'high'
    },
    { 
      id: 'mock-4', 
      title: '✅ Task Completed Successfully', 
      message: 'Your previous technical task was successfully marked as completed.', 
      created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(), 
      is_read: true, 
      is_mock: true, 
      category: 'system',
      priority: 'normal'
    }
  ];

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

      // 5. Fetch notifications list & merge with mocks for testing
      const notificationsRes = await fetch('http://localhost:5000/api/employee/notifications', reqOpts);
      let fetchedNotifs = [];
      if (notificationsRes.ok) {
        fetchedNotifs = await notificationsRes.json();
      }

      // Merge mock and real database notifications
      const mergedNotifications = [
        ...getMockNotifications().filter(mn => {
          // Keep mock notification if not removed or if testing state is fresh
          const removedMocks = JSON.parse(localStorage.getItem('removed_mocks') || '[]');
          return !removedMocks.includes(mn.id);
        }),
        ...fetchedNotifs
      ];
      setNotifications(mergedNotifications);

      // 6. Calculate unread counts dynamically based on merged notifications
      const unreadMerged = mergedNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unreadMerged);

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
      const targetItem = complaints.find(c => c.id === complaintId);
      setSelectedItem(targetItem);
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
      const targetItem = tasks.find(t => t.id === taskId);
      setSelectedItem(targetItem);
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

  // Mark single notification as read
  const handleMarkNotificationAsRead = async (notif) => {
    if (notif.is_read) return;

    if (notif.is_mock) {
      // Simulate read for mock notification
      const updated = notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.is_read).length);
      showToast('Notification marked as read.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/employee/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
        credentials: 'include'
      });
      if (response.ok) {
        loadPortalData();
        showToast('Notification marked as read.');
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleMarkNotificationsAsRead = async () => {
    try {
      // 1. Mark database notifications as read
      await fetch('http://localhost:5000/api/employee/notifications/mark-read', {
        method: 'POST',
        credentials: 'include'
      });
      
      // 2. Mark mock notifications as read in client-side state
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updated);
      setUnreadCount(0);

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
      setActiveTab('Profile');
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  // Client-side filtering logic for My Complaints Tab
  const filteredComplaints = complaints.filter(c => {
    const query = complaintsSearch.toLowerCase().trim();
    const matchesSearch = !query ||
      c.id.toString().includes(query) ||
      c.customer_name?.toLowerCase().includes(query) ||
      c.subject?.toLowerCase().includes(query) ||
      c.customer_phone?.includes(query);

    const matchesStatus = complaintsStatusFilter === 'all' || c.status === complaintsStatusFilter;
    const matchesPriority = complaintsPriorityFilter === 'all' || c.priority === complaintsPriorityFilter;

    let matchesDate = true;
    if (complaintsDateFilter !== 'all') {
      const createdDate = new Date(c.created_at);
      const today = new Date();
      if (complaintsDateFilter === 'today') {
        matchesDate = createdDate.toDateString() === today.toDateString();
      } else if (complaintsDateFilter === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDate = createdDate >= sevenDaysAgo;
      } else if (complaintsDateFilter === 'month') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        matchesDate = createdDate >= thirtyDaysAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  // Client-side filtering logic for Technical Tasks Tab
  const filteredTasks = tasks.filter(t => {
    const query = tasksSearch.toLowerCase().trim();
    const matchesSearch = !query ||
      t.id.toString().includes(query) ||
      t.customer_name?.toLowerCase().includes(query) ||
      t.customer_address?.toLowerCase().includes(query);

    const matchesStatus = tasksStatusFilter === 'all' || t.status === tasksStatusFilter;
    const matchesType = tasksTypeFilter === 'all' || t.task_type === tasksTypeFilter;
    const matchesPriority = tasksPriorityFilter === 'all' || t.priority === tasksPriorityFilter;

    let matchesDate = true;
    if (tasksDateFilter !== 'all') {
      const createdDate = new Date(t.created_at);
      const today = new Date();
      if (tasksDateFilter === 'today') {
        matchesDate = createdDate.toDateString() === today.toDateString();
      } else if (tasksDateFilter === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDate = createdDate >= sevenDaysAgo;
      } else if (tasksDateFilter === 'month') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        matchesDate = createdDate >= thirtyDaysAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesDate;
  });

  // Filtered History
  const filteredHistory = history.filter(item => {
    const query = historySearch.toLowerCase().trim();
    const matchesSearch = !query ||
      item.id.toString().includes(query) ||
      item.customer_name?.toLowerCase().includes(query) ||
      item.work_type?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query);
    
    let matchesType = true;
    if (historyFilterType !== 'all') {
      if (historyFilterType === 'complaint') {
        matchesType = item.type === 'complaint';
      } else if (historyFilterType === 'task') {
        matchesType = item.type === 'task';
      } else {
        matchesType = item.work_type === historyFilterType;
      }
    }

    const matchesPriority = historyFilterPriority === 'all' || item.priority === historyFilterPriority;

    let matchesDate = true;
    if (historyFilterDate !== 'all') {
      const completedDate = new Date(item.completed_date);
      const today = new Date();
      if (historyFilterDate === 'today') {
        matchesDate = completedDate.toDateString() === today.toDateString();
      } else if (historyFilterDate === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDate = completedDate >= sevenDaysAgo;
      } else if (historyFilterDate === 'month') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        matchesDate = completedDate >= thirtyDaysAgo;
      }
    }

    return matchesSearch && matchesType && matchesPriority && matchesDate;
  });

  // Pagination for Complaints
  const totalComplaintsPages = Math.ceil(filteredComplaints.length / complaintsPerPage) || 1;
  const indexOfLastComplaint = complaintsCurrentPage * complaintsPerPage;
  const indexOfFirstComplaint = indexOfLastComplaint - complaintsPerPage;
  const currentComplaintsPageData = filteredComplaints.slice(indexOfFirstComplaint, indexOfLastComplaint);

  // Pagination for Tasks
  const totalTasksPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
  const indexOfLastTask = tasksCurrentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasksPageData = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  // Pagination for Work History
  const totalHistoryPages = Math.ceil(filteredHistory.length / historyPerPage) || 1;
  const indexOfLastHistory = historyCurrentPage * historyPerPage;
  const indexOfFirstHistory = indexOfLastHistory - historyPerPage;
  const currentHistoryPageData = filteredHistory.slice(indexOfFirstHistory, indexOfLastHistory);

  // Statistics summaries
  const totalAssigned = complaints.length;
  const pendingComplaintsCount = complaints.filter(c => c.status === 'pending' || c.status === 'open').length;
  const inProgressComplaintsCount = complaints.filter(c => c.status === 'in_progress' || c.status === 'on_the_way').length;
  const resolvedComplaintsCount = complaints.filter(c => c.status === 'resolved').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  // Technical Tasks counts
  const totalTasksCount = tasks.length;
  const pendingTasksCountAll = tasks.filter(t => t.status === 'assigned' || t.status === 'pending').length;
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress' || t.status === 'on_the_way').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  // Work History stats
  const totalHistoryCount = history.length;
  const historyCompletedThisWeek = history.filter(h => {
    const diff = new Date() - new Date(h.completed_date);
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 7;
  }).length;
  const historyCompletedThisMonth = history.filter(h => {
    const diff = new Date() - new Date(h.completed_date);
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 30;
  }).length;

  const avgCompletionTime = calculateAvgDuration();

  // Performance Insight calculations
  const performanceHighPriorityCompleted = history.filter(h => h.priority === 'urgent' || h.priority === 'high').length;
  const performanceComplaintResolutions = history.filter(h => h.type === 'complaint').length;
  const performanceInstallations = history.filter(h => h.type === 'task' && h.work_type === 'Installation').length;
  const performanceRepairs = history.filter(h => h.type === 'task' && h.work_type === 'Fiber Repair').length;

  function calculateAvgDuration() {
    if (!history || history.length === 0) return '0 Hours';
    let totalMs = 0;
    let count = 0;
    history.forEach(h => {
      if (h.completed_date && h.created_at) {
        const diff = new Date(h.completed_date) - new Date(h.created_at);
        if (diff > 0) {
          totalMs += diff;
          count++;
        }
      }
    });
    if (count === 0) return '0 Hours';
    const avgHours = totalMs / (1000 * 60 * 60 * count);
    return avgHours > 24 
      ? `${(avgHours / 24).toFixed(1)} Days`
      : `${avgHours.toFixed(1)} Hours`;
  }

  // Aggregate action alerts
  const actionAlerts = [
    ...complaints.filter(c => (c.priority === 'urgent' || c.priority === 'high') && c.status !== 'resolved').map(c => ({
      id: `c-${c.id}`,
      type: 'complaint',
      severity: c.priority,
      message: `Urgent ticket: "${c.subject}" requires technician response.`,
      target: c
    })),
    ...tasks.filter(t => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed').map(t => ({
      id: `t-${t.id}`,
      type: 'task',
      severity: t.priority,
      message: `Urgent Task: "${t.task_type}" is pending completion.`,
      target: t
    }))
  ];

  // Hub Notifications specific stats calculations
  const notifUnreadCount = notifications.filter(n => !n.is_read).length;
  const notifTodayCount = notifications.filter(n => {
    const diff = Date.now() - new Date(n.created_at);
    return diff <= 24 * 60 * 60 * 1000;
  }).length;
  const notifImportantCount = notifications.filter(n => 
    n.priority === 'high' || 
    n.title?.toLowerCase().includes('priority') || 
    n.title?.toLowerCase().includes('urgent') ||
    n.message?.toLowerCase().includes('priority')
  ).length;

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
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">Technician Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          
          <button
            onClick={() => { setActiveTab('Dashboard'); setShowProfileDropdown(false); }}
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
            onClick={() => { setActiveTab('Complaints'); setShowProfileDropdown(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'Complaints'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-405 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
            }`}
          >
            <span>🎫</span>
            <span>My Complaints</span>
            {complaints.filter(c => c.status !== 'resolved').length > 0 && (
              <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-cyan-955 border border-cyan-800 text-cyan-400 font-bold">
                {complaints.filter(c => c.status !== 'resolved').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('Tasks'); setShowProfileDropdown(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'Tasks'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
            }`}
          >
            <span>🛠️</span>
            <span>Technical Tasks</span>
            {pendingTasksCount > 0 && (
              <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-indigo-950 border border-indigo-850 text-indigo-400 font-bold">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('History'); setShowProfileDropdown(false); }}
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
            onClick={() => { setActiveTab('Notifications'); setShowProfileDropdown(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${
              activeTab === 'Notifications'
                ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-405 text-cyan-400'
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
            onClick={() => { setActiveTab('Profile'); setShowProfileDropdown(false); }}
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
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-955/20 hover:bg-red-955/20 hover:text-red-300 border border-transparent transition-all"
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
            <span className="font-extrabold text-sm uppercase text-white">Technician Portal</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">
            {activeTab === 'Dashboard' && 'Field Operations Dashboard'}
            {activeTab === 'Complaints' && 'Assigned Complaints'}
            {activeTab === 'Tasks' && 'Technical Tasks'}
            {activeTab === 'History' && 'Completed Work History'}
            {activeTab === 'Notifications' && 'Notifications Hub'}
            {activeTab === 'Profile' && 'Account Settings'}
          </h1>
          
          <div className="flex items-center space-x-5">
            
            {/* Header Notification Bell Widget with vibrating/pulsing glow */}
            <button
              onClick={() => { setActiveTab('Notifications'); setShowProfileDropdown(false); }}
              className={`relative p-2 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-cyan-400 transition-colors flex items-center ${unreadCount > 0 ? 'animate-bounce' : ''}`}
              title="Notifications"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-extrabold flex items-center justify-center shadow-lg shadow-cyan-500/20 pulse-subtle">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown Area */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 focus:outline-none group p-1.5 rounded-xl hover:bg-slate-900/50 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white leading-none">{profile?.full_name || user?.name}</p>
                  <p className="text-cyan-405 text-cyan-400 text-[10px] mt-0.5 tracking-wider uppercase font-medium">{profile?.designation || 'Technician'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-650/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-sm group-hover:scale-105 transition-transform duration-200 shadow-md">
                  {(profile?.full_name || user?.name)?.slice(0, 2).toUpperCase() || 'ST'}
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs animate-fade-in ring-1 ring-cyan-500/10">
                  <div className="px-3.5 py-2 border-b border-slate-850/60">
                    <p className="font-semibold text-white truncate">{profile?.full_name || user?.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">{profile?.employee_code}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('Profile'); setShowProfileDropdown(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-slate-300 hover:bg-slate-850 hover:text-cyan-400 transition-colors flex items-center space-x-2"
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('Profile'); setShowProfileDropdown(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-slate-300 hover:bg-slate-850 hover:text-cyan-400 transition-colors flex items-center space-x-2"
                  >
                    <span>🔒</span>
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2.5 text-red-400 hover:bg-red-955/20 hover:bg-red-950/20 hover:text-red-305 transition-colors border-t border-slate-850/40 flex items-center space-x-2"
                  >
                    <span>🚪</span>
                    <span>Logout Session</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto flex flex-col justify-between">
          
          <div className="space-y-6">
          {/* ==============================================
              TAB 1: FIELD OPERATIONS DASHBOARD (WORKSPACE)
              ============================================== */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Premium Summary Statistics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* 1. Assigned Complaints */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-cyan-500/20 transition-all duration-300 flex items-center space-x-3.5 group">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/30 border border-cyan-900/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    🎫
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">Assigned</span>
                    <span className="text-2xl font-black text-white mt-1 block leading-none">{totalAssigned}</span>
                    <span className="text-[9px] text-slate-550 block mt-0.5">Complaints</span>
                  </div>
                </div>

                {/* 2. Pending Tickets */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-amber-500/20 transition-all duration-300 flex items-center space-x-3.5 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-955/20 border border-amber-900/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    ⏳
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">Pending</span>
                    <span className="text-2xl font-black text-amber-400 mt-1 block leading-none">{pendingComplaintsCount}</span>
                    <span className="text-[9px] text-slate-550 block mt-0.5">Tickets</span>
                  </div>
                </div>

                {/* 3. In Progress */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-cyan-500/20 transition-all duration-300 flex items-center space-x-3.5 group">
                  <div className="w-10 h-10 rounded-xl bg-cyan-955/20 border border-cyan-900/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">In Progress</span>
                    <span className="text-2xl font-black text-cyan-400 mt-1 block leading-none">{inProgressComplaintsCount}</span>
                    <span className="text-[9px] text-slate-550 block mt-0.5">On Job</span>
                  </div>
                </div>

                {/* 4. Resolved Today */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-emerald-500/20 transition-all duration-300 flex items-center space-x-3.5 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-955/20 border border-emerald-900/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    ✓
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-505 block leading-none">Resolved</span>
                    <span className="text-2xl font-black text-emerald-450 mt-1 block leading-none">{resolvedComplaintsCount}</span>
                    <span className="text-[9px] text-slate-550 block mt-0.5">Complaints</span>
                  </div>
                </div>

                {/* 5. Technical Tasks */}
                <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-indigo-500/20 transition-all duration-300 flex items-center space-x-3.5 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/30 border border-indigo-900/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    🛠️
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-505 block leading-none">Pending Tasks</span>
                    <span className="text-2xl font-black text-indigo-400 mt-1 block leading-none">{pendingTasksCount}</span>
                    <span className="text-[9px] text-slate-550 block mt-0.5">Deployments</span>
                  </div>
                </div>

              </div>

              {/* Balanced Dashboard Grid Layout (Recent Complaints, Tasks, Alerts) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* 1. Recent Complaints Table (col-span-1) */}
                <div className="p-5 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">Recent Assigned Complaints</h3>
                      <button onClick={() => setActiveTab('Complaints')} className="text-cyan-405 text-cyan-400 text-xs font-semibold hover:underline">View All</button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                            <th className="pb-2.5">Ticket</th>
                            <th className="pb-2.5">Customer</th>
                            <th className="pb-2.5">Priority</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complaints.slice(0, 4).map(c => (
                            <tr key={c.id} className="border-b border-slate-950/20 text-slate-300">
                              <td className="py-2.5 font-bold text-white">CMP-{c.id}</td>
                              <td className="py-2.5 truncate max-w-[90px]" title={c.customer_name}>{c.customer_name}</td>
                              <td className="py-2.5 uppercase">
                                <span className={`px-1 rounded text-[8px] font-bold ${
                                  c.priority === 'urgent' || c.priority === 'high' ? 'bg-red-955/20 text-red-405 text-red-400' : 'bg-slate-900 text-slate-550'
                                }`}>{c.priority}</span>
                              </td>
                              <td className="py-2.5 uppercase text-[9px] font-bold text-cyan-400">{c.status}</td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => setSelectedItem(c)}
                                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-355 hover:text-white"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {complaints.length === 0 && (
                        <div className="py-12 text-center text-slate-600 italic">No complaints currently assigned.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Technical Tasks Table (col-span-1) */}
                <div className="p-5 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">Technical Work Tasks</h3>
                      <button onClick={() => setActiveTab('Tasks')} className="text-indigo-400 text-xs font-semibold hover:underline">View All</button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                            <th className="pb-2.5">Task ID</th>
                            <th className="pb-2.5">Task Type</th>
                            <th className="pb-2.5">Priority</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(t => (
                            <tr key={t.id} className="border-b border-slate-955/15 border-slate-950/20 text-slate-300">
                              <td className="py-2.5 font-bold text-white">TSK-{t.id}</td>
                              <td className="py-2.5 truncate max-w-[100px]" title={t.task_type}>{t.task_type}</td>
                              <td className="py-2.5 uppercase">
                                <span className={`px-1 rounded text-[8px] font-bold ${
                                  t.priority === 'urgent' || t.priority === 'high' ? 'bg-red-955/20 text-red-400' : 'bg-slate-900 text-slate-550'
                                }`}>{t.priority}</span>
                              </td>
                              <td className="py-2.5 uppercase text-[9px] font-bold text-indigo-400">{t.status}</td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => setSelectedItem(t)}
                                  className="px-2 py-0.5 rounded bg-slate-955 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-350 hover:text-white"
                                >
                                  Start
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {tasks.filter(t => t.status !== 'completed').length === 0 && (
                        <div className="py-12 text-center text-slate-600 italic">No pending technical tasks.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Alerts & Notifications Column */}
                <div className="space-y-6">
                  
                  {/* Action Required Alerts Panel */}
                  <div className="p-5 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-4">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Action Required Alerts</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                      {actionAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="p-3 rounded-xl bg-red-955/20 border border-red-900/30 text-red-455 text-red-400 text-[11px] font-medium flex items-center justify-between animate-pulse"
                        >
                          <span className="truncate max-w-[200px]" title={alert.message}>⚠️ {alert.message}</span>
                          <button
                            onClick={() => { setSelectedItem(alert.target); alert.type === 'complaint' ? setActiveTab('Complaints') : setActiveTab('Tasks'); }}
                            className="underline font-bold text-[9px] uppercase hover:text-white shrink-0 ml-2"
                          >
                            Resolve
                          </button>
                        </div>
                      ))}

                      {actionAlerts.length === 0 && (
                        <div className="p-3.5 rounded-xl bg-emerald-955/15 border border-emerald-900/25 text-emerald-400 text-xs text-center font-semibold">
                          ✓ No urgent actions required.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Latest Notifications Box */}
                  <div className="p-5 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">Latest Notifications</h3>
                      <button onClick={() => setActiveTab('Notifications')} className="text-slate-505 text-slate-500 text-xs font-semibold hover:underline">View All</button>
                    </div>

                    <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                      {notifications.slice(0, 3).map(n => (
                        <div key={n.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-[11px] flex items-start space-x-2.5">
                          <span className="text-sm shrink-0">🔔</span>
                          <div className="space-y-0.5 flex-grow">
                            <span className={`font-bold block ${n.is_read ? 'text-slate-400' : 'text-white'}`}>{n.title}</span>
                            <p className="text-slate-505 text-slate-500 leading-snug font-light">{n.message.slice(0, 50)}...</p>
                          </div>
                        </div>
                      ))}

                      {notifications.length === 0 && (
                        <div className="py-6 text-center text-slate-600 italic text-xs">No new notifications.</div>
                      )}
                    </div>
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
              
              {/* Complaints Tab Header Stats Badges */}
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-slate-900/50">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-white">My Complaints Roster</h2>
                  <p className="text-xs text-slate-505 text-slate-500 font-light">Manage and resolve customer support tickets assigned to you.</p>
                </div>
                
                <div className="flex items-center space-x-2.5">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-850 text-[11px] font-semibold text-slate-400">
                    Assigned: <span className="text-white font-extrabold">{totalAssigned}</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-955/25 border border-amber-900/35 text-[11px] font-semibold text-amber-400">
                    Pending: <span className="font-extrabold">{pendingComplaintsCount}</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-cyan-955/25 border border-cyan-900/35 text-[11px] font-semibold text-cyan-400">
                    On Job: <span className="font-extrabold">{inProgressComplaintsCount}</span>
                  </div>
                </div>
              </div>

              {/* Advanced Search & Filtering Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-wrap gap-4 items-center">
                
                {/* Text Search complaints */}
                <div className="flex-grow min-w-[220px] relative">
                  <input
                    type="text"
                    placeholder="Search complaints by ID, customer, phone, issue..."
                    value={complaintsSearch}
                    onChange={(e) => { setComplaintsSearch(e.target.value); setComplaintsCurrentPage(1); }}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute left-3.5 top-3 text-xs text-slate-500">🔍</span>
                  {complaintsSearch && (
                    <button
                      onClick={() => { setComplaintsSearch(''); setComplaintsCurrentPage(1); }}
                      className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status selection */}
                <div className="w-36 shrink-0">
                  <select
                    value={complaintsStatusFilter}
                    onChange={(e) => { setComplaintsStatusFilter(e.target.value); setComplaintsCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-850 text-xs text-slate-355 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Assigned / Pending</option>
                    <option value="on_the_way">On the Way</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* Priority Selection */}
                <div className="w-36 shrink-0">
                  <select
                    value={complaintsPriorityFilter}
                    onChange={(e) => { setComplaintsPriorityFilter(e.target.value); setComplaintsCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-355 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Date Filter Selection */}
                <div className="w-36 shrink-0">
                  <select
                    value={complaintsDateFilter}
                    onChange={(e) => { setComplaintsDateFilter(e.target.value); setComplaintsCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-855 text-xs text-slate-355 focus:outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

              </div>

              {/* Complaints Table (Desktop) / Cards (Mobile) */}
              <div className="space-y-4">
                
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-900 bg-slate-905 bg-slate-900/10 shadow-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-955/40 bg-slate-950/40 text-slate-405 text-slate-400 font-bold uppercase">
                        <th className="py-3.5 px-4">Ticket ID</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Issue Description</th>
                        <th className="py-3.5 px-4">Contact Phone</th>
                        <th className="py-3.5 px-4">Address Location</th>
                        <th className="py-3.5 px-4">Priority</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentComplaintsPageData.map((c) => (
                        <tr key={c.id} className="border-b border-slate-955/15 border-slate-950/20 text-slate-300 hover:bg-slate-900/10">
                          <td className="py-3.5 px-4 font-mono">
                            <button onClick={() => setSelectedItem(c)} className="text-cyan-400 font-bold hover:underline">
                              CMP-{c.id}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <span className="mr-1.5">👤</span>
                            <span>{c.customer_name}</span>
                          </td>
                          <td className="py-3.5 px-4 truncate max-w-[180px]" title={c.subject}>
                            <span className="font-bold text-slate-200 block truncate">{c.subject}</span>
                            <span className="text-[10px] text-slate-500 font-light block truncate">{c.description}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-medium">
                            <span className="mr-1">📞</span>
                            <span>{c.customer_phone}</span>
                          </td>
                          <td className="py-3.5 px-4 truncate max-w-[150px]" title={c.customer_address}>
                            <span className="mr-1">📍</span>
                            <span>{c.customer_address}</span>
                          </td>
                          <td className="py-3.5 px-4 uppercase">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              c.priority === 'urgent' ? 'bg-red-955/30 text-red-405 border border-red-800/30' :
                              c.priority === 'high' ? 'bg-amber-955/20 text-amber-400 border border-amber-800/30' :
                              c.priority === 'medium' ? 'bg-blue-955/25 text-blue-400' : 'bg-slate-900 text-slate-505 text-slate-500'
                            }`}>{c.priority}</span>
                          </td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-cyan-400">
                            {c.status}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedItem(c)}
                              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-905 text-slate-305 text-slate-300 transition-colors font-semibold"
                            >
                              View Details &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                  {currentComplaintsPageData.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-3.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-cyan-405 text-cyan-400">CMP-{c.id}</span>
                        <span className="text-[10px] text-slate-505 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-sm">{c.subject}</h4>
                        <p className="text-slate-400 leading-snug font-light line-clamp-2">{c.description}</p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-900 space-y-2 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-505 text-slate-500">Customer:</span>
                          <span className="font-semibold text-white">{c.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone:</span>
                          <span>{c.customer_phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Address:</span>
                          <span className="truncate max-w-[180px]">{c.customer_address}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5">
                        <div className="space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-950 text-slate-400 font-bold uppercase">{c.priority}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-950 text-cyan-400 font-bold uppercase">{c.status}</span>
                        </div>
                        <button
                          onClick={() => setSelectedItem(c)}
                          className="px-3 py-1 bg-slate-900 border border-slate-850 text-slate-300 font-bold rounded-lg"
                        >
                          Details &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredComplaints.length === 0 && (
                  <div className="py-20 text-center max-w-sm mx-auto space-y-4 animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-950/20 border border-cyan-900/20 flex items-center justify-center text-cyan-400 mx-auto">
                      🎫
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-black text-white text-base">All Clear!</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        No customer complaints are currently assigned to you. New tickets assigned by your administrator will appear here.
                      </p>
                    </div>
                  </div>
                )}

                {/* Pagination selector indicators */}
                {filteredComplaints.length > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
                    <span>
                      Showing {indexOfFirstComplaint + 1}–{Math.min(indexOfLastComplaint, filteredComplaints.length)} of {filteredComplaints.length} complaints
                    </span>
                    
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setComplaintsCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={complaintsCurrentPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalComplaintsPages)].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setComplaintsCurrentPage(idx + 1)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors font-bold ${
                            complaintsCurrentPage === idx + 1
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => setComplaintsCurrentPage(prev => Math.min(prev + 1, totalComplaintsPages))}
                        disabled={complaintsCurrentPage === totalComplaintsPages}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ==============================================
              TAB 3: TECHNICAL TASKS REGISTER
              ============================================== */}
          {activeTab === 'Tasks' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Technical Tasks Header Stats Row */}
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-slate-900/50">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-white">Technical Tasks Dashboard</h2>
                  <p className="text-xs text-slate-500 font-light">Installation, repair and service jobs assigned to you.</p>
                </div>
                
                <div className="flex items-center space-x-2.5">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-850 text-[11px] font-semibold text-slate-400">
                    Total Jobs: <span className="text-white font-extrabold">{totalTasksCount}</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-[11px] font-semibold text-indigo-400">
                    Pending: <span className="font-extrabold">{pendingTasksCountAll}</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-cyan-955/25 border border-cyan-900/35 text-[11px] font-semibold text-cyan-400">
                    In Progress: <span className="font-extrabold">{inProgressTasksCount}</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-955/25 border border-emerald-900/35 text-[11px] font-semibold text-emerald-450">
                    Completed: <span className="font-extrabold">{completedTasksCount}</span>
                  </div>
                </div>
              </div>

              {/* Task filters panel */}
              <div className="p-4 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-wrap gap-4 items-center">
                
                {/* Search query input */}
                <div className="flex-grow min-w-[220px] relative">
                  <input
                    type="text"
                    placeholder="Search by Task ID, Customer or Address..."
                    value={tasksSearch}
                    onChange={(e) => { setTasksSearch(e.target.value); setTasksCurrentPage(1); }}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-855 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute left-3.5 top-3 text-xs text-slate-500">🔍</span>
                  {tasksSearch && (
                    <button
                      onClick={() => { setTasksSearch(''); setTasksCurrentPage(1); }}
                      className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status selection */}
                <div className="w-36 shrink-0">
                  <select
                    value={tasksStatusFilter}
                    onChange={(e) => { setTasksStatusFilter(e.target.value); setTasksCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="assigned">Assigned / Pending</option>
                    <option value="on_the_way">On the Way</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Task Type filter */}
                <div className="w-40 shrink-0">
                  <select
                    value={tasksTypeFilter}
                    onChange={(e) => { setTasksTypeFilter(e.target.value); setTasksCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="Installation">Installation</option>
                    <option value="Fiber Repair">Fiber Repair</option>
                    <option value="Router Replacement">Router Replace</option>
                    <option value="ONU/ONT Replacement">ONU/ONT Replace</option>
                    <option value="Configuration">Configuration</option>
                    <option value="Service Restoration">Restoration</option>
                    <option value="Other">Other Type</option>
                  </select>
                </div>

                {/* Priority Selection */}
                <div className="w-32 shrink-0">
                  <select
                    value={tasksPriorityFilter}
                    onChange={(e) => { setTasksPriorityFilter(e.target.value); setTasksCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Date range Filter */}
                <div className="w-32 shrink-0">
                  <select
                    value={tasksDateFilter}
                    onChange={(e) => { setTasksDateFilter(e.target.value); setTasksCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-855 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

              </div>

              {/* Tasks Desktop Grid Table / Mobile Cards */}
              <div className="space-y-4">
                
                {/* Desktop view Table */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-900 bg-slate-905 bg-slate-900/10 shadow-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 font-bold uppercase">
                        <th className="py-3.5 px-4">Task ID</th>
                        <th className="py-3.5 px-4">Task Type</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Contact Phone</th>
                        <th className="py-3.5 px-4">Service Address</th>
                        <th className="py-3.5 px-4">Priority</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-center">Warnings</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTasksPageData.map((t) => {
                        const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed';
                        const isDueToday = t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString() && t.status !== 'completed';
                        
                        return (
                          <tr key={t.id} className="border-b border-slate-955/15 border-slate-950/20 text-slate-300 hover:bg-slate-900/10">
                            <td className="py-3.5 px-4 font-mono">
                              <button onClick={() => setSelectedItem(t)} className="text-cyan-405 text-cyan-400 font-bold hover:underline">
                                TSK-{t.id}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white uppercase text-[10px]">
                              {t.task_type}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-200">
                              <span>👤</span> {t.customer_name}
                            </td>
                            <td className="py-3.5 px-4">
                              <span>📞</span> {t.customer_phone}
                            </td>
                            <td className="py-3.5 px-4 truncate max-w-[150px]" title={t.customer_address}>
                              <span>📍</span> {t.customer_address}
                            </td>
                            <td className="py-3.5 px-4 uppercase">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                t.priority === 'urgent' ? 'bg-red-955/30 text-red-400 border border-red-800/30' :
                                t.priority === 'high' ? 'bg-amber-955/25 text-amber-400' : 'bg-slate-900 text-slate-500'
                              }`}>{t.priority}</span>
                            </td>
                            <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-indigo-400">
                              {t.status}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isOverdue && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-955/40 text-red-400 font-bold">⚠️ Overdue</span>
                              )}
                              {isDueToday && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-950 text-amber-405 font-bold">⚠️ Due Today</span>
                              )}
                              {!isOverdue && !isDueToday && (
                                <span className="text-slate-600 text-[10px]">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedItem(t)}
                                className="px-3 py-1.5 rounded-lg bg-slate-955 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 font-semibold transition-colors"
                              >
                                View Details &rarr;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                  {currentTasksPageData.map((t) => {
                    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed';
                    const isDueToday = t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString() && t.status !== 'completed';
                    
                    return (
                      <div key={t.id} className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-indigo-405 text-indigo-400">TSK-{t.id}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{t.task_type}</span>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-950 space-y-1.5 text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Customer:</span>
                            <span className="text-white font-semibold">{t.customer_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Address:</span>
                            <span className="truncate max-w-[180px]">{t.customer_address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Target Date:</span>
                            <span>{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                          <div className="space-x-1.5 flex items-center">
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-950 text-slate-400 font-bold uppercase">{t.priority}</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-950 text-indigo-400 font-bold uppercase">{t.status}</span>
                            {isOverdue && <span className="text-[9px] text-red-400 font-bold">⚠️ Overdue</span>}
                            {isDueToday && <span className="text-[9px] text-amber-400 font-bold">⚠️ Today</span>}
                          </div>
                          
                          <button
                            onClick={() => setSelectedItem(t)}
                            className="px-3 py-1 bg-slate-900 border border-slate-850 text-slate-300 font-semibold rounded-lg"
                          >
                            Details &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredTasks.length === 0 && (
                  <div className="py-20 text-center max-w-sm mx-auto space-y-4 animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-950/20 border border-indigo-900/20 flex items-center justify-center text-indigo-400 mx-auto">
                      🔧
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-black text-white text-base">You're All Caught Up</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        No installation or service tasks are currently assigned to you. New technical jobs assigned by your administrator will appear here.
                      </p>
                    </div>
                  </div>
                )}

                {/* Pagination Selector for Tasks */}
                {filteredTasks.length > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
                    <span>
                      Showing {indexOfFirstTask + 1}–{Math.min(indexOfLastTask, filteredTasks.length)} of {filteredTasks.length} tasks
                    </span>
                    
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setTasksCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={tasksCurrentPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-855 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalTasksPages)].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTasksCurrentPage(idx + 1)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors font-bold ${
                            tasksCurrentPage === idx + 1
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => setTasksCurrentPage(prev => Math.min(prev + 1, totalTasksPages))}
                        disabled={tasksCurrentPage === totalTasksPages}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ==============================================
              TAB 4: WORK HISTORY & PERFORMANCE RECORDS
              ============================================== */}
          {activeTab === 'History' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Summary Metrics Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* Total jobs completed */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-emerald-500/20 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-slate-505 text-slate-500 block leading-none">Total Jobs Done</span>
                    <span className="text-sm">📋</span>
                  </div>
                  <span className="text-2xl font-black text-white mt-2 block leading-none">{totalHistoryCount}</span>
                  <span className="text-[9px] text-slate-550 block mt-1.5">Resolved operations</span>
                </div>

                {/* Completed this week */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-emerald-500/25 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-slate-505 block leading-none">Resolved Week</span>
                    <span className="text-sm">📆</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-450 mt-2 block leading-none">{historyCompletedThisWeek}</span>
                  <span className="text-[9px] text-slate-550 block mt-1.5">Last 7 calendar days</span>
                </div>

                {/* Completed this month */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-emerald-500/25 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">Resolved Month</span>
                    <span className="text-sm">📅</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-450 mt-2 block leading-none">{historyCompletedThisMonth}</span>
                  <span className="text-[9px] text-slate-550 block mt-1.5">Last 30 calendar days</span>
                </div>

                {/* Avg resolution duration */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-cyan-500/20 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">Avg Closure Time</span>
                    <span className="text-sm">⏱️</span>
                  </div>
                  <span className="text-2xl font-black text-cyan-400 mt-2 block leading-none">{avgCompletionTime}</span>
                  <span className="text-[9px] text-slate-550 block mt-1.5">Avg resolution span</span>
                </div>

              </div>

              {/* Performance insight overview widget panel */}
              <div className="p-5 rounded-2xl bg-slate-900/15 border border-slate-900/80 backdrop-blur-sm space-y-4">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Technician Performance Audits Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                  
                  <div className="p-3 bg-slate-950/45 border border-slate-900 rounded-xl">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Total Operations</span>
                    <span className="text-base font-black text-white mt-1 block leading-none">{totalHistoryCount}</span>
                  </div>
                  
                  <div className="p-3 bg-slate-950/45 border border-slate-900 rounded-xl">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">High Priority Jobs</span>
                    <span className="text-base font-black text-amber-400 mt-1 block leading-none">{performanceHighPriorityCompleted}</span>
                  </div>

                  <div className="p-3 bg-slate-950/45 border border-slate-900 rounded-xl">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Complaint Resolved</span>
                    <span className="text-base font-black text-cyan-400 mt-1 block leading-none">{performanceComplaintResolutions}</span>
                  </div>

                  <div className="p-3 bg-slate-950/45 border border-slate-900 rounded-xl">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Installations Done</span>
                    <span className="text-base font-black text-indigo-400 mt-1 block leading-none">{performanceInstallations}</span>
                  </div>

                  <div className="p-3 bg-slate-950/45 border border-slate-900 rounded-xl">
                    <span className="text-slate-505 block text-[9px] uppercase font-bold">Fiber Cable Repairs</span>
                    <span className="text-base font-black text-emerald-450 mt-1 block leading-none">{performanceRepairs}</span>
                  </div>

                </div>
              </div>

              {/* Advanced Audits Search & Filtering Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-wrap gap-4 items-center">
                
                {/* Text query input */}
                <div className="flex-grow min-w-[200px] relative">
                  <input
                    type="text"
                    placeholder="Search history by Customer, Work description or ID..."
                    value={historySearch}
                    onChange={(e) => { setHistorySearch(e.target.value); setHistoryCurrentPage(1); }}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute left-3.5 top-3 text-xs text-slate-500">🔍</span>
                  {historySearch && (
                    <button
                      onClick={() => { setHistorySearch(''); setHistoryCurrentPage(1); }}
                      className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Job type selection */}
                <div className="w-40 shrink-0">
                  <select
                    value={historyFilterType}
                    onChange={(e) => { setHistoryFilterType(e.target.value); setHistoryCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-955 bg-slate-955 bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Job Types</option>
                    <option value="complaint">Complaint Resolutions</option>
                    <option value="task">Technical Tasks</option>
                    <option value="Installation">Installation jobs</option>
                    <option value="Fiber Repair">Fiber Cable repair</option>
                    <option value="Router Replacement">Router replacement</option>
                    <option value="ONU/ONT Replacement">ONU/ONT replace</option>
                    <option value="Configuration">Configurations</option>
                    <option value="Service Restoration">Restorations</option>
                  </select>
                </div>

                {/* Priority Selection */}
                <div className="w-36 shrink-0">
                  <select
                    value={historyFilterPriority}
                    onChange={(e) => { setHistoryFilterPriority(e.target.value); setHistoryCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Date filter dropdown */}
                <div className="w-36 shrink-0">
                  <select
                    value={historyFilterDate}
                    onChange={(e) => { setHistoryFilterDate(e.target.value); setHistoryCurrentPage(1); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

              </div>

              {/* History Audits List (Desktop Table / Mobile Cards) */}
              <div className="space-y-4">
                
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-900 bg-slate-900/10 shadow-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 font-bold uppercase">
                        <th className="py-3.5 px-4">Job ID</th>
                        <th className="py-3.5 px-4">Job Type</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Description / Subject</th>
                        <th className="py-3.5 px-4">Priority</th>
                        <th className="py-3.5 px-4">Final Status</th>
                        <th className="py-3.5 px-4">Completed Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentHistoryPageData.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-955/20 text-slate-300 hover:bg-slate-900/10">
                          <td className="py-3.5 px-4 font-mono">
                            <button onClick={() => setSelectedHistoryItem(item)} className="text-cyan-400 font-bold hover:underline">
                              {item.type === 'task' ? `TSK-${item.id}` : `CMP-${item.id}`}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white uppercase text-[10px]">
                            {item.type} ({item.work_type})
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-202">
                            👤 {item.customer_name}
                          </td>
                          <td className="py-3.5 px-4 truncate max-w-[200px]" title={item.description}>
                            {item.description}
                          </td>
                          <td className="py-3.5 px-4 uppercase">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-900 text-slate-400`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 uppercase">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-950/40 border border-emerald-800/30 text-emerald-450">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {new Date(item.completed_date).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedHistoryItem(item)}
                              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 font-bold transition-colors"
                            >
                              View Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                  {currentHistoryPageData.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-cyan-405 text-cyan-400">
                          {item.type === 'task' ? `TSK-${item.id}` : `CMP-${item.id}`}
                        </span>
                        <span className="text-[10px] text-slate-505 text-slate-500 uppercase font-bold">{item.work_type}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 capitalize block">Customer Profile:</span>
                        <span className="font-bold text-white block">👤 {item.customer_name}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                        <div className="space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-950 text-slate-405 text-slate-400 font-bold uppercase">{item.priority}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-950 text-emerald-400 font-bold uppercase">{item.status}</span>
                        </div>
                        <button
                          onClick={() => setSelectedHistoryItem(item)}
                          className="px-3 py-1 bg-slate-900 border border-slate-850 text-slate-300 font-bold rounded-lg"
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State registers */}
                {history.length === 0 && (
                  <div className="py-24 text-center max-w-sm mx-auto space-y-4 animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-955/20 border border-emerald-900/20 flex items-center justify-center text-emerald-450 text-lg mx-auto">
                      📋
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-white text-base">No Completed Work Yet</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Your completed installations, repairs and service jobs will appear here as resolving closures are committed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Filter Empty Results State */}
                {history.length > 0 && filteredHistory.length === 0 && (
                  <div className="py-14 text-center max-w-xs mx-auto space-y-3 animate-fade-in">
                    <span className="text-xl">🔍</span>
                    <h4 className="font-bold text-white text-xs">No matching work records</h4>
                    <p className="text-[10px] text-slate-505 text-slate-500">Try changing your search or filters.</p>
                    <button
                      onClick={() => { setHistorySearch(''); setHistoryFilterType('all'); setHistoryFilterPriority('all'); setHistoryFilterDate('all'); }}
                      className="px-3 py-1 rounded bg-slate-900 border border-slate-850 text-slate-300 hover:text-white"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                {/* Pagination Controls */}
                {filteredHistory.length > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
                    <span>
                      Showing {indexOfFirstHistory + 1}–{Math.min(indexOfLastHistory, filteredHistory.length)} of {filteredHistory.length} completed records
                    </span>
                    
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setHistoryCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={historyCurrentPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-855 border-slate-850 hover:bg-slate-850 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalHistoryPages)].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHistoryCurrentPage(idx + 1)}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors font-bold ${
                            historyCurrentPage === idx + 1
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-850'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => setHistoryCurrentPage(prev => Math.min(prev + 1, totalHistoryPages))}
                        disabled={historyCurrentPage === totalHistoryPages}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:text-white transition-colors disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ==============================================
              TAB 5: NOTIFICATIONS HUB (Upgraded premium SaaS layout)
              ============================================== */}
          {activeTab === 'Notifications' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Notifications Header toolbar */}
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-slate-900/50">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-white">Notifications Hub</h2>
                  <p className="text-xs text-slate-500 font-light">Stay updated with your latest tasks, complaints and system activity.</p>
                </div>
                
                {notifUnreadCount > 0 && (
                  <button
                    onClick={handleMarkNotificationsAsRead}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-850 hover:border-cyan-500/30 text-cyan-400 font-bold text-xs hover:shadow hover:shadow-cyan-500/5 transition-all"
                  >
                    ✓ Mark all as read
                  </button>
                )}
              </div>

              {/* Dynamic Notification Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. Unread */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-cyan-500/20 transition-all duration-300 flex items-center justify-between group">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-550 text-slate-500 block leading-none">Unread Notifications</span>
                    <span className="text-2xl font-black text-cyan-400 block pt-1.5 leading-none">{notifUnreadCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/20 border border-cyan-900/20 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    ✉️
                  </div>
                </div>

                {/* 2. Today */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-amber-500/20 transition-all duration-300 flex items-center justify-between group">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-550 text-slate-500 block leading-none">Received Today</span>
                    <span className="text-2xl font-black text-amber-400 block pt-1.5 leading-none">{notifTodayCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-950/20 border border-amber-900/20 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    📅
                  </div>
                </div>

                {/* 3. Important */}
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-red-500/20 transition-all duration-300 flex items-center justify-between group">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-550 block leading-none">Important Alerts</span>
                    <span className="text-2xl font-black text-red-400 block pt-1.5 leading-none">{notifImportantCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-950/20 border border-red-900/20 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    ⚠️
                  </div>
                </div>

              </div>

              {/* Notifications Feed */}
              <div className="space-y-3.5 max-w-3xl">
                {notifications.map((n) => {
                  const isHighPriority = n.priority === 'high' || n.title?.toLowerCase().includes('priority') || n.title?.toLowerCase().includes('urgent');
                  
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleMarkNotificationAsRead(n)}
                      className={`p-4.5 p-4 rounded-2xl border flex items-start space-x-4 transition-all duration-200 cursor-pointer group relative ${
                        n.is_read
                          ? 'bg-slate-900/10 border-slate-900 opacity-60'
                          : 'bg-slate-900/40 border-slate-850 shadow-md hover:shadow-cyan-500/5 hover:border-cyan-500/20 ring-l-2 ring-cyan-400'
                      }`}
                    >
                      {/* Left Circular Icon Container */}
                      <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-base border ${
                        n.is_read 
                          ? 'bg-slate-950 border-slate-850 text-slate-500' 
                          : isHighPriority 
                            ? 'bg-red-950/20 border-red-900/30 text-red-400'
                            : 'bg-cyan-950/20 border-cyan-900/30 text-cyan-400'
                      }`}>
                        {n.title?.includes('🔧') || n.category === 'task' ? '🔧' :
                         n.title?.includes('📋') || n.category === 'complaint' ? '📋' :
                         n.title?.includes('⚡') || n.category === 'priority' ? '⚡' :
                         n.title?.includes('✅') || n.category === 'system' ? '✅' : '🔔'}
                      </div>

                      {/* Notification Body */}
                      <div className="flex-grow space-y-1 text-xs">
                        <div className="flex justify-between items-start">
                          <h4 className={`font-bold text-sm tracking-tight ${n.is_read ? 'text-slate-455 text-slate-400' : 'text-white'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-550 shrink-0 ml-4 font-light">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`font-light leading-relaxed ${n.is_read ? 'text-slate-505 text-slate-500' : 'text-slate-300'}`}>
                          {n.message}
                        </p>

                        {/* Optional action buttons */}
                        {!n.is_read && (n.category === 'task' || n.title?.toLowerCase().includes('task')) && (
                          <div className="pt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkNotificationAsRead(n); setActiveTab('Tasks'); }}
                              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wide transition-colors"
                            >
                              View Task &rarr;
                            </button>
                          </div>
                        )}
                        {!n.is_read && (n.category === 'complaint' || n.title?.toLowerCase().includes('complaint')) && (
                          <div className="pt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkNotificationAsRead(n); setActiveTab('Complaints'); }}
                              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wide transition-colors"
                            >
                              View Ticket &rarr;
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tiny Unread dot */}
                      {!n.is_read && (
                        <div className="absolute right-4 bottom-4 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping pulse-subtle" />
                      )}
                    </div>
                  );
                })}

                {notifications.length === 0 && (
                  <div className="py-24 text-center max-w-sm mx-auto space-y-4 animate-fade-in">
                    <div className="relative w-16 h-16 rounded-full bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-center text-cyan-400 mx-auto shadow-xl">
                      <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-md pulse-subtle" />
                      <span className="text-xl">🔔</span>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-black text-white text-base">You're all caught up!</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        No new notifications right now. We'll let you know when something needs your attention.
                      </p>
                    </div>
                  </div>
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
                  <p className="text-[10px] text-slate-505 text-slate-500 mt-0.5">Read-only structural parameters and self-managed contacts</p>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-wide">Contact Phone</label>
                      <input
                        type="text"
                        value={editProfileForm.phone}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-550 text-slate-500 uppercase tracking-wide">Residential Address</label>
                      <textarea
                        value={editProfileForm.address}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500 h-20 resize-none"
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {profile?.full_name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{profile?.full_name}</h4>
                          <span className="text-[10px] text-cyan-400 uppercase font-semibold">{profile?.designation}</span>
                        </div>
                      </div>
                      <button onClick={() => setIsEditingProfile(true)} className="px-3.5 py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-cyan-400 rounded-xl font-bold">Edit Details</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Employee Code</span>
                        <span className="text-white font-mono mt-0.5 block">{profile?.employee_code}</span>
                      </div>
                      <div>
                        <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Office Email</span>
                        <span className="text-white mt-0.5 block">{profile?.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Contact Phone</span>
                        <span className="text-slate-300 mt-0.5 block">{profile?.phone || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">CNIC Identifier</span>
                        <span className="text-slate-300 font-mono mt-0.5 block">{profile?.cnic || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Current Residential Address</span>
                        <span className="text-slate-300 mt-0.5 block">{profile?.address || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Portal Access Context</span>
                        <span className="text-indigo-405 text-indigo-400 mt-0.5 uppercase font-bold block">ROLE: {profile?.role}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Config Card */}
              <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 space-y-6">
                <div>
                  <h3 className="font-black text-white text-base">Change Password</h3>
                  <p className="text-[10px] text-slate-550 text-slate-500 mt-0.5">Reset your staff account portal login password</p>
                </div>

                {passwordError && (
                  <div className="p-3.5 rounded-xl bg-red-955/20 border border-red-900/35 text-red-400 text-xs">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-wide">Current Password</label>
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
                    <label className="text-[10px] font-bold text-slate-505 text-slate-500 uppercase tracking-wide">New Secure Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-550 text-slate-505 text-slate-500 uppercase tracking-wide">Confirm New Password</label>
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
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-655 text-white font-bold hover:shadow hover:shadow-cyan-500/10 hover:scale-[1.01] transition-all"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          </div>

          <div className="pt-8 border-t border-slate-900/40 text-[10px] text-slate-600 flex justify-between items-center">
            <span>ISP Operational Technician Client Dashboard (NOC Console)</span>
            <span>Local Time: {new Date().toLocaleTimeString()}</span>
          </div>

        </main>
      </div>

      {/* ==============================================
          MODAL 1: ASSIGNED ITEM DETAILS & PROGRESSIONS
          ============================================== */}
      {selectedItem && !showReportForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[580px] max-w-full rounded-[26px] bg-slate-900 border border-slate-800 p-6 shadow-2xl relative space-y-5 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-3.5 border-b border-slate-850/60">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
                  {selectedItem.task_type ? `TECHNICAL TASK // TSK-${selectedItem.id}` : `COMPLAINT TICKET // CMP-${selectedItem.id}`}
                </span>
                <h3 className="font-extrabold text-white text-lg mt-1 flex items-center space-x-2">
                  <span>{selectedItem.task_type || selectedItem.subject}</span>
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    selectedItem.priority === 'urgent' || selectedItem.priority === 'high' ? 'bg-red-955/30 text-red-405 border border-red-800/30' : 'bg-slate-955 bg-slate-950 text-slate-400'
                  }`}>{selectedItem.priority}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-950 text-cyan-400 font-bold uppercase">{selectedItem.status}</span>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-500 hover:text-white font-bold text-lg transition-colors">✕</button>
            </div>

            {/* Content Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              
              <div className="col-span-2 p-3.5 rounded-xl bg-slate-950/30 border border-slate-850 space-y-2">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Customer Contact Profile</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-505 text-slate-500 block">Name:</span>
                    <span className="text-white block mt-0.5 font-semibold">{selectedItem.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-505 text-slate-500 block">Contact Phone:</span>
                    <span className="text-white block mt-0.5 font-medium">{selectedItem.customer_phone}</span>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-slate-900">
                    <span className="text-slate-505 text-slate-500 block">Service Address Location:</span>
                    <span className="text-slate-300 block mt-0.5 leading-relaxed">{selectedItem.customer_address}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Description / Notes</span>
                <p className="text-slate-350 block mt-1 leading-relaxed max-h-24 overflow-y-auto pr-1 select-text bg-slate-950/20 p-2.5 rounded-xl border border-slate-850">
                  {selectedItem.description}
                </p>
              </div>

              {selectedItem.admin_notes && (
                <div className="col-span-2">
                  <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Admin Manager Notes</span>
                  <p className="text-slate-350 block mt-1 leading-relaxed bg-slate-950/25 p-2.5 rounded-xl border border-slate-850">
                    {selectedItem.admin_notes}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Assigned / Created Date</span>
                <span className="text-slate-350 block mt-0.5">{new Date(selectedItem.created_at).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-505 text-slate-500 text-[10px] uppercase font-bold block">Task Due Date</span>
                <span className="text-slate-300 block mt-0.5">{selectedItem.due_date ? new Date(selectedItem.due_date).toLocaleDateString() : 'Immediate Target'}</span>
              </div>

            </div>

            {/* Quick Actions Workflow Panels */}
            <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-3.5 text-xs">
              <h4 className="font-bold text-slate-550 uppercase tracking-wider text-[9px]">Technician Operations Action Toolbar</h4>
              
              <div className="flex flex-wrap gap-2.5">
                
                {/* 1. Quick call customer (mock) */}
                <button
                  onClick={() => alert(`Dialing customer ${selectedItem.customer_name} at: ${selectedItem.customer_phone}`)}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-855 text-slate-305 text-slate-300 hover:text-white rounded-xl font-bold flex items-center space-x-1.5 transition-all active:scale-[0.98]"
                >
                  <span>📞</span>
                  <span>Call Customer</span>
                </button>

                {/* 2. Map coordinates (mock) */}
                <button
                  onClick={() => alert(`Navigating via GPS maps coordinates to address: ${selectedItem.customer_address}`)}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl font-bold flex items-center space-x-1.5 transition-all active:scale-[0.98]"
                >
                  <span>📍</span>
                  <span>View Location</span>
                </button>

                {/* 3. Status Transitions Trigger Buttons */}
                {selectedItem.subject && (
                  <>
                    {selectedItem.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateComplaintStatus(selectedItem.id, 'on_the_way')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-1 transition-all active:scale-[0.98]"
                      >
                        <span>▶</span>
                        <span>Start Job</span>
                      </button>
                    )}
                    {selectedItem.status === 'on_the_way' && (
                      <button
                        onClick={() => handleUpdateComplaintStatus(selectedItem.id, 'in_progress')}
                        className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center space-x-1 transition-all active:scale-[0.98]"
                      >
                        <span>⏸</span>
                        <span>Mark In Progress</span>
                      </button>
                    )}
                    {selectedItem.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateComplaintStatus(selectedItem.id, 'resolved')}
                        className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl flex items-center space-x-1 transition-all active:scale-[0.98]"
                      >
                        <span>✓</span>
                        <span>Resolve Ticket</span>
                      </button>
                    )}
                  </>
                )}

                {/* Technical Tasks Transitions */}
                {selectedItem.task_type && (
                  <>
                    {selectedItem.status === 'assigned' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(selectedItem.id, 'on_the_way')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-1 transition-all active:scale-[0.98]"
                      >
                        <span>▶</span>
                        <span>Start Job</span>
                      </button>
                    )}
                    {selectedItem.status === 'on_the_way' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(selectedItem.id, 'in_progress')}
                        className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center space-x-1 transition-all active:scale-[0.98]"
                      >
                        <span>⏸</span>
                        <span>Mark In Progress</span>
                      </button>
                    )}
                    {selectedItem.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(selectedItem.id, 'completed')}
                        className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl flex items-center space-x-1 transition-all active:scale-[0.98]"
                      >
                        <span>✓</span>
                        <span>Complete Task</span>
                      </button>
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
                <span className="text-[9px] font-mono text-slate-550 uppercase tracking-widest block">WORK COMPLETION REPORT</span>
                <h3 className="font-extrabold text-white text-lg mt-0.5">
                  Log report for: {selectedItem.task_type || selectedItem.subject}
                </h3>
              </div>
              <button onClick={() => { setShowReportForm(false); setSelectedItem(null); }} className="text-slate-500 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmitWorkReport} className="space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Resolution Summary / Problem Found</label>
                <textarea
                  placeholder="Describe the root issue diagnosed..."
                  value={reportForm.problem_found}
                  onChange={(e) => setReportForm({ ...reportForm, problem_found: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Work Performed / Operations Done</label>
                <textarea
                  placeholder="Describe details of repairs/installations..."
                  value={reportForm.work_performed}
                  onChange={(e) => setReportForm({ ...reportForm, work_performed: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Final Solution</label>
                <input
                  type="text"
                  placeholder="e.g. Fiber splice replaced, signals restored to normal."
                  value={reportForm.solution}
                  onChange={(e) => setReportForm({ ...reportForm, solution: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-855 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Materials / Equipment Used</label>
                <input
                  type="text"
                  placeholder="e.g. 1x ONU router, 2x fiber adapters, 15m optical patch cable."
                  value={reportForm.equipment_used}
                  onChange={(e) => setReportForm({ ...reportForm, equipment_used: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Additional Notes</label>
                <input
                  type="text"
                  placeholder="Extra observations or admin warnings..."
                  value={reportForm.additional_notes}
                  onChange={(e) => setReportForm({ ...reportForm, additional_notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-650 text-white font-bold rounded-xl hover:brightness-105 active:scale-[0.99] transition-all"
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

      {/* ==============================================
          MODAL 3: VIEW COMPLETED WORK REPORT DRAWER
          ============================================== */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-[500px] max-w-full h-full bg-slate-900 border-l border-slate-850 p-6 shadow-2xl overflow-y-auto space-y-6 relative animate-fade-in-up scrollbar-thin">
            
            {/* Header drawer */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-850/60">
              <div>
                <span className="text-[9px] font-mono text-slate-550 uppercase tracking-wider block">COMPLETED FIELD OPERATIONS REPORT</span>
                <h3 className="font-extrabold text-white text-lg mt-1">
                  Report #{selectedHistoryItem.type === 'task' ? `TSK-${selectedHistoryItem.id}` : `CMP-${selectedHistoryItem.id}`}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-955 border border-emerald-800/30 text-emerald-450 font-bold uppercase">{selectedHistoryItem.status}</span>
                  <span className="px-2 py-0.5 rounded text-[8px] bg-slate-950 text-slate-400 font-bold uppercase">{selectedHistoryItem.priority} priority</span>
                </div>
              </div>
              <button onClick={() => setSelectedHistoryItem(null)} className="text-slate-500 hover:text-white font-bold text-lg transition-colors">✕</button>
            </div>

            {/* Customer Details Info block */}
            <div className="space-y-4 text-xs">
              
              <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-2.5">
                <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Customer Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Name:</span>
                    <span className="text-white block font-bold mt-0.5">{selectedHistoryItem.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Phone Number:</span>
                    <span className="text-white block font-medium mt-0.5">{selectedHistoryItem.customer_phone}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-900/60">
                    <span className="text-slate-500 block text-[10px]">Residential Address:</span>
                    <span className="text-slate-300 block leading-relaxed mt-0.5">{selectedHistoryItem.customer_address}</span>
                  </div>
                </div>
              </div>

              {/* Job description details */}
              <div className="space-y-1.5">
                <span className="text-slate-550 text-slate-500 text-[10px] uppercase font-bold block">Job Type & Subject</span>
                <span className="text-white font-semibold block capitalize">{selectedHistoryItem.type} ({selectedHistoryItem.work_type})</span>
                <p className="p-3 rounded-xl bg-slate-950/20 border border-slate-850 text-slate-350 leading-relaxed font-light mt-1">
                  {selectedHistoryItem.description}
                </p>
              </div>

              {/* Work report entries */}
              <div className="space-y-3.5 pt-2.5 border-t border-slate-855/50 border-slate-850/60">
                <h4 className="text-[10px] font-bold text-indigo-405 text-indigo-400 uppercase tracking-wider">Field Diagnostics & Operations</h4>
                
                <div className="space-y-2 bg-slate-950/25 p-3.5 rounded-xl border border-slate-850">
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-bold">Problem Diagnosed</span>
                    <p className="text-slate-300 block font-light mt-0.5">{selectedHistoryItem.problem_found || 'Standard field diagnostics.'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-905 border-slate-900/60">
                    <span className="text-slate-505 text-slate-500 text-[9px] uppercase font-bold">Work Performed</span>
                    <p className="text-slate-300 block font-light mt-0.5">{selectedHistoryItem.work_performed || 'Job completed successfully.'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-900/60">
                    <span className="text-slate-505 text-slate-500 text-[9px] uppercase font-bold">Resolution Solution</span>
                    <p className="text-white block font-semibold mt-0.5">{selectedHistoryItem.solution || 'Connection stabilized.'}</p>
                  </div>
                  {selectedHistoryItem.equipment_used && (
                    <div className="pt-2 border-t border-slate-900/60">
                      <span className="text-slate-505 text-slate-500 text-[9px] uppercase font-bold">Materials / Equipment Used</span>
                      <p className="text-slate-305 text-slate-300 block font-light mt-0.5">{selectedHistoryItem.equipment_used}</p>
                    </div>
                  )}
                  {selectedHistoryItem.additional_notes && (
                    <div className="pt-2 border-t border-slate-900/60">
                      <span className="text-slate-500 text-[9px] uppercase font-bold">Additional notes</span>
                      <p className="text-slate-400 block font-light italic mt-0.5">{selectedHistoryItem.additional_notes}</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Completion Timeline Tracker */}
              <div className="space-y-3.5 pt-2.5 border-t border-slate-850/60">
                <h4 className="text-[10px] font-bold text-emerald-450 uppercase tracking-wider">Completion Operation Timeline</h4>
                
                <div className="space-y-4 pl-4 relative border-l border-slate-800">
                  
                  {/* Step 1: Created */}
                  <div className="relative text-xs">
                    <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-slate-900" />
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Assigned</span>
                    <span className="text-slate-350 block mt-0.5">{new Date(selectedHistoryItem.created_at).toLocaleString()}</span>
                  </div>

                  {/* Step 2: Completed */}
                  <div className="relative text-xs">
                    <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    <span className="text-emerald-400 block text-[9px] uppercase font-bold">Resolved / Completed</span>
                    <span className="text-white block mt-0.5">{new Date(selectedHistoryItem.completed_date).toLocaleString()}</span>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default EmployeePortal;
