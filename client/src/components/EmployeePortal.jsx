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

  // Complaints Tab specific filter/search/pagination states
  const [complaintsSearch, setComplaintsSearch] = useState('');
  const [complaintsStatusFilter, setComplaintsStatusFilter] = useState('all'); 
  const [complaintsPriorityFilter, setComplaintsPriorityFilter] = useState('all'); 
  const [complaintsCurrentPage, setComplaintsCurrentPage] = useState(1);
  const complaintsPerPage = 8;

  // Service Requests Tab specific search/filter/pagination states
  const [tasksSearch, setTasksSearch] = useState('');
  const [tasksStatusFilter, setTasksStatusFilter] = useState('all'); 
  const [tasksTypeFilter, setTasksTypeFilter] = useState('all'); 
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const tasksPerPage = 8;

  // Quick Action Modal States
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
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

  const filteredTasks = recentRequests.filter(t => {
    const q = tasksSearch.toLowerCase().trim();
    const matchQ = !q || t.id.toString().includes(q) || t.customer_name?.toLowerCase().includes(q);
    const matchStatus = tasksStatusFilter === 'all' || t.status === tasksStatusFilter;
    const matchType = tasksTypeFilter === 'all' || t.task_type === tasksTypeFilter;
    return matchQ && matchStatus && matchType;
  });

  const filteredComplaints = recentComplaints.filter(c => {
    const q = complaintsSearch.toLowerCase().trim();
    const matchQ = !q || c.id.toString().includes(q) || c.customer_name?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q);
    const matchStatus = complaintsStatusFilter === 'all' || c.status === complaintsStatusFilter;
    const matchPriority = complaintsPriorityFilter === 'all' || c.priority === complaintsPriorityFilter;
    return matchQ && matchStatus && matchPriority;
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
      <aside className="w-64 border-r border-[#111827] bg-[#070b15]/90 backdrop-blur-md hidden lg:flex flex-col h-screen sticky top-0 z-40 shrink-0">
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
                  ? 'bg-gradient-to-r from-cyan-950/20 to-blue-950/10 border border-cyan-500/20 text-cyan-400 font-semibold shadow-inner'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
              }`}
            >
              {activeTab === item.id && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-cyan-400 shadow-lg shadow-cyan-400" />
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
          {activeTab === 'ServiceRequests' && (
            <div className="space-y-6 animate-fade-in-up">
              
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#111827]">
                <div>
                  <h2 className="text-lg font-bold text-white">Operations & Service Requests</h2>
                  <p className="text-xs text-slate-400">Track task deployments, connection setups, and field request pipelines.</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400">
                  <span>Pending Tasks: <strong className="text-white">{filteredTasks.filter(t => t.status !== 'completed').length}</strong></span>
                </div>
              </div>

              {/* Task filters panel */}
              <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center">
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
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
              {loading ? (
                <div className="h-44 bg-slate-900/30 rounded-2xl animate-pulse" />
              ) : filteredTasks.length > 0 ? (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] overflow-x-auto shadow-xl custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#111827] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="pb-3.5 px-3">Task ID</th>
                        <th className="pb-3.5 px-3">Request Type</th>
                        <th className="pb-3.5 px-3">Customer Name</th>
                        <th className="pb-3.5 px-3">Target Date</th>
                        <th className="pb-3.5 px-3">Priority</th>
                        <th className="pb-3.5 px-3">Status</th>
                        <th className="pb-3.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((t, idx) => (
                        <tr key={idx} className="border-b border-[#111827]/40 hover:bg-slate-900/20 text-slate-305 hover:text-white transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-white">TSK-{t.id}</td>
                          <td className="py-3 px-3 font-bold text-white uppercase text-[10px]">{t.task_type}</td>
                          <td className="py-3 px-3">{t.customer_name}</td>
                          <td className="py-3 px-3 text-slate-500">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              t.priority === 'urgent' || t.priority === 'high' ? 'bg-red-950 text-red-400 border border-red-900/40' : 'bg-slate-900 text-slate-550'
                            }`}>{t.priority}</span>
                          </td>
                          <td className="py-3 px-3 uppercase text-[10px] font-bold text-cyan-405 text-cyan-400">{t.status}</td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedItem(t)}
                              className="px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 text-[10px] hover:text-white"
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
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3 animate-fade-in-up stagger-1">
                  <span className="text-3xl opacity-60">📋</span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">No service requests</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">New customer requests will appear here.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================
              TAB 5: COMPLAINTS & SUPPORT (Real database integration)
              ============================================== */}
          {activeTab === 'Complaints' && (
            <div className="space-y-6 animate-fade-in-up">
              
              <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-[#111827]">
                <div>
                  <h2 className="text-lg font-bold text-white">Customer Support complaints</h2>
                  <p className="text-xs text-slate-400">Resolve internet downtime tickets, hardware speed upgrades, and client conflicts.</p>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="px-3 py-1 rounded-xl bg-slate-900 text-xs text-slate-400 font-semibold border border-slate-800">
                    Open Tickets: <strong className="text-white font-extrabold">{filteredComplaints.filter(c => c.status !== 'resolved').length}</strong>
                  </div>
                </div>
              </div>

              {/* Advanced Search & Filtering Toolbar */}
              <div className="p-4 rounded-2xl bg-[#090d16]/30 border border-[#111827] flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[220px] relative">
                  <input
                    type="text"
                    placeholder="Search complaints by ID, Customer Name, Subject..."
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
                    <option value="pending">Pending</option>
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
              {loading ? (
                <div className="h-44 bg-slate-900/30 rounded-2xl animate-pulse" />
              ) : filteredComplaints.length > 0 ? (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] overflow-x-auto shadow-xl custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#111827] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="pb-3.5 px-3">Ticket ID</th>
                        <th className="pb-3.5 px-3">Customer Name</th>
                        <th className="pb-3.5 px-3">Subject / Issue</th>
                        <th className="pb-3.5 px-3">Priority</th>
                        <th className="pb-3.5 px-3">Status</th>
                        <th className="pb-3.5 px-3">Technician</th>
                        <th className="pb-3.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map((c, idx) => (
                        <tr key={idx} className="border-b border-[#111827]/40 hover:bg-slate-900/20 text-slate-350 hover:text-white transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-white">CMP-{c.id}</td>
                          <td className="py-3 px-3 font-semibold text-white">{c.customer_name}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold block text-slate-205 text-slate-200">{c.subject}</span>
                          </td>
                          <td className="py-3 px-3 uppercase">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              c.priority === 'urgent' || c.priority === 'high' ? 'bg-red-955/20 text-red-400 border border-red-900/40' : 'bg-slate-900 text-slate-500'
                            }`}>{c.priority}</span>
                          </td>
                          <td className="py-3 px-3 uppercase text-[10px] font-bold text-cyan-400">{c.status}</td>
                          <td className="py-3 px-3 text-slate-400">{c.technician_name || 'Unassigned'}</td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedItem(c)}
                              className="px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 text-[10px] hover:text-white"
                            >
                              Details
                            </button>
                            {c.status !== 'resolved' && (
                              <button
                                onClick={() => handleUpdateComplaintStatus(c.id, 'resolved')}
                                className="px-2.5 py-1 rounded bg-emerald-600/20 border border-emerald-800 text-[10px] text-emerald-450 text-emerald-400 font-bold hover:bg-emerald-600 hover:text-white transition-colors"
                              >
                                Close Ticket
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3 animate-fade-in-up stagger-1">
                  <span className="text-3xl opacity-60">🎫</span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">No open complaints</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Great! There are currently no complaints requiring attention.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================
              TAB 6: TECHNICIAN COORDINATION
              ============================================== */}
          {activeTab === 'Technicians' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="pb-4 border-b border-[#111827]">
                <h2 className="text-lg font-bold text-white">Technician Crew Registry</h2>
                <p className="text-xs text-slate-400">Coordinate assignees, monitor technician schedules, availability, and active job counters.</p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-40 bg-slate-900/30 rounded-2xl border border-slate-800" />
                  ))}
                </div>
              ) : techniciansList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {techniciansList.map((tech, idx) => {
                    const statusLabel = tech.active_jobs > 0 ? 'On Job' : 'Available';
                    return (
                      <div key={idx} className="p-5 rounded-2xl bg-[#090d16]/30 border border-[#111827] space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center font-bold text-sm text-cyan-400 shadow-md border border-slate-850">
                              {tech.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-white text-sm">{tech.name}</h4>
                              <span className="text-[9px] text-slate-500">Field Technician</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            statusLabel === 'Available' ? 'bg-emerald-950 text-emerald-450 text-emerald-400 border border-emerald-900/40' : 'bg-blue-950 text-blue-400 border border-blue-900/40'
                          }`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="space-y-2 border-t border-slate-900 pt-3.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Contact Phone:</span>
                            <span className="text-slate-300 font-medium">{tech.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Active Job Tasks:</span>
                            <span className="text-white font-bold">{tech.active_jobs} assigned</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setAssignForm({ type: 'task', ticketId: '', technicianId: tech.id.toString() });
                            setShowAssignTechModal(true);
                          }}
                          className="w-full py-2 bg-[#070b14] hover:bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl text-slate-350 hover:text-white transition-colors"
                        >
                          Assign Ticket
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl opacity-60">🔧</span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">No technicians available</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Technician availability will appear here.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================
              TAB 7: BILLING & PAYMENTS
              ============================================== */}
          {activeTab === 'Billing' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="pb-4 border-b border-[#111827]">
                <h2 className="text-lg font-bold text-white">Billing & Payments Registry</h2>
                <p className="text-xs text-slate-400">Track invoice collections, pending client billing files, and check outstanding balances.</p>
              </div>

              {loading ? (
                <div className="h-44 bg-slate-900/30 rounded-2xl animate-pulse" />
              ) : billingList.length > 0 ? (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] overflow-x-auto shadow-xl custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#111827] text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="pb-3.5 px-3">Invoice ID</th>
                        <th className="pb-3.5 px-3">Customer Client</th>
                        <th className="pb-3.5 px-3">Total Amount</th>
                        <th className="pb-3.5 px-3">Payment Status</th>
                        <th className="pb-3.5 px-3">Due Date</th>
                        <th className="pb-3.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingList.map((bill, idx) => (
                        <tr key={idx} className="border-b border-[#111827]/60 hover:bg-slate-900/20 text-slate-350 hover:text-white transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-white">INV-{bill.invoice_id}</td>
                          <td className="py-3 px-3 font-semibold text-white">{bill.customer}</td>
                          <td className="py-3 px-3 font-bold text-white">Rs. {bill.amount.toLocaleString()}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                              bill.status === 'paid' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/40 text-emerald-400' : 'bg-amber-955/20 text-amber-400 border border-amber-900/40'
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">{new Date(bill.due_date).toLocaleDateString()}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => showToast(`Dispatched invoice notification to ${bill.customer}`)}
                              className="px-2.5 py-1 rounded bg-[#090d16] border border-slate-800 text-[10px] hover:text-white font-medium"
                            >
                              Dispatch Reminder
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl opacity-60">💳</span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">No outstanding payments</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">All customer payments are up to date.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==============================================
              TAB 8: INSTALLATIONS SCHEDULES
              ============================================== */}
          {activeTab === 'Installations' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="pb-4 border-b border-[#111827]">
                <h2 className="text-lg font-bold text-white">Installations Calendar Schedules</h2>
                <p className="text-xs text-slate-400">Track and monitor connection installations pipeline and schedule timelines.</p>
              </div>

              {loading ? (
                <div className="h-44 bg-slate-900/30 rounded-2xl animate-pulse" />
              ) : todayInstallationsList.length > 0 ? (
                <div className="p-5 rounded-2xl bg-[#090d16]/20 border border-[#111827] space-y-6 shadow-xl">
                  <div className="relative pl-6 border-l-2 border-slate-850 space-y-6">
                    {todayInstallationsList.map((inst, idx) => (
                      <div key={idx} className="relative text-xs animate-fade-in-up">
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-cyan-500 shadow-md shadow-cyan-500/20" />
                        <span className="text-[10px] font-bold text-cyan-400 block leading-none">{new Date(inst.due_date).toLocaleDateString()}</span>
                        <h4 className="font-extrabold text-white text-sm mt-1.5">New Connection</h4>
                        <p className="text-slate-350 mt-1">Customer Client Profile: <strong className="text-white">{inst.customer_name}</strong></p>
                        <p className="text-slate-350">Assigned Technician: <span className="font-medium text-slate-300">{inst.technician_name || 'Unassigned'}</span></p>
                        <p className="text-slate-400">Service address: <span className="font-light text-slate-400">{inst.customer_address || 'N/A'}</span></p>
                        <div className="mt-2.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            inst.status === 'completed' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/40 text-emerald-400' : 'bg-slate-900 text-slate-500'
                          }`}>
                            {inst.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <span className="text-3xl opacity-60">📅</span>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">No installations scheduled</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Today's installation schedule is clear.</p>
                  </div>
                </div>
              )}
            </div>
          )}

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
      {selectedItem && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Ticket Details - {selectedItem.task_type ? `TSK-${selectedItem.id}` : `CMP-${selectedItem.id}`}
                </h3>
                <span className="text-[10px] text-slate-500">Customer operation dispatch logs.</span>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Client Information</span>
                <p className="text-white font-semibold">Name: {selectedItem.customer_name}</p>
                {selectedItem.customer_phone && <p className="text-slate-300">Contact Number: {selectedItem.customer_phone}</p>}
                {selectedItem.customer_address && <p className="text-slate-350">Service Address: {selectedItem.customer_address}</p>}
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Description</span>
                <p className="p-3 bg-slate-950/20 border border-slate-800 text-slate-300 rounded-xl leading-relaxed">
                  {selectedItem.subject || selectedItem.task_type || 'Customer requested service assistance.'} - {selectedItem.description || 'No detailed logs.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-slate-550 text-slate-500 text-[9px] block uppercase font-bold">Priority Level</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold block text-center mt-1 uppercase text-[10px]">{selectedItem.priority}</span>
                </div>
                <div>
                  <span className="text-slate-550 text-slate-500 text-[9px] block uppercase font-bold">Current Status</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold block text-center mt-1 uppercase text-[10px]">{selectedItem.status}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold rounded-xl text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

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
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[500px] max-w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-805 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">New Service Connection Request</h3>
                <span className="text-[10px] text-slate-500">File a new technical connection or package upgrade request.</span>
              </div>
              <button onClick={() => setShowNewRequestModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleNewRequestSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Select Customer</label>
                <select
                  value={newRequestForm.customerId}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  {customersList.map((cust, idx) => (
                    <option key={idx} value={cust.id.toString()}>{cust.name} ({cust.customer_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-555 block">Request Job Type</label>
                  <select
                    value={newRequestForm.requestType}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, requestType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="Installation">Installation</option>
                    <option value="Fiber Repair">Fiber Repair</option>
                    <option value="Router Replacement">Router Replace</option>
                    <option value="ONU/ONT Replacement">ONU/ONT Replace</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-555 block">Priority Severity</label>
                  <select
                    value={newRequestForm.priority}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 block">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newRequestForm.dueDate}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 block">Description Notes</label>
                <textarea
                  rows="3"
                  placeholder="Provide parameters and specific setup guidelines..."
                  value={newRequestForm.description}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, description: e.target.value })}
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
