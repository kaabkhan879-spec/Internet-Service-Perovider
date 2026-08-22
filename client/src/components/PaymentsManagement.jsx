import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatPKR = (amount) => {
  const val = parseFloat(amount) || 0;
  return `Rs. ${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

function PaymentsManagement({ user, onLogoutSuccess }) {
  const [payments, setPayments] = useState([]);
  const [bills, setBills] = useState([]); // Loaded for record payment selection
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'Paid', 'Partial', 'Failed'
  const [methodFilter, setMethodFilter] = useState(''); // '', 'Cash', 'Bank Transfer', 'Easypaisa', 'JazzCash', 'Other'
  const [dateFilter, setDateFilter] = useState(''); // '', e.g., '2026-08'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Payments');
  const navigate = useNavigate();

  // Modal control states
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState(null);
  
  // Record Form state controls
  const [recordForm, setRecordForm] = useState({
    bill_id: '',
    amount: '',
    payment_method: 'Cash',
    transaction_reference: '',
    notes: '',
    payment_date: new Date().toISOString().slice(0, 10),
    status: 'Paid'
  });
  const [selectedBillInfo, setSelectedBillInfo] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Sidebar navigation options (12 items)
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

  // Fetch payments list
  const fetchPayments = async (searchStr = '', statusVal = '', methodVal = '', dateVal = '') => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/admin/payments';
      const params = [];
      if (searchStr.trim()) params.push(`search=${encodeURIComponent(searchStr.trim())}`);
      if (statusVal) params.push(`status=${encodeURIComponent(statusVal)}`);
      if (methodVal) params.push(`payment_method=${encodeURIComponent(methodVal)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load payment records.');
      let data = await response.json();

      // Client filter for date/month if specified
      if (dateVal) {
        data = data.filter(p => {
          if (!p.payment_date) return false;
          return p.payment_date.slice(0, 7) === dateVal || p.billing_month === dateVal;
        });
      }

      setPayments(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load payments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unpaid bills for dropdown
  const fetchUnpaidBills = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/bills', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBills(data.filter(b => b.status !== 'paid'));
      }
    } catch (err) {
      console.error('[Payments] Error loading unpaid bills:', err.message);
    }
  };

  useEffect(() => {
    fetchPayments(search, statusFilter, methodFilter, dateFilter);
    fetchUnpaidBills();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchPayments(val, statusFilter, methodFilter, dateFilter);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchPayments('', statusFilter, methodFilter, dateFilter);
  };

  const handleStatusFilterChange = (statusVal) => {
    setStatusFilter(statusVal);
    fetchPayments(search, statusVal, methodFilter, dateFilter);
  };

  const handleMethodFilterChange = (methodVal) => {
    setMethodFilter(methodVal);
    fetchPayments(search, statusFilter, methodVal, dateFilter);
  };

  const handleDateFilterChange = (e) => {
    const val = e.target.value;
    setDateFilter(val);
    fetchPayments(search, statusFilter, methodFilter, val);
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

  // Open Record Payment Modal
  const handleOpenRecordModal = () => {
    fetchUnpaidBills();
    setRecordForm({
      bill_id: '',
      amount: '',
      payment_method: 'Cash',
      transaction_reference: '',
      notes: '',
      payment_date: new Date().toISOString().slice(0, 10),
      status: 'Paid'
    });
    setSelectedBillInfo(null);
    setShowRecordModal(true);
  };

  // Handle Bill Selector change in Record Payment Modal
  const handleBillSelect = (e) => {
    const billId = e.target.value;
    setRecordForm(prev => ({ ...prev, bill_id: billId }));

    if (!billId) {
      setSelectedBillInfo(null);
      return;
    }

    const bill = bills.find(b => b.id.toString() === billId.toString());
    if (bill) {
      setSelectedBillInfo(bill);
      setRecordForm(prev => ({ ...prev, amount: bill.remaining_balance.toString() }));
    }
  };

  // Submit record payment form
  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.bill_id) return alert('Please select a bill.');

    const paymentAmount = parseFloat(recordForm.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return alert('Payment amount must be greater than zero.');
    }

    if (selectedBillInfo && paymentAmount > selectedBillInfo.remaining_balance) {
      return alert(`Overpayment blocked! Amount cannot exceed the remaining balance of Rs. ${selectedBillInfo.remaining_balance.toLocaleString()}.`);
    }

    const confirmed = window.confirm(`Confirm recording payment of Rs. ${paymentAmount.toLocaleString()} via ${recordForm.payment_method}?`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to record payment.');

      setShowRecordModal(false);
      fetchPayments(search, statusFilter, methodFilter, dateFilter);
      fetchUnpaidBills();
      
      setToastMessage(`Payment of ${formatPKR(paymentAmount)} recorded successfully!`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // View specific payment details modal
  const handleOpenDetails = async (id) => {
    setSelectedPaymentDetails(null);
    setShowDetailsModal(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/payments/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load payment details.');
      const data = await response.json();
      setSelectedPaymentDetails(data);
    } catch (err) {
      alert(err.message);
      setShowDetailsModal(false);
    }
  };

  // Dynamic computations driven from real Neon database records
  const totalCollected = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const partialCount = payments.filter(p => p.status === 'Partial').length;
  const failedCount = payments.filter(p => p.status === 'Failed').length;

  // Render payments sparkline trend if data is populated
  const renderSparkline = () => {
    if (payments.length < 3) {
      return (
        <div className="h-full flex items-center justify-center border border-slate-900 bg-slate-950/20 rounded-2xl p-4 text-slate-600 text-xs italic">
          Not enough payment data yet
        </div>
      );
    }

    // Dynamic scale helper based on amounts
    const cleanAmounts = payments.map(p => parseFloat(p.amount) || 0);
    const maxVal = Math.max(...cleanAmounts) || 1;
    const minVal = Math.min(...cleanAmounts) || 0;
    const range = maxVal - minVal || 1;

    // Build SVG points coordinates
    const points = payments.slice(0, 10).map((p, index) => {
      const x = (index * (120 / 9)).toFixed(1);
      const y = (32 - (((parseFloat(p.amount) || 0) - minVal) / range) * 26).toFixed(1);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-32 h-10 text-cyan-400 overflow-visible" viewBox="0 0 120 32">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans w-full selection:bg-cyan-500 selection:text-slate-955">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-400 text-sm shadow-xl flex items-center space-x-3 animate-fade-in ring-1 ring-cyan-500/25">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-955/80 bg-slate-950/80 backdrop-blur-md hidden md:flex flex-col h-screen sticky top-0 z-40">
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-650 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">ISP Management</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleSidebarClick(item.name)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                activeTab === item.name || item.name === 'Payments'
                  ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400 shadow-md'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
              }`}
            >
              <svg className={`w-5 h-5 transition-transform group-hover:scale-105 ${activeTab === item.name || item.name === 'Payments' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              <span>{item.name}</span>
              {(activeTab === item.name || item.name === 'Payments') && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-subtle" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-955/20 hover:bg-red-950/20 hover:text-red-300 border border-transparent transition-all duration-250"
          >
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Header bar */}
        <header className="border-b border-slate-900 bg-slate-955/40 bg-slate-950/40 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm uppercase text-white">ISP Admin</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Payment Logs</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{user?.name || 'Administrator'}</p>
              <p className="text-slate-500 text-xs mt-0.5 tracking-wider uppercase">{user?.role || 'admin'}</p>
            </div>
            {/* Avatar container with online status */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-650/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-sm shadow-md ring-1 ring-cyan-500/25">
                {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <button onClick={handleLogout} className="md:hidden p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto fade-in-up">
          
          {/* Header title */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-cyan-950/20 border border-cyan-800/35 flex items-center justify-center text-cyan-400 shadow-md">
                💳
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Payment Center</h2>
                <p className="text-slate-500 text-xs font-light mt-0.5">Manage customer payments, transactions, balances and payment history.</p>
              </div>
            </div>
            
            <button
              onClick={handleOpenRecordModal}
              disabled={actionLoading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 font-bold text-white text-xs hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center space-x-2 border border-cyan-400/20 disabled:opacity-50"
            >
              {actionLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>Record Payment</span>
            </button>
          </div>

          {/* Error handling block */}
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-slate-900 bg-slate-955/20 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center text-red-400 animate-pulse">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Unable to load payments</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-normal">
                  The payment records lookup failed. Confirm server is active and try again.
                </p>
              </div>
              <button
                onClick={() => { setError(''); fetchPayments(search, statusFilter, methodFilter, dateFilter); }}
                className="px-4 py-2 rounded-lg bg-red-955/20 border border-red-900/30 text-red-400 text-xs font-semibold hover:bg-red-900 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Payment Summary Metric Cards & Visualization Row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                
                {/* 4 Metrics Cards */}
                <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  {/* Total Collected */}
                  <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Collected</p>
                      <h4 className="text-base sm:text-lg font-black text-emerald-400">{formatPKR(totalCollected)}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-805/20 flex items-center justify-center text-emerald-400 shadow">
                      💰
                    </div>
                  </div>

                  {/* Paid Payments */}
                  <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Paid Payments</p>
                      <h4 className="text-xl font-black text-white">{paidCount}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/20 border border-cyan-805/20 flex items-center justify-center text-cyan-400 shadow">
                      ✓
                    </div>
                  </div>

                  {/* Partial Payments */}
                  <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Partial Payments</p>
                      <h4 className="text-xl font-black text-white text-amber-500">{partialCount}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-amber-955/20 border border-amber-805 flex items-center justify-center text-amber-450 shadow">
                      ◓
                    </div>
                  </div>

                  {/* Failed Payments */}
                  <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex items-center justify-between group glass-card">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Failed Payments</p>
                      <h4 className="text-xl font-black text-white text-red-500">{failedCount}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-red-955/20 border border-red-805 flex items-center justify-center text-red-400 shadow">
                      ⚠
                    </div>
                  </div>

                </div>

                {/* Collection Trend SVG Sparkline */}
                <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900/80 flex flex-col justify-between glass-card">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Collection Trend</p>
                    <span className="text-[9px] text-cyan-400 bg-cyan-950/25 border border-cyan-900/35 px-1.5 py-0.5 rounded font-bold">Real Data</span>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-xs text-slate-500">Weekly specs</span>
                    {renderSparkline()}
                  </div>
                </div>

              </div>

              {/* Filtering Controls (Translucent bar style) */}
              <div className="p-4 rounded-2xl bg-slate-900/25 border border-slate-905 border-slate-900 backdrop-blur-md space-y-4 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  
                  {/* Search box */}
                  <div className="relative w-full md:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search payments by customer name, Payment ID, Bill ID or Reference ID..."
                      value={search}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 transition-colors text-xs shadow-inner animate-focus"
                    />
                    {search && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-550 hover:text-white transition-colors"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Payment Method filter dropdown */}
                  <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-900">
                    <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0 tracking-wider">Method:</label>
                    <select
                      value={methodFilter}
                      onChange={(e) => handleMethodFilterChange(e.target.value)}
                      className="w-full bg-transparent text-slate-205 focus:outline-none text-xs text-white"
                    >
                      <option value="" className="bg-slate-950 text-slate-400">All Methods</option>
                      <option value="Cash" className="bg-slate-950 text-white">Cash</option>
                      <option value="Bank Transfer" className="bg-slate-950 text-white">Bank Transfer</option>
                      <option value="Easypaisa" className="bg-slate-950 text-white">Easypaisa</option>
                      <option value="JazzCash" className="bg-slate-950 text-white">JazzCash</option>
                      <option value="Other" className="bg-slate-950 text-white">Other</option>
                    </select>
                  </div>

                  {/* Period date filter selector */}
                  <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-900">
                    <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0 tracking-wider">Period:</label>
                    <input
                      type="month"
                      value={dateFilter}
                      onChange={handleDateFilterChange}
                      className="bg-transparent text-slate-205 focus:outline-none text-xs text-white"
                    />
                  </div>

                </div>

                {/* Pill Status tabs */}
                <div className="flex flex-wrap gap-2 pt-3.5 border-t border-slate-900/50 animate-fade-in">
                  {[
                    { name: 'All Payments', value: '' },
                    { name: 'Paid (Full)', value: 'Paid' },
                    { name: 'Partial', value: 'Partial' },
                    { name: 'Failed', value: 'Failed' }
                  ].map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => handleStatusFilterChange(tab.value)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                        statusFilter === tab.value
                          ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/25 text-cyan-400 font-bold shadow-md shadow-cyan-500/5'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payments log table catalog */}
              <div className="rounded-2xl border border-slate-900 bg-slate-955/20 bg-slate-950/20 backdrop-blur-sm overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-6 space-y-3.5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="shimmer-loader h-14 rounded-xl opacity-20" />
                      ))}
                    </div>
                  ) : payments.length === 0 ? (
                    /* Beautiful Empty State illustration */
                    <div className="py-24 text-center max-w-md mx-auto space-y-6 animate-fade-in">
                      <div className="relative w-16 h-16 rounded-full bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-center text-cyan-400 mx-auto">
                        <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-md pulse-subtle" />
                        <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-white text-base">No payments yet</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Payment transactions will appear here once a customer payment is recorded.
                        </p>
                      </div>
                      <button
                        onClick={handleOpenRecordModal}
                        className="px-4 py-2 rounded-xl bg-cyan-955/25 border border-cyan-800/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-900 transition-colors inline-block"
                      >
                        Record Payment
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-4 px-4">Payment ID</th>
                          <th className="py-4 px-4">Customer Name</th>
                          <th className="py-4 px-4">Bill ID</th>
                          <th className="py-4 px-4">Billing Month</th>
                          <th className="py-4 px-4">Amount Paid</th>
                          <th className="py-4 px-4">Payment Date</th>
                          <th className="py-4 px-4">Method</th>
                          <th className="py-4 px-4">Reference No.</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-slate-950/60 table-row-hover text-slate-300">
                            <td className="py-4 px-4 font-mono font-bold text-slate-450 text-[10px]">#{p.id}</td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-white text-sm">{p.customer_name}</div>
                              <div className="text-slate-505 text-slate-500 font-light text-[10px] tracking-wider uppercase mt-0.5">{p.customer_code}</div>
                            </td>
                            <td className="py-4 px-4 font-mono text-slate-350">#{p.bill_id || '-'}</td>
                            <td className="py-4 px-4 text-slate-400">{p.billing_month || '-'}</td>
                            <td className="py-4 px-4 text-emerald-400 font-black text-sm">{formatPKR(p.amount)}</td>
                            <td className="py-4 px-4 text-slate-350">
                              {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold text-slate-205 text-slate-300 flex items-center space-x-1">
                                <span>{p.payment_method === 'Cash' ? '💵' : '🏦'}</span>
                                <span>{p.payment_method}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-slate-350 text-[10px]">{p.transaction_reference || <span className="text-slate-600 italic">None</span>}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center w-fit space-x-1.5 ${
                                p.status === 'Paid'
                                  ? 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400'
                                  : p.status === 'Partial'
                                  ? 'bg-amber-955/30 border border-amber-800/30 text-amber-400'
                                  : 'bg-red-955/20 border border-red-800/30 text-red-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  p.status === 'Paid' ? 'bg-emerald-400' :
                                  p.status === 'Partial' ? 'bg-amber-450' : 'bg-red-400 animate-ping'
                                }`} />
                                <span>{p.status}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleOpenDetails(p.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 hover:text-cyan-305 transition-all duration-200 hover:scale-105 active:scale-95"
                                title="View Ledger Details"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* 3. MODAL: Record Payment Form */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto relative scrollbar-thin animate-fade-in">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white">Record Invoice Payment</h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
              
              {/* Select Unpaid Bill selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Select Unpaid/Partial Bill invoice:</label>
                <select
                  required
                  value={recordForm.bill_id}
                  onChange={handleBillSelect}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose Pending Bill --</option>
                  {bills.map(b => (
                    <option key={b.id} value={b.id}>
                      Invoice #{b.id} - {b.customer_name} ({b.billing_month}) - Balance: Rs. {b.remaining_balance.toLocaleString()}
                    </option>
                  ))}
                </select>
                {bills.length === 0 && (
                  <p className="text-amber-500 text-[10px] italic mt-1">No unpaid or partially paid bills available.</p>
                )}
              </div>

              {/* Selected Bill Info Profile */}
              {selectedBillInfo && (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-850 space-y-2 animate-fade-in">
                  <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[9px]">Bill Profile Overview</h4>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div><span className="text-slate-500">Customer:</span> <strong className="text-white">{selectedBillInfo.customer_name}</strong></div>
                    <div><span className="text-slate-500">Customer Code:</span> <strong className="text-slate-350 uppercase font-mono">{selectedBillInfo.customer_code}</strong></div>
                    <div><span className="text-slate-500">Package:</span> <strong className="text-slate-350">{selectedBillInfo.package_name}</strong></div>
                    <div><span className="text-slate-500">Billing Month:</span> <strong className="text-white">{selectedBillInfo.billing_month}</strong></div>
                    
                    <div className="col-span-2 border-t border-slate-900 pt-2 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Total Bill</span>
                        <span className="text-slate-300 font-bold">Rs. {selectedBillInfo.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Already Paid</span>
                        <span className="text-slate-300 font-bold">Rs. {selectedBillInfo.total_paid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-cyan-400 block text-[9px] uppercase font-bold">Remaining</span>
                        <span className="text-cyan-400 font-black">Rs. {selectedBillInfo.remaining_balance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Input Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Enter Payment Amount */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment Amount (Rs.):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Enter amount to pay..."
                    value={recordForm.amount}
                    onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 text-sm font-bold text-emerald-400"
                  />
                </div>

                {/* Select Payment Method */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment Method:</label>
                  <select
                    required
                    value={recordForm.payment_method}
                    onChange={(e) => setRecordForm({ ...recordForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Transaction/Ref Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Transaction Reference ID {recordForm.payment_method === 'Cash' ? '(Optional)' : '(Required)'}:
                  </label>
                  <input
                    type="text"
                    required={recordForm.payment_method !== 'Cash'}
                    placeholder="Reference code..."
                    value={recordForm.transaction_reference}
                    onChange={(e) => setRecordForm({ ...recordForm, transaction_reference: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* Payment Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment Date:</label>
                  <input
                    type="date"
                    required
                    value={recordForm.payment_date}
                    onChange={(e) => setRecordForm({ ...recordForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment Capture Status Setting:</label>
                <select
                  required
                  value={recordForm.status}
                  onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Paid">Paid (Successful)</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Optional Collection Notes:</label>
                <textarea
                  placeholder="Record description or reference information..."
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-955 bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-350 font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 text-white font-bold disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {actionLoading ? 'Saving...' : 'Save Collection Record'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 4. MODAL: View Payment Details */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 relative animate-fade-in">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white">Payment Collection Details</h3>
              <button onClick={() => { setShowDetailsModal(false); setSelectedPaymentDetails(null); }} className="text-slate-505 text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {!selectedPaymentDetails ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-slate-505 text-slate-505 text-slate-500 font-bold uppercase tracking-wider">Syncing collection details...</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                
                {/* Profile detail */}
                <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-3 text-xs">
                  <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Customer Contact Profile</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-550 text-slate-500 block">Name:</span>
                      <strong className="text-white">{selectedPaymentDetails.customer_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-550 text-slate-500 block">Customer Code:</span>
                      <strong className="text-slate-300 font-mono uppercase">{selectedPaymentDetails.customer_code}</strong>
                    </div>
                    <div>
                      <span className="text-slate-550 text-slate-500 block">Phone:</span>
                      <span className="text-slate-350">{selectedPaymentDetails.customer_phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-555 text-slate-500 block">Email:</span>
                      <span className="text-slate-350 truncate block">{selectedPaymentDetails.customer_email}</span>
                    </div>
                  </div>
                </div>

                {/* Collection Specs */}
                <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-3 text-xs">
                  <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">Transaction Parameters</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                    <div><span className="text-slate-500">Invoice ID:</span> <strong className="text-slate-305 text-slate-300 font-mono">#{selectedPaymentDetails.bill_id}</strong></div>
                    <div><span className="text-slate-500">Billing Month:</span> <strong className="text-slate-305 text-slate-300">{selectedPaymentDetails.billing_month}</strong></div>
                    <div><span className="text-slate-500">Payment ID:</span> <strong className="text-slate-305 text-slate-300 font-mono">#{selectedPaymentDetails.id}</strong></div>
                    <div><span className="text-slate-500">Payment Date:</span> <span className="text-slate-305 text-slate-300">{new Date(selectedPaymentDetails.payment_date).toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Method:</span> <strong className="text-white">{selectedPaymentDetails.payment_method}</strong></div>
                    <div><span className="text-slate-500">Reference ID:</span> <strong className="text-white font-mono">{selectedPaymentDetails.transaction_reference || '-'}</strong></div>
                    
                    <div className="col-span-2 border-t border-slate-900 pt-2 flex justify-between items-center">
                      <div>
                        <span className="text-slate-505 text-slate-500 text-[9px] uppercase font-bold block">Amount Paid</span>
                        <span className="text-emerald-400 text-base font-black">Rs. {selectedPaymentDetails.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-505 text-slate-500 text-[9px] uppercase font-bold block text-right">Status</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          selectedPaymentDetails.status === 'Paid' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' : 'bg-amber-955/30 text-amber-400 border border-amber-800/30'
                        }`}>
                          {selectedPaymentDetails.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedPaymentDetails.notes && (
                  <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-855 border-slate-900 space-y-1">
                    <span className="text-slate-505 text-slate-500 block uppercase font-bold text-[9px]">Collector Notes:</span>
                    <p className="text-slate-300 leading-relaxed font-light">{selectedPaymentDetails.notes}</p>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default PaymentsManagement;
