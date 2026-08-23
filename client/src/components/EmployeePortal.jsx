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

  // Password Visibility States
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Account Preferences Toggle States
  const [prefNotifications, setPrefNotifications] = useState(true);
  const [prefTheme, setPrefTheme] = useState(true);
  const [prefAlerts, setPrefAlerts] = useState(true);

  // Complaints Tab specific filter/search/pagination states
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [complaintsStatusFilter, setComplaintsStatusFilter] = useState('all'); 
  const [complaintsPriorityFilter, setComplaintsPriorityFilter] = useState('all'); 
  const [complaintsDateFilter, setComplaintsDateFilter] = useState('all'); 
  const [complaintsCurrentPage, setComplaintsCurrentPage] = useState(1);
  const complaintsPerPage = 8;

  // Technical Tasks Tab specific search/filter/pagination states
  const [tasksSearch, setTasksSearch] = useState('');
  const [tasksStatusFilter, setTasksStatusFilter] = useState('all'); 
  const [tasksTypeFilter, setTasksTypeFilter] = useState('all'); 
  const [tasksPriorityFilter, setTasksPriorityFilter] = useState('all'); 
  const [tasksDateFilter, setTasksDateFilter] = useState('all'); 
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const tasksPerPage = 8;

  // History filters states
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState('all'); 
  const [historyFilterPriority, setHistoryFilterPriority] = useState('all'); 
  const [historyFilterDate, setHistoryFilterDate] = useState('all'); 
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const historyPerPage = 8;

  // Quick Action Modal States
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showCreateComplaintModal, setShowCreateComplaintModal] = useState(false);
  const [showAssignTechModal, setShowAssignTechModal] = useState(false);

  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '', address: '', plan: 'Silver' });
  const [newRequestForm, setNewRequestForm] = useState({ customerName: '', requestType: 'New Connection', notes: '' });
  const [newComplaintForm, setNewComplaintForm] = useState({ customerName: '', issue: '', priority: 'High', description: '' });
  const [assignForm, setAssignForm] = useState({ ticketId: '', technicianId: 'Hamza' });

  // Mock Data for Operations Dashboard
  const [mockCustomers, setMockCustomers] = useState([
    { id: 'CUST-3042', name: 'Ahmed Khan', email: 'ahmed.k@gmail.com', phone: '0300-1234567', plan: 'Fiber Gold (250 Mbps)', status: 'Active', joined: '12 Jan 2025' },
    { id: 'CUST-3043', name: 'Sara Ali', email: 'sara.ali@yahoo.com', phone: '0321-7654321', plan: 'Fiber Silver (100 Mbps)', status: 'Active', joined: '04 Feb 2025' },
    { id: 'CUST-3044', name: 'Bilal Ahmed', email: 'bilal.a@outlook.com', phone: '0333-9876543', plan: 'Fiber Bronze (50 Mbps)', status: 'Active', joined: '20 May 2025' },
    { id: 'CUST-3045', name: 'Noor Fatima', email: 'noor.f@gmail.com', phone: '0345-2468135', plan: 'Fiber Gold (250 Mbps)', status: 'Active', joined: '18 Jun 2025' },
    { id: 'CUST-3046', name: 'Zainab Bibi', email: 'zainab.b@gmail.com', phone: '0312-3571113', plan: 'Fiber Platinum (1 Gbps)', status: 'Suspended', joined: '30 Sep 2024' },
    { id: 'CUST-3047', name: 'Kamran Shah', email: 'kamran.shah@gmail.com', phone: '0302-8642013', plan: 'Fiber Silver (100 Mbps)', status: 'Active', joined: '05 Aug 2025' }
  ]);

  const mockServicePlans = [
    { name: 'Fiber Bronze', speed: '50 Mbps', price: '$30/mo', activeSubscribers: 846, type: 'Fiber Optic', reliability: '99.9%', support: 'Standard' },
    { name: 'Fiber Silver', speed: '100 Mbps', price: '$50/mo', activeSubscribers: 1105, type: 'Fiber Optic', reliability: '99.9%', support: 'Priority 24/7' },
    { name: 'Fiber Gold', speed: '250 Mbps', price: '$80/mo', activeSubscribers: 420, type: 'Fiber Optic', reliability: '99.9%', support: 'Premium Dedicated' },
    { name: 'Fiber Platinum', speed: '1 Gbps', price: '$120/mo', activeSubscribers: 160, type: 'Direct Fiber', reliability: '99.99%', support: 'VIP Executive' }
  ];

  const mockTechnicians = [
    { name: 'Hamza', status: 'Available', color: 'bg-emerald-500', icon: '🟢', activeJobs: 0, rating: '4.8', phone: '0310-9876543' },
    { name: 'Usman', status: 'On Job', color: 'bg-blue-500', icon: '🔵', activeJobs: 2, rating: '4.6', phone: '0300-7654321' },
    { name: 'Ali Raza', status: 'On Break', color: 'bg-amber-500', icon: '🟠', activeJobs: 1, rating: '4.9', phone: '0322-1234567' },
    { name: 'Bilal', status: 'Offline', color: 'bg-red-500', icon: '🔴', activeJobs: 0, rating: '4.5', phone: '0333-2468101' }
  ];

  const mockBillings = [
    { invoiceId: 'INV-2026-987', customer: 'Ahmed Khan', amount: '$80.00', status: 'Paid', dueDate: '15 Aug 2026' },
    { invoiceId: 'INV-2026-988', customer: 'Sara Ali', amount: '$50.00', status: 'Pending', dueDate: '25 Aug 2026' },
    { invoiceId: 'INV-2026-989', customer: 'Bilal Ahmed', amount: '$30.00', status: 'Paid', dueDate: '18 Aug 2026' },
    { invoiceId: 'INV-2026-990', customer: 'Noor Fatima', amount: '$80.00', status: 'Pending', dueDate: '28 Aug 2026' },
    { invoiceId: 'INV-2026-991', customer: 'Zainab Bibi', amount: '$120.00', status: 'Overdue', dueDate: '10 Aug 2026' }
  ];

  const mockInstallations = [
    { time: '09:00 AM', type: 'New Fiber Connection', customer: 'Ahmed Khan', technician: 'Hamza', area: 'Gulberg', status: 'Completed' },
    { time: '11:30 AM', type: 'Package Upgrade', customer: 'Sara Ali', technician: 'Usman', area: 'DHA', status: 'In Progress' },
    { time: '02:00 PM', type: 'New Fiber Connection', customer: 'Bilal Ahmed', technician: 'Ali Raza', area: 'Model Town', status: 'Scheduled' }
  ];

  const getMockNotifications = () => [
    { 
      id: 'mock-1', 
      title: '📋 New service request received', 
      message: 'Customer Ahmed Khan requested a new fiber connection.', 
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), 
      is_read: false, 
      is_mock: true, 
      category: 'request',
      priority: 'normal'
    },
    { 
      id: 'mock-2', 
      title: '🎫 Complaint escalated', 
      message: 'Complaint CMP-1048 requires immediate attention.', 
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(), 
      is_read: false, 
      is_mock: true, 
      category: 'complaint',
      priority: 'high'
    },
    { 
      id: 'mock-3', 
      title: '🔧 Technician completed installation', 
      message: 'Hamza completed REQ-1045.', 
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), 
      is_read: false, 
      is_mock: true, 
      category: 'system',
      priority: 'normal'
    },
    { 
      id: 'mock-4', 
      title: '💳 Payment reminder', 
      message: '37 customer payments are currently outstanding.', 
      created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(), 
      is_read: true, 
      is_mock: true, 
      category: 'billing',
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

      const complaintsRes = await fetch('http://localhost:5000/api/employee/complaints', reqOpts);
      if (complaintsRes.ok) {
        const complaintsData = await complaintsRes.json();
        setComplaints(complaintsData);
      }

      const tasksRes = await fetch('http://localhost:5000/api/employee/tasks', reqOpts);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      const historyRes = await fetch('http://localhost:5000/api/employee/work-history', reqOpts);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

      const notificationsRes = await fetch('http://localhost:5000/api/employee/notifications', reqOpts);
      let fetchedNotifs = [];
      if (notificationsRes.ok) {
        fetchedNotifs = await notificationsRes.json();
      }

      const mergedNotifications = [
        ...getMockNotifications().filter(mn => {
          const removedMocks = JSON.parse(localStorage.getItem('removed_mocks') || '[]');
          return !removedMocks.includes(mn.id);
        }),
        ...fetchedNotifs
      ];
      setNotifications(mergedNotifications);

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

  const handleMarkNotificationAsRead = async (notif) => {
    if (notif.is_read) return;

    if (notif.is_mock) {
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
      await fetch('http://localhost:5000/api/employee/notifications/mark-read', {
        method: 'POST',
        credentials: 'include'
      });
      
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

  // Mock Form Submissions for Operations Shortcuts
  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.email || !newCustomerForm.phone) {
      alert('Please fill out Name, Email, and Phone number.');
      return;
    }
    const newCust = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newCustomerForm.name,
      email: newCustomerForm.email,
      phone: newCustomerForm.phone,
      address: newCustomerForm.address || 'Not Provided',
      plan: `Fiber ${newCustomerForm.plan} (${newCustomerForm.plan === 'Gold' ? '250 Mbps' : newCustomerForm.plan === 'Silver' ? '100 Mbps' : newCustomerForm.plan === 'Bronze' ? '50 Mbps' : '1 Gbps'})`,
      status: 'Active',
      joined: 'Today'
    };
    setMockCustomers([newCust, ...mockCustomers]);
    showToast(`Successfully added Customer: ${newCustomerForm.name}`);
    setShowAddCustomerModal(false);
    setNewCustomerForm({ name: '', email: '', phone: '', address: '', plan: 'Silver' });
  };

  const handleNewRequestSubmit = (e) => {
    e.preventDefault();
    if (!newRequestForm.customerName || !newRequestForm.notes) {
      alert('Please fill out Customer Name and Notes.');
      return;
    }
    showToast(`Operations request generated for: ${newRequestForm.customerName}`);
    setShowNewRequestModal(false);
    setNewRequestForm({ customerName: '', requestType: 'New Connection', notes: '' });
  };

  const handleCreateComplaintSubmit = (e) => {
    e.preventDefault();
    if (!newComplaintForm.customerName || !newComplaintForm.issue) {
      alert('Please fill out Customer Name and Issue.');
      return;
    }
    showToast(`Customer Complaint created for: ${newComplaintForm.customerName}`);
    setShowCreateComplaintModal(false);
    setNewComplaintForm({ customerName: '', issue: '', priority: 'High', description: '' });
  };

  const handleAssignTechSubmit = (e) => {
    e.preventDefault();
    if (!assignForm.ticketId) {
      alert('Please enter a valid Service Request / Complaint ID.');
      return;
    }
    showToast(`Assigned Ticket ${assignForm.ticketId} to Technician: ${assignForm.technicianId}`);
    setShowAssignTechModal(false);
    setAssignForm({ ticketId: '', technicianId: 'Hamza' });
  };

  // Client-side filtering logic for Service Requests (mapped to real Tasks state)
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

  // Client-side filtering logic for Complaints Tab
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

  const totalComplaintsPages = Math.ceil(filteredComplaints.length / complaintsPerPage) || 1;
  const indexOfLastComplaint = complaintsCurrentPage * complaintsPerPage;
  const indexOfFirstComplaint = indexOfLastComplaint - complaintsPerPage;
  const currentComplaintsPageData = filteredComplaints.slice(indexOfFirstComplaint, indexOfLastComplaint);

  const totalTasksPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
  const indexOfLastTask = tasksCurrentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasksPageData = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  return (
    <div className="flex bg-[#070b14] min-h-screen text-slate-100 font-sans w-full selection:bg-cyan-500 selection:text-[#070b14] overflow-x-hidden">
      
      {/* Toast Messages */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[60] p-4 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-400 text-sm shadow-xl flex items-center space-x-3 ring-1 ring-cyan-500/25 transition-all duration-200 animate-slide-in">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-[#151c2e] bg-[#090d18]/90 backdrop-blur-md hidden lg:flex flex-col h-screen sticky top-0 z-40 shrink-0">
        <div className="p-6 border-b border-[#151c2e] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-white block">Employee Portal</span>
              <span className="text-[10px] text-cyan-400 font-bold tracking-widest block uppercase mt-0.5">ISP Operations</span>
            </div>
          </div>
        </div>

        <nav className="flex-grow px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {[
            { id: 'Dashboard', label: 'Dashboard', icon: '🏠' },
            { id: 'Customers', label: 'Customers', icon: '👥' },
            { id: 'ServicePlans', label: 'Service Plans', icon: '📦' },
            { id: 'ServiceRequests', label: 'Service Requests', icon: '📋' },
            { id: 'Complaints', label: 'Complaints & Support', icon: '🎫' },
            { id: 'Technicians', label: 'Technician Management', icon: '🔧' },
            { id: 'Billing', label: 'Billing & Payments', icon: '💳' },
            { id: 'Installations', label: 'Installations & Appointments', icon: '📅' },
            { id: 'Reports', label: 'Reports', icon: '📊' },
            { id: 'Notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
            { id: 'Profile', label: 'My Profile', icon: '👤' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setShowProfileDropdown(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-cyan-955/40 to-blue-955/20 border border-cyan-800/40 text-cyan-405 font-semibold shadow-inner'
                  : 'text-slate-405 hover:bg-slate-900/40 hover:text-white border border-transparent'
              }`}
            >
              {activeTab === item.id && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-cyan-405" />
              )}
              <span className="text-base transition-transform group-hover:scale-110">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-cyan-955 border border-cyan-800 text-cyan-405 font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#151c2e]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-405 hover:bg-red-955/20 hover:text-red-305 transition-all border border-transparent hover:border-red-900/20"
          >
            <span className="text-base">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header Navigation */}
        <header className="border-b border-[#151c2e] bg-[#070b14]/80 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('Dashboard')}
              className="lg:hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center"
            >
              <span className="text-white text-xs">⚡</span>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Operations Dashboard</h1>
              <p className="text-[10px] text-slate-400 font-light hidden sm:block">Monitor customers, services, requests and daily operations.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell with Badge */}
            <button
              onClick={() => { setActiveTab('Notifications'); setShowProfileDropdown(false); }}
              className="relative p-2 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-cyan-400 transition-colors flex items-center"
              title="Notifications"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-500 text-white text-[8px] font-extrabold flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile widget */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 focus:outline-none group p-1.5 rounded-xl hover:bg-slate-900/50 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-none">{profile?.full_name || user?.name || 'Ali Raza'}</p>
                  <p className="text-slate-500 text-[9px] mt-1 tracking-wider uppercase font-bold">EMPLOYEE</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/25 to-blue-600/25 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-xs group-hover:scale-105 transition-transform duration-150">
                  {(profile?.full_name || user?.name || 'Ali')?.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-slate-500 text-[10px] hidden sm:inline">▼</span>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs animate-fade-in ring-1 ring-cyan-500/10">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white truncate">{profile?.full_name || user?.name || 'Ali Raza'}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">{profile?.employee_code || 'EMP-3042'}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('Profile'); setShowProfileDropdown(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors flex items-center space-x-2"
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2.5 text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors border-t border-slate-800 flex items-center space-x-2"
                  >
                    <span>🚪</span>
                    <span>Logout Session</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dashboard Grid Container */}
        <main className="flex-grow p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">

          {/* ==============================================
              TAB 1: OPERATIONS DASHBOARD
              ============================================== */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fade-in duration-200">
              
              {/* Compact Premium Welcome Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl bg-gradient-to-r from-slate-900/40 to-slate-950/20 border border-[#151c2e] gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">Good evening, Ali 👋</h2>
                  <p className="text-xs text-slate-400">Here's what's happening across your ISP operations today.</p>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                  <span className="text-sm">📅</span>
                  <span className="font-medium">23 August 2026</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold ml-1.5">Today</span>
                </div>
              </div>

              {/* 6 KPI Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { title: 'TOTAL CUSTOMERS', val: '2,846', change: '+8.4% this month', icon: '👥', color: 'hover:border-cyan-500/20' },
                  { title: 'ACTIVE SERVICES', val: '2,531', change: '+5.2% this month', icon: '📦', color: 'hover:border-cyan-500/20' },
                  { title: 'PENDING REQUESTS', val: '24', change: '7 require attention', icon: '📋', color: 'hover:border-amber-500/20', alert: true },
                  { title: 'OPEN COMPLAINTS', val: '18', change: '5 high priority', icon: '🎫', color: 'hover:border-red-500/20', alert: true },
                  { title: 'TODAY\'S INSTALLS', val: '12', change: '4 remaining', icon: '📅', color: 'hover:border-emerald-500/20' },
                  { title: 'PENDING PAYMENTS', val: '37', change: 'View outstanding', icon: '💳', color: 'hover:border-amber-500/20' }
                ].map((kpi, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl bg-[#090d18]/50 border border-[#151c2e] ${kpi.color} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5 group flex flex-col justify-between h-28`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block">{kpi.title}</span>
                      <span className="text-sm shrink-0">{kpi.icon}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-xl font-extrabold text-white block leading-none">{kpi.val}</span>
                      <span className={`text-[9px] block mt-1.5 ${kpi.alert ? 'text-amber-400 font-medium' : 'text-slate-505'}`}>{kpi.change}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* TWO COLUMN CONTENT LAYOUT */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* LEFT: Recent Service Requests Table (col-span-2) */}
                <div className="xl:col-span-2 p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white text-sm">Recent Service Requests</h3>
                      <p className="text-[10px] text-slate-500 font-light">Direct operational requests and tasks pipeline.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('ServiceRequests')}
                      className="text-cyan-400 text-xs font-semibold hover:underline flex items-center space-x-1"
                    >
                      <span>View All</span>
                      <span>→</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#151c2e] bg-[#070b14]/50">
                    <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                      <thead>
                        <tr className="border-b border-[#151c2e] bg-slate-900/30 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="py-3 px-4">Request ID</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Request Type</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Assigned To</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'REQ-1048', customer: 'Ahmed Khan', type: 'New Connection', date: 'Today', status: 'Pending', statusColor: 'bg-amber-950 border border-amber-800 text-amber-400', tech: 'Unassigned' },
                          { id: 'REQ-1047', customer: 'Sara Ali', type: 'Package Upgrade', date: 'Today', status: 'In Progress', statusColor: 'bg-blue-950 border border-blue-800 text-blue-400', tech: 'Hamza' },
                          { id: 'REQ-1046', customer: 'Bilal Ahmed', type: 'Disconnection', date: 'Yesterday', status: 'Completed', statusColor: 'bg-emerald-950 border border-emerald-800 text-emerald-400', tech: 'Usman' },
                          { id: 'REQ-1045', customer: 'Noor Fatima', type: 'Speed Upgrade', date: 'Yesterday', status: 'Pending', statusColor: 'bg-amber-950 border border-amber-800 text-amber-400', tech: 'Unassigned' }
                        ].map((req, idx) => (
                          <tr key={idx} className="border-b border-[#151c2e]/50 hover:bg-[#131b2e]/30 text-slate-300 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white">{req.id}</td>
                            <td className="py-3 px-4 font-medium text-slate-200">{req.customer}</td>
                            <td className="py-3 px-4">{req.type}</td>
                            <td className="py-3 px-4 text-slate-500">{req.date}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${req.statusColor}`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={req.tech === 'Unassigned' ? 'text-amber-500 font-medium' : 'text-slate-300'}>
                                {req.tech}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setActiveTab('ServiceRequests')}
                                className="px-2.5 py-1 rounded bg-[#090d18] hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT COLUMN: QUICK ACTIONS */}
                <div className="space-y-6">
                  
                  {/* Quick Actions Panel */}
                  <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-4">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Add Customer', icon: '👤', onClick: () => setShowAddCustomerModal(true) },
                        { label: 'New Request', icon: '📋', onClick: () => setShowNewRequestModal(true) },
                        { label: 'Create Complaint', icon: '🎫', onClick: () => setShowCreateComplaintModal(true) },
                        { label: 'Assign Tech', icon: '🔧', onClick: () => setShowAssignTechModal(true) }
                      ].map((action, idx) => (
                        <button
                          key={idx}
                          onClick={action.onClick}
                          className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#090d18] border border-slate-800 hover:border-cyan-500/20 text-xs font-semibold text-slate-300 hover:text-white hover:-translate-y-0.5 transition-all duration-150"
                        >
                          <span className="text-xl mb-1.5">{action.icon}</span>
                          <span className="text-center">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Technician Availability */}
                  <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">Technician Availability</h3>
                      <button onClick={() => setActiveTab('Technicians')} className="text-cyan-400 text-[10px] font-semibold hover:underline">
                        View All Technicians →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {mockTechnicians.map((tech, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/30 border border-slate-800/40">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-slate-300">
                              {tech.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block leading-none">{tech.name}</span>
                              <span className="text-[9px] text-slate-500 block mt-1">Rating: {tech.rating} ★</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            tech.status === 'Available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-850/60' :
                            tech.status === 'On Job' ? 'bg-blue-950 text-blue-400 border border-blue-850/60' :
                            tech.status === 'On Break' ? 'bg-amber-950 text-amber-400 border border-amber-850/60' : 'bg-red-950 text-red-400'
                          }`}>
                            {tech.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* SECOND ROW LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Complaints List Card */}
                <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Customer Complaints</h3>
                    <button onClick={() => setActiveTab('Complaints')} className="text-cyan-400 text-[10px] font-semibold hover:underline">
                      View All
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { id: 'CMP-1048', desc: 'Internet Down', priority: 'High', tech: 'Ali Raza', status: 'In Progress', priColor: 'bg-red-950 text-red-400', statColor: 'text-blue-400' },
                      { id: 'CMP-1047', desc: 'Slow Speed', priority: 'Medium', tech: 'Hamza', status: 'Pending', priColor: 'bg-amber-950 text-amber-400', statColor: 'text-amber-400' },
                      { id: 'CMP-1046', desc: 'Router Issue', priority: 'Low', tech: 'Usman', status: 'Resolved', priColor: 'bg-slate-800 text-slate-400', statColor: 'text-emerald-400' }
                    ].map((comp, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/40 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-white">{comp.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${comp.priColor}`}>
                            {comp.priority}
                          </span>
                        </div>
                        <p className="text-slate-300 font-semibold">{comp.desc}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>Tech: {comp.tech}</span>
                          <span className={`font-bold uppercase ${comp.statColor}`}>{comp.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Today's Installations Scheduling Timeline */}
                <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Today's Installations</h3>
                    <button onClick={() => setActiveTab('Installations')} className="text-cyan-400 text-[10px] font-semibold hover:underline">
                      Calendar View
                    </button>
                  </div>

                  <div className="relative pl-4 border-l-2 border-slate-800 space-y-4">
                    {mockInstallations.map((inst, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-950 border-2 border-cyan-500" />
                        <span className="text-[10px] font-bold text-cyan-400 block leading-none">{inst.time}</span>
                        <span className="font-semibold text-white block mt-1">{inst.type}</span>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>Client: {inst.customer} | Tech: {inst.technician}</span>
                          <span className={`font-bold ${inst.status === 'Completed' ? 'text-emerald-400' : inst.status === 'In Progress' ? 'text-blue-400' : 'text-slate-400'}`}>
                            {inst.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Latest Notifications Box */}
                <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Latest Notifications</h3>
                    <button onClick={() => setActiveTab('Notifications')} className="text-cyan-400 text-[10px] font-semibold hover:underline">
                      View All
                    </button>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {notifications.slice(0, 4).map((notif, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/20 border border-slate-800/40 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-white truncate max-w-[170px]">{notif.title}</span>
                          <span className="text-[8px] text-slate-500 shrink-0 ml-1">5 min ago</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-light leading-snug line-clamp-2">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==============================================
              TAB 2: CUSTOMERS DIRECTORY
              ============================================== */}
          {activeTab === 'Customers' && (
            <div className="space-y-6 animate-fade-in duration-200">
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#151c2e]">
                <div>
                  <h2 className="text-lg font-bold text-white">Active Subscriber Directory</h2>
                  <p className="text-xs text-slate-400">View profiles, configure subscription plans, and manage internet users.</p>
                </div>
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 transition-colors"
                >
                  + Add New Customer
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#151c2e] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-3.5 px-3">Customer ID</th>
                      <th className="pb-3.5 px-3">Full Name</th>
                      <th className="pb-3.5 px-3">Email Address</th>
                      <th className="pb-3.5 px-3">Contact Phone</th>
                      <th className="pb-3.5 px-3">Residential Address</th>
                      <th className="pb-3.5 px-3">Current Plan</th>
                      <th className="pb-3.5 px-3">Status</th>
                      <th className="pb-3.5 px-3">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCustomers.map((cust, idx) => (
                      <tr key={idx} className="border-b border-[#151c2e]/60 hover:bg-slate-900/20 text-slate-300">
                        <td className="py-3 px-3 font-mono font-bold text-white">{cust.id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-200">{cust.name}</td>
                        <td className="py-3 px-3 text-slate-400">{cust.email}</td>
                        <td className="py-3 px-3">{cust.phone}</td>
                        <td className="py-3 px-3 truncate max-w-[150px]">{cust.address}</td>
                        <td className="py-3 px-3">{cust.plan}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            cust.status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                          }`}>
                            {cust.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{cust.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 3: SERVICE PLANS
              ============================================== */}
          {activeTab === 'ServicePlans' && (
            <div className="space-y-6 animate-fade-in duration-200">
              <div className="pb-4 border-b border-[#151c2e]">
                <h2 className="text-lg font-bold text-white">ISP Broadband Packages</h2>
                <p className="text-xs text-slate-400">Configure speeds, bandwidth allowances, pricing tiers, and active subscription plans.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {mockServicePlans.map((plan, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-[#090d18]/40 border border-[#151c2e] hover:border-cyan-500/20 transition-all duration-200 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[8px] bg-cyan-950 text-cyan-400 font-bold uppercase">{plan.type}</span>
                        <h3 className="font-extrabold text-white text-base mt-2">{plan.name}</h3>
                      </div>
                      <span className="text-lg font-black text-cyan-400">{plan.price}</span>
                    </div>

                    <div className="space-y-2 border-t border-slate-900 pt-3 text-xs text-slate-350 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Connection Speed:</span>
                        <span className="font-bold text-white">{plan.speed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Uptime SLA:</span>
                        <span>{plan.reliability}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Helpdesk Support:</span>
                        <span>{plan.support}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Active Subscribers:</span>
                        <span className="font-semibold text-cyan-400">{plan.activeSubscribers} users</span>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast(`Service plan ${plan.name} configuration requested.`)}
                      className="w-full py-2 bg-[#090d18] hover:bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl text-slate-300 hover:text-white transition-colors"
                    >
                      Modify Parameters
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 4: SERVICE REQUESTS (Real Tasks database integration)
              ============================================== */}
          {activeTab === 'ServiceRequests' && (
            <div className="space-y-6 animate-fade-in duration-200">
              
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#151c2e]">
                <div>
                  <h2 className="text-lg font-bold text-white">Operations & Service Requests</h2>
                  <p className="text-xs text-slate-400">Track task deployments, connection setups, and field request pipelines.</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400">
                  <span>Pending Tasks: <strong className="text-white">{filteredTasks.filter(t => t.status !== 'completed').length}</strong></span>
                </div>
              </div>

              {/* Task filters panel */}
              <div className="p-4 rounded-2xl bg-[#090d18]/40 border border-[#151c2e] flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[220px] relative">
                  <input
                    type="text"
                    placeholder="Search by ID, Customer Name..."
                    value={tasksSearch}
                    onChange={(e) => { setTasksSearch(e.target.value); setTasksCurrentPage(1); }}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute left-3 top-2 text-xs">🔍</span>
                </div>

                <div className="w-36 shrink-0">
                  <select
                    value={tasksStatusFilter}
                    onChange={(e) => { setTasksStatusFilter(e.target.value); setTasksCurrentPage(1); }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="assigned">Assigned / Pending</option>
                    <option value="on_the_way">On the Way</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="w-36 shrink-0">
                  <select
                    value={tasksTypeFilter}
                    onChange={(e) => { setTasksTypeFilter(e.target.value); setTasksCurrentPage(1); }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="Installation">Installation</option>
                    <option value="Fiber Repair">Fiber Repair</option>
                    <option value="Router Replacement">Router Replace</option>
                    <option value="ONU/ONT Replacement">ONU/ONT Replace</option>
                  </select>
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#151c2e] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-3.5 px-3">Task ID</th>
                      <th className="pb-3.5 px-3">Request Type</th>
                      <th className="pb-3.5 px-3">Customer Name</th>
                      <th className="pb-3.5 px-3">Contact Phone</th>
                      <th className="pb-3.5 px-3">Service Address</th>
                      <th className="pb-3.5 px-3">Priority</th>
                      <th className="pb-3.5 px-3">Status</th>
                      <th className="pb-3.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTasksPageData.map((t, idx) => (
                      <tr key={idx} className="border-b border-[#151c2e]/60 hover:bg-slate-900/20 text-slate-300">
                        <td className="py-3 px-3 font-mono font-bold text-white">TSK-{t.id}</td>
                        <td className="py-3 px-3 font-bold text-white uppercase text-[10px]">{t.task_type}</td>
                        <td className="py-3 px-3">{t.customer_name}</td>
                        <td className="py-3 px-3">{t.customer_phone}</td>
                        <td className="py-3 px-3 truncate max-w-[150px]">{t.customer_address}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            t.priority === 'urgent' || t.priority === 'high' ? 'bg-red-950 text-red-400' : 'bg-slate-900 text-slate-500'
                          }`}>{t.priority}</span>
                        </td>
                        <td className="py-3 px-3 uppercase text-[10px] font-bold text-cyan-400">{t.status}</td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedItem(t)}
                            className="px-2.5 py-1 rounded bg-[#090d18] border border-slate-800 text-[10px] hover:text-white"
                          >
                            Details
                          </button>
                          {t.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(t.id, 'completed')}
                              className="px-2.5 py-1 rounded bg-emerald-600/20 border border-emerald-800 text-[10px] text-emerald-400 font-bold hover:bg-emerald-600 hover:text-white transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredTasks.length === 0 && (
                  <div className="py-12 text-center text-slate-500 italic">No service requests matches query filters.</div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 5: COMPLAINTS & SUPPORT (Real database integration)
              ============================================== */}
          {activeTab === 'Complaints' && (
            <div className="space-y-6 animate-fade-in duration-200">
              
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#151c2e]">
                <div>
                  <h2 className="text-lg font-bold text-white">Customer Support complaints</h2>
                  <p className="text-xs text-slate-400">Resolve internet downtime tickets, hardware speed upgrades, and client conflicts.</p>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="px-3 py-1 rounded-xl bg-slate-900 text-xs text-slate-405 text-slate-400 font-semibold border border-slate-800">
                    Open Tickets: <strong className="text-white font-extrabold">{complaints.filter(c => c.status !== 'resolved').length}</strong>
                  </div>
                </div>
              </div>

              {/* Advanced Search & Filtering Toolbar */}
              <div className="p-4 rounded-2xl bg-[#090d18]/40 border border-[#151c2e] flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[220px] relative">
                  <input
                    type="text"
                    placeholder="Search complaints by ID, Customer Name..."
                    value={complaintsSearch}
                    onChange={(e) => { setComplaintsSearch(e.target.value); setComplaintsCurrentPage(1); }}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute left-3 top-2 text-xs">🔍</span>
                </div>

                <div className="w-36 shrink-0">
                  <select
                    value={complaintsStatusFilter}
                    onChange={(e) => { setComplaintsStatusFilter(e.target.value); setComplaintsCurrentPage(1); }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Assigned / Pending</option>
                    <option value="on_the_way">On the Way</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="w-36 shrink-0">
                  <select
                    value={complaintsPriorityFilter}
                    onChange={(e) => { setComplaintsPriorityFilter(e.target.value); setComplaintsCurrentPage(1); }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Complaints Table */}
              <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#151c2e] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-3.5 px-3">Ticket ID</th>
                      <th className="pb-3.5 px-3">Customer Name</th>
                      <th className="pb-3.5 px-3">Subject / Issue</th>
                      <th className="pb-3.5 px-3">Phone Number</th>
                      <th className="pb-3.5 px-3">Priority</th>
                      <th className="pb-3.5 px-3">Status</th>
                      <th className="pb-3.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentComplaintsPageData.map((c, idx) => (
                      <tr key={idx} className="border-b border-[#151c2e]/60 hover:bg-slate-900/20 text-slate-300">
                        <td className="py-3 px-3 font-mono font-bold text-white">CMP-{c.id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-200">{c.customer_name}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold block text-slate-200">{c.subject}</span>
                          <span className="text-[10px] text-slate-500 font-light block truncate max-w-[200px]">{c.description}</span>
                        </td>
                        <td className="py-3 px-3">{c.customer_phone}</td>
                        <td className="py-3 px-3 uppercase">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            c.priority === 'urgent' || c.priority === 'high' ? 'bg-red-955/20 text-red-400 border border-red-900/30' : 'bg-slate-900 text-slate-500'
                          }`}>{c.priority}</span>
                        </td>
                        <td className="py-3 px-3 uppercase text-[10px] font-bold text-cyan-400">{c.status}</td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedItem(c)}
                            className="px-2.5 py-1 rounded bg-[#090d18] border border-slate-800 text-[10px] hover:text-white"
                          >
                            Details
                          </button>
                          {c.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateComplaintStatus(c.id, 'resolved')}
                              className="px-2.5 py-1 rounded bg-emerald-600/20 border border-emerald-800 text-[10px] text-emerald-400 font-bold hover:bg-emerald-600 hover:text-white transition-colors"
                            >
                              Close Ticket
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredComplaints.length === 0 && (
                  <div className="py-12 text-center text-slate-500 italic">No customer complaints found matching criteria.</div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 6: TECHNICIAN COORDINATION
              ============================================== */}
          {activeTab === 'Technicians' && (
            <div className="space-y-6 animate-fade-in duration-200">
              <div className="pb-4 border-b border-[#151c2e]">
                <h2 className="text-lg font-bold text-white">Technician Crew Registry</h2>
                <p className="text-xs text-slate-400">Coordinate assignees, monitor technician schedules, availability, and active job counters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mockTechnicians.map((tech, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#090d18]/40 border border-[#151c2e] space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center font-bold text-sm text-cyan-400 shadow-md">
                          {tech.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{tech.name}</h4>
                          <span className="text-[9px] text-slate-500">Field Technician</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        tech.status === 'Available' ? 'bg-emerald-950 text-emerald-400' :
                        tech.status === 'On Job' ? 'bg-blue-950 text-blue-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {tech.status}
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-slate-900 pt-3.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contact Phone:</span>
                        <span className="text-slate-300">{tech.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Performance Rating:</span>
                        <span className="text-cyan-400 font-bold">{tech.rating} ★</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Active Job Tasks:</span>
                        <span className="text-white font-bold">{tech.activeJobs} assigned</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAssignForm({ ticketId: '', technicianId: tech.name });
                        setShowAssignTechModal(true);
                      }}
                      className="w-full py-2 bg-[#090d18] hover:bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl text-slate-300 hover:text-white transition-colors"
                    >
                      Assign Task
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 7: BILLING & PAYMENTS
              ============================================== */}
          {activeTab === 'Billing' && (
            <div className="space-y-6 animate-fade-in duration-200">
              <div className="pb-4 border-b border-[#151c2e]">
                <h2 className="text-lg font-bold text-white">Billing & Payments Registry</h2>
                <p className="text-xs text-slate-400">Track invoice collections, pending client billing files, and check outstanding balances.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#151c2e] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-3.5 px-3">Invoice ID</th>
                      <th className="pb-3.5 px-3">Customer Client</th>
                      <th className="pb-3.5 px-3">Total Amount</th>
                      <th className="pb-3.5 px-3">Payment Status</th>
                      <th className="pb-3.5 px-3">Due Date</th>
                      <th className="pb-3.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBillings.map((bill, idx) => (
                      <tr key={idx} className="border-b border-[#151c2e]/60 hover:bg-slate-900/20 text-slate-300">
                        <td className="py-3 px-3 font-mono font-bold text-white">{bill.invoiceId}</td>
                        <td className="py-3 px-3 font-semibold text-slate-200">{bill.customer}</td>
                        <td className="py-3 px-3 font-bold text-white">{bill.amount}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            bill.status === 'Paid' ? 'bg-emerald-950 text-emerald-400' :
                            bill.status === 'Pending' ? 'bg-amber-950 text-amber-400' : 'bg-red-955/20 text-red-400 border border-red-900/30'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{bill.dueDate}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => showToast(`Dispatched invoice notification for ${bill.customer}`)}
                            className="px-2.5 py-1 rounded bg-[#090d18] border border-slate-800 text-[10px] hover:text-white"
                          >
                            Remind Customer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 8: INSTALLATIONS SCHEDULES
              ============================================== */}
          {activeTab === 'Installations' && (
            <div className="space-y-6 animate-fade-in duration-200">
              <div className="pb-4 border-b border-[#151c2e]">
                <h2 className="text-lg font-bold text-white">Installations Calendar Schedules</h2>
                <p className="text-xs text-slate-400">Track and monitor today's broadband connections, routers setups, and scheduling times.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-6 shadow-xl">
                <div className="relative pl-6 border-l-2 border-slate-850 space-y-6">
                  {mockInstallations.map((inst, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-cyan-500 shadow-md shadow-cyan-500/20" />
                      <span className="text-[10px] font-bold text-cyan-400 block leading-none">{inst.time}</span>
                      <h4 className="font-extrabold text-white text-sm mt-1.5">{inst.type}</h4>
                      <p className="text-slate-400 mt-1">Customer Profile: <strong className="text-slate-200">{inst.customer}</strong></p>
                      <p className="text-slate-400">Assigned Crew Technician: <span className="font-medium text-slate-300">{inst.technician}</span></p>
                      <p className="text-slate-400">Area Location: <span className="font-light text-slate-400">{inst.area}</span></p>
                      <div className="mt-2.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          inst.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' :
                          inst.status === 'In Progress' ? 'bg-blue-950 text-blue-400' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {inst.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 9: OPERATIONAL REPORTS
              ============================================== */}
          {activeTab === 'Reports' && (
            <div className="space-y-6 animate-fade-in duration-200">
              <div className="pb-4 border-b border-[#151c2e]">
                <h2 className="text-lg font-bold text-white">ISP Operations & Analytics Reports</h2>
                <p className="text-xs text-slate-400">View diagnostic visual charts, packet loads, complaint closures, and subscriber growths.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart 1: SVG Customer Growth */}
                <div className="p-5 rounded-2xl bg-[#090d18]/40 border border-[#151c2e] space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Subscribers Growth Rate</h4>
                  <div className="h-44 w-full flex items-end justify-between px-2 pt-4 bg-[#070b14]/50 rounded-xl border border-slate-900">
                    {[35, 45, 60, 50, 75, 90].map((height, idx) => (
                      <div key={idx} className="flex flex-col items-center space-y-2 flex-grow">
                        <div className="w-6 bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t" style={{ height: `${height * 1.2}px` }}></div>
                        <span className="text-[9px] text-slate-500">M{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-555 text-slate-500 text-center font-light leading-relaxed">Monthly new client signups showing positive growth trajectory.</p>
                </div>

                {/* Chart 2: SVG Package Distribution */}
                <div className="p-5 rounded-2xl bg-[#090d18]/40 border border-[#151c2e] space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Plan Distribution Rates</h4>
                  <div className="h-44 w-full flex items-center justify-center bg-[#070b14]/50 rounded-xl border border-slate-900">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 32 32">
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke="#1e293b" strokeWidth="6" />
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke="#06b6d4" strokeWidth="6" strokeDasharray="40 100" strokeDashoffset="0" />
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray="30 100" strokeDashoffset="-40" />
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray="20 100" strokeDashoffset="-70" />
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="10 100" strokeDashoffset="-90" />
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-cyan-400 block" /><span>Gold (40%)</span></div>
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-blue-500 block" /><span>Silver (30%)</span></div>
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-500 block" /><span>Bronze (20%)</span></div>
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500 block" /><span>Platinum (10%)</span></div>
                  </div>
                </div>

                {/* Chart 3: Service SLA performance */}
                <div className="p-5 rounded-2xl bg-[#090d18]/40 border border-[#151c2e] space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Trouble Ticket Performance SLA</h4>
                  <div className="h-44 w-full flex flex-col justify-center space-y-3 px-4 bg-[#070b14]/50 rounded-xl border border-slate-900">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Complaints Closure:</span>
                        <span className="font-bold text-white">92.5%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: '92.5%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>New Connections Deployment SLA:</span>
                        <span className="font-bold text-white">88.0%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: '88.0%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Average Ticket Fix Time:</span>
                        <span className="font-bold text-white">3.4 hrs</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-555 text-slate-500 text-center font-light leading-relaxed">Ticket handling time compared against SLA limits.</p>
                </div>

              </div>
            </div>
          )}

          {/* ==============================================
              TAB 10: NOTIFICATIONS HUB
              ============================================== */}
          {activeTab === 'Notifications' && (
            <div className="space-y-6 animate-fade-in duration-200">
              
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#151c2e]">
                <div>
                  <h2 className="text-lg font-bold text-white">Notifications Registry Hub</h2>
                  <p className="text-xs text-slate-400">View real-time deployment notifications, system alerts, and task dispatch logs.</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkNotificationsAsRead}
                    className="px-3.5 py-1.5 bg-[#090d18] hover:bg-slate-900 border border-slate-850 hover:text-white text-slate-300 font-bold text-xs rounded-xl transition-colors"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-4 max-h-[500px] overflow-y-auto shadow-xl">
                {notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleMarkNotificationAsRead(notif)}
                    className={`p-4 rounded-xl border flex items-start justify-between cursor-pointer transition-all duration-150 ${
                      notif.is_read
                        ? 'bg-slate-950/20 border-slate-900 text-slate-400'
                        : 'bg-[#090d18] border-slate-800 text-white hover:border-cyan-500/20 shadow-md shadow-cyan-500/5'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <span className="text-lg shrink-0 mt-0.5">🔔</span>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm leading-none">{notif.title}</h4>
                        <p className="text-xs font-light text-slate-400 leading-snug">{notif.message}</p>
                        <span className="text-[9px] text-slate-500 block">{new Date(notif.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 ml-4 animate-pulse" />
                    )}
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="py-12 text-center text-slate-500 italic">No notifications logs recorded.</div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================
              TAB 11: MY PROFILE & SETTINGS
              ============================================== */}
          {activeTab === 'Profile' && (
            <div className="space-y-6 animate-fade-in duration-200">
              
              <div className="pb-4 border-b border-[#151c2e]">
                <h2 className="text-lg font-bold text-white">Employee Account Settings</h2>
                <p className="text-xs text-slate-400">Configure notifications, edit personal profile data, and update password credentials.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Account Details Card */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-[#151c2e] flex items-center justify-center text-cyan-400 font-extrabold text-lg">
                      {(profile?.full_name || user?.name || 'AL').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base leading-none">{profile?.full_name || user?.name || 'Ali Raza'}</h3>
                      <p className="text-xs text-slate-500 mt-1">ISP coordinator | Designation: {profile?.designation || 'EMPLOYEE'}</p>
                    </div>
                  </div>

                  {!isEditingProfile ? (
                    <div className="space-y-4 border-t border-slate-900 pt-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-505 text-slate-500 block text-[9px] uppercase font-bold">Email Address:</span>
                          <span className="text-white block font-semibold mt-1">{profile?.email || 'ali.raza@isp.com'}</span>
                        </div>
                        <div>
                          <span className="text-slate-505 text-slate-505 text-slate-500 block text-[9px] uppercase font-bold">Employee Code:</span>
                          <span className="text-white block font-semibold mt-1">{profile?.employee_code || 'EMP-3042'}</span>
                        </div>
                        <div>
                          <span className="text-slate-505 text-slate-505 text-slate-500 block text-[9px] uppercase font-bold">Contact Phone:</span>
                          <span className="text-white block font-medium mt-1">{profile?.phone || '0300-1234567'}</span>
                        </div>
                        <div>
                          <span className="text-slate-505 text-slate-505 text-slate-500 block text-[9px] uppercase font-bold">Office Address:</span>
                          <span className="text-white block font-medium mt-1">{profile?.address || 'ISP Operations Hub, Lahore'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold rounded-xl text-slate-300 hover:text-white transition-colors"
                      >
                        Edit Contact Details
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-4 border-t border-slate-900 pt-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                          <input
                            type="text"
                            value={editProfileForm.phone}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Address Location</label>
                          <input
                            type="text"
                            value={editProfileForm.address}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2.5">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors"
                        >
                          Save Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditProfileForm({ phone: profile?.phone || '', address: profile?.address || '' });
                            setIsEditingProfile(false);
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 font-semibold rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Change Password Forms */}
                <div className="p-6 rounded-2xl bg-[#090d18]/30 border border-[#151c2e] space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Update Security Credentials</h4>
                  {passwordError && <p className="text-xs text-red-400 bg-red-955/30 p-2.5 rounded-xl border border-red-900/40">{passwordError}</p>}
                  
                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">New Password</label>
                      <input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-105 text-white font-bold rounded-xl transition-all"
                    >
                      Update Password
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* =======================================================================
          MODALS & DIALOG POPUPS
          ======================================================================= */}

      {/* 1. VIEW DETAILED MODAL DRAWER (Used for Task/Complaint detailed views) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Ticket details - {selectedItem.id ? `CMP-${selectedItem.id}` : `TSK-${selectedItem.id}`}
                </h3>
                <span className="text-[10px] text-slate-500">Customer operation dispatch logs.</span>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Client Information</span>
                <p className="text-white font-semibold">Name: {selectedItem.customer_name}</p>
                <p className="text-slate-350 text-slate-300 font-medium">Contact Number: {selectedItem.customer_phone}</p>
                <p className="text-slate-350">Service address: {selectedItem.customer_address}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Description of issue</span>
                <p className="p-3 bg-slate-950/20 border border-slate-800 text-slate-300 rounded-xl leading-relaxed">
                  {selectedItem.subject || selectedItem.task_type || 'Customer requested service assistance.'} - {selectedItem.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-slate-505 text-slate-500 text-[9px] block uppercase font-bold">Priority level</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold block text-center mt-1 uppercase text-[10px]">{selectedItem.priority}</span>
                </div>
                <div>
                  <span className="text-slate-505 text-slate-500 text-[9px] block uppercase font-bold">Current status</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-955 text-cyan-405 font-bold block text-center mt-1 uppercase text-[10px]">{selectedItem.status}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-405 font-bold rounded-xl text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUBMIT WORK REPORT MODAL FORM */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Submit Operations Diagnostic Report</h3>
                <span className="text-[10px] text-slate-505 text-slate-500">Provide final diagnostics to close this service assignment.</span>
              </div>
              <button onClick={() => { setShowReportForm(false); setSelectedItem(null); }} className="text-slate-405 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitWorkReport} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-555 text-slate-500 uppercase">Problem Diagnosed</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken fiber core at node splice, faulty ONU..."
                  value={reportForm.problem_found}
                  onChange={(e) => setReportForm({ ...reportForm, problem_found: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Work Performed</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spliced fiber at box 14, swapped patch cord..."
                  value={reportForm.work_performed}
                  onChange={(e) => setReportForm({ ...reportForm, work_performed: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Resolution Solution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Connection re-established with normal optical levels..."
                  value={reportForm.solution}
                  onChange={(e) => setReportForm({ ...reportForm, solution: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Equipment / Materials Used</label>
                <input
                  type="text"
                  placeholder="e.g. 5m Patch cord, Fiber Splice Sleeve (Optional)..."
                  value={reportForm.equipment_used}
                  onChange={(e) => setReportForm({ ...reportForm, equipment_used: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-955 bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Additional Observations</label>
                <input
                  type="text"
                  placeholder="Additional warnings or comments..."
                  value={reportForm.additional_notes}
                  onChange={(e) => setReportForm({ ...reportForm, additional_notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-650 text-white font-bold rounded-xl"
                >
                  Submit & Close Ticket
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReportForm(false); setSelectedItem(null); }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD NEW CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Add New ISP Customer</h3>
                <span className="text-[10px] text-slate-505 text-slate-500">Register a new client profile into the operations database.</span>
              </div>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-405 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Customer name"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="03xx-xxxxxxx"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Service address</label>
                <input
                  type="text"
                  placeholder="Physical street address"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-555 text-slate-500 block">Initial Package Plan</label>
                <select
                  value={newCustomerForm.plan}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, plan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="Bronze">Fiber Bronze (50 Mbps)</option>
                  <option value="Silver">Fiber Silver (100 Mbps)</option>
                  <option value="Gold">Fiber Gold (250 Mbps)</option>
                  <option value="Platinum">Fiber Platinum (1 Gbps)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors">
                  Create Account
                </button>
                <button type="button" onClick={() => setShowAddCustomerModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 font-bold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. NEW REQUEST MODAL */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">New Service Connection Request</h3>
                <span className="text-[10px] text-slate-500">File a new technical connection or bandwidth modification request.</span>
              </div>
              <button onClick={() => setShowNewRequestModal(false)} className="text-slate-405 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleNewRequestSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Customer Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Khan"
                  value={newRequestForm.customerName}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Request Job Type</label>
                <select
                  value={newRequestForm.requestType}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, requestType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="New Connection">New Connection</option>
                  <option value="Package Upgrade">Package Upgrade</option>
                  <option value="Disconnection">Disconnection</option>
                  <option value="Speed Upgrade">Speed Upgrade</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-555 text-slate-500 block">Notes & Specifications</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Provide parameters and specific requests..."
                  value={newRequestForm.notes}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors">
                  Submit Request
                </button>
                <button type="button" onClick={() => setShowNewRequestModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 font-bold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CREATE COMPLAINT MODAL */}
      {showCreateComplaintModal && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">File Customer Operations Complaint</h3>
                <span className="text-[10px] text-slate-500">Log a verified internet downtime or speed complaint ticket.</span>
              </div>
              <button onClick={() => setShowCreateComplaintModal(false)} className="text-slate-405 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateComplaintSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Customer Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="Customer name"
                  value={newComplaintForm.customerName}
                  onChange={(e) => setNewComplaintForm({ ...newComplaintForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-555 block">Verified Issue Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Internet Down, Router Issue"
                    value={newComplaintForm.issue}
                    onChange={(e) => setNewComplaintForm({ ...newComplaintForm, issue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Severity Priority</label>
                  <select
                    value={newComplaintForm.priority}
                    onChange={(e) => setNewComplaintForm({ ...newComplaintForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Detailed Symptoms Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Provide details about symptoms, optical levels, power losses..."
                  value={newComplaintForm.description}
                  onChange={(e) => setNewComplaintForm({ ...newComplaintForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors">
                  Create Complaint
                </button>
                <button type="button" onClick={() => setShowCreateComplaintModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 font-bold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ASSIGN TECHNICIAN MODAL */}
      {showAssignTechModal && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Assign Crew Technician</h3>
                <span className="text-[10px] text-slate-555 text-slate-500 font-light">Assign field tasks or support complaints to crew technicians.</span>
              </div>
              <button onClick={() => setShowAssignTechModal(false)} className="text-slate-405 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignTechSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Ticket ID (Complaint / Request ID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REQ-1048 or CMP-1048"
                  value={assignForm.ticketId}
                  onChange={(e) => setAssignForm({ ...assignForm, ticketId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Select Technician</label>
                <select
                  value={assignForm.technicianId}
                  onChange={(e) => setAssignForm({ ...assignForm, technicianId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  {mockTechnicians.map((tech, idx) => (
                    <option key={idx} value={tech.name}>
                      {tech.name} — ({tech.status} | {tech.activeJobs} Active Jobs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors">
                  Assign Ticket
                </button>
                <button type="button" onClick={() => setShowAssignTechModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 font-bold rounded-xl">
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
