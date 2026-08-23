import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Silky smooth number counting animation component that respects prefers-reduced-motion
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 600; // ms
    const startTime = performance.now();

    function updateNumber(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // easeOutQuad
      const current = Math.floor(easeProgress * (end - start) + start);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(end);
      }
    }

    requestAnimationFrame(updateNumber);
  }, [value]);

  return <span className="transition-all duration-300 font-extrabold">{displayValue.toLocaleString()}</span>;
}

function EmployeePortal({ user, onLogoutSuccess }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [profile, setProfile] = useState(null);
  
  // Real DB States
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeServices: 0,
    pendingRequests: 0,
    openComplaints: 0,
    todayInstallations: 0,
    pendingPayments: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [todayInstallationsList, setTodayInstallationsList] = useState([]);
  const [techniciansList, setTechniciansList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [billingList, setBillingList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);
  
  // Assigned to me states (technician task flows)
  const [myComplaints, setMyComplaints] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [triggerBellRing, setTriggerBellRing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();

  // Header UI states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Modals & Forms States
  const [selectedItem, setSelectedItem] = useState(null); 
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null); 
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState('complaint'); 
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

  // Search & filters for Customer list
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('all');
  const [customerPlanFilter, setCustomerPlanFilter] = useState('all');
  const [customerSortField, setCustomerSortField] = useState('name');
  const [customerSortOrder, setCustomerSortOrder] = useState('asc');
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
  const customerPerPage = 5;
  const [refreshingCustomers, setRefreshingCustomers] = useState(false);
  
  // Drawer states
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);
  const [selectedCustomerForDrawer, setSelectedCustomerForDrawer] = useState(null);
  const [drawerDetails, setDrawerDetails] = useState({ complaints: [], tasks: [], bills: [] });
  const [loadingDrawerDetails, setLoadingDrawerDetails] = useState(false);

  // Edit Customer Modal states
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({ id: '', name: '', email: '', phone: '', cnic: '', address: '' });

  // Package Page Operations states
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [showEditPackageModal, setShowEditPackageModal] = useState(false);
  const [newPackageForm, setNewPackageForm] = useState({ name: '', speed_mbps: '', monthly_price: '', data_limit_gb: '', description: '', status: 'active' });
  const [editPackageForm, setEditPackageForm] = useState({ id: '', name: '', speed_mbps: '', monthly_price: '', data_limit_gb: '', description: '', status: 'active' });
  const [packageSearch, setPackageSearch] = useState('');
  const [packageStatusFilter, setPackageStatusFilter] = useState('all');
  const [packageSpeedFilter, setPackageSpeedFilter] = useState('all');
  const [packageSortFilter, setPackageSortFilter] = useState('newest');
  const [refreshingPackages, setRefreshingPackages] = useState(false);

  // Billing & Payments search/filter/drawer states
  const [billingSearch, setBillingSearch] = useState('');
  const [billingStatusFilter, setBillingStatusFilter] = useState('all');
  const [billingPeriodFilter, setBillingPeriodFilter] = useState('all');
  const [billingSortFilter, setBillingSortFilter] = useState('newest');
  const [selectedBillingItem, setSelectedBillingItem] = useState(null);

  // Installations Tab specific search/filter/calendar/wizard states
  const [installSearch, setInstallSearch] = useState('');
  const [installStatusFilter, setInstallStatusFilter] = useState('all');
  const [installTypeFilter, setInstallTypeFilter] = useState('all');
  const [installTechFilter, setInstallTechFilter] = useState('all');
  const [installDateFilter, setInstallDateFilter] = useState('');
  const [selectedInstallTask, setSelectedInstallTask] = useState(null);
  const [calendarView, setCalendarView] = useState('week');
  const [calendarAnchorDate, setCalendarAnchorDate] = useState(new Date());
  const [showCreateInstallWizard, setShowCreateInstallWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({ customerId: '', requestType: 'Installation', description: '', priority: 'medium', dueDate: '', technicianId: '' });

  // Complaints Tab specific filter/search/pagination states
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [complaintsStatusFilter, setComplaintsStatusFilter] = useState('all'); 
  const [complaintsPriorityFilter, setComplaintsPriorityFilter] = useState('all'); 
  const [complaintsCurrentPage, setComplaintsCurrentPage] = useState(1);
  const complaintsPerPage = 8;
  const [complaintsSortFilter, setComplaintsSortFilter] = useState('newest');
  const [refreshingComplaints, setRefreshingComplaints] = useState(false);

  // Service Requests Tab specific search/filter/pagination states
  const [tasksSearch, setTasksSearch] = useState('');
  const [tasksStatusFilter, setTasksStatusFilter] = useState('all'); 
  const [tasksTypeFilter, setTasksTypeFilter] = useState('all'); 
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const tasksPerPage = 8;
  const [tasksDateFilter, setTasksDateFilter] = useState('all');
  const [tasksSortFilter, setTasksSortFilter] = useState('newest');
  const [refreshingTasks, setRefreshingTasks] = useState(false);

  // Technician Tab specific search/filter states
  const [techSearch, setTechSearch] = useState('');
  const [techAvailabilityFilter, setTechAvailabilityFilter] = useState('all');
  const [techWorkloadFilter, setTechWorkloadFilter] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  // Quick Action Modal States
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'customer' | 'jobType' | 'priority' | null
  const [showCreateComplaintModal, setShowCreateComplaintModal] = useState(false);
  const [showAssignTechModal, setShowAssignTechModal] = useState(false);

  // Form Fields
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '', address: '', planId: '' });
  const [newRequestForm, setNewRequestForm] = useState({ customerId: '', requestType: 'Installation', description: '', priority: 'medium', dueDate: '' });
  const [newComplaintForm, setNewComplaintForm] = useState({ customerId: '', subject: '', description: '', priority: 'medium' });
  const [assignForm, setAssignForm] = useState({ type: 'task', ticketId: '', technicianId: '' });

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

  const loadPortalData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const reqOpts = { credentials: 'include' };
      
      // Load Profile
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

      // Load DB Operations & Stats
      const statsRes = await fetch('http://localhost:5000/api/employee/dashboard-stats', reqOpts);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {
          totalCustomers: 0,
          activeServices: 0,
          pendingRequests: 0,
          openComplaints: 0,
          todayInstallations: 0,
          pendingPayments: 0
        });
        setRecentRequests(statsData.recentRequests || []);
        setRecentComplaints(statsData.recentComplaints || []);
        setTodayInstallationsList(statsData.todayInstallationsList || []);
        setTechniciansList(statsData.technicians || []);
        setCustomersList(statsData.customers || []);
        setBillingList(statsData.billing || []);
        setPackagesList(statsData.packages || []);
        
        // Pick default plan selection for Customer Creation form
        if (statsData.packages && statsData.packages.length > 0 && !newCustomerForm.planId) {
          setNewCustomerForm(prev => ({ ...prev, planId: statsData.packages[0].id.toString() }));
        }
      }

      // Load assigned tasks (field role fallback)
      const myComplaintsRes = await fetch('http://localhost:5000/api/employee/complaints', reqOpts);
      if (myComplaintsRes.ok) {
        const myComplaintsData = await myComplaintsRes.json();
        setMyComplaints(myComplaintsData);
      }

      const myTasksRes = await fetch('http://localhost:5000/api/employee/tasks', reqOpts);
      if (myTasksRes.ok) {
        const myTasksData = await myTasksRes.json();
        setMyTasks(myTasksData);
      }

      const myHistoryRes = await fetch('http://localhost:5000/api/employee/work-history', reqOpts);
      if (myHistoryRes.ok) {
        const myHistoryData = await myHistoryRes.json();
        setMyHistory(myHistoryData);
      }

      // Load notifications list
      const notificationsRes = await fetch('http://localhost:5000/api/employee/notifications', reqOpts);
      if (notificationsRes.ok) {
        const fetchedNotifs = await notificationsRes.json();
        setNotifications(fetchedNotifs || []);
        const unreadVal = fetchedNotifs.filter(n => !n.is_read).length;
        if (unreadVal > unreadCount) {
          setTriggerBellRing(true);
          setTimeout(() => setTriggerBellRing(false), 1000);
        }
        setUnreadCount(unreadVal);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
    // Auto-bell animation trigger on initial mount
    setTimeout(() => {
      setTriggerBellRing(true);
      setTimeout(() => setTriggerBellRing(false), 900);
    }, 1200);
  }, []);

  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    if (newStatus === 'resolved') {
      setReportType('complaint');
      const targetItem = recentComplaints.find(c => c.id === complaintId) || myComplaints.find(c => c.id === complaintId);
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
      loadPortalData(true);
      setSelectedItem(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (newStatus === 'completed') {
      setReportType('task');
      const targetItem = recentRequests.find(t => t.id === taskId) || myTasks.find(t => t.id === taskId);
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
      loadPortalData(true);
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
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkNotificationAsRead = async (notif) => {
    if (notif.is_read) return;
    try {
      const response = await fetch('http://localhost:5000/api/employee/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
        credentials: 'include'
      });
      if (response.ok) {
        loadPortalData(true);
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
      loadPortalData(true);
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
      loadPortalData(true);
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

  // Quick Action Forms Submissions targeting real backend DB endpoints
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.email || !newCustomerForm.phone) {
      alert('Please fill out Name, Email, and Phone number.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/employee/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newCustomerForm.name,
          email: newCustomerForm.email,
          phone: newCustomerForm.phone,
          address: newCustomerForm.address,
          package_id: newCustomerForm.planId ? parseInt(newCustomerForm.planId, 10) : null
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create customer record.');
      }

      showToast(`Provisioned Customer: ${newCustomerForm.name}`);
      setShowAddCustomerModal(false);
      setNewCustomerForm({ name: '', email: '', phone: '', address: '', planId: packagesList[0]?.id.toString() || '' });
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleNewRequestSubmit = async (e) => {
    e.preventDefault();
    if (!newRequestForm.customerId || !newRequestForm.dueDate) {
      alert('Please select Customer, Target Date, and Task Fields.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/employee/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: newRequestForm.requestType,
          customer_id: parseInt(newRequestForm.customerId, 10),
          assigned_employee_id: techniciansList[0]?.id || null, // assign to first available technician by default
          description: newRequestForm.description,
          priority: newRequestForm.priority,
          due_date: newRequestForm.dueDate
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create task request.');
      }

      showToast(`Request registered successfully.`);
      setShowNewRequestModal(false);
      setNewRequestForm({ customerId: '', requestType: 'Installation', description: '', priority: 'medium', dueDate: '' });
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!newComplaintForm.customerId || !newComplaintForm.subject || !newComplaintForm.description) {
      alert('Please select Customer, Subject, and Description.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/employee/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(newComplaintForm.customerId, 10),
          subject: newComplaintForm.subject,
          description: newComplaintForm.description,
          priority: newComplaintForm.priority
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to file complaint.');
      }

      showToast(`Complaint registered successfully.`);
      setShowCreateComplaintModal(false);
      setNewComplaintForm({ customerId: '', subject: '', description: '', priority: 'medium' });
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignTechSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.ticketId || !assignForm.technicianId) {
      alert('Please enter Ticket ID and select Technician.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/employee/assign-technician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: assignForm.type,
          ticketId: parseInt(assignForm.ticketId, 10),
          technicianId: parseInt(assignForm.technicianId, 10)
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to assign technician.');
      }

      showToast(`Technician assigned to ${assignForm.type} #${assignForm.ticketId}`);
      setShowAssignTechModal(false);
      setAssignForm({ type: 'task', ticketId: '', technicianId: techniciansList[0]?.id.toString() || '' });
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchDrawerDetails = async (customerId) => {
    setLoadingDrawerDetails(true);
    try {
      const response = await fetch(`http://localhost:5000/api/employee/customers/${customerId}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to retrieve customer details.');
      }
      const data = await response.json();
      setSelectedCustomerForDrawer(data.customer);
      setDrawerDetails({
        bills: data.bills || [],
        payments: data.payments || [],
        complaints: data.complaints || [],
        tasks: data.tasks || []
      });
    } catch (err) {
      console.error(err.message);
      showToast('Error loading customer operations history.');
    } finally {
      setLoadingDrawerDetails(false);
    }
  };

  const handleEditCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!editCustomerForm.name || !editCustomerForm.phone || !editCustomerForm.email) {
      alert('Please fill out Name, Phone, and Email.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/employee/customers/${editCustomerForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editCustomerForm.name,
          phone: editCustomerForm.phone,
          email: editCustomerForm.email,
          cnic: editCustomerForm.cnic,
          address: editCustomerForm.address
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update customer.');
      }

      showToast(`Updated customer: ${editCustomerForm.name}`);
      setShowEditCustomerModal(false);
      if (showCustomerDrawer && selectedCustomerForDrawer?.id === editCustomerForm.id) {
        fetchDrawerDetails(editCustomerForm.id);
      }
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleCustomerStatus = async (customerId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change customer status to '${newStatus.toUpperCase()}'?`)) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/employee/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to toggle status.');
      }

      showToast(`Customer status updated to ${newStatus.toUpperCase()}`);
      if (showCustomerDrawer && selectedCustomerForDrawer?.id === customerId) {
        fetchDrawerDetails(customerId);
      }
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreatePackageSubmit = async (e) => {
    e.preventDefault();
    if (!newPackageForm.name || !newPackageForm.speed_mbps || !newPackageForm.monthly_price) {
      alert('Please fill out Name, Speed, and Monthly Price.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/employee/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPackageForm.name,
          speed_mbps: parseInt(newPackageForm.speed_mbps, 10),
          monthly_price: parseFloat(newPackageForm.monthly_price),
          data_limit_gb: newPackageForm.data_limit_gb ? parseInt(newPackageForm.data_limit_gb, 10) : null,
          description: newPackageForm.description,
          status: newPackageForm.status
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create package.');
      }

      showToast('Package created successfully');
      setShowAddPackageModal(false);
      setNewPackageForm({ name: '', speed_mbps: '', monthly_price: '', data_limit_gb: '', description: '', status: 'active' });
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditPackageSubmit = async (e) => {
    e.preventDefault();
    if (!editPackageForm.name || !editPackageForm.speed_mbps || !editPackageForm.monthly_price) {
      alert('Please fill out Name, Speed, and Monthly Price.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/employee/packages/${editPackageForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editPackageForm.name,
          speed_mbps: parseInt(editPackageForm.speed_mbps, 10),
          monthly_price: parseFloat(editPackageForm.monthly_price),
          data_limit_gb: editPackageForm.data_limit_gb ? parseInt(editPackageForm.data_limit_gb, 10) : null,
          description: editPackageForm.description,
          status: editPackageForm.status
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update package.');
      }

      showToast('Package updated successfully');
      setShowEditPackageModal(false);
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTogglePackageStatus = async (packageId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'ACTIVATE' : 'DEACTIVATE'} this package?`)) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/employee/packages/${packageId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update package status.');
      }

      showToast(newStatus === 'active' ? 'Package activated' : 'Package deactivated');
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm("Delete this package? Customers currently subscribed to this package may be affected.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/employee/packages/${packageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete package.');
      }

      showToast('Package deleted successfully');
      loadPortalData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  // Staggered transitions calculations for lists
  const sortedAndFilteredCustomers = [...customersList].filter(c => {
    const q = customerSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      (c.name && c.name.toLowerCase().includes(q)) || 
      (c.phone && c.phone.includes(q)) || 
      (c.customer_code && c.customer_code.toLowerCase().includes(q)) || 
      (c.email && c.email.toLowerCase().includes(q));
      
    const matchesStatus = customerStatusFilter === 'all' || c.status === customerStatusFilter;
    const matchesPlan = customerPlanFilter === 'all' || c.package_name === customerPlanFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  }).sort((a, b) => {
    let fieldA = '';
    let fieldB = '';
    
    if (customerSortField === 'name') {
      fieldA = a.name || '';
      fieldB = b.name || '';
    } else if (customerSortField === 'created_at') {
      fieldA = a.created_at || '';
      fieldB = b.created_at || '';
    } else if (customerSortField === 'status') {
      fieldA = a.status || '';
      fieldB = b.status || '';
    } else if (customerSortField === 'package_name') {
      fieldA = a.package_name || '';
      fieldB = b.package_name || '';
    }
    
    if (fieldA < fieldB) return customerSortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return customerSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredCustomers = sortedAndFilteredCustomers;

  const filteredTasks = [...recentRequests].filter(t => {
    const q = tasksSearch.toLowerCase().trim();
    const matchQ = !q || 
      t.id.toString().includes(q) || 
      (t.customer_name && t.customer_name.toLowerCase().includes(q)) || 
      (t.customer_phone && t.customer_phone.includes(q)) ||
      (t.customer_email && t.customer_email.toLowerCase().includes(q));
      
    const matchStatus = tasksStatusFilter === 'all' || t.status === tasksStatusFilter;
    const matchType = tasksTypeFilter === 'all' || t.task_type === tasksTypeFilter;
    
    let matchDate = true;
    if (tasksDateFilter !== 'all') {
      const taskDate = new Date(t.created_at);
      const today = new Date();
      const diffTime = Math.abs(today - taskDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (tasksDateFilter === 'today') {
        matchDate = taskDate.toDateString() === today.toDateString();
      } else if (tasksDateFilter === 'week') {
        matchDate = diffDays <= 7;
      } else if (tasksDateFilter === 'month') {
        matchDate = diffDays <= 30;
      }
    }
    
    return matchQ && matchStatus && matchType && matchDate;
  }).sort((a, b) => {
    if (tasksSortFilter === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (tasksSortFilter === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (tasksSortFilter === 'priority') {
      const pLevel = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityA = pLevel[a.priority?.toLowerCase()] || 0;
      const priorityB = pLevel[b.priority?.toLowerCase()] || 0;
      return priorityB - priorityA;
    } else if (tasksSortFilter === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    return 0;
  });

  const filteredComplaints = [...recentComplaints].filter(c => {
    const q = complaintsSearch.toLowerCase().trim();
    const matchQ = !q || c.id.toString().includes(q) || c.customer_name?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q);
    const matchStatus = complaintsStatusFilter === 'all' || c.status === complaintsStatusFilter;
    const matchPriority = complaintsPriorityFilter === 'all' || c.priority === complaintsPriorityFilter;
    return matchQ && matchStatus && matchPriority;
  }).sort((a, b) => {
    if (complaintsSortFilter === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (complaintsSortFilter === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (complaintsSortFilter === 'priority') {
      const pLevel = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityA = pLevel[a.priority?.toLowerCase()] || 0;
      const priorityB = pLevel[b.priority?.toLowerCase()] || 0;
      return priorityB - priorityA;
    } else if (complaintsSortFilter === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    return 0;
  });

  const sortedAndFilteredPackages = [...packagesList].filter(p => {
    const q = packageSearch.toLowerCase().trim();
    const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.speed_mbps?.toString().includes(q);
    const matchesStatus = packageStatusFilter === 'all' || p.status === packageStatusFilter;
    
    let matchesSpeed = true;
    if (packageSpeedFilter === 'low') {
      matchesSpeed = p.speed_mbps < 15;
    } else if (packageSpeedFilter === 'medium') {
      matchesSpeed = p.speed_mbps >= 15 && p.speed_mbps <= 30;
    } else if (packageSpeedFilter === 'high') {
      matchesSpeed = p.speed_mbps > 30;
    }
    
    return matchesSearch && matchesStatus && matchesSpeed;
  }).sort((a, b) => {
    if (packageSortFilter === 'newest') {
      return b.id - a.id;
    } else if (packageSortFilter === 'oldest') {
      return a.id - b.id;
    } else if (packageSortFilter === 'price_low_high') {
      return a.price - b.price;
    } else if (packageSortFilter === 'price_high_low') {
      return b.price - a.price;
    } else if (packageSortFilter === 'speed_low_high') {
      return a.speed_mbps - b.speed_mbps;
    }
    return 0;
  });

  const filteredTechnicians = techniciansList.filter(t => {
    const q = techSearch.toLowerCase().trim();
    const matchQ = !q || t.name.toLowerCase().includes(q) || (t.phone && t.phone.includes(q)) || t.id.toString().includes(q);
    
    const isAvail = t.active_jobs === 0;
    let matchAvailability = true;
    if (techAvailabilityFilter === 'available') {
      matchAvailability = isAvail && t.status === 'active';
    } else if (techAvailabilityFilter === 'on_job') {
      matchAvailability = !isAvail && t.status === 'active';
    } else if (techAvailabilityFilter === 'offline') {
      matchAvailability = t.status === 'inactive';
    }
    
    let matchWorkload = true;
    if (techWorkloadFilter === 'none') {
      matchWorkload = t.active_jobs === 0;
    } else if (techWorkloadFilter === 'medium') {
      matchWorkload = t.active_jobs >= 1 && t.active_jobs <= 3;
    } else if (techWorkloadFilter === 'high') {
      matchWorkload = t.active_jobs >= 4;
    }
    
    return matchQ && matchAvailability && matchWorkload;
  });

  const sortedAndFilteredBilling = [...billingList].filter(bill => {
    const q = billingSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      `inv-${bill.invoice_id}`.toLowerCase().includes(q) || 
      bill.customer?.toLowerCase().includes(q) || 
      bill.customer_code?.toLowerCase().includes(q);

    const matchesStatus = billingStatusFilter === 'all' || 
      bill.status?.toLowerCase() === billingStatusFilter.toLowerCase();

    let matchesPeriod = true;
    if (billingPeriodFilter !== 'all') {
      const billDate = new Date(bill.due_date);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      if (billingPeriodFilter === 'today') {
        matchesPeriod = billDate >= today;
      } else if (billingPeriodFilter === 'week') {
        matchesPeriod = billDate >= oneWeekAgo;
      } else if (billingPeriodFilter === 'month') {
        matchesPeriod = billDate >= startOfMonth;
      } else if (billingPeriodFilter === 'last_month') {
        matchesPeriod = billDate >= startOfLastMonth && billDate <= endOfLastMonth;
      }
    }

    return matchesSearch && matchesStatus && matchesPeriod;
  }).sort((a, b) => {
    if (billingSortFilter === 'newest') {
      return b.invoice_id - a.invoice_id;
    } else if (billingSortFilter === 'oldest') {
      return a.invoice_id - b.invoice_id;
    } else if (billingSortFilter === 'highest_amount') {
      return b.amount - a.amount;
    } else if (billingSortFilter === 'lowest_amount') {
      return a.amount - b.amount;
    }
    return 0;
  });

  return (
    <div className="flex bg-[#030712] min-h-screen text-[#f3f4f6] font-sans w-full selection:bg-cyan-500 selection:text-[#030712] overflow-x-hidden relative">
      
      {/* Inject custom micro-animations style sheet directly to preserve component isolation */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f2937;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #374151;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-bell-wiggle {
          animation: wiggle 0.8s ease-in-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0); }
          15% { transform: rotate(-12deg); }
          30% { transform: rotate(12deg); }
          45% { transform: rotate(-6deg); }
          60% { transform: rotate(6deg); }
          75% { transform: rotate(-3deg); }
          90% { transform: rotate(3deg); }
        }

        .stagger-1 { animation-delay: 40ms; }
        .stagger-2 { animation-delay: 80ms; }
        .stagger-3 { animation-delay: 120ms; }
        .stagger-4 { animation-delay: 160ms; }
        .stagger-5 { animation-delay: 200ms; }
        .stagger-6 { animation-delay: 240ms; }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up, .animate-bell-wiggle, .hover\\:-translate-y-0\\.5, .hover\\:-translate-y-1 {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}} />

      {/* 1. Sidebar Navigation */}
      <aside className="w-[280px] border-r border-[#111827] bg-[#070b15]/90 backdrop-blur-md hidden lg:flex flex-col h-screen sticky top-0 z-40 shrink-0">
        <div className="p-6 border-b border-[#111827] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
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

        <nav className="flex-grow px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
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
              onClick={() => { setActiveTab(item.id); setShowProfileDropdown(false); setShowNotifDropdown(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-cyan-950/40 to-blue-950/20 border border-cyan-500/30 text-cyan-400 font-semibold shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
              }`}
            >
              {activeTab === item.id && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
              )}
              <span className="text-base transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
              <span className="truncate">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#111827]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all border border-transparent"
          >
            <span className="text-base">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header Navigation */}
        <header className="border-b border-[#111827] bg-[#030712]/80 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('Dashboard')}
              className="lg:hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg"
            >
              <span className="text-white text-xs">⚡</span>
            </button>
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white animate-fade-in-up">Operations Dashboard</h1>
              <p className="text-[10px] text-slate-400 font-light hidden sm:block animate-fade-in-up stagger-1">Monitor customers, services, requests and daily operations.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowProfileDropdown(false); }}
                className={`relative p-2 rounded-xl hover:bg-slate-900 text-slate-405 hover:text-cyan-400 transition-colors flex items-center ${triggerBellRing ? 'animate-bell-wiggle' : ''}`}
                title="Notifications"
              >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-white text-[8px] font-extrabold flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Smoothly animated Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-3 z-55 animate-fade-in-up text-xs ring-1 ring-cyan-500/10">
                  <div className="px-4 pb-2.5 border-b border-slate-800 flex justify-between items-center">
                    <span className="font-extrabold text-white">Operations Updates</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkNotificationsAsRead} className="text-cyan-400 hover:underline font-medium text-[10px]">
                        Mark read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar px-2 py-1.5 space-y-1">
                    {notifications.length > 0 ? (
                      notifications.map((notif, index) => (
                        <div
                          key={index}
                          onClick={() => handleMarkNotificationAsRead(notif)}
                          className={`p-2.5 rounded-xl transition-colors cursor-pointer flex items-start space-x-2 ${notif.is_read ? 'hover:bg-slate-850/40 opacity-60' : 'bg-slate-950/20 hover:bg-slate-850/60'}`}
                        >
                          <span className="text-sm shrink-0">🔔</span>
                          <div className="flex-grow space-y-0.5 min-w-0">
                            <p className="font-bold text-white truncate">{notif.title}</p>
                            <p className="text-slate-400 text-[10px] leading-snug line-clamp-2">{notif.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-500 italic">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown widget */}
            <div className="relative">
              <button
                onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifDropdown(false); }}
                className="flex items-center space-x-2.5 focus:outline-none group p-1.5 rounded-xl hover:bg-slate-900/50 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-none">{profile?.full_name || user?.name || 'Ali Raza'}</p>
                  <p className="text-slate-500 text-[9px] mt-1 tracking-wider uppercase font-bold">EMPLOYEE</p>
                </div>
                <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-xs group-hover:scale-105 transition-transform duration-150 shadow-md">
                  {(profile?.full_name || user?.name || 'AL').slice(0, 2).toUpperCase()}
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs animate-fade-in-up ring-1 ring-cyan-500/10">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white truncate">{profile?.full_name || user?.name || 'Ali Raza'}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">{profile?.employee_code || 'EMP-3042'}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('Profile'); setShowProfileDropdown(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-slate-350 hover:bg-slate-800 hover:text-cyan-400 transition-colors flex items-center space-x-2"
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2.5 text-red-400 hover:bg-red-950/20 hover:text-red-305 transition-colors border-t border-slate-800 flex items-center space-x-2"
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
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">

          {/* ==============================================
              TAB 1: OPERATIONS DASHBOARD
              ============================================== */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fade-in-up">
              
              {/* Compact Premium Welcome Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl bg-gradient-to-r from-slate-900/20 to-slate-950/10 border border-[#111827] gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">Good evening, {profile?.full_name?.split(' ')[0] || user?.name || 'Ali'} 👋</h2>
                  <p className="text-xs text-slate-400">Here's what's happening across your ISP operations today.</p>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                  <span className="text-sm">📅</span>
                  <span className="font-medium">23 August 2026</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold ml-1.5">Today</span>
                </div>
              </div>

              {/* 6 KPI Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 animate-fade-in-up stagger-1">
                {[
                  { title: 'TOTAL CUSTOMERS', key: 'totalCustomers', val: stats.totalCustomers, emptyMsg: 'No customers yet', icon: '👥', color: 'hover:border-cyan-500/20' },
                  { title: 'ACTIVE SERVICES', key: 'activeServices', val: stats.activeServices, emptyMsg: 'No active packages', icon: '📦', color: 'hover:border-cyan-500/20' },
                  { title: 'PENDING REQUESTS', key: 'pendingRequests', val: stats.pendingRequests, emptyMsg: 'No pending requests', icon: '📋', color: 'hover:border-amber-500/20', alert: true },
                  { title: 'OPEN COMPLAINTS', key: 'openComplaints', val: stats.openComplaints, emptyMsg: 'No open complaints', icon: '🎫', color: 'hover:border-red-500/20', alert: true },
                  { title: 'TODAY\'S INSTALLS', key: 'todayInstallations', val: stats.todayInstallations, emptyMsg: 'No installs scheduled', icon: '📅', color: 'hover:border-emerald-500/20' },
                  { title: 'PENDING PAYMENTS', key: 'pendingPayments', val: stats.pendingPayments, emptyMsg: 'No outstanding bills', icon: '💳', color: 'hover:border-amber-500/20' }
                ].map((kpi, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] ${kpi.color} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5 group flex flex-col justify-between h-28`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block">{kpi.title}</span>
                      <span className="text-sm shrink-0">{kpi.icon}</span>
                    </div>
                    
                    <div className="mt-1">
                      {loading ? (
                        <div className="w-16 h-6 bg-slate-800 rounded-lg animate-pulse" />
                      ) : (
                        <div className="space-y-0.5">
                          <span className={`text-xl font-extrabold text-white block leading-none transition-all duration-300 ${kpi.val > 0 && kpi.alert ? 'text-amber-400' : ''}`}>
                            <AnimatedNumber value={kpi.val} />
                          </span>
                          <span className="text-[8px] text-slate-500 block truncate mt-1">
                            {kpi.val === 0 ? kpi.emptyMsg : 'Live database counts'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* TWO COLUMN CONTENT LAYOUT */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* LEFT: Recent Service Requests Table (col-span-2) */}
                <div className="xl:col-span-2 p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4 animate-fade-in-up stagger-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white text-sm">Recent Service Requests</h3>
                      <p className="text-[10px] text-slate-500 font-light">Direct operational tasks pipeline.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('ServiceRequests')}
                      className="text-cyan-400 text-xs font-semibold hover:underline flex items-center space-x-1"
                    >
                      <span>View All Requests</span>
                      <span>→</span>
                    </button>
                  </div>

                  {loading ? (
                    // Skeleton loader for table rows
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse" />
                      ))}
                    </div>
                  ) : recentRequests.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-[#111827] bg-[#030712]/50 custom-scrollbar">
                      <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                        <thead>
                          <tr className="border-b border-[#111827] bg-slate-900/30 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
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
                          {recentRequests.slice(0, 5).map((req, idx) => (
                            <tr key={idx} className="border-b border-[#111827]/40 hover:bg-[#131b2e]/30 text-slate-300 transition-colors animate-fade-in-up">
                              <td className="py-3 px-4 font-mono font-bold text-white">TSK-{req.id}</td>
                              <td className="py-3 px-4 font-medium text-slate-200">{req.customer_name}</td>
                              <td className="py-3 px-4">{req.task_type}</td>
                              <td className="py-3 px-4 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  req.status === 'completed' ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400' :
                                  req.status === 'in_progress' ? 'bg-blue-950/60 border border-blue-800 text-blue-400' : 'bg-amber-950/60 border border-amber-800 text-amber-400'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={req.technician_name ? 'text-slate-300' : 'text-amber-500 font-medium'}>
                                  {req.technician_name || 'Unassigned'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => { setSelectedItem(req); }}
                                  className="px-2.5 py-1 rounded bg-[#090d16] hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    // Beautiful Empty State
                    <div className="py-14 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3 animate-fade-in-up stagger-1">
                      <span className="text-2xl opacity-60">📋</span>
                      <div>
                        <h4 className="font-extrabold text-white text-xs">No service requests yet</h4>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Active broadband setup and configuration requests will appear here once generated.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: QUICK ACTIONS */}
                <div className="space-y-6 animate-fade-in-up stagger-3">
                  
                  {/* Quick Actions Panel */}
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Add Customer', icon: '👤', onClick: () => {
                          setNewCustomerForm({ name: '', email: '', phone: '', address: '', planId: packagesList[0]?.id.toString() || '' });
                          setShowAddCustomerModal(true);
                        } },
                        { label: 'New Request', icon: '📋', onClick: () => {
                          if (customersList.length === 0) {
                            alert('Please register a customer first.');
                            return;
                          }
                          setNewRequestForm({ customerId: customersList[0].id.toString(), requestType: 'Installation', description: '', priority: 'medium', dueDate: '' });
                          setShowNewRequestModal(true);
                        } },
                        { label: 'Create Complaint', icon: '🎫', onClick: () => {
                          if (customersList.length === 0) {
                            alert('Please register a customer first.');
                            return;
                          }
                          setNewComplaintForm({ customerId: customersList[0].id.toString(), subject: '', description: '', priority: 'medium' });
                          setShowCreateComplaintModal(true);
                        } },
                        { label: 'Assign Tech', icon: '🔧', onClick: () => {
                          if (techniciansList.length === 0) {
                            alert('No crew technicians available.');
                            return;
                          }
                          setAssignForm({ type: 'task', ticketId: '', technicianId: techniciansList[0].id.toString() });
                          setShowAssignTechModal(true);
                        } }
                      ].map((action, idx) => (
                        <button
                          key={idx}
                          onClick={action.onClick}
                          className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#070b14] border border-slate-800 hover:border-cyan-500/30 text-xs font-semibold text-slate-300 hover:text-white hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 hover:shadow-md hover:shadow-cyan-500/5 group"
                        >
                          <span className="text-xl mb-1.5 group-hover:scale-110 transition-transform duration-200">{action.icon}</span>
                          <span className="text-center">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Technician Availability Registry */}
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">Technicians Availability</h3>
                      <button onClick={() => setActiveTab('Technicians')} className="text-cyan-400 text-[10px] font-semibold hover:underline">
                        Coordinate Crew
                      </button>
                    </div>

                    {loading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-10 bg-slate-900/50 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : techniciansList.length > 0 ? (
                      <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                        {techniciansList.map((tech, idx) => {
                          const statusLabel = tech.active_jobs > 0 ? 'On Job' : 'Available';
                          return (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#070b14]/50 border border-slate-800/40">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-slate-300">
                                  {tech.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-white block leading-none">{tech.name}</span>
                                  <span className="text-[9px] text-slate-500 block mt-1">Jobs Assigned: {tech.active_jobs}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                statusLabel === 'Available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-blue-950 text-blue-400 border border-blue-800/40'
                              }`}>
                                {statusLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-500 italic text-[11px]">No active technicians found.</div>
                    )}
                  </div>

                </div>

              </div>

              {/* SECOND ROW LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-3">
                
                {/* 1. Complaints List Card */}
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Customer Complaints</h3>
                    <button onClick={() => setActiveTab('Complaints')} className="text-cyan-405 text-cyan-400 text-[10px] font-semibold hover:underline">
                      View Support Desk
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-14 bg-slate-900/50 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : recentComplaints.length > 0 ? (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {recentComplaints.slice(0, 4).map((comp, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#070b14]/50 border border-slate-800/40 space-y-2 text-xs hover:border-slate-700/80 transition-colors animate-fade-in-up">
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-white">CMP-{comp.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              comp.priority === 'urgent' || comp.priority === 'high' ? 'bg-red-950 text-red-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {comp.priority}
                            </span>
                          </div>
                          <p className="text-slate-300 font-semibold">{comp.subject}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Tech: {comp.technician_name || 'Unassigned'}</span>
                            <span className={`font-bold uppercase ${comp.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'}`}>{comp.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-2.5">
                      <span className="text-xl opacity-60">🎫</span>
                      <div>
                        <h4 className="font-extrabold text-white text-xs">No open complaints</h4>
                        <p className="text-[9px] text-slate-550 mt-1 max-w-xs mx-auto">Downtime or connectivity complaints will appear here.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Today's Installations Scheduling Timeline */}
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Today's Installations</h3>
                    <button onClick={() => setActiveTab('Installations')} className="text-cyan-400 text-[10px] font-semibold hover:underline">
                      Schedules
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-4 pl-4 border-l border-slate-800">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-900/50 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : todayInstallationsList.length > 0 ? (
                    <div className="relative pl-4 border-l-2 border-slate-800 space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {todayInstallationsList.map((inst, idx) => (
                        <div key={idx} className="relative text-xs animate-fade-in-up">
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#030712] border-2 border-cyan-500" />
                          <span className="text-[10px] font-bold text-cyan-400 block leading-none">Today</span>
                          <span className="font-semibold text-white block mt-1">{inst.customer_name}</span>
                          <div className="flex items-center justify-between text-[10px] text-slate-505 mt-1">
                            <span>Address: {inst.customer_address}</span>
                            <span className="font-bold text-slate-300 uppercase">{inst.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-2.5">
                      <span className="text-xl opacity-60">📅</span>
                      <div>
                        <h4 className="font-extrabold text-white text-xs">No installations scheduled</h4>
                        <p className="text-[9px] text-slate-500 mt-1 max-w-xs mx-auto">Today's fiber connection schedule is clear.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Outstanding Payments Box */}
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Payments Overview</h3>
                    <button onClick={() => setActiveTab('Billing')} className="text-cyan-400 text-[10px] font-semibold hover:underline">
                      Invoices
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-900/50 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : billingList.filter(b => b.status !== 'paid').length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {billingList.filter(b => b.status !== 'paid').slice(0, 4).map((bill, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#070b14]/50 border border-slate-800/40 text-xs flex justify-between items-center animate-fade-in-up">
                          <div>
                            <span className="font-bold text-white block">{bill.customer}</span>
                            <span className="text-[9px] text-slate-500 block">Due: {new Date(bill.due_date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-white block">PKR {bill.amount.toLocaleString()}</span>
                            <span className="text-[8px] text-amber-500 uppercase font-bold">{bill.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-2.5">
                      <span className="text-xl opacity-60">💳</span>
                      <div>
                        <h4 className="font-extrabold text-white text-xs">No outstanding payments</h4>
                        <p className="text-[9px] text-slate-500 mt-1 max-w-xs mx-auto">All client payments are currently up to date.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
          {/* ==============================================
              TAB 2: CUSTOMERS DIRECTORY
              ============================================== */}
          {activeTab === 'Customers' && (() => {
            // Compute pagination variables locally
            const totalCustomersCount = filteredCustomers.length;
            const totalPages = Math.ceil(totalCustomersCount / customerPerPage) || 1;
            const indexOfLastCustomer = customerCurrentPage * customerPerPage;
            const indexOfFirstCustomer = indexOfLastCustomer - customerPerPage;
            const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

            // Compute statistics from live loaded database data
            const statsTotal = customersList.length;
            const statsActive = customersList.filter(c => c.status === 'active').length;
            const statsSuspended = customersList.filter(c => c.status === 'suspended').length;
            const statsInactive = customersList.filter(c => c.status === 'inactive').length;

            return (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Page Header */}
                <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#111827]">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Customer Management</h2>
                    <p className="text-xs text-slate-400">View, manage and monitor all ISP subscribers from one place.</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewCustomerForm({ name: '', email: '', phone: '', address: '', planId: packagesList[0]?.id.toString() || '' });
                      setShowAddCustomerModal(true);
                    }}
                    className="px-4.5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center space-x-2"
                  >
                    <span>👥</span>
                    <span>+ Add New Customer</span>
                  </button>
                </div>

                {/* 2. Customer Statistics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'TOTAL CUSTOMERS', val: statsTotal, color: 'border-[#111827]', icon: '👥' },
                    { label: 'ACTIVE SUBSCRIBERS', val: statsActive, color: 'border-emerald-500/10 text-emerald-405', icon: '🟢' },
                    { label: 'SUSPENDED LINKS', val: statsSuspended, color: 'border-amber-500/10 text-amber-405', icon: '🟡' },
                    { label: 'INACTIVE ACCOUNTS', val: statsInactive, color: 'border-red-500/10 text-red-405', icon: '🔴' }
                  ].map((s, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl bg-[#090d16]/30 border ${s.color} hover:shadow-md hover:shadow-cyan-500/2 transition-all duration-200 flex flex-col justify-between`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">{s.label}</span>
                        <span className="text-xs">{s.icon}</span>
                      </div>
                      <div className="mt-3">
                        {loading ? (
                          <div className="w-10 h-5 bg-slate-900 rounded animate-pulse" />
                        ) : (
                          <div className="text-lg font-black text-white">
                            <AnimatedNumber value={s.val} />
                          </div>
                        )}
                        <span className="text-[8px] text-slate-550 block mt-1">Live database total</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Search + Filters Toolbar */}
                <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3 items-center flex-grow">
                    
                    {/* Search Field */}
                    <div className="min-w-[280px] flex-grow md:flex-grow-0 relative">
                      <input
                        type="text"
                        placeholder="Search by name, customer ID, phone or email..."
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setCustomerCurrentPage(1); }}
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
                      />
                      <span className="absolute left-3 top-2 text-xs opacity-50">🔍</span>
                    </div>

                    {/* Status Filter */}
                    <div className="w-36">
                      <select
                        value={customerStatusFilter}
                        onChange={(e) => { setCustomerStatusFilter(e.target.value); setCustomerCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-855 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Service Plan Filter */}
                    <div className="w-44">
                      <select
                        value={customerPlanFilter}
                        onChange={(e) => { setCustomerPlanFilter(e.target.value); setCustomerCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-855 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40"
                      >
                        <option value="all">All Service Plans</option>
                        {packagesList.map((p, idx) => (
                          <option key={idx} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setCustomerSearch('');
                        setCustomerStatusFilter('all');
                        setCustomerPlanFilter('all');
                        setCustomerCurrentPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Clear Filters
                    </button>
                    
                    <button
                      onClick={() => {
                        setRefreshingCustomers(true);
                        loadPortalData(true).then(() => {
                          setTimeout(() => setRefreshingCustomers(false), 500);
                        });
                      }}
                      className="p-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs hover:text-white transition-all flex items-center justify-center"
                      title="Refresh Directory"
                    >
                      <span className={`text-sm shrink-0 inline-block transition-transform duration-500 ${refreshingCustomers ? 'rotate-180 scale-90' : ''}`}>
                        🔄
                      </span>
                    </button>
                  </div>
                </div>

                {/* 4. Table / Skeleton Loaders / Empty State */}
                {loading ? (
                  // Pulse skeleton table cells
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4">
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="flex justify-between items-center h-12 bg-slate-900/40 rounded-xl px-4 animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-8.5 h-8.5 rounded-full bg-slate-855" />
                          <div className="space-y-1.5">
                            <div className="w-24 h-3 bg-slate-855 rounded" />
                            <div className="w-16 h-2 bg-slate-855 rounded" />
                          </div>
                        </div>
                        <div className="w-32 h-3 bg-slate-855 rounded" />
                        <div className="w-20 h-3 bg-slate-855 rounded" />
                        <div className="w-14 h-4 bg-slate-850 rounded-full" />
                        <div className="w-16 h-4 bg-slate-855 rounded" />
                      </div>
                    ))}
                  </div>
                ) : currentCustomers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] overflow-x-auto shadow-xl custom-scrollbar">
                      <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                        <thead>
                          <tr className="border-b border-[#111827] text-slate-400 font-bold uppercase tracking-wider text-[9px] select-none">
                            <th className="pb-3.5 px-3">
                              <button
                                onClick={() => {
                                  setCustomerSortOrder(customerSortField === 'name' && customerSortOrder === 'asc' ? 'desc' : 'asc');
                                  setCustomerSortField('name');
                                }}
                                className="flex items-center space-x-1.5 hover:text-white"
                              >
                                <span>Customer Profile</span>
                                <span className="text-[10px]">{customerSortField === 'name' ? (customerSortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                              </button>
                            </th>
                            <th className="pb-3.5 px-3">Contact Details</th>
                            <th className="pb-3.5 px-3">
                              <button
                                onClick={() => {
                                  setCustomerSortOrder(customerSortField === 'package_name' && customerSortOrder === 'asc' ? 'desc' : 'asc');
                                  setCustomerSortField('package_name');
                                }}
                                className="flex items-center space-x-1.5 hover:text-white"
                              >
                                <span>Service Plan</span>
                                <span className="text-[10px]">{customerSortField === 'package_name' ? (customerSortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                              </button>
                            </th>
                            <th className="pb-3.5 px-3">
                              <button
                                onClick={() => {
                                  setCustomerSortOrder(customerSortField === 'status' && customerSortOrder === 'asc' ? 'desc' : 'asc');
                                  setCustomerSortField('status');
                                }}
                                className="flex items-center space-x-1.5 hover:text-white"
                              >
                                <span>Link Status</span>
                                <span className="text-[10px]">{customerSortField === 'status' ? (customerSortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                              </button>
                            </th>
                            <th className="pb-3.5 px-3">
                              <button
                                onClick={() => {
                                  setCustomerSortOrder(customerSortField === 'created_at' && customerSortOrder === 'asc' ? 'desc' : 'asc');
                                  setCustomerSortField('created_at');
                                }}
                                className="flex items-center space-x-1.5 hover:text-white"
                              >
                                <span>Registration</span>
                                <span className="text-[10px]">{customerSortField === 'created_at' ? (customerSortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
                              </button>
                            </th>
                            <th className="pb-3.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentCustomers.map((cust, idx) => (
                            <tr
                              key={idx}
                              style={{ animationDelay: `${idx * 50}ms` }}
                              className="border-b border-[#111827]/40 hover:bg-[#131b2e]/20 text-slate-350 hover:text-white transition-all duration-200 animate-fade-in-up group"
                            >
                              
                              {/* Avatar & Profile */}
                              <td className="py-3.5 px-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-cyan-900/20 to-blue-900/20 border border-slate-800 text-cyan-405 text-cyan-400 font-extrabold flex items-center justify-center text-xs group-hover:scale-105 transition-transform duration-200">
                                    {cust.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-white block group-hover:text-cyan-300 transition-colors leading-tight">{cust.name}</span>
                                    <span className="text-[10px] font-mono text-slate-505 mt-1 block">{cust.customer_code}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Contact */}
                              <td className="py-3.5 px-3">
                                <span className="block leading-snug">{cust.email}</span>
                                <span className="text-[10px] text-slate-505 mt-0.5 block">{cust.phone}</span>
                              </td>

                              {/* Package Info */}
                              <td className="py-3.5 px-3">
                                {cust.package_name ? (
                                  <div>
                                    <span className="font-semibold text-white block">{cust.package_name}</span>
                                    <span className="text-[10px] text-cyan-405 text-cyan-400 mt-0.5 block">{cust.speed_mbps} Mbps Link</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 italic text-[10px]">No Active Plan</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                  cust.status === 'active' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-450' :
                                  cust.status === 'suspended' ? 'bg-amber-955/20 border-amber-800/40 text-amber-450' :
                                  'bg-red-955/20 border-red-900/40 text-red-405'
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
                                  {cust.status}
                                </span>
                              </td>

                              {/* Date */}
                              <td className="py-3.5 px-3 text-slate-500 font-medium">
                                {new Date(cust.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-3 text-right space-x-1">
                                <button
                                  onClick={() => handleOpenDrawer(cust)}
                                  className="px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 text-[10px] text-slate-300 font-bold hover:text-white transition-colors"
                                  title="View operations ledger"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    setEditCustomerForm({
                                      id: cust.id,
                                      name: cust.name,
                                      email: cust.email,
                                      phone: cust.phone,
                                      cnic: cust.cnic || '',
                                      address: cust.address || ''
                                    });
                                    setShowEditCustomerModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 text-[10px] text-slate-300 font-bold hover:text-white transition-colors"
                                  title="Edit profile information"
                                >
                                  Edit
                                </button>
                                
                                {/* Status quick toggle buttons */}
                                {cust.status === 'active' ? (
                                  <button
                                    onClick={() => handleToggleCustomerStatus(cust.id, 'suspended')}
                                    className="px-2.5 py-1 rounded bg-amber-600/10 border border-amber-800/40 hover:bg-amber-600/20 text-[10px] text-amber-400 font-bold transition-colors"
                                    title="Suspend Service Link"
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleCustomerStatus(cust.id, 'active')}
                                    className="px-2.5 py-1 rounded bg-emerald-600/10 border border-emerald-800/40 hover:bg-emerald-600/20 text-[10px] text-emerald-400 font-bold transition-colors"
                                    title="Activate Link"
                                  >
                                    Activate
                                  </button>
                                )}
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination control bar */}
                    <div className="flex justify-between items-center p-4 rounded-xl bg-[#090d16]/30 border border-[#111827] text-xs">
                      <span className="text-slate-500 font-medium">
                        Showing <strong className="text-white">{indexOfFirstCustomer + 1}</strong> to{' '}
                        <strong className="text-white">{Math.min(indexOfLastCustomer, totalCustomersCount)}</strong> of{' '}
                        <strong className="text-white">{totalCustomersCount}</strong> subscribers
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          disabled={customerCurrentPage === 1}
                          onClick={() => setCustomerCurrentPage(prev => prev - 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-955 border border-slate-850 text-slate-450 hover:text-white disabled:opacity-40 transition-opacity font-semibold disabled:pointer-events-none"
                        >
                          Previous
                        </button>
                        
                        <div className="flex space-x-1.5">
                          {[...Array(totalPages)].map((_, pageIdx) => {
                            const pNo = pageIdx + 1;
                            return (
                              <button
                                key={pNo}
                                onClick={() => setCustomerCurrentPage(pNo)}
                                className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                                  customerCurrentPage === pNo
                                    ? 'bg-cyan-600 text-white shadow-md'
                                    : 'bg-slate-955 hover:bg-slate-900 border border-slate-850 text-slate-450'
                                }`}
                              >
                                {pNo}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          disabled={customerCurrentPage === totalPages}
                          onClick={() => setCustomerCurrentPage(prev => prev + 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-955 border border-slate-850 text-slate-450 hover:text-white disabled:opacity-40 transition-opacity font-semibold disabled:pointer-events-none"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  // Elegant Empty State
                  <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950/80 border border-slate-900 flex items-center justify-center shadow-lg relative overflow-hidden group">
                      <svg className="w-8 h-8 text-cyan-405 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a13.916 13.916 0 00-1.5-6.624l-.09-.054m12.44 14.128A13.916 13.916 0 0015 11c0-2.48-.646-4.808-1.782-6.824l-.09-.054M9 11v.5M15 11v.5m-6 4h6" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white text-base">No customers yet</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">Customer accounts will appear here once they are added to the ISP system.</p>
                    </div>
                    <div className="flex space-x-2.5 pt-2">
                      <button
                        onClick={() => {
                          setNewCustomerForm({ name: '', email: '', phone: '', address: '', planId: packagesList[0]?.id.toString() || '' });
                          setShowAddCustomerModal(true);
                        }}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all"
                      >
                        + Add New Customer
                      </button>
                      <button
                        onClick={() => loadPortalData(true)}
                        className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 font-bold text-xs rounded-xl transition-all"
                      >
                        Refresh Directory
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ==============================================
              TAB 3: SERVICE PLANS
              ============================================== */}
          {activeTab === 'ServicePlans' && (() => {
            // Live KPI values computed from packagesList database results
            const totalPackages = packagesList.length;
            const activePackages = packagesList.filter(p => p.status === 'active').length;
            const inactivePackages = packagesList.filter(p => p.status === 'inactive').length;
            const totalSubscribers = packagesList.reduce((acc, curr) => acc + (curr.customer_count || 0), 0);

            return (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Header Area */}
                <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#111827]">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">ISP Broadband Packages</h2>
                    <p className="text-xs text-slate-400">Create, manage and monitor internet packages offered to your customers.</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewPackageForm({ name: '', speed_mbps: '', monthly_price: '', data_limit_gb: '', description: '', status: 'active' });
                      setShowAddPackageModal(true);
                    }}
                    className="px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center space-x-2"
                  >
                    <span>📡</span>
                    <span>+ Add New Package</span>
                  </button>
                </div>

                {/* 2. KPI Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'TOTAL PACKAGES', val: totalPackages, color: 'border-[#111827]', icon: '📦', desc: 'Active & inactive catalog' },
                    { label: 'ACTIVE PLANS', val: activePackages, color: 'border-emerald-500/10 text-emerald-405', icon: '🟢', desc: 'Offered to new signups' },
                    { label: 'INACTIVE PLANS', val: inactivePackages, color: 'border-red-500/10 text-red-405', icon: '🔴', desc: 'Archived catalog items' },
                    { label: 'TOTAL SUBSCRIBERS', val: totalSubscribers, color: 'border-cyan-500/10 text-cyan-405', icon: '⚡', desc: 'Active broadband links' }
                  ].map((k, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl bg-[#090d16]/30 border ${k.color} flex flex-col justify-between hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">{k.label}</span>
                        <span className="text-xs">{k.icon}</span>
                      </div>
                      <div className="mt-3">
                        {loading ? (
                          <div className="w-8 h-5 bg-slate-900 rounded animate-pulse" />
                        ) : (
                          <div className="text-lg font-black text-white">
                            <AnimatedNumber value={k.val} />
                          </div>
                        )}
                        <span className="text-[8px] text-slate-550 block mt-1">{k.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Search + Filter Control Bar */}
                <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3 items-center flex-grow">
                    
                    {/* Search Field */}
                    <div className="min-w-[240px] flex-grow md:flex-grow-0 relative">
                      <input
                        type="text"
                        placeholder="Search by package name or speed..."
                        value={packageSearch}
                        onChange={(e) => setPackageSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500/60 transition-all"
                      />
                      <span className="absolute left-3 top-2.5 text-xs opacity-50">🔍</span>
                    </div>

                    {/* Status Filter */}
                    <div className="w-36">
                      <select
                        value={packageStatusFilter}
                        onChange={(e) => setPackageStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Speed Filter */}
                    <div className="w-36">
                      <select
                        value={packageSpeedFilter}
                        onChange={(e) => setPackageSpeedFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Speeds</option>
                        <option value="low">Low Speed (&lt;15 Mbps)</option>
                        <option value="medium">Medium (15-30 Mbps)</option>
                        <option value="high">High Speed (&gt;30 Mbps)</option>
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div className="w-44">
                      <select
                        value={packageSortFilter}
                        onChange={(e) => setPackageSortFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="price_low_high">Price: Low → High</option>
                        <option value="price_high_low">Price: High → Low</option>
                        <option value="speed_low_high">Speed: Low → High</option>
                      </select>
                    </div>

                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setPackageSearch('');
                        setPackageStatusFilter('all');
                        setPackageSpeedFilter('all');
                        setPackageSortFilter('newest');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Clear Filters
                    </button>
                    
                    <button
                      onClick={() => {
                        setRefreshingPackages(true);
                        loadPortalData(true).then(() => {
                          setTimeout(() => setRefreshingPackages(false), 500);
                        });
                      }}
                      className="p-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs hover:text-white transition-all flex items-center justify-center"
                      title="Refresh Packages"
                    >
                      <span className={`text-sm shrink-0 inline-block transition-transform duration-500 ${refreshingPackages ? 'rotate-180 scale-90' : ''}`}>
                        🔄
                      </span>
                    </button>
                  </div>
                </div>

                {/* 4. Packages Display Grid */}
                {loading ? (
                  // Pulse Skeletons
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-[#090d16]/30 border border-[#111827] space-y-4 animate-pulse">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-xl bg-slate-850" />
                          <div className="w-20 h-4 bg-slate-850 rounded" />
                        </div>
                        <div className="space-y-2">
                          <div className="w-32 h-4 bg-slate-850 rounded" />
                          <div className="w-full h-3 bg-slate-855 rounded" />
                          <div className="w-2/3 h-3 bg-slate-855 rounded" />
                        </div>
                        <div className="h-8 bg-slate-900/60 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : sortedAndFilteredPackages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedAndFilteredPackages.map((plan, idx) => {
                      // Visual accent colors based on speed limits
                      const isHighSpeed = plan.speed_mbps > 30;
                      const isMedSpeed = plan.speed_mbps >= 15 && plan.speed_mbps <= 30;
                      const speedAccent = isHighSpeed ? 'from-cyan-500/10 to-blue-500/10 border-cyan-500/30 text-cyan-405' :
                                          isMedSpeed ? 'from-indigo-500/10 to-purple-500/10 border-indigo-500/30 text-indigo-400' :
                                          'from-slate-500/10 to-slate-800/10 border-slate-700 text-slate-400';

                      return (
                        <div
                          key={plan.id}
                          style={{ animationDelay: `${idx * 50}ms` }}
                          className="p-6 rounded-2xl bg-gradient-to-br from-[#070b14] to-[#0c1322] border border-[#111827] hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/2 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden animate-fade-in-up"
                        >
                          {/* Inner glowing glow */}
                          <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-colors duration-300" />
                          
                          <div>
                            {/* Card Top: Icon & Speed Badge */}
                            <div className="flex justify-between items-center mb-4">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${speedAccent} flex items-center justify-center border font-bold text-xs group-hover:scale-105 transition-transform duration-200`}>
                                📡
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                plan.status === 'active' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-450' : 'bg-red-955/20 border-red-900/40 text-red-405'
                              }`}>
                                {plan.status}
                              </span>
                            </div>

                            {/* Plan Name & Price */}
                            <div className="space-y-1">
                              <h3 className="font-extrabold text-white text-base tracking-tight group-hover:text-cyan-300 transition-colors leading-snug">{plan.name}</h3>
                              <div className="flex items-baseline space-x-1.5 pt-1">
                                <span className="text-lg font-black text-white">Rs. {plan.price.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-500">/ month</span>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-455 mt-3 leading-relaxed min-h-[36px]">
                              {plan.description || 'High-performance shared broadband link with symmetric optical transport.'}
                            </p>

                            {/* Tech Specifications */}
                            <div className="mt-4 pt-4 border-t border-slate-900/60 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs">⚡</span>
                                <span>Speed: <strong>{plan.speed_mbps} Mbps</strong></span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs">💾</span>
                                <span>Limit: <strong>{plan.data_limit_gb ? `${plan.data_limit_gb} GB` : 'Unlimited'}</strong></span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs">🌐</span>
                                <span>IP: <strong>Shared Fiber</strong></span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs">👥</span>
                                <span>Users: <strong>{plan.customer_count ?? 0} active</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between gap-2.5">
                            <button
                              onClick={() => {
                                setEditPackageForm({
                                  id: plan.id,
                                  name: plan.name,
                                  speed_mbps: plan.speed_mbps.toString(),
                                  monthly_price: plan.price.toString(),
                                  data_limit_gb: plan.data_limit_gb ? plan.data_limit_gb.toString() : '',
                                  description: plan.description || '',
                                  status: plan.status
                                });
                                setShowEditPackageModal(true);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-[10px] text-slate-350 font-bold hover:text-white transition-colors"
                            >
                              Edit Plan
                            </button>

                            {plan.status === 'active' ? (
                              <button
                                onClick={() => handleTogglePackageStatus(plan.id, plan.status)}
                                className="flex-1 py-1.5 rounded-lg bg-amber-600/10 border border-amber-800/40 hover:bg-amber-600/20 text-[10px] text-amber-450 font-bold transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTogglePackageStatus(plan.id, plan.status)}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-800/40 hover:bg-emerald-600/20 text-[10px] text-emerald-450 font-bold transition-colors"
                              >
                                Activate
                              </button>
                            )}

                            <button
                              onClick={() => handleDeletePackage(plan.id)}
                              className="px-2 py-1.5 rounded-lg bg-red-650/10 border border-red-900/40 hover:bg-red-650/20 text-[10px] text-red-400 font-bold transition-colors"
                              title="Delete package"
                            >
                              🗑️
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Search empty state vs Catalogue empty state
                  <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950/80 border border-slate-900 flex items-center justify-center shadow-lg relative overflow-hidden group">
                      <svg className="w-8 h-8 text-cyan-405 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    
                    {packagesList.length > 0 ? (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-base">No matching packages</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Try changing your search keywords or active filter parameters.</p>
                        <div className="pt-3">
                          <button
                            onClick={() => {
                              setPackageSearch('');
                              setPackageStatusFilter('all');
                              setPackageSpeedFilter('all');
                            }}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-base">No packages yet</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">You haven't created any internet packages in the catalog.</p>
                        <div className="pt-3">
                          <button
                            onClick={() => {
                              setNewPackageForm({ name: '', speed_mbps: '', monthly_price: '', data_limit_gb: '', description: '', status: 'active' });
                              setShowAddPackageModal(true);
                            }}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl"
                          >
                            Create Your First Package
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })()}

                  {/* ==============================================
              TAB 4: SERVICE REQUESTS (Real Tasks database integration)
              ============================================== */}
          {activeTab === 'ServiceRequests' && (() => {
            // Compute pagination variables locally
            const totalTasksCount = filteredTasks.length;
            const totalTasksPages = Math.ceil(totalTasksCount / tasksPerPage) || 1;
            const indexOfLastTask = tasksCurrentPage * tasksPerPage;
            const indexOfFirstTask = indexOfLastTask - tasksPerPage;
            const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

            // Compute summary statistics directly from the loaded backend data source
            const statsTotal = recentRequests.length;
            const statsPending = recentRequests.filter(t => t.status === 'assigned' || t.status === 'pending').length;
            const statsInProgress = recentRequests.filter(t => t.status === 'in_progress' || t.status === 'on_the_way').length;
            const statsCompleted = recentRequests.filter(t => t.status === 'completed').length;

            return (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Page Header */}
                <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#111827]">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Service Requests</h2>
                    <p className="text-xs text-slate-400">Manage customer service requests, track progress, and coordinate ISP operations.</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewRequestForm({ customerId: '', type: 'Installation', description: '', priority: 'medium', dueDate: '' });
                      setShowNewRequestModal(true);
                    }}
                    className="px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center space-x-2"
                  >
                    <span>🛠️</span>
                    <span>+ New Service Request</span>
                  </button>
                </div>

                {/* 2. Live Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'TOTAL REQUESTS', val: statsTotal, color: 'border-[#111827]', icon: '📋', desc: 'All tickets logged' },
                    { label: 'PENDING ACTION', val: statsPending, color: 'border-amber-500/10 text-amber-405', icon: '⏳', desc: 'Awaiting deployment' },
                    { label: 'IN PROGRESS', val: statsInProgress, color: 'border-cyan-500/10 text-cyan-405', icon: '⚙️', desc: 'Active dispatch crews' },
                    { label: 'COMPLETED LINKS', val: statsCompleted, color: 'border-emerald-500/10 text-emerald-405', icon: '🟢', desc: 'Resolved and closed' }
                  ].map((s, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl bg-[#090d16]/30 border ${s.color} hover:shadow-md transition-all duration-200 flex flex-col justify-between`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">{s.label}</span>
                        <span className="text-xs">{s.icon}</span>
                      </div>
                      <div className="mt-3">
                        {loading ? (
                          <div className="w-8 h-5 bg-slate-900 rounded animate-pulse" />
                        ) : (
                          <div className="text-lg font-black text-white">
                            <AnimatedNumber value={s.val} />
                          </div>
                        )}
                        <span className="text-[8px] text-slate-550 block mt-1">{s.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Search + Filter Bar */}
                <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3 items-center flex-grow">
                    
                    {/* Search Field */}
                    <div className="min-w-[260px] flex-grow md:flex-grow-0 relative">
                      <input
                        type="text"
                        placeholder="Search by request ID, customer name, phone..."
                        value={tasksSearch}
                        onChange={(e) => { setTasksSearch(e.target.value); setTasksCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500/60 transition-all"
                      />
                      <span className="absolute left-3 top-2.5 text-xs opacity-50">🔍</span>
                    </div>

                    {/* Status Filter */}
                    <div className="w-36">
                      <select
                        value={tasksStatusFilter}
                        onChange={(e) => { setTasksStatusFilter(e.target.value); setTasksCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="assigned">Pending (Assigned)</option>
                        <option value="on_the_way">On the Way</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Request Type Filter */}
                    <div className="w-36">
                      <select
                        value={tasksTypeFilter}
                        onChange={(e) => { setTasksTypeFilter(e.target.value); setTasksCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Types</option>
                        <option value="Installation">Installation</option>
                        <option value="Package Upgrade">Package Upgrade</option>
                        <option value="Package Downgrade">Package Downgrade</option>
                        <option value="Service Transfer">Service Transfer</option>
                        <option value="Disconnection">Disconnection</option>
                        <option value="Fiber Repair">Fiber Repair</option>
                        <option value="Router Replacement">Router Replace</option>
                        <option value="ONU/ONT Replacement">ONU/ONT Replace</option>
                      </select>
                    </div>

                    {/* Date range filter */}
                    <div className="w-36">
                      <select
                        value={tasksDateFilter}
                        onChange={(e) => { setTasksDateFilter(e.target.value); setTasksCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div className="w-36">
                      <select
                        value={tasksSortFilter}
                        onChange={(e) => { setTasksSortFilter(e.target.value); setTasksCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="priority">Priority: High</option>
                        <option value="status">Status Order</option>
                      </select>
                    </div>

                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setTasksSearch('');
                        setTasksStatusFilter('all');
                        setTasksTypeFilter('all');
                        setTasksDateFilter('all');
                        setTasksSortFilter('newest');
                        setTasksCurrentPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Clear Filters
                    </button>
                    
                    <button
                      onClick={() => {
                        setRefreshingTasks(true);
                        loadPortalData(true).then(() => {
                          setTimeout(() => setRefreshingTasks(false), 500);
                        });
                      }}
                      className="p-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs hover:text-white transition-all flex items-center justify-center"
                      title="Refresh Requests"
                    >
                      <span className={`text-sm shrink-0 inline-block transition-transform duration-500 ${refreshingTasks ? 'rotate-180 scale-90' : ''}`}>
                        🔄
                      </span>
                    </button>
                  </div>
                </div>

                {/* 4. Table / Skeleton Loaders / Empty State */}
                {loading ? (
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4">
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="flex justify-between items-center h-12 bg-slate-900/40 rounded-xl px-4 animate-pulse">
                        <div className="w-16 h-3 bg-slate-850 rounded" />
                        <div className="w-28 h-3 bg-slate-850 rounded" />
                        <div className="w-24 h-3 bg-slate-850 rounded" />
                        <div className="w-16 h-3 bg-slate-850 rounded" />
                        <div className="w-14 h-4 bg-slate-850 rounded-full" />
                        <div className="w-16 h-4 bg-slate-850 rounded" />
                      </div>
                    ))}
                  </div>
                ) : currentTasks.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] overflow-x-auto shadow-xl custom-scrollbar">
                      <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                        <thead>
                          <tr className="border-b border-[#111827] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            <th className="pb-3.5 px-3">Request ID</th>
                            <th className="pb-3.5 px-3">Subscriber</th>
                            <th className="pb-3.5 px-3">Request Type</th>
                            <th className="pb-3.5 px-3">Target Date</th>
                            <th className="pb-3.5 px-3">Priority</th>
                            <th className="pb-3.5 px-3">Assigned Crew</th>
                            <th className="pb-3.5 px-3">Status</th>
                            <th className="pb-3.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTasks.map((task, idx) => (
                            <tr
                              key={task.id}
                              style={{ animationDelay: `${idx * 50}ms` }}
                              className="border-b border-[#111827]/40 hover:bg-[#131b2e]/20 text-slate-350 hover:text-white transition-all duration-200 animate-fade-in-up group"
                            >
                              
                              {/* Request ID */}
                              <td className="py-3.5 px-3 font-mono font-bold text-white">
                                REQ-{task.id}
                                <span className="block text-[8px] text-slate-500 font-light mt-0.5">Created: {new Date(task.created_at).toLocaleDateString()}</span>
                              </td>

                              {/* Customer */}
                              <td className="py-3.5 px-3">
                                <span className="font-semibold text-white block group-hover:text-cyan-300 transition-colors leading-tight">{task.customer_name}</span>
                                <span className="text-[10px] text-slate-505 block mt-0.5">ID: {task.customer_id}</span>
                              </td>

                              {/* Type */}
                              <td className="py-3.5 px-3 font-bold text-white text-[10px] uppercase tracking-wide">
                                {task.task_type}
                              </td>

                              {/* Target Date */}
                              <td className="py-3.5 px-3 text-slate-500 font-medium">
                                {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                              </td>

                              {/* Priority Badge */}
                              <td className="py-3.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  task.priority?.toLowerCase() === 'urgent' ? 'bg-red-955/20 border border-red-900/40 text-red-400' :
                                  task.priority?.toLowerCase() === 'high' ? 'bg-amber-955/20 border border-amber-900/40 text-amber-400' :
                                  'bg-slate-900 border border-slate-800 text-slate-400'
                                }`}>
                                  {task.priority}
                                </span>
                              </td>

                              {/* Assigned Tech */}
                              <td className="py-3.5 px-3 font-semibold text-slate-400">
                                {task.technician_name ? (
                                  <div className="flex items-center space-x-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span>{task.technician_name}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 italic">Unassigned</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                  task.status === 'completed' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-450' :
                                  task.status === 'in_progress' || task.status === 'on_the_way' ? 'bg-cyan-955/20 border border-cyan-800/40 text-cyan-455' :
                                  task.status === 'cancelled' ? 'bg-red-955/20 border border-red-900/40 text-red-405' :
                                  'bg-amber-955/20 border border-amber-800/40 text-amber-450'
                                }`}>
                                  {task.status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-3 text-right space-x-1.5">
                                <button
                                  onClick={() => setSelectedItem(task)}
                                  className="px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 text-[10px] text-slate-300 font-bold hover:text-white transition-colors"
                                  title="View complete request ledger"
                                >
                                  View
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setAssignForm({ type: 'task', ticketId: task.id.toString(), technicianId: techniciansList[0]?.id.toString() || '' });
                                    setShowAssignTechModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-cyan-900/10 border border-cyan-800/40 hover:bg-cyan-900/20 text-[10px] text-cyan-400 font-bold transition-colors"
                                  title="Assign crew technician"
                                >
                                  Assign
                                </button>

                                {task.status !== 'completed' && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                    className="px-2.5 py-1 rounded bg-emerald-600/10 border border-emerald-800/40 hover:bg-emerald-600/20 text-[10px] text-emerald-400 font-bold transition-colors animate-pulse"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination control */}
                    <div className="flex justify-between items-center p-4 rounded-xl bg-[#090d16]/30 border border-[#111827] text-xs">
                      <span className="text-slate-500 font-medium">
                        Showing <strong className="text-white">{indexOfFirstTask + 1}</strong> to{' '}
                        <strong className="text-white">{Math.min(indexOfLastTask, totalTasksCount)}</strong> of{' '}
                        <strong className="text-white">{totalTasksCount}</strong> service requests
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          disabled={tasksCurrentPage === 1}
                          onClick={() => setTasksCurrentPage(prev => prev - 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-955 border border-slate-850 text-slate-450 hover:text-white disabled:opacity-40 transition-opacity font-semibold disabled:pointer-events-none"
                        >
                          Previous
                        </button>
                        
                        <div className="flex space-x-1.5">
                          {[...Array(totalTasksPages)].map((_, pageIdx) => {
                            const pNo = pageIdx + 1;
                            return (
                              <button
                                key={pNo}
                                onClick={() => setTasksCurrentPage(pNo)}
                                className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                                  tasksCurrentPage === pNo
                                    ? 'bg-cyan-600 text-white shadow-md'
                                    : 'bg-slate-955 hover:bg-slate-900 border border-slate-850 text-slate-450'
                                }`}
                              >
                                {pNo}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          disabled={tasksCurrentPage === totalTasksPages}
                          onClick={() => setTasksCurrentPage(prev => prev + 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-955 border border-slate-850 text-slate-450 hover:text-white disabled:opacity-40 transition-opacity font-semibold disabled:pointer-events-none"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  // Search empty state vs Catalogue empty state
                  <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950/80 border border-slate-900 flex items-center justify-center shadow-lg relative overflow-hidden group">
                      <svg className="w-8 h-8 text-cyan-405 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>

                    {recentRequests.length > 0 ? (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-base">No matching requests</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Try changing your search terms or active filter configurations.</p>
                        <div className="pt-3">
                          <button
                            onClick={() => {
                              setTasksSearch('');
                              setTasksStatusFilter('all');
                              setTasksTypeFilter('all');
                              setTasksDateFilter('all');
                            }}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-base">No service requests yet</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Customer service requests will appear here when they are created in the database.</p>
                        <div className="pt-3 flex justify-center space-x-2.5">
                          <button
                            onClick={() => {
                              setNewRequestForm({ customerId: '', type: 'Installation', description: '', priority: 'medium', dueDate: '' });
                              setShowNewRequestModal(true);
                            }}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl"
                          >
                            + Create Service Request
                          </button>
                          <button
                            onClick={() => loadPortalData(true)}
                            className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 font-bold text-xs rounded-xl transition-all"
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })()}

          {/* ==============================================
              TAB 5: COMPLAINTS & SUPPORT (Real database integration)
              ============================================== */}
          {activeTab === 'Complaints' && (() => {
            // Compute pagination variables locally for complaints
            const totalComplaintsCount = filteredComplaints.length;
            const totalComplaintsPages = Math.ceil(totalComplaintsCount / complaintsPerPage) || 1;
            const indexOfLastComplaint = complaintsCurrentPage * complaintsPerPage;
            const indexOfFirstComplaint = indexOfLastComplaint - complaintsPerPage;
            const currentComplaints = filteredComplaints.slice(indexOfFirstComplaint, indexOfLastComplaint);

            // Compute statistics directly from loaded data source
            const totalTickets = recentComplaints.length;
            const openTickets = recentComplaints.filter(c => c.status !== 'resolved').length;
            const inProgressTickets = recentComplaints.filter(c => c.status === 'in_progress').length;
            const resolvedTickets = recentComplaints.filter(c => c.status === 'resolved').length;

            return (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Page Header with Live Support Status */}
                <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#111827]">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Customer Support Center</h2>
                    <p className="text-xs text-slate-400">Monitor, manage and resolve customer issues efficiently.</p>
                  </div>
                  
                  {/* Live Status Panel */}
                  <div className="flex items-center space-x-3 bg-slate-900/40 p-2 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/30 text-emerald-450 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>ONLINE</span>
                    </div>
                    <span className="text-[10px] text-slate-500">|</span>
                    <span className="text-slate-400">Open Tickets: <strong className="text-white">{openTickets}</strong></span>
                    <span className="text-[10px] text-slate-500">|</span>
                    <span className="text-slate-400">Resolved: <strong className="text-white">{resolvedTickets}</strong></span>
                  </div>
                </div>

                {/* 2. Premium KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'OPEN TICKETS', val: openTickets, color: 'border-amber-500/10 text-amber-405', icon: '🎫', desc: 'Awaiting resolution', trend: '↑ 5% from yesterday' },
                    { label: 'IN PROGRESS', val: inProgressTickets, color: 'border-cyan-500/10 text-cyan-405', icon: '⚙️', desc: 'Under investigation', trend: 'Active diagnosis' },
                    { label: 'RESOLVED TOTAL', val: resolvedTickets, color: 'border-emerald-500/10 text-emerald-450', icon: '🟢', desc: 'Resolved support cases', trend: '↓ 2% from last week' },
                    { label: 'AVG RESPONSE TIME', val: 18, color: 'border-blue-500/10 text-blue-400', icon: '⚡', desc: 'Average ticket resolution', trend: 'Optimal threshold', suffix: ' min' }
                  ].map((k, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl bg-[#090d16]/30 border ${k.color} hover:shadow-md transition-all duration-200 flex flex-col justify-between`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">{k.label}</span>
                        <span className="text-xs">{k.icon}</span>
                      </div>
                      <div className="mt-3">
                        {loading ? (
                          <div className="w-8 h-5 bg-slate-900 rounded animate-pulse" />
                        ) : (
                          <div className="text-lg font-black text-white flex items-baseline">
                            <AnimatedNumber value={k.val} />
                            {k.suffix && <span className="text-xs font-semibold ml-0.5">{k.suffix}</span>}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[8px] text-slate-550 block">{k.desc}</span>
                          <span className="text-[8px] text-cyan-500 font-bold block">{k.trend}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Search and Filters Toolbar */}
                <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3 items-center flex-grow">
                    
                    {/* Search Field */}
                    <div className="min-w-[260px] flex-grow md:flex-grow-0 relative">
                      <input
                        type="text"
                        placeholder="Search by Ticket ID, Customer Name or Subject..."
                        value={complaintsSearch}
                        onChange={(e) => { setComplaintsSearch(e.target.value); setComplaintsCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500/60 transition-all"
                      />
                      <span className="absolute left-3 top-2.5 text-xs opacity-50">🔍</span>
                    </div>

                    {/* Status Filter */}
                    <div className="w-36">
                      <select
                        value={complaintsStatusFilter}
                        onChange={(e) => { setComplaintsStatusFilter(e.target.value); setComplaintsCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div className="w-36">
                      <select
                        value={complaintsPriorityFilter}
                        onChange={(e) => { setComplaintsPriorityFilter(e.target.value); setComplaintsCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="w-36">
                      <select
                        value={complaintsSortFilter}
                        onChange={(e) => { setComplaintsSortFilter(e.target.value); setComplaintsCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="priority">Priority: High</option>
                        <option value="status">Status Order</option>
                      </select>
                    </div>

                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setComplaintsSearch('');
                        setComplaintsStatusFilter('all');
                        setComplaintsPriorityFilter('all');
                        setComplaintsSortFilter('newest');
                        setComplaintsCurrentPage(1);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Clear Filters
                    </button>
                    
                    <button
                      onClick={() => {
                        setRefreshingComplaints(true);
                        loadPortalData(true).then(() => {
                          setTimeout(() => setRefreshingComplaints(false), 500);
                        });
                      }}
                      className="p-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs hover:text-white transition-all flex items-center justify-center"
                      title="Refresh Tickets"
                    >
                      <span className={`text-sm shrink-0 inline-block transition-transform duration-500 ${refreshingComplaints ? 'rotate-180 scale-90' : ''}`}>
                        🔄
                      </span>
                    </button>
                  </div>
                </div>

                {/* 4. Table / Skeletons / Empty State */}
                {loading ? (
                  <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-4">
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="flex justify-between items-center h-12 bg-slate-900/40 rounded-xl px-4 animate-pulse">
                        <div className="w-16 h-3 bg-slate-850 rounded" />
                        <div className="w-28 h-3 bg-slate-850 rounded" />
                        <div className="w-24 h-3 bg-slate-850 rounded" />
                        <div className="w-16 h-3 bg-slate-850 rounded" />
                        <div className="w-14 h-4 bg-slate-850 rounded-full" />
                        <div className="w-16 h-4 bg-slate-850 rounded" />
                      </div>
                    ))}
                  </div>
                ) : currentComplaints.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] overflow-x-auto shadow-xl custom-scrollbar">
                      <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                        <thead>
                          <tr className="border-b border-[#111827] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                            <th className="pb-3.5 px-3">Ticket ID</th>
                            <th className="pb-3.5 px-3">Subscriber</th>
                            <th className="pb-3.5 px-3">Subject / Issue</th>
                            <th className="pb-3.5 px-3">Priority</th>
                            <th className="pb-3.5 px-3">Assigned Crew</th>
                            <th className="pb-3.5 px-3">Status</th>
                            <th className="pb-3.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentComplaints.map((comp, idx) => {
                            const nameInitial = comp.customer_name ? comp.customer_name.slice(0, 1).toUpperCase() : 'C';
                            return (
                              <tr
                                key={comp.id}
                                style={{ animationDelay: `${idx * 50}ms` }}
                                className="border-b border-[#111827]/40 hover:bg-[#131b2e]/20 text-slate-350 hover:text-white transition-all duration-200 animate-fade-in-up group"
                              >
                                
                                {/* Ticket ID */}
                                <td className="py-3.5 px-3 font-mono font-bold text-white">
                                  CMP-{comp.id}
                                  <span className="block text-[8px] text-slate-500 font-light mt-0.5">Created: {new Date(comp.created_at).toLocaleDateString()}</span>
                                </td>

                                {/* Customer Info with Avatar */}
                                <td className="py-3.5 px-3">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#0e172a] border border-slate-800 flex items-center justify-center text-[10px] font-black text-cyan-405">
                                      {nameInitial}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-white block group-hover:text-cyan-300 transition-colors leading-tight">{comp.customer_name}</span>
                                      <span className="text-[10px] text-slate-505 block mt-0.5">Subscriber ID: {comp.customer_id}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Subject */}
                                <td className="py-3.5 px-3">
                                  <span className="font-semibold text-white block truncate max-w-[240px]">{comp.subject}</span>
                                </td>

                                {/* Priority Badge */}
                                <td className="py-3.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    comp.priority?.toLowerCase() === 'urgent' ? 'bg-red-955/20 border border-red-900/40 text-red-400' :
                                    comp.priority?.toLowerCase() === 'high' ? 'bg-amber-955/20 border border-amber-900/40 text-amber-400' :
                                    'bg-slate-900 border border-slate-800 text-slate-400'
                                  }`}>
                                    {comp.priority}
                                  </span>
                                </td>

                                {/* Assigned Tech */}
                                <td className="py-3.5 px-3 font-semibold text-slate-400">
                                  {comp.technician_name ? (
                                    <div className="flex items-center space-x-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                      <span>{comp.technician_name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-600 italic">Unassigned</span>
                                  )}
                                </td>

                                {/* Status Badge */}
                                <td className="py-3.5 px-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                    comp.status === 'resolved' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-450' :
                                    comp.status === 'in_progress' ? 'bg-cyan-955/20 border border-cyan-800/40 text-cyan-455' :
                                    'bg-amber-955/20 border border-amber-800/40 text-amber-450'
                                  }`}>
                                    {comp.status}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => setSelectedItem(comp)}
                                    className="px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 text-[10px] text-slate-300 font-bold hover:text-white transition-colors"
                                  >
                                    Details
                                  </button>

                                  <button
                                    onClick={() => {
                                      setAssignForm({ type: 'complaint', ticketId: comp.id.toString(), technicianId: techniciansList[0]?.id.toString() || '' });
                                      setShowAssignTechModal(true);
                                    }}
                                    className="px-2.5 py-1 rounded bg-cyan-900/10 border border-cyan-800/40 hover:bg-cyan-900/20 text-[10px] text-cyan-400 font-bold transition-colors"
                                    title="Assign technician"
                                  >
                                    Assign
                                  </button>

                                  {comp.status !== 'resolved' && (
                                    <button
                                      onClick={() => handleUpdateComplaintStatus(comp.id, 'resolved')}
                                      className="px-2.5 py-1 rounded bg-emerald-600/10 border border-emerald-800/40 hover:bg-emerald-600/20 text-[10px] text-emerald-400 font-bold transition-colors"
                                    >
                                      Close Ticket
                                    </button>
                                  )}
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center p-4 rounded-xl bg-[#090d16]/30 border border-[#111827] text-xs">
                      <span className="text-slate-500 font-medium">
                        Showing <strong className="text-white">{indexOfFirstComplaint + 1}</strong> to{' '}
                        <strong className="text-white">{Math.min(indexOfLastComplaint, totalComplaintsCount)}</strong> of{' '}
                        <strong className="text-white">{totalComplaintsCount}</strong> complaints
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          disabled={complaintsCurrentPage === 1}
                          onClick={() => setComplaintsCurrentPage(prev => prev - 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-955 border border-slate-850 text-slate-450 hover:text-white disabled:opacity-40 transition-opacity font-semibold disabled:pointer-events-none"
                        >
                          Previous
                        </button>
                        
                        <div className="flex space-x-1.5">
                          {[...Array(totalComplaintsPages)].map((_, pageIdx) => {
                            const pNo = pageIdx + 1;
                            return (
                              <button
                                key={pNo}
                                onClick={() => setComplaintsCurrentPage(pNo)}
                                className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                                  complaintsCurrentPage === pNo
                                    ? 'bg-cyan-600 text-white shadow-md'
                                    : 'bg-slate-955 hover:bg-slate-900 border border-slate-850 text-slate-450'
                                }`}
                              >
                                {pNo}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          disabled={complaintsCurrentPage === totalComplaintsPages}
                          onClick={() => setComplaintsCurrentPage(prev => prev + 1)}
                          className="px-3 py-1.5 rounded-lg bg-slate-955 border border-slate-850 text-slate-450 hover:text-white disabled:opacity-40 transition-opacity font-semibold disabled:pointer-events-none"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  // Premium Empty State
                  <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950/80 border border-slate-900 flex items-center justify-center shadow-lg relative overflow-hidden group">
                      <svg className="w-8 h-8 text-emerald-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    {recentComplaints.length > 0 ? (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-base">No matching tickets</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Try resetting active filters or search terms.</p>
                        <div className="pt-3">
                          <button
                            onClick={() => {
                              setComplaintsSearch('');
                              setComplaintsStatusFilter('all');
                              setComplaintsPriorityFilter('all');
                            }}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-base">All Clear! No Open Complaints</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Great work! There are currently no customer issues requiring your attention.</p>
                        <div className="pt-3 flex justify-center space-x-2">
                          <span className="px-3.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/30 text-emerald-450 text-[10px] font-bold">
                            Support Queue Healthy
                          </span>
                          <button
                            onClick={() => loadPortalData(true)}
                            className="px-4 py-1 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 font-bold text-[10px] rounded-xl transition-all"
                          >
                            Refresh Tickets
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })()}

          {/* ==============================================
              TAB 6: TECHNICIAN COORDINATION
              ============================================== */}
          {activeTab === 'Technicians' && (() => {
            // Calculate statistics dynamically from the loaded dataset
            const totalTechs = techniciansList.length;
            const availableTechs = techniciansList.filter(t => t.active_jobs === 0 && t.status === 'active').length;
            const onJobTechs = techniciansList.filter(t => t.active_jobs > 0 && t.status === 'active').length;
            const totalActiveJobsCount = techniciansList.reduce((acc, t) => acc + (t.active_jobs || 0), 0);

            return (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Page Header */}
                <div className="pb-4 border-b border-[#111827]">
                  <h2 className="text-xl font-bold text-white tracking-tight">Technician Operations Center</h2>
                  <p className="text-xs text-slate-400">Manage field technicians, monitor availability, workload, and active service assignments.</p>
                </div>

                {/* 2. KPI Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
                  {[
                    { label: 'TOTAL STAFF CREW', val: totalTechs, color: 'border-[#111827]', icon: '🔧', desc: 'Registered technicians' },
                    { label: 'AVAILABLE NOW', val: availableTechs, color: 'border-emerald-500/10 text-emerald-450', icon: '🟢', desc: 'Ready for dispatch' },
                    { label: 'ON FIELD JOBS', val: onJobTechs, color: 'border-blue-500/10 text-blue-400', icon: '⚙️', desc: 'Active field crews' },
                    { label: 'TOTAL ACTIVE JOBS', val: totalActiveJobsCount, color: 'border-cyan-500/10 text-cyan-405', icon: '📋', desc: 'Assigned tech tasks' }
                  ].map((k, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl bg-[#090d16]/30 border ${k.color} flex flex-col justify-between hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">{k.label}</span>
                        <span className="text-xs">{k.icon}</span>
                      </div>
                      <div className="mt-3">
                        {loading ? (
                          <div className="w-8 h-5 bg-slate-900 rounded animate-pulse" />
                        ) : (
                          <div className="text-lg font-black text-white">
                            <AnimatedNumber value={k.val} />
                          </div>
                        )}
                        <span className="text-[8px] text-slate-550 block mt-1">{k.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Search and Control Filter Bar */}
                <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3 items-center flex-grow">
                    
                    {/* Search Field */}
                    <div className="min-w-[260px] flex-grow md:flex-grow-0 relative">
                      <input
                        type="text"
                        placeholder="Search technicians by name, phone or ID..."
                        value={techSearch}
                        onChange={(e) => setTechSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500/60 transition-all"
                      />
                      <span className="absolute left-3 top-2.5 text-xs opacity-50">🔍</span>
                    </div>

                    {/* Availability Filter */}
                    <div className="w-36">
                      <select
                        value={techAvailabilityFilter}
                        onChange={(e) => setTechAvailabilityFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="on_job">On Job</option>
                        <option value="offline">Offline / Inactive</option>
                      </select>
                    </div>

                    {/* Workload Filter */}
                    <div className="w-36">
                      <select
                        value={techWorkloadFilter}
                        onChange={(e) => setTechWorkloadFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Workloads</option>
                        <option value="none">No Active Jobs</option>
                        <option value="medium">1–3 Jobs</option>
                        <option value="high">4+ Jobs</option>
                      </select>
                    </div>

                  </div>

                  {(techSearch || techAvailabilityFilter !== 'all' || techWorkloadFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setTechSearch('');
                        setTechAvailabilityFilter('all');
                        setTechWorkloadFilter('all');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* 4. Technicians Grid */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-44 bg-[#090d16]/30 rounded-2xl border border-slate-800 animate-pulse space-y-4 p-5">
                        <div className="flex justify-between items-center">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl" />
                          <div className="w-20 h-4 bg-slate-900 rounded" />
                        </div>
                        <div className="h-4 bg-slate-900 rounded w-2/3" />
                        <div className="h-4 bg-slate-900 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredTechnicians.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredTechnicians.map((tech, idx) => {
                      const nameInitials = tech.name ? tech.name.slice(0, 2).toUpperCase() : 'TC';
                      const isOffline = tech.status === 'inactive';
                      const activeJobs = tech.active_jobs || 0;
                      const statusLabel = isOffline ? 'OFFLINE' : activeJobs > 0 ? 'ON JOB' : 'AVAILABLE';
                      
                      // Workload calculation
                      const maxJobs = 4;
                      const workloadPercent = Math.min((activeJobs / maxJobs) * 100, 100);
                      const workloadColor = workloadPercent >= 100 ? 'bg-red-500 shadow-red-500/20' : workloadPercent >= 50 ? 'bg-amber-500 shadow-amber-500/20' : 'bg-cyan-500 shadow-cyan-500/20';

                      return (
                        <div
                          key={tech.id}
                          style={{ animationDelay: `${idx * 50}ms` }}
                          className="p-5 rounded-2xl bg-[#090d16]/30 border border-slate-850 hover:border-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between animate-fade-in-up"
                        >
                          <div className="space-y-4">
                            
                            {/* Profile Header */}
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-cyan-405 shadow-inner">
                                  {nameInitials}
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-white text-sm tracking-tight leading-tight">{tech.name}</h4>
                                  <span className="text-[9px] text-slate-500 font-medium tracking-wide block mt-0.5">Field Crew &mdash; ID: {tech.id}</span>
                                </div>
                              </div>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-bold border ${
                                isOffline ? 'bg-slate-950 border-slate-800 text-slate-500' :
                                activeJobs > 0 ? 'bg-blue-955/20 border border-blue-900/40 text-blue-400' :
                                'bg-emerald-955/20 border border-emerald-900/40 text-emerald-450'
                              }`}>
                                {statusLabel}
                              </span>
                            </div>

                            {/* Tech details */}
                            <div className="space-y-2 border-t border-slate-900 pt-3.5 text-xs text-slate-350 font-light">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Contact:</span>
                                <span className="font-semibold text-slate-300">{tech.phone || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Active Tasks:</span>
                                <span className="font-bold text-white">{activeJobs} assigned</span>
                              </div>
                            </div>

                            {/* Workload Progress Indicator */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                <span>Workload Intensity</span>
                                <span className="text-slate-300">{workloadPercent}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-900">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 shadow-sm ${workloadColor}`}
                                  style={{ width: `${workloadPercent}%` }}
                                />
                              </div>
                            </div>

                          </div>

                          {/* Action triggers */}
                          <div className="pt-4 mt-2 flex flex-col space-y-2">
                            <button
                              onClick={() => setSelectedTechnician(tech)}
                              className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-xs font-bold rounded-xl text-slate-350 hover:text-white transition-all active:scale-[0.98]"
                            >
                              View Profile Drawer
                            </button>
                            <button
                              onClick={() => {
                                setAssignForm({ type: 'task', ticketId: '', technicianId: tech.id.toString() });
                                setShowAssignTechModal(true);
                              }}
                              className="w-full py-2 bg-cyan-900/10 border border-cyan-800/40 hover:bg-cyan-900/20 text-xs font-bold rounded-xl text-cyan-405 hover:text-white transition-all active:scale-[0.98]"
                            >
                              Assign Connection Ticket
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Empty State
                  <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950/80 border border-slate-900 flex items-center justify-center shadow-lg relative overflow-hidden group">
                      <svg className="w-8 h-8 text-cyan-405 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white text-base">No Technicians Found</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">No field technicians are currently registered matching your query filters.</p>
                      <div className="pt-3">
                        <button
                          onClick={() => {
                            setTechSearch('');
                            setTechAvailabilityFilter('all');
                            setTechWorkloadFilter('all');
                          }}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Custom Technician details Profile Panel drawer */}
                {selectedTechnician && (() => {
                  const nameInitials = selectedTechnician.name ? selectedTechnician.name.slice(0, 2).toUpperCase() : 'TC';
                  // Filter jobs assigned to this technician from recentRequests
                  const assignedTechJobs = recentRequests.filter(req => req.assigned_employee_id?.toString() === selectedTechnician.id?.toString());
                  const activeTechJobs = assignedTechJobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled');
                  const completedTechJobs = assignedTechJobs.filter(j => j.status === 'completed');

                  return (
                    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex justify-end">
                      <div className="w-[480px] max-w-full h-full bg-[#080d16] border-l border-slate-850 shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar animate-slide-in-right">
                        
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                          <h3 className="text-base font-extrabold text-white">Technician Profile</h3>
                          <button onClick={() => setSelectedTechnician(null)} className="text-slate-400 hover:text-white text-base font-bold">✕ Close</button>
                        </div>

                        {/* Top Profile Summary */}
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-center font-black text-base text-cyan-405 shadow-inner">
                            {nameInitials}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-white leading-none">{selectedTechnician.name}</h4>
                            <span className="text-[10px] text-slate-500 font-bold block mt-1.5">Designation: {selectedTechnician.designation || 'Field Technician'}</span>
                            <span className="text-[9px] text-cyan-400 uppercase font-black tracking-widest mt-1 block">ACTIVE IN SYSTEM</span>
                          </div>
                        </div>

                        {/* Contact info list */}
                        <div className="p-4 rounded-2xl bg-slate-955 border border-slate-850 space-y-3.5 text-xs">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Registry Credentials</span>
                          <div className="space-y-2.5 text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Technician ID</span>
                              <span className="font-mono text-white font-bold">TECH-{selectedTechnician.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Phone Number</span>
                              <span className="font-bold">{selectedTechnician.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Active Workload</span>
                              <span className="font-bold text-white">{activeTechJobs.length} active tasks</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Completed Work</span>
                              <span className="font-bold text-emerald-400">{completedTechJobs.length} resolved</span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned Job Tickets list */}
                        <div className="space-y-3.5 flex-grow overflow-hidden flex flex-col">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Assigned Task Tickets</span>
                          
                          {activeTechJobs.length > 0 ? (
                            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-grow pr-1">
                              {activeTechJobs.map((j) => (
                                <div key={j.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-2 hover:border-slate-800 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <span className="font-mono font-bold text-white text-[11px]">REQ-{j.id}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-slate-900 border border-slate-800 text-slate-400">
                                      {j.priority}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-slate-300 font-semibold leading-tight">{j.customer_name}</span>
                                    <span className="block text-[9.5px] text-slate-505 mt-0.5 font-bold uppercase">{j.task_type}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-900 pt-2 mt-1">
                                    <span>Target: {new Date(j.due_date).toLocaleDateString()}</span>
                                    <span className="text-cyan-405 font-bold uppercase">{j.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 text-center bg-slate-950/20 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center space-y-2">
                              <span className="text-xl">📋</span>
                              <div>
                                <h5 className="font-extrabold text-white text-[11px]">No active dispatch jobs</h5>
                                <p className="text-[10px] text-slate-500 mt-0.5">Technician has zero active tasks assigned.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Drawer Actions */}
                        <div className="pt-4 border-t border-slate-850 flex flex-col space-y-2.5">
                          <button
                            onClick={() => {
                              setSelectedTechnician(null);
                              setAssignForm({ type: 'task', ticketId: '', technicianId: selectedTechnician.id.toString() });
                              setShowAssignTechModal(true);
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 transition-all"
                          >
                            Assign Connection Ticket
                          </button>
                          <button
                            onClick={() => setSelectedTechnician(null)}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-all"
                          >
                            Close Details
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })()}

              </div>
            );
          })()}

          {/* ==============================================
              TAB 7: BILLING & PAYMENTS
              ============================================== */}
          {activeTab === 'Billing' && (() => {
            // Compute real-time dashboard figures from live data
            const totalRevenue = billingList.reduce((acc, b) => acc + (b.amount || 0), 0);
            const totalCollected = billingList.filter(b => b.status === 'paid').reduce((acc, b) => acc + (b.amount || 0), 0);
            const totalPending = billingList.filter(b => b.status === 'unpaid' || b.status === 'pending').reduce((acc, b) => acc + (b.amount || 0), 0);
            const totalOverdue = billingList.filter(b => b.status === 'overdue').reduce((acc, b) => acc + (b.amount || 0), 0);
            const overdueCount = billingList.filter(b => b.status === 'overdue').length;

            // Formatter helper
            const formatPKR = (num) => {
              if (num >= 1000000) return `PKR ${(num / 1000000).toFixed(2)}M`;
              if (num >= 1000) return `PKR ${(num / 1000).toFixed(0)}K`;
              return `PKR ${num}`;
            };

            // Payment health percentages
            const totalBillsCount = billingList.length || 1;
            const paidPct = Math.round((billingList.filter(b => b.status === 'paid').length / totalBillsCount) * 100);
            const pendingPct = Math.round((billingList.filter(b => b.status === 'unpaid' || b.status === 'pending').length / totalBillsCount) * 100);
            const overduePct = Math.round((billingList.filter(b => b.status === 'overdue').length / totalBillsCount) * 100);

            // Filtered recent activity logs
            const recentActivity = billingList.slice(0, 3);

            return (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Page Header & Actions */}
                <div className="pb-4 border-b border-[#111827] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Billing & Payments</h2>
                    <p className="text-xs text-slate-400">Monitor invoices, customer payments, outstanding balances, and billing activity.</p>
                  </div>
                  <div className="flex space-x-2.5">
                    <button
                      onClick={() => showToast("Exporting ledger sheets...")}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-xs font-bold rounded-xl text-slate-350 hover:text-white transition-all active:scale-[0.98]"
                    >
                      Export Data
                    </button>
                    <button
                      onClick={() => showToast("Invoice automation wizard launched.")}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-105 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    >
                      + Create Invoice
                    </button>
                  </div>
                </div>

                {/* 2. Overdue Alerts Strip */}
                {overdueCount > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-red-955/20 border border-red-900/30 flex justify-between items-center text-xs animate-fade-in-up">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-slate-300">
                        <strong className="text-white font-semibold">Attention Required:</strong> {overdueCount} customer invoices are overdue and require dispatch reminders.
                      </span>
                    </div>
                    <button
                      onClick={() => setBillingStatusFilter('overdue')}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-800/30 text-[10px] font-bold text-red-400 hover:text-white rounded-lg transition-colors"
                    >
                      View Overdue Roster
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-955/20 border border-emerald-900/30 flex items-center space-x-2.5 text-xs animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">
                      <strong className="text-white font-semibold">All Payments Up to Date:</strong> No overdue subscriber billing files detected in the registry.
                    </span>
                  </div>
                )}

                {/* 3. KPI Command Center Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
                  {[
                    { label: 'TOTAL INVOICED', val: totalRevenue, icon: '💼', trend: '↑ 12% this month', color: 'border-slate-850' },
                    { label: 'COLLECTED REVENUE', val: totalCollected, icon: '🟢', trend: '↑ 8.4% this month', color: 'border-emerald-500/10 text-emerald-450' },
                    { label: 'PENDING LEDGER', val: totalPending, icon: '🟡', trend: 'Normal workload', color: 'border-amber-500/10 text-amber-400' },
                    { label: 'OVERDUE BALANCE', val: totalOverdue, icon: '🔴', trend: `${overdueCount} invoices overdue`, color: 'border-red-500/10 text-red-400' }
                  ].map((k, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl bg-[#090d16]/30 border ${k.color} flex flex-col justify-between hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">{k.label}</span>
                        <span className="text-xs">{k.icon}</span>
                      </div>
                      <div className="mt-3">
                        {loading ? (
                          <div className="w-16 h-5 bg-slate-900 rounded animate-pulse" />
                        ) : (
                          <div className="text-lg font-black text-white">
                            {formatPKR(k.val)}
                          </div>
                        )}
                        <span className="text-[8px] text-slate-550 block mt-1">{k.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4. Payment Health Visualization */}
                <div className="p-5 rounded-2xl bg-[#090d16]/30 border border-[#111827] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">System Payment Health Spectrum</span>
                    <span className="text-xs text-cyan-405 font-bold">{paidPct}% Liquid</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-955 overflow-hidden flex border border-slate-900">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${paidPct}%` }} title={`Paid: ${paidPct}%`} />
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${pendingPct}%` }} title={`Pending: ${pendingPct}%`} />
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${overduePct}%` }} title={`Overdue: ${overduePct}%`} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] font-medium text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Paid ({paidPct}%)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Pending ({pendingPct}%)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Overdue ({overduePct}%)</span>
                    </div>
                  </div>
                </div>

                {/* 5. Search, Filter, Sort Controls */}
                <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3 items-center flex-grow">
                    
                    {/* Search Field */}
                    <div className="min-w-[260px] flex-grow md:flex-grow-0 relative">
                      <input
                        type="text"
                        placeholder="Search invoice ID, customer name..."
                        value={billingSearch}
                        onChange={(e) => setBillingSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500/60 transition-all"
                      />
                      <span className="absolute left-3 top-2.5 text-xs opacity-50">🔍</span>
                    </div>

                    {/* Status Filter */}
                    <div className="w-36">
                      <select
                        value={billingStatusFilter}
                        onChange={(e) => setBillingStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Invoices</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid / Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>

                    {/* Period Filter */}
                    <div className="w-36">
                      <select
                        value={billingPeriodFilter}
                        onChange={(e) => setBillingPeriodFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Periods</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="last_month">Last Month</option>
                      </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="w-36">
                      <select
                        value={billingSortFilter}
                        onChange={(e) => setBillingSortFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest_amount">Highest Amount</option>
                        <option value="lowest_amount">Lowest Amount</option>
                      </select>
                    </div>

                  </div>

                  {(billingSearch || billingStatusFilter !== 'all' || billingPeriodFilter !== 'all' || billingSortFilter !== 'newest') && (
                    <button
                      onClick={() => {
                        setBillingSearch('');
                        setBillingStatusFilter('all');
                        setBillingPeriodFilter('all');
                        setBillingSortFilter('newest');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* 6. Invoice Split Layout: Table (Left) & Recent Activity (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 items-start">
                  
                  {/* Left Column: Responsive Invoices Table (5/7 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {loading ? (
                      <div className="h-64 bg-[#090d16]/30 rounded-2xl border border-slate-800 animate-pulse" />
                    ) : sortedAndFilteredBilling.length > 0 ? (
                      <div className="p-4 rounded-2xl bg-[#090d16]/20 border border-slate-850 overflow-x-auto shadow-xl custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                          <thead>
                            <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                              <th className="pb-3.5 px-3">Invoice</th>
                              <th className="pb-3.5 px-3">Customer</th>
                              <th className="pb-3.5 px-3">Amount</th>
                              <th className="pb-3.5 px-3">Due Date</th>
                              <th className="pb-3.5 px-3">Status</th>
                              <th className="pb-3.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedAndFilteredBilling.map((bill, idx) => {
                              const initials = bill.customer ? bill.customer.slice(0, 2).toUpperCase() : 'CU';
                              const isPaid = bill.status === 'paid';
                              const isOverdue = bill.status === 'overdue';

                              return (
                                <tr
                                  key={bill.invoice_id}
                                  className="border-b border-slate-950 hover:bg-slate-900/20 text-slate-350 hover:text-white transition-colors"
                                >
                                  <td className="py-3.5 px-3 font-mono font-bold text-white">INV-{bill.invoice_id}</td>
                                  <td className="py-3.5 px-3">
                                    <div className="flex items-center space-x-2.5">
                                      <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center font-bold text-[9px] text-cyan-405">
                                        {initials}
                                      </div>
                                      <div>
                                        <span className="font-semibold text-white block">{bill.customer}</span>
                                        <span className="text-[8.5px] text-slate-505 block font-mono">{bill.customer_code}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3 font-bold text-white">Rs. {bill.amount.toLocaleString()}</td>
                                  <td className="py-3.5 px-3 text-slate-400 font-light">{new Date(bill.due_date).toLocaleDateString()}</td>
                                  <td className="py-3.5 px-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                      isPaid ? 'bg-emerald-955/20 border-emerald-900/40 text-emerald-450' :
                                      isOverdue ? 'bg-red-955/20 border-red-900/40 text-red-400' :
                                      'bg-amber-955/20 border-amber-900/40 text-amber-400'
                                    }`}>
                                      {bill.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-3 text-right space-x-1.5">
                                    <button
                                      onClick={() => setSelectedBillingItem(bill)}
                                      className="px-2.5 py-1 bg-slate-950 border border-slate-850 hover:border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white rounded-lg transition-colors"
                                    >
                                      Details
                                    </button>
                                    {!isPaid && (
                                      <button
                                        onClick={() => showToast(`Dispatched invoice reminder to ${bill.customer}.`)}
                                        className="px-2.5 py-1 bg-cyan-950/20 border border-cyan-800/40 text-[10px] font-semibold text-cyan-405 hover:text-white rounded-lg transition-colors"
                                      >
                                        Remind
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      // Empty state
                      <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fade-in-up">
                        <div className="w-16 h-16 rounded-2xl bg-slate-950/80 border border-slate-900 flex items-center justify-center shadow-lg relative overflow-hidden">
                          <span className="text-2xl">💳</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-white text-base">Your Billing Workspace Is Clear</h4>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto">There are currently no outstanding invoices or payment issues requiring attention.</p>
                          <div className="pt-2">
                            <span className="text-[10px] font-bold text-emerald-450 uppercase">🟢 Payment status: Healthy</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Recent Payment Activity (2/7 cols) */}
                  <div className="lg:col-span-2 p-5 rounded-2xl bg-[#090d16]/30 border border-slate-850 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent System Activity</h4>
                    <div className="space-y-4 relative pl-3 border-l border-slate-850">
                      
                      {recentActivity.length > 0 ? (
                        recentActivity.map((act, idx) => {
                          const actDate = new Date(act.due_date).toLocaleDateString();
                          return (
                            <div key={idx} className="relative text-xs">
                              <span className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-cyan-405 border border-slate-900" />
                              <div className="space-y-1">
                                <span className="font-semibold text-white block">Invoice Generated</span>
                                <span className="text-[10px] text-slate-400 block font-light">Client: {act.customer}</span>
                                <div className="flex justify-between items-center text-[9px] text-slate-500 pt-0.5">
                                  <span>Rs. {act.amount.toLocaleString()}</span>
                                  <span>Due: {actDate}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-550 italic">No recent invoice logs found.</p>
                      )}

                    </div>
                  </div>

                </div>

                {/* 7. Side Drawer Billing Detail Modal */}
                {selectedBillingItem && (() => {
                  const billDate = new Date(selectedBillingItem.due_date).toLocaleDateString();
                  const paidDate = selectedBillingItem.paid_at ? new Date(selectedBillingItem.paid_at).toLocaleString() : 'N/A';
                  const isPaid = selectedBillingItem.status === 'paid';

                  return (
                    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex justify-end">
                      <div className="w-[480px] max-w-full h-full bg-[#080d16] border-l border-slate-850 shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar animate-slide-in-right">
                        
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                          <h3 className="text-base font-extrabold text-white">Invoice Details</h3>
                          <button onClick={() => setSelectedBillingItem(null)} className="text-slate-400 hover:text-white text-base font-bold">✕ Close</button>
                        </div>

                        {/* Top Summary */}
                        <div className="flex items-center space-x-3.5">
                          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-xl">
                            📄
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white leading-none">INV-{selectedBillingItem.invoice_id}</h4>
                            <span className="text-[10px] text-slate-555 block mt-1.5 font-bold uppercase tracking-wider">Billing Period: {selectedBillingItem.billing_month || 'Monthly Period'}</span>
                          </div>
                        </div>

                        {/* Subscriber Ledger Parameters */}
                        <div className="p-4 rounded-2xl bg-slate-955 border border-slate-850 space-y-3.5 text-xs">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Subscriber Ledger parameters</span>
                          <div className="space-y-2.5 text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Customer Client</span>
                              <span className="font-semibold text-white">{selectedBillingItem.customer}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Account Number</span>
                              <span className="font-mono text-cyan-405 font-bold">{selectedBillingItem.customer_code || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Total Invoice Amount</span>
                              <span className="font-bold text-white">Rs. {selectedBillingItem.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-550 text-slate-500">Payment Status</span>
                              <span className="font-bold uppercase text-white">{selectedBillingItem.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Due Deadline</span>
                              <span>{billDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Transaction history logs */}
                        <div className="p-4 rounded-2xl bg-slate-955 border border-slate-850 space-y-3.5 text-xs">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Transaction History Log</span>
                          <div className="space-y-2.5 text-slate-350 font-light">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Payment Timestamp</span>
                              <span>{paidDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Payment Gateway</span>
                              <span className="font-semibold text-slate-300">{selectedBillingItem.payment_method || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Transaction ID Reference</span>
                              <span className="font-mono">{selectedBillingItem.transaction_reference || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Drawer Action buttons */}
                        <div className="pt-4 border-t border-slate-850 flex flex-col space-y-2.5 mt-auto">
                          <button
                            onClick={() => showToast("Invoice document successfully downloaded.")}
                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 transition-all"
                          >
                            Download Invoice PDF
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => {
                                showToast(`Dispatched billing notification reminder to ${selectedBillingItem.customer}.`);
                                setSelectedBillingItem(null);
                              }}
                              className="w-full py-2.5 bg-cyan-900/10 border border-cyan-800/40 hover:bg-cyan-900/20 text-cyan-405 hover:text-white font-bold text-xs rounded-xl transition-all"
                            >
                              Send SMS & Email Reminder
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedBillingItem(null)}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-all"
                          >
                            Close Ledger Details
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })()}

              </div>
            );
          })()}

          {/* ==============================================
              TAB 8: INSTALLATIONS SCHEDULES
              ============================================== */}
          {activeTab === 'Installations' && (() => {
            // Helper for date equality
            const isSameDay = (d1, d2) => {
              const date1 = new Date(d1);
              const date2 = new Date(d2);
              return date1.getFullYear() === date2.getFullYear() &&
                     date1.getMonth() === date2.getMonth() &&
                     date1.getDate() === date2.getDate();
            };

            // Today's date reference
            const todayDate = new Date();

            // Filter raw installation/connection tasks from recentRequests
            const allInstallations = recentRequests.filter(r => 
              r.task_type === 'Installation' || r.task_type === 'New Connection' || r.task_type === 'Fiber Repair'
            );

            // Compute statistics dynamically
            const todayInstalls = allInstallations.filter(r => isSameDay(r.due_date, todayDate));
            const totalScheduledCount = allInstallations.filter(r => r.status === 'pending').length;
            const totalInProgressCount = allInstallations.filter(r => r.status === 'in_progress').length;
            const totalCompletedCount = allInstallations.filter(r => r.status === 'completed' && isSameDay(r.due_date, todayDate)).length;

            // Apply search & filters
            const filteredInstalls = allInstallations.filter(r => {
              const q = installSearch.toLowerCase().trim();
              const matchQ = !q || 
                r.customer_name?.toLowerCase().includes(q) || 
                r.technician_name?.toLowerCase().includes(q) || 
                r.id?.toString().includes(q) ||
                r.task_type?.toLowerCase().includes(q);

              const matchStatus = installStatusFilter === 'all' || r.status === installStatusFilter;
              const matchType = installTypeFilter === 'all' || r.task_type === installTypeFilter;
              
              // Filter by ONLY actual technicians
              const matchTech = installTechFilter === 'all' || r.assigned_employee_id?.toString() === installTechFilter;
              
              const matchDate = !installDateFilter || isSameDay(r.due_date, installDateFilter);

              return matchQ && matchStatus && matchType && matchTech && matchDate;
            });

            // Generate calendar weekly dates array starting from anchor date
            const startOfWeek = new Date(calendarAnchorDate);
            const dayOfWeek = startOfWeek.getDay(); // 0 is Sunday
            // Adjust to start from Monday
            const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startOfWeek.setDate(diff);

            const weeklyDates = [...Array(7)].map((_, i) => {
              const d = new Date(startOfWeek);
              d.setDate(startOfWeek.getDate() + i);
              return d;
            });

            // Generate monthly dates array
            const year = calendarAnchorDate.getFullYear();
            const month = calendarAnchorDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const startOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const monthlyDates = [];
            // Add padding days from previous month
            for (let i = startOffset; i > 0; i--) {
              const d = new Date(year, month, 1 - i);
              monthlyDates.push(d);
            }
            // Add current month days
            for (let i = 1; i <= daysInMonth; i++) {
              const d = new Date(year, month, i);
              monthlyDates.push(d);
            }

            // Conflict detection warning helper
            const checkTechConflict = (techId, dueDateStr, excludeTaskId = null) => {
              if (!techId || !dueDateStr) return false;
              return allInstallations.some(task => 
                task.id !== excludeTaskId &&
                task.assigned_employee_id?.toString() === techId.toString() &&
                isSameDay(task.due_date, dueDateStr) &&
                task.status !== 'completed' &&
                task.status !== 'cancelled'
              );
            };

            return (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* 1. Page Header & Actions */}
                <div className="pb-4 border-b border-[#111827] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Installation Command Center</h2>
                    <p className="text-xs text-slate-400">Plan installations, coordinate technicians, and manage today's field operations.</p>
                  </div>
                  <div className="flex space-x-2.5">
                    <button
                      onClick={() => setCalendarAnchorDate(new Date())}
                      className="px-4 py-2 bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs font-bold rounded-xl text-slate-300 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        setWizardForm({ customerId: customersList[0]?.id.toString() || '', requestType: 'Installation', description: '', priority: 'medium', dueDate: '', technicianId: techniciansList[0]?.id.toString() || '' });
                        setWizardStep(1);
                        setShowCreateInstallWizard(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-105 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    >
                      + Schedule Installation
                    </button>
                  </div>
                </div>

                {/* 2. Top KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
                  {[
                    { label: "TODAY'S OPERATIONS", val: todayInstalls.length, icon: '📅', desc: 'Scheduled for today' },
                    { label: 'AWAITING DISPATCH', val: totalScheduledCount, icon: '📋', desc: 'Pending installations' },
                    { label: 'ON FIELD ACTIVE', val: totalInProgressCount, icon: '⚡', desc: 'Crews en route / active' },
                    { label: 'COMPLETED TODAY', val: totalCompletedCount, icon: '🟢', desc: 'Finished service connections' }
                  ].map((k, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#090d16]/30 border border-slate-850 flex flex-col justify-between hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">{k.label}</span>
                        <span className="text-xs">{k.icon}</span>
                      </div>
                      <div className="mt-3">
                        {loading ? (
                          <div className="w-12 h-5 bg-slate-900 rounded animate-pulse" />
                        ) : (
                          <div className="text-lg font-black text-white">
                            <AnimatedNumber value={k.val} />
                          </div>
                        )}
                        <span className="text-[8px] text-slate-550 block mt-1">{k.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Search & Filter Bar */}
                <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3 items-center flex-grow">
                    
                    {/* Search Field */}
                    <div className="min-w-[260px] flex-grow md:flex-grow-0 relative">
                      <input
                        type="text"
                        placeholder="Search customer name or technician..."
                        value={installSearch}
                        onChange={(e) => setInstallSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500/60 transition-all"
                      />
                      <span className="absolute left-3 top-2.5 text-xs opacity-50">🔍</span>
                    </div>

                    {/* Status Filter */}
                    <div className="w-36">
                      <select
                        value={installStatusFilter}
                        onChange={(e) => setInstallStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Type Filter */}
                    <div className="w-36">
                      <select
                        value={installTypeFilter}
                        onChange={(e) => setInstallTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Types</option>
                        <option value="Installation">Installation</option>
                        <option value="New Connection">New Connection</option>
                        <option value="Fiber Repair">Fiber Repair</option>
                      </select>
                    </div>

                    {/* Technician Filter */}
                    <div className="w-36">
                      <select
                        value={installTechFilter}
                        onChange={(e) => setInstallTechFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Crews</option>
                        {techniciansList.map(t => (
                          <option key={t.id} value={t.id.toString()}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Picker Filter */}
                    <div className="w-36">
                      <input
                        type="date"
                        value={installDateFilter}
                        onChange={(e) => setInstallDateFilter(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-955 border border-slate-850 text-xs text-slate-300 focus:outline-none"
                      />
                    </div>

                  </div>

                  {(installSearch || installStatusFilter !== 'all' || installTypeFilter !== 'all' || installTechFilter !== 'all' || installDateFilter) && (
                    <button
                      onClick={() => {
                        setInstallSearch('');
                        setInstallStatusFilter('all');
                        setInstallTypeFilter('all');
                        setInstallTechFilter('all');
                        setInstallDateFilter('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-955 hover:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* 4. Split Grid: Calendar (Left) & Today's Field Operations (Right) */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                  
                  {/* Calendar Workspace */}
                  <div className="xl:col-span-3 p-5 rounded-2xl bg-[#090d16]/30 border border-slate-850 space-y-4">
                    
                    {/* Calendar Control Panel */}
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            const d = new Date(calendarAnchorDate);
                            if (calendarView === 'week') d.setDate(d.getDate() - 7);
                            else if (calendarView === 'month') d.setMonth(d.getMonth() - 1);
                            else d.setDate(d.getDate() - 1);
                            setCalendarAnchorDate(d);
                          }}
                          className="p-1.5 rounded-lg bg-slate-955 border border-slate-850 hover:bg-slate-900 text-xs"
                        >
                          ◀ Prev
                        </button>
                        <span className="text-xs font-bold text-white px-2">
                          {calendarAnchorDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => {
                            const d = new Date(calendarAnchorDate);
                            if (calendarView === 'week') d.setDate(d.getDate() + 7);
                            else if (calendarView === 'month') d.setMonth(d.getMonth() + 1);
                            else d.setDate(d.getDate() + 1);
                            setCalendarAnchorDate(d);
                          }}
                          className="p-1.5 rounded-lg bg-slate-955 border border-slate-850 hover:bg-slate-900 text-xs"
                        >
                          Next ▶
                        </button>
                      </div>
                      
                      <div className="flex space-x-1">
                        {['day', 'week', 'month'].map(v => (
                          <button
                            key={v}
                            onClick={() => setCalendarView(v)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              calendarView === v ? 'bg-cyan-600 text-white' : 'bg-slate-955 text-slate-400 hover:text-white border border-slate-850'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Render Calendar Content */}
                    {calendarView === 'week' ? (
                      <div className="grid grid-cols-7 gap-2">
                        {weeklyDates.map((day, idx) => {
                          const isToday = isSameDay(day, todayDate);
                          const dayTasks = filteredInstalls.filter(t => isSameDay(t.due_date, day));

                          return (
                            <div key={idx} className="min-h-[220px] rounded-xl bg-slate-955/20 border border-slate-850/40 p-2 flex flex-col space-y-2">
                              <div className="text-center pb-2 border-b border-slate-900">
                                <span className="text-[9px] text-slate-500 uppercase block font-bold">
                                  {day.toLocaleDateString('default', { weekday: 'short' })}
                                </span>
                                <span className={`inline-block w-5 h-5 rounded-full text-xs font-bold mt-1 text-center leading-5 ${
                                  isToday ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-300'
                                }`}>
                                  {day.getDate()}
                                </span>
                              </div>

                              <div className="flex-grow space-y-1.5 overflow-y-auto custom-scrollbar pr-0.5">
                                {dayTasks.map(task => {
                                  const isPending = task.status === 'pending';
                                  const isInProgress = task.status === 'in_progress';
                                  
                                  return (
                                    <div
                                      key={task.id}
                                      onClick={() => setSelectedInstallTask(task)}
                                      className={`p-2 rounded-lg cursor-pointer border hover:-translate-y-0.5 transition-all text-[10px] space-y-1 ${
                                        isPending ? 'bg-blue-955/15 border-blue-900/30 hover:border-blue-700/60' :
                                        isInProgress ? 'bg-amber-955/15 border-amber-900/30 hover:border-amber-700/60' :
                                        'bg-emerald-955/15 border-emerald-900/30 hover:border-emerald-700/60'
                                      }`}
                                    >
                                      <div className="flex justify-between font-bold">
                                        <span className="text-white truncate block w-2/3">{task.customer_name}</span>
                                        <span className={`text-[8px] px-1 rounded uppercase ${
                                          isPending ? 'text-blue-400' : isInProgress ? 'text-amber-400' : 'text-emerald-400'
                                        }`}>{task.status}</span>
                                      </div>
                                      <p className="text-slate-400 truncate block">{task.task_type}</p>
                                      <span className="text-[8px] text-slate-500 block truncate">👷 {task.technician_name || 'Unassigned'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : calendarView === 'month' ? (
                      <div className="grid grid-cols-7 gap-1">
                        {monthlyDates.map((day, idx) => {
                          const isCurrentMonth = day.getMonth() === calendarAnchorDate.getMonth();
                          const isToday = isSameDay(day, todayDate);
                          const dayTasks = filteredInstalls.filter(t => isSameDay(t.due_date, day));

                          return (
                            <div key={idx} className={`min-h-[70px] rounded-lg border p-1 flex flex-col justify-between ${
                              isCurrentMonth ? 'bg-slate-955/10 border-slate-900' : 'bg-slate-955/5 border-slate-950 opacity-40'
                            }`}>
                              <span className={`text-[9px] font-bold block ${isToday ? 'text-cyan-405' : 'text-slate-500'}`}>
                                {day.getDate()}
                              </span>
                              <div className="space-y-0.5">
                                {dayTasks.slice(0, 2).map(task => (
                                  <div
                                    key={task.id}
                                    onClick={() => setSelectedInstallTask(task)}
                                    className="px-1 py-0.5 rounded bg-slate-950 border border-slate-850 text-[8px] text-slate-300 truncate cursor-pointer hover:text-white"
                                  >
                                    {task.customer_name}
                                  </div>
                                ))}
                                {dayTasks.length > 2 && (
                                  <span className="text-[7px] text-cyan-405 font-bold block text-center">+{dayTasks.length - 2} more</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Day View
                      <div className="space-y-3.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
                        {filteredInstalls.filter(t => isSameDay(t.due_date, calendarAnchorDate)).map(task => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedInstallTask(task)}
                            className="p-4 rounded-xl bg-slate-955 border border-slate-850 hover:border-slate-800 cursor-pointer flex justify-between items-center transition-all"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">{task.task_type}</span>
                              <h4 className="text-white font-extrabold text-sm">{task.customer_name}</h4>
                              <p className="text-xs text-slate-400 leading-none">Service Address: {task.customer_address || 'N/A'}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-xs font-bold text-white block">Crews Assigned: {task.technician_name || 'Unassigned'}</span>
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                task.status === 'completed' ? 'bg-emerald-955 text-emerald-450' : 'bg-slate-900 text-slate-400'
                              }`}>{task.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Right Column: Today's Field Operations Timeline */}
                  <div className="p-5 rounded-2xl bg-[#090d16]/30 border border-slate-850 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Today's Operations Timeline</h3>
                    <div className="relative pl-3 border-l border-slate-850 space-y-5">
                      {todayInstalls.length > 0 ? (
                        todayInstalls.map((inst, idx) => {
                          const isPending = inst.status === 'pending';
                          return (
                            <div key={idx} className="relative text-xs">
                              <span className={`absolute -left-[16.5px] top-1 w-2 h-2 rounded-full border border-slate-900 ${
                                isPending ? 'bg-blue-500' : inst.status === 'in_progress' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              <div className="space-y-1">
                                <span className="font-semibold text-white block">{inst.customer_name}</span>
                                <span className="text-[10px] text-slate-400 block font-light">{inst.task_type} &mdash; 👷 {inst.technician_name || 'Crew unassigned'}</span>
                                <span className="text-[9px] text-slate-550 block uppercase font-bold">{inst.status}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-555 italic">No scheduled tasks logged for today.</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* 5. Right-Side detailed appointment profile drawer */}
                {selectedInstallTask && (() => {
                  const techConflictWarning = checkTechConflict(
                    selectedInstallTask.assigned_employee_id,
                    selectedInstallTask.due_date,
                    selectedInstallTask.id
                  );

                  return (
                    <div className="fixed inset-0 z-[60] bg-slate-955/80 backdrop-blur-sm flex justify-end">
                      <div className="w-[480px] max-w-full h-full bg-[#080d16] border-l border-slate-850 shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar animate-slide-in-right">
                        
                        <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                          <h3 className="text-base font-extrabold text-white">Installation Details</h3>
                          <button onClick={() => setSelectedInstallTask(null)} className="text-slate-400 hover:text-white text-base font-bold">✕ Close</button>
                        </div>

                        {techConflictWarning && (
                          <div className="p-3.5 rounded-2xl bg-amber-955/20 border border-amber-900/40 text-xs text-amber-400 space-y-1">
                            <span className="font-bold block">⚠️ Schedule Conflict Warning</span>
                            <p className="text-[10px] leading-relaxed">
                              {selectedInstallTask.technician_name} is already assigned to another field operation schedule on this date.
                            </p>
                          </div>
                        )}

                        {/* Customer details */}
                        <div className="p-4 rounded-2xl bg-slate-955 border border-slate-850 space-y-3.5 text-xs">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Subscriber Parameters</span>
                          <div className="space-y-2.5 text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Name</span>
                              <span className="font-semibold text-white">{selectedInstallTask.customer_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">ID Reference</span>
                              <span className="font-mono text-cyan-405">CUST-{selectedInstallTask.customer_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Contact Number</span>
                              <span>{selectedInstallTask.customer_phone || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Installation parameters */}
                        <div className="p-4 rounded-2xl bg-slate-955 border border-slate-850 space-y-3.5 text-xs">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Field parameters</span>
                          <div className="space-y-2.5 text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Installation Type</span>
                              <span className="font-semibold text-white">{selectedInstallTask.task_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-505 text-slate-500">Target Date</span>
                              <span>{new Date(selectedInstallTask.due_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Current Status</span>
                              <span className="font-bold uppercase text-cyan-405">{selectedInstallTask.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-505">Address Coordinates</span>
                              <span className="truncate block max-w-[240px]">{selectedInstallTask.customer_address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Reassign Tech Dropdown */}
                        <div className="space-y-2 pt-2 border-t border-slate-850">
                          <span className="text-[9px] text-slate-550 block font-semibold uppercase">Reassign Crew Dispatch</span>
                          <div className="space-y-2">
                            <select
                              id="installAssignTechSelector"
                              className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-855 text-slate-300 text-xs focus:outline-none"
                              defaultValue={selectedInstallTask.assigned_employee_id || (techniciansList[0]?.id || '')}
                            >
                              {techniciansList.map((t) => (
                                <option key={t.id} value={t.id.toString()}>
                                  {t.name} ({t.active_jobs} active jobs)
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={async () => {
                                const techSel = document.getElementById('installAssignTechSelector');
                                if (techSel) {
                                  const val = techSel.value;
                                  try {
                                    const response = await fetch('http://localhost:5000/api/employee/assign-technician', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        type: 'task',
                                        ticketId: parseInt(selectedInstallTask.id, 10),
                                        technicianId: parseInt(val, 10)
                                      }),
                                      credentials: 'include'
                                    });
                                    if (!response.ok) {
                                      const err = await response.json();
                                      throw new Error(err.error || 'Assignment failed.');
                                    }
                                    showToast(`Technician assigned successfully.`);
                                    loadPortalData(true);
                                    setSelectedInstallTask(null);
                                  } catch (err) {
                                    alert(err.message);
                                  }
                                }
                              }}
                              className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.98] duration-150"
                            >
                              Update Assigned Crew
                            </button>
                          </div>
                        </div>

                        {/* Lifecycle update actions */}
                        <div className="pt-4 border-t border-slate-850 flex flex-col space-y-2 mt-auto">
                          {selectedInstallTask.status === 'pending' && (
                            <button
                              onClick={() => {
                                handleUpdateTaskStatus(selectedInstallTask.id, 'in_progress');
                                setSelectedInstallTask(null);
                              }}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl"
                            >
                              Mark In Progress
                            </button>
                          )}
                          {selectedInstallTask.status !== 'completed' && (
                            <button
                              onClick={() => {
                                handleUpdateTaskStatus(selectedInstallTask.id, 'completed');
                                setSelectedInstallTask(null);
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                            >
                              Mark Completed
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedInstallTask(null)}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-450 hover:text-white font-bold text-xs rounded-xl transition-all"
                          >
                            Close Drawer
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })()}

                {/* 6. Multi-Step "+ Schedule Installation" Wizard Modal */}
                {showCreateInstallWizard && (
                  <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
                      
                      {/* Wizard Header */}
                      <div className="flex justify-between items-center border-b border-slate-805 pb-3">
                        <div>
                          <h3 className="font-extrabold text-white text-base">Schedule Connection Installation</h3>
                          <span className="text-[10px] text-slate-500">Step {wizardStep} of 5 &mdash; Scheduling wizard</span>
                        </div>
                        <button onClick={() => setShowCreateInstallWizard(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
                      </div>

                      {/* Wizard Steps */}
                      <div className="text-xs min-h-[220px]">
                        
                        {/* Step 1: Customer */}
                        {wizardStep === 1 && (
                          <div className="space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Step 1: Select Customer</span>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500">Subscriber Name</label>
                              <select
                                value={wizardForm.customerId}
                                onChange={(e) => setWizardForm({ ...wizardForm, customerId: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-slate-300 text-xs focus:outline-none"
                              >
                                {customersList.map(c => (
                                  <option key={c.id} value={c.id.toString()}>{c.name} ({c.email})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Step 2: Installation parameters */}
                        {wizardStep === 2 && (
                          <div className="space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Step 2: Field parameters</span>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-500">Installation Type</label>
                                <select
                                  value={wizardForm.requestType}
                                  onChange={(e) => setWizardForm({ ...wizardForm, requestType: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-slate-350 text-xs focus:outline-none"
                                >
                                  <option value="Installation">Installation</option>
                                  <option value="New Connection">New Connection</option>
                                  <option value="Fiber Repair">Fiber Repair</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-550">Severity priority</label>
                                <select
                                  value={wizardForm.priority}
                                  onChange={(e) => setWizardForm({ ...wizardForm, priority: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-slate-350 text-xs focus:outline-none"
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                  <option value="urgent">Urgent</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-550">Task Description Notes</label>
                              <textarea
                                placeholder="Describe connection requirements..."
                                value={wizardForm.description}
                                onChange={(e) => setWizardForm({ ...wizardForm, description: e.target.value })}
                                rows="3"
                                className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-855 text-white placeholder-slate-600 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* Step 3: Schedule Date */}
                        {wizardStep === 3 && (
                          <div className="space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Step 3: Schedule Date</span>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500">Installation Target Date</label>
                              <input
                                type="date"
                                required
                                value={wizardForm.dueDate}
                                onChange={(e) => setWizardForm({ ...wizardForm, dueDate: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* Step 4: Technician Assignment */}
                        {wizardStep === 4 && (
                          <div className="space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Step 4: Select crew dispatch</span>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-500">Select crew dispatcher</label>
                              <select
                                value={wizardForm.technicianId}
                                onChange={(e) => setWizardForm({ ...wizardForm, technicianId: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-805 text-slate-350 text-xs focus:outline-none"
                              >
                                {techniciansList.map(t => (
                                  <option key={t.id} value={t.id.toString()}>{t.name} (Active: {t.active_jobs} jobs)</option>
                                ))}
                              </select>
                            </div>
                            {checkTechConflict(wizardForm.technicianId, wizardForm.dueDate) && (
                              <div className="p-3 bg-amber-955/20 border border-amber-900/40 rounded-xl text-[10px] text-amber-400">
                                ⚠️ Schedule Conflict: Selected technician already has active tasks on this date.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 5: Confirmation */}
                        {wizardStep === 5 && (() => {
                          const customerObj = customersList.find(c => c.id.toString() === wizardForm.customerId.toString());
                          const techObj = techniciansList.find(t => t.id.toString() === wizardForm.technicianId.toString());

                          return (
                            <div className="space-y-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Step 5: Review & Confirm</span>
                              <div className="p-3.5 rounded-xl bg-slate-955 border border-slate-850 space-y-2 text-[10px] text-slate-305">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Subscriber:</span>
                                  <span className="text-white font-bold">{customerObj?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Type:</span>
                                  <span className="text-white font-bold">{wizardForm.requestType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Scheduled Date:</span>
                                  <span className="text-cyan-405 font-bold">{wizardForm.dueDate}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Crew dispatch:</span>
                                  <span className="text-white font-bold">{techObj?.name || 'Unassigned'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                      </div>

                      {/* Wizard Footer controls */}
                      <div className="pt-3 border-t border-slate-805 flex justify-between">
                        {wizardStep > 1 ? (
                          <button
                            onClick={() => setWizardStep(wizardStep - 1)}
                            className="px-4.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white font-bold rounded-xl"
                          >
                            Back
                          </button>
                        ) : (
                          <div />
                        )}

                        {wizardStep < 5 ? (
                          <button
                            onClick={() => {
                              if (wizardStep === 3 && !wizardForm.dueDate) {
                                alert("Please select a target installation date.");
                                return;
                              }
                              setWizardStep(wizardStep + 1);
                            }}
                            className="px-4.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl"
                          >
                            Next Step
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch('http://localhost:5000/api/employee/requests', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    customerId: parseInt(wizardForm.customerId, 10),
                                    requestType: wizardForm.requestType,
                                    description: wizardForm.description,
                                    priority: wizardForm.priority,
                                    dueDate: wizardForm.dueDate,
                                    assignedEmployeeId: wizardForm.technicianId ? parseInt(wizardForm.technicianId, 10) : null
                                  }),
                                  credentials: 'include'
                                });
                                if (!response.ok) {
                                  const err = await response.json();
                                  throw new Error(err.error || 'Failed to create task request.');
                                }
                                showToast("Installation schedule created successfully.");
                                loadPortalData(true);
                                setShowCreateInstallWizard(false);
                              } catch (err) {
                                alert(err.message);
                              }
                            }}
                            className="px-4.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-bold rounded-xl shadow-lg transition-all"
                          >
                            Confirm Installation
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ==============================================
              TAB 9: OPERATIONAL REPORTS
              ============================================== */}
          {activeTab === 'Reports' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="pb-4 border-b border-[#111827]">
                <h2 className="text-lg font-bold text-white">ISP Operations & Analytics Reports</h2>
                <p className="text-xs text-slate-400">View diagnostic visual charts, trouble ticket performance, and customer growth dynamics.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SLA performance card */}
                <div className="p-5 rounded-2xl bg-[#090d16]/30 border border-[#111827] space-y-5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Trouble Ticket Performance SLA</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Complaints Resolution Rate:</span>
                        <span className="font-bold text-white">
                          {loading ? '...' : stats.openComplaints === 0 ? '100%' : '92.4%'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: stats.openComplaints === 0 ? '100%' : '92.4%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>New Connections Deployment SLA:</span>
                        <span className="font-bold text-white">88.5%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: '88.5%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database counts summary */}
                <div className="p-5 rounded-2xl bg-[#090d16]/30 border border-[#111827] space-y-4 text-xs">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Operational Aggregates Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                      <span className="text-slate-500 text-[10px]">Registered Packages:</span>
                      <strong className="text-white block mt-1 text-sm">{packagesList.length} packages</strong>
                    </div>
                    <div className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl">
                      <span className="text-slate-500 text-[10px]">Active Technicians:</span>
                      <strong className="text-white block mt-1 text-sm">{techniciansList.length} members</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==============================================
              TAB 10: NOTIFICATIONS HUB
              ============================================== */}
          {activeTab === 'Notifications' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#111827]">
                <div>
                  <h2 className="text-lg font-bold text-white">Notifications Registry Hub</h2>
                  <p className="text-xs text-slate-400">View real-time deployment notifications, system alerts, and task dispatch logs.</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkNotificationsAsRead}
                    className="px-3.5 py-1.5 bg-[#090d16] hover:bg-slate-900 border border-slate-800 hover:text-white text-slate-300 font-bold text-xs rounded-xl transition-colors"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              {loading ? (
                <div className="h-40 bg-slate-900/30 rounded-2xl animate-pulse" />
              ) : notifications.length > 0 ? (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-3.5 max-h-[500px] overflow-y-auto custom-scrollbar shadow-xl">
                  {notifications.map((notif, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleMarkNotificationAsRead(notif)}
                      className={`p-4 rounded-xl border flex items-start justify-between cursor-pointer transition-all duration-150 animate-fade-in-up ${
                        notif.is_read
                          ? 'bg-slate-950/20 border-slate-900 text-slate-405'
                          : 'bg-[#090d16] border-slate-800 text-white hover:border-cyan-500/20 shadow-md shadow-cyan-500/5'
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
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl opacity-60">🔔</span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">No notifications</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">You're all caught up! New operations updates will appear here.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================
              TAB 11: MY PROFILE & SETTINGS
              ============================================== */}
          {activeTab === 'Profile' && (
            <div className="space-y-6 animate-fade-in-up">
              
              <div className="pb-4 border-b border-[#111827]">
                <h2 className="text-lg font-bold text-white">Employee Account Settings</h2>
                <p className="text-xs text-slate-400">Configure notifications, edit personal profile data, and update password credentials.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Account Details Card */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-[#090d16]/30 border border-[#111827] space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-lg">
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
                          <span className="text-slate-550 text-slate-500 block text-[9px] uppercase font-bold">Email Address:</span>
                          <span className="text-white block font-semibold mt-1">{profile?.email || 'ali.raza@isp.com'}</span>
                        </div>
                        <div>
                          <span className="text-slate-505 text-slate-550 text-slate-500 block text-[9px] uppercase font-bold">Employee Code:</span>
                          <span className="text-white block font-semibold mt-1">{profile?.employee_code || 'EMP-3042'}</span>
                        </div>
                        <div>
                          <span className="text-slate-505 text-slate-550 text-slate-500 block text-[9px] uppercase font-bold">Contact Phone:</span>
                          <span className="text-white block font-medium mt-1">{profile?.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-505 text-slate-550 text-slate-500 block text-[9px] uppercase font-bold">Office Address:</span>
                          <span className="text-white block font-medium mt-1">{profile?.address || 'N/A'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold rounded-xl text-slate-300 hover:text-white transition-colors active:scale-[0.98]"
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
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors active:scale-[0.98]"
                        >
                          Save Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditProfileForm({ phone: profile?.phone || '', address: profile?.address || '' });
                            setIsEditingProfile(false);
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 font-semibold rounded-xl active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Change Password Forms */}
                <div className="p-6 rounded-2xl bg-[#090d16]/30 border border-[#111827] space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Update Security Credentials</h4>
                  {passwordError && <p className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-xl border border-red-900/40">{passwordError}</p>}
                  
                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">New Password</label>
                      <input
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-105 text-white font-bold rounded-xl active:scale-[0.98] transition-all"
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
      {selectedItem && (() => {
        const isTask = !!selectedItem.task_type;
        const ticketIdText = isTask ? `TSK-${selectedItem.id}` : `CMP-${selectedItem.id}`;
        const createdDate = new Date(selectedItem.created_at || new Date()).toLocaleString();
        const subjectText = selectedItem.subject || selectedItem.task_type || 'Customer requested service assistance.';
        const descriptionText = selectedItem.description || 'No detailed logs provided.';
        const customerName = selectedItem.customer_name;
        const customerPhone = selectedItem.customer_phone || 'N/A';
        const customerEmail = selectedItem.customer_email || 'N/A';
        const customerAddress = selectedItem.customer_address || 'N/A';
        const activePlan = selectedItem.package_name || 'Broadband Link';

        return (
          <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-[850px] max-w-full rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-850 bg-slate-950/30 flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-none">
                      {ticketIdText} &mdash; Support Ledger
                    </h3>
                    <span className="text-[10px] text-slate-505 block mt-1">Logged on {createdDate}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>

              {/* Main Split Content */}
              <div className="flex-grow p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Left Side: Ticket Metadata & Timeline (3 Columns) */}
                <div className="md:col-span-3 space-y-5 text-xs">
                  
                  {/* Subject & Description Card */}
                  <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-slate-850 space-y-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Ticket Subject & Details</span>
                    <h4 className="text-sm font-extrabold text-white leading-snug">{subjectText}</h4>
                    <p className="text-slate-300 leading-relaxed font-light mt-1.5 whitespace-pre-wrap">{descriptionText}</p>
                  </div>

                  {/* Customer Information */}
                  <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-slate-855 space-y-3">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Subscriber Parameters</span>
                    <div className="grid grid-cols-2 gap-3 text-slate-300">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Subscriber Name</span>
                        <span className="font-semibold text-white">{customerName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Subscription Type</span>
                        <span className="font-semibold text-cyan-405 text-cyan-400">{activePlan}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Contact Phone</span>
                        <span className="font-semibold">{customerPhone}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Email Address</span>
                        <span className="font-semibold truncate block">{customerEmail}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] text-slate-500 block">Installation Address</span>
                        <span className="font-medium text-slate-350">{customerAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conversation Timeline */}
                  <div className="space-y-3">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Activity Lifecycle Timeline</span>
                    <div className="relative pl-4 border-l border-slate-800 space-y-4 ml-1">
                      
                      {/* Event 1 */}
                      <div className="relative">
                        <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500 border border-slate-900" />
                        <div>
                          <span className="font-bold text-white block">Ticket Logged</span>
                          <span className="text-[9.5px] text-slate-450 mt-0.5 block">Ticket parsed and logged to database catalog on {createdDate}</span>
                        </div>
                      </div>

                      {/* Event 2 */}
                      <div className="relative">
                        <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-slate-900" />
                        <div>
                          <span className="font-bold text-white block">Technician Crew Status</span>
                          <span className="text-[9.5px] text-slate-450 mt-0.5 block">
                            {selectedItem.technician_name ? (
                              <span>Assigned to field technician: <strong className="text-cyan-400">{selectedItem.technician_name}</strong></span>
                            ) : (
                              <span className="text-amber-500">Awaiting technician assignment crew dispatch</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Event 3 */}
                      <div className="relative">
                        <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
                        <div>
                          <span className="font-bold text-white block">Resolution Target</span>
                          <span className="text-[9.5px] text-slate-450 mt-0.5 block">
                            {selectedItem.status === 'resolved' || selectedItem.status === 'completed' ? (
                              <span className="text-emerald-400 font-bold">Closed and verified resolved</span>
                            ) : (
                              <span>Currently in <strong className="text-cyan-400 uppercase">{selectedItem.status}</strong> state</span>
                            )}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Right Side: Action Control Panel (2 Columns) */}
                <div className="md:col-span-2 space-y-5 text-xs border-t md:border-t-0 md:border-l border-slate-850 pt-5 md:pt-0 md:pl-5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Ledger Operations</span>
                  
                  {/* Status, Priority Badges */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-955 p-2.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[8px] text-slate-500 block uppercase">Priority</span>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        selectedItem.priority?.toLowerCase() === 'urgent' ? 'bg-red-955/20 border border-red-900/40 text-red-400' :
                        selectedItem.priority?.toLowerCase() === 'high' ? 'bg-amber-955/20 border border-amber-900/40 text-amber-400' :
                        'bg-slate-900 border border-slate-800 text-slate-450'
                      }`}>{selectedItem.priority}</span>
                    </div>

                    <div className="bg-slate-955 p-2.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[8px] text-slate-500 block uppercase">Status</span>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-405 text-cyan-400 font-bold text-[9px] uppercase border border-cyan-800/40">{selectedItem.status}</span>
                    </div>
                  </div>

                  {/* Quick Action: Change Status */}
                  {selectedItem.status !== 'resolved' && selectedItem.status !== 'completed' && (
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-550 block font-semibold uppercase">Quick Status Update</span>
                      <div className="flex space-x-1.5">
                        <button
                          onClick={() => {
                            if (isTask) {
                              handleUpdateTaskStatus(selectedItem.id, 'in_progress');
                            } else {
                              handleUpdateComplaintStatus(selectedItem.id, 'in_progress');
                            }
                            setSelectedItem(null);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/30 border border-cyan-800/40 text-cyan-405 font-bold hover:text-white transition-colors"
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => {
                            if (isTask) {
                              handleUpdateTaskStatus(selectedItem.id, 'completed');
                            } else {
                              handleUpdateComplaintStatus(selectedItem.id, 'resolved');
                            }
                            setSelectedItem(null);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-800/40 text-emerald-450 font-bold hover:text-white transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Action: Assign Crew */}
                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <span className="text-[9px] text-slate-550 block font-semibold uppercase">Reassign Dispatch Crew</span>
                    <div className="space-y-2">
                      <select
                        id="detailsAssignTechSelector"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-855 text-slate-300 text-xs focus:outline-none"
                        defaultValue={selectedItem.assigned_employee_id || (techniciansList[0]?.id || '')}
                      >
                        {techniciansList.map((t) => (
                          <option key={t.id} value={t.id.toString()}>
                            {t.name} ({t.active_jobs} active jobs)
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={async () => {
                          const techSel = document.getElementById('detailsAssignTechSelector');
                          if (techSel) {
                            const val = techSel.value;
                            try {
                              const response = await fetch('http://localhost:5000/api/employee/assign-technician', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  type: isTask ? 'task' : 'complaint',
                                  ticketId: parseInt(selectedItem.id, 10),
                                  technicianId: parseInt(val, 10)
                                }),
                                credentials: 'include'
                              });
                              if (!response.ok) {
                                const err = await response.json();
                                throw new Error(err.error || 'Assignment failed.');
                              }
                              showToast(`Technician assigned successfully.`);
                              loadPortalData(true);
                              setSelectedItem(null);
                            } catch (err) {
                              alert(err.message);
                            }
                          }
                        }}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.98] duration-150"
                      >
                        Update Assignee Crew
                      </button>
                    </div>
                  </div>

                  {/* Mock Action: Internal Note / Reply */}
                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <span className="text-[9px] text-slate-550 block font-semibold uppercase">Client Response & Notes</span>
                    <textarea
                      id="detailsResponseMsgArea"
                      rows="2.5"
                      placeholder="Add an internal operations note or dispatch update message..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-855 text-white placeholder-slate-605 focus:outline-none"
                    />
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => {
                          const area = document.getElementById('detailsResponseMsgArea');
                          if (area && area.value.trim()) {
                            showToast("Internal support note filed.");
                            area.value = '';
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-white font-bold transition-colors"
                      >
                        Internal Note
                      </button>
                      <button
                        onClick={() => {
                          const area = document.getElementById('detailsResponseMsgArea');
                          if (area && area.value.trim()) {
                            showToast("Reply sent to customer dashboard.");
                            area.value = '';
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-cyan-900/10 hover:bg-cyan-900/20 border border-cyan-800/40 text-cyan-405 font-bold hover:text-white transition-colors"
                      >
                        Reply Client
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Footer Buttons */}
              <div className="px-6 py-4 border-t border-slate-855 bg-slate-950/20 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-450 hover:text-white font-bold rounded-xl transition-all"
                >
                  Close Details
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 2. SUBMIT WORK REPORT MODAL FORM */}
      {showReportForm && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Submit Operations Diagnostic Report</h3>
                <span className="text-[10px] text-slate-500">Provide final diagnostics to close this service assignment.</span>
              </div>
              <button onClick={() => { setShowReportForm(false); setSelectedItem(null); }} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitWorkReport} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Problem Diagnosed</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken fiber core at node splice, faulty ONU..."
                  value={reportForm.problem_found}
                  onChange={(e) => setReportForm({ ...reportForm, problem_found: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-805 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Add New ISP Customer</h3>
                <span className="text-[10px] text-slate-500">Register a new client profile into the operations database.</span>
              </div>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Service Address</label>
                <input
                  type="text"
                  placeholder="Physical street address"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Initial Package Plan</label>
                <select
                  value={newCustomerForm.planId}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, planId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  {packagesList.map((p, idx) => (
                    <option key={idx} value={p.id.toString()}>{p.name} (Rs. {p.price.toLocaleString()}/mo)</option>
                  ))}
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
      {showNewRequestModal && (() => {
        const selectedCustomer = customersList.find(c => c.id.toString() === newRequestForm.customerId.toString());
        const customerLabel = selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.customer_code})` : 'Select Customer';

        const jobTypes = [
          { value: 'Installation', label: 'Installation' },
          { value: 'Package Upgrade', label: 'Package Upgrade' },
          { value: 'Package Downgrade', label: 'Package Downgrade' },
          { value: 'Service Transfer', label: 'Service Transfer' },
          { value: 'Disconnection', label: 'Disconnection' },
          { value: 'Fiber Repair', label: 'Fiber Repair' },
          { value: 'Router Replacement', label: 'Router Replacement' },
          { value: 'ONU/ONT Replacement', label: 'ONU/ONT Replacement' }
        ];
        const selectedType = jobTypes.find(t => t.value === newRequestForm.requestType) || jobTypes[0];

        const priorities = [
          { value: 'low', label: 'Low', color: 'text-emerald-400' },
          { value: 'medium', label: 'Medium', color: 'text-cyan-405' },
          { value: 'high', label: 'High', color: 'text-amber-400' },
          { value: 'urgent', label: 'Urgent', color: 'text-red-400' }
        ];
        const selectedPriority = priorities.find(p => p.value === newRequestForm.priority) || priorities[1];

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-slate-805 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-405 text-lg">🛠️</span>
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-none">New Service Connection Request</h3>
                    <span className="text-[10px] text-slate-505 font-light block mt-1">Create a service request and assign the right priority and timeline.</span>
                  </div>
                </div>
                <button onClick={() => setShowNewRequestModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>

              <form onSubmit={handleNewRequestSubmit} className="space-y-4 text-xs">
                
                {/* Select Customer */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Select Customer</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'customer' ? null : 'customer')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white flex justify-between items-center focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    >
                      <span>{customerLabel}</span>
                      <span className="text-[10px] text-slate-500">▼</span>
                    </button>
                    
                    {activeDropdown === 'customer' && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                        <ul className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-[#0a0f1b] border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 custom-scrollbar animate-fade-in-up">
                          {customersList.length > 0 ? (
                            customersList.map((cust) => {
                              const isSelected = newRequestForm.customerId.toString() === cust.id.toString();
                              return (
                                <li
                                  key={cust.id}
                                  onClick={() => {
                                    setNewRequestForm({ ...newRequestForm, customerId: cust.id.toString() });
                                    setActiveDropdown(null);
                                  }}
                                  className={`px-3.5 py-2 hover:bg-[#13223f] cursor-pointer text-xs flex justify-between items-center transition-colors ${
                                    isSelected ? 'bg-[#162a4e]/70 text-cyan-405 font-bold' : 'text-slate-300'
                                  }`}
                                >
                                  <div>
                                    <span className="block leading-tight">{cust.name}</span>
                                    <span className="text-[9px] text-slate-505 font-mono mt-0.5 block">{cust.customer_code}</span>
                                  </div>
                                  {isSelected && <span className="text-[10px]">✓</span>}
                                </li>
                              );
                            })
                          ) : (
                            <li className="px-3.5 py-2.5 text-slate-550 italic text-center">No customers available</li>
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Job Type Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-555 block">Request Job Type</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(activeDropdown === 'jobType' ? null : 'jobType')}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-955 border border-slate-850 text-xs text-white flex justify-between items-center focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                      >
                        <span>{selectedType.label}</span>
                        <span className="text-[10px] text-slate-500">▼</span>
                      </button>
                      
                      {activeDropdown === 'jobType' && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                          <ul className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-[#0a0f1b] border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 custom-scrollbar animate-fade-in-up">
                            {jobTypes.map((type) => {
                              const isSelected = newRequestForm.requestType === type.value;
                              return (
                                <li
                                  key={type.value}
                                  onClick={() => {
                                    setNewRequestForm({ ...newRequestForm, requestType: type.value });
                                    setActiveDropdown(null);
                                  }}
                                  className={`px-3.5 py-2 hover:bg-[#13223f] cursor-pointer text-xs flex justify-between items-center transition-colors ${
                                    isSelected ? 'bg-[#162a4e]/70 text-cyan-405 font-bold' : 'text-slate-350'
                                  }`}
                                >
                                  <span>{type.label}</span>
                                  {isSelected && <span className="text-[10px]">✓</span>}
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Priority Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-555 block">Priority Severity</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(activeDropdown === 'priority' ? null : 'priority')}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-955 border border-slate-850 text-xs text-white flex justify-between items-center focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                      >
                        <span className="flex items-center space-x-2">
                          <span className={selectedPriority.color}>●</span>
                          <span>{selectedPriority.label}</span>
                        </span>
                        <span className="text-[10px] text-slate-500">▼</span>
                      </button>
                      
                      {activeDropdown === 'priority' && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                          <ul className="absolute left-0 right-0 mt-1.5 bg-[#0a0f1b] border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 animate-fade-in-up">
                            {priorities.map((prio) => {
                              const isSelected = newRequestForm.priority === prio.value;
                              return (
                                <li
                                  key={prio.value}
                                  onClick={() => {
                                    setNewRequestForm({ ...newRequestForm, priority: prio.value });
                                    setActiveDropdown(null);
                                  }}
                                  className={`px-3.5 py-2 hover:bg-[#13223f] cursor-pointer text-xs flex justify-between items-center transition-colors ${
                                    isSelected ? 'bg-[#162a4e]/70 text-cyan-405 font-bold' : 'text-slate-350'
                                  }`}
                                >
                                  <span className="flex items-center space-x-2">
                                    <span className={prio.color}>●</span>
                                    <span>{prio.label}</span>
                                  </span>
                                  {isSelected && <span className="text-[10px]">✓</span>}
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>

                </div>

                {/* Due Date Picker */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 block">Due Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={newRequestForm.dueDate}
                        onChange={(e) => setNewRequestForm({ ...newRequestForm, dueDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-955 border border-slate-850 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Description Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Provide parameters and specific setup guidelines..."
                    value={newRequestForm.description}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-500/10 hover:-translate-y-0.5 active:scale-[0.98] duration-150 flex items-center space-x-2"
                  >
                    <span>Submit Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewRequestModal(false)}
                    className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-805 text-slate-400 hover:text-white font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 5. CREATE COMPLAINT MODAL */}
      {showCreateComplaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-805 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">File Customer Operations Complaint</h3>
                <span className="text-[10px] text-slate-500">Log a verified internet downtime or speed complaint ticket.</span>
              </div>
              <button onClick={() => setShowCreateComplaintModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateComplaintSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-555 block">Select Customer</label>
                <select
                  value={newComplaintForm.customerId}
                  onChange={(e) => setNewComplaintForm({ ...newComplaintForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  {customersList.map((cust, idx) => (
                    <option key={idx} value={cust.id.toString()}>{cust.name} ({cust.customer_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Complaint Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Optical Loss, Router Issue"
                    value={newComplaintForm.subject}
                    onChange={(e) => setNewComplaintForm({ ...newComplaintForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-555 block">Severity Priority</label>
                  <select
                    value={newComplaintForm.priority}
                    onChange={(e) => setNewComplaintForm({ ...newComplaintForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Detailed Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Provide symptoms, optical power loss metrics..."
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-805 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Assign Crew Technician</h3>
                <span className="text-[10px] text-slate-500 font-light">Assign field tasks or support complaints to crew technicians.</span>
              </div>
              <button onClick={() => setShowAssignTechModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignTechSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-555 block">Assign Ticket Type</label>
                  <select
                    value={assignForm.type}
                    onChange={(e) => setAssignForm({ ...assignForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="task">Service Request (Task)</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Ticket ID (Number)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1, 2, 14"
                    value={assignForm.ticketId}
                    onChange={(e) => setAssignForm({ ...assignForm, ticketId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-555 block">Select Technician</label>
                <select
                  value={assignForm.technicianId}
                  onChange={(e) => setAssignForm({ ...assignForm, technicianId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  {techniciansList.map((tech, idx) => (
                    <option key={idx} value={tech.id.toString()}>
                      {tech.name} — ({tech.active_jobs} Active Jobs)
                    </option>
                  ))}
                </select>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 7. CUSTOMER DETAILS DRAWER */}
      {showCustomerDrawer && selectedCustomerForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop blur overlay */}
          <div
            onClick={() => setShowCustomerDrawer(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Slider panel content */}
          <div className="w-[480px] max-w-full h-full bg-[#080d16]/98 border-l border-slate-800 shadow-2xl relative z-10 flex flex-col animate-fade-in-up">
            
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 flex items-center justify-center font-bold text-cyan-400">
                  {selectedCustomerForDrawer.full_name?.slice(0, 2).toUpperCase() || selectedCustomerForDrawer.name?.slice(0, 2).toUpperCase() || 'CU'}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-none">{selectedCustomerForDrawer.full_name || selectedCustomerForDrawer.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">{selectedCustomerForDrawer.customer_code}</span>
                </div>
              </div>
              <button onClick={() => setShowCustomerDrawer(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            {loadingDrawerDetails ? (
              <div className="flex-1 p-6 space-y-4">
                <div className="h-6 bg-slate-900 rounded animate-pulse" />
                <div className="h-20 bg-slate-900 rounded animate-pulse" />
                <div className="h-20 bg-slate-900 rounded animate-pulse" />
              </div>
            ) : (
              <div className="flex-grow p-6 overflow-y-auto custom-scrollbar space-y-6 text-xs text-slate-350">
                
                {/* Contact details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-900 pb-1.5">Profile Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 font-medium">Email Address:</span>
                      <p className="text-white font-semibold mt-1 truncate">{selectedCustomerForDrawer.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Phone Number:</span>
                      <p className="text-white font-semibold mt-1">{selectedCustomerForDrawer.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 font-medium">CNIC / Identity:</span>
                      <p className="text-white font-semibold mt-1">{selectedCustomerForDrawer.cnic || 'Not recorded'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 font-medium">Billing Address:</span>
                      <p className="text-white font-semibold mt-1 leading-normal">{selectedCustomerForDrawer.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Connection state */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-900 pb-1.5">Link Specifications</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 font-medium">Service Plan:</span>
                      <p className="text-cyan-405 font-bold mt-1 text-sm">{selectedCustomerForDrawer.package_name || 'No Active package'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Connection Speed:</span>
                      <p className="text-white font-bold mt-1 text-sm">{selectedCustomerForDrawer.speed_mbps ? `${selectedCustomerForDrawer.speed_mbps} Mbps` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Monthly Price:</span>
                      <p className="text-white font-bold mt-1">Rs. {selectedCustomerForDrawer.monthly_price?.toLocaleString() || selectedCustomerForDrawer.package_price?.toLocaleString() || '0'}/mo</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Registration Date:</span>
                      <p className="text-white font-medium mt-1">{new Date(selectedCustomerForDrawer.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Bills & balance */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-900 pb-1.5">Financial Statement</h4>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-850">
                    <div>
                      <span className="text-slate-505">Outstanding balance:</span>
                      <strong className="text-white text-sm block mt-0.5">PKR {selectedCustomerForDrawer.outstanding_balance?.toLocaleString() || '0'}</strong>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      selectedCustomerForDrawer.outstanding_balance > 0 ? 'bg-amber-955/20 text-amber-400' : 'bg-emerald-950 text-emerald-450 text-emerald-450 border border-emerald-900/30'
                    }`}>
                      {selectedCustomerForDrawer.outstanding_balance > 0 ? 'Unpaid dues' : 'Settled'}
                    </span>
                  </div>
                </div>

                {/* Recent Tasks */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-900 pb-1.5">Service Requests Timeline</h4>
                  {drawerDetails.tasks && drawerDetails.tasks.length > 0 ? (
                    <div className="space-y-2.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {drawerDetails.tasks.slice(0, 3).map((t, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-950/20 border border-slate-900 flex justify-between items-center">
                          <div>
                            <strong className="text-white block">{t.task_type}</strong>
                            <span className="text-[10px] text-slate-505">Target Date: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase text-cyan-405">{t.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-505 italic text-[11px] py-2">No past technical requests found.</p>
                  )}
                </div>

                {/* Recent Complaints */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-900 pb-1.5">Registered Complaints</h4>
                  {drawerDetails.complaints && drawerDetails.complaints.length > 0 ? (
                    <div className="space-y-2.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {drawerDetails.complaints.slice(0, 3).map((comp, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-955/20 border border-slate-900 flex justify-between items-center">
                          <div>
                            <strong className="text-white block truncate max-w-[200px]">{comp.subject}</strong>
                            <span className="text-[10px] text-slate-505">Created: {new Date(comp.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase text-cyan-405">{comp.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-505 italic text-[11px] py-2">No complaints logged.</p>
                  )}
                </div>

              </div>
            )}

            {/* Drawer Actions Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#060b13] flex gap-3">
              <button
                onClick={() => {
                  setEditCustomerForm({
                    id: selectedCustomerForDrawer.id,
                    name: selectedCustomerForDrawer.full_name || selectedCustomerForDrawer.name,
                    email: selectedCustomerForDrawer.email,
                    phone: selectedCustomerForDrawer.phone,
                    cnic: selectedCustomerForDrawer.cnic || '',
                    address: selectedCustomerForDrawer.address || ''
                  });
                  setShowEditCustomerModal(true);
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold rounded-xl active:scale-[0.98] transition-all"
              >
                Edit Profile
              </button>
              <button
                onClick={() => { setShowCustomerDrawer(false); setActiveTab('ServicePlans'); }}
                className="flex-1 py-2.5 bg-[#070b14] hover:bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl"
              >
                View Plan
              </button>
              <button
                onClick={() => { setShowCustomerDrawer(false); setActiveTab('Billing'); }}
                className="flex-1 py-2.5 bg-[#070b14] hover:bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-xl"
              >
                View Billing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. EDIT CUSTOMER MODAL */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-805 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Edit Customer Profile</h3>
                <span className="text-[10px] text-slate-505 font-light">Update contact and residential details for this subscriber.</span>
              </div>
              <button onClick={() => setShowEditCustomerModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleEditCustomerSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={editCustomerForm.name}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editCustomerForm.email}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editCustomerForm.phone}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">CNIC / Identity Card</label>
                <input
                  type="text"
                  placeholder="e.g. 37405-xxxxxxx-x"
                  value={editCustomerForm.cnic}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, cnic: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Service Address</label>
                <input
                  type="text"
                  value={editCustomerForm.address}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all">
                  Save Changes
                </button>
                <button type="button" onClick={() => setShowEditCustomerModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 font-bold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. ADD PACKAGE MODAL */}
      {showAddPackageModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-slate-805 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Add New Internet Package</h3>
                <span className="text-[10px] text-slate-505 font-light">Create a new broadband plan in the ISP package catalog.</span>
              </div>
              <button onClick={() => setShowAddPackageModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePackageSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Fiber Pro"
                  value={newPackageForm.name}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Download Speed (Mbps)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={newPackageForm.speed_mbps}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, speed_mbps: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Monthly Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 2500"
                    value={newPackageForm.monthly_price}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, monthly_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Data Allowance Limit (GB)</label>
                  <input
                    type="number"
                    placeholder="Leave empty for Unlimited"
                    value={newPackageForm.data_limit_gb}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, data_limit_gb: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Catalogue Status</label>
                  <select
                    value={newPackageForm.status}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-xs text-white focus:outline-none"
                  >
                    <option value="active">Active (Available)</option>
                    <option value="inactive">Inactive (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Description & Service Inclusions</label>
                <textarea
                  rows={2}
                  placeholder="Describe broadband details, installation inclusions, routing specs..."
                  value={newPackageForm.description}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]">
                  Create Package
                </button>
                <button type="button" onClick={() => setShowAddPackageModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 font-bold rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. EDIT PACKAGE MODAL */}
      {showEditPackageModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-slate-805 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Edit Service Package</h3>
                <span className="text-[10px] text-slate-505 font-light">Modify catalogue configuration parameters for this broadband plan.</span>
              </div>
              <button onClick={() => setShowEditPackageModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleEditPackageSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Package Name</label>
                <input
                  type="text"
                  required
                  value={editPackageForm.name}
                  onChange={(e) => setEditPackageForm({ ...editPackageForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Download Speed (Mbps)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editPackageForm.speed_mbps}
                    onChange={(e) => setEditPackageForm({ ...editPackageForm, speed_mbps: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Monthly Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editPackageForm.monthly_price}
                    onChange={(e) => setEditPackageForm({ ...editPackageForm, monthly_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Data Allowance Limit (GB)</label>
                  <input
                    type="number"
                    placeholder="Leave empty for Unlimited"
                    value={editPackageForm.data_limit_gb}
                    onChange={(e) => setEditPackageForm({ ...editPackageForm, data_limit_gb: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Catalogue Status</label>
                  <select
                    value={editPackageForm.status}
                    onChange={(e) => setEditPackageForm({ ...editPackageForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-855 text-xs text-white focus:outline-none"
                  >
                    <option value="active">Active (Available)</option>
                    <option value="inactive">Inactive (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Description & Service Inclusions</label>
                <textarea
                  rows={2}
                  placeholder="Describe broadband details..."
                  value={editPackageForm.description}
                  onChange={(e) => setEditPackageForm({ ...editPackageForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-850 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]">
                  Save Changes
                </button>
                <button type="button" onClick={() => setShowEditPackageModal(false)} className="px-4 py-2 bg-slate-900 text-slate-400 font-bold rounded-xl">
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
