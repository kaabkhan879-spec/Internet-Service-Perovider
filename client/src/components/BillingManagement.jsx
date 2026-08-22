import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const formatPKR = (amount) => {
  const val = parseFloat(amount) || 0;
  return `Rs. ${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

function BillingManagement({ user, onLogoutSuccess }) {
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]); // Loaded for generating bills
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'paid', 'unpaid', 'overdue'
  const [monthFilter, setMonthFilter] = useState(''); // 'YYYY-MM'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Billing');
  const navigate = useNavigate();

  // Modals visibility states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Focus entity states
  const [selectedBillDetails, setSelectedBillDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Forms state controls
  const [addForm, setAddForm] = useState({ customer_id: '', billing_month: new Date().toISOString().slice(0, 7), due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
  const [paymentForm, setPaymentForm] = useState({ bill_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'Cash', transaction_reference: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Sidebar navigation options (13 items)
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

  // Fetch bills with filters
  const fetchBills = async (searchStr = '', statusVal = '', monthVal = '') => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/admin/bills';
      const params = [];
      if (searchStr.trim()) params.push(`search=${encodeURIComponent(searchStr.trim())}`);
      if (statusVal) params.push(`status=${statusVal}`);
      if (monthVal) params.push(`billing_month=${monthVal}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load generated invoices.');
      const data = await response.json();
      setBills(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('[Billing] Error loading customer records:', err.message);
    }
  };

  useEffect(() => {
    fetchBills(search, statusFilter, monthFilter);
    fetchCustomersList();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchBills(val, statusFilter, monthFilter);
  };

  const handleStatusTabChange = (statusVal) => {
    setStatusFilter(statusVal);
    fetchBills(search, statusVal, monthFilter);
  };

  const handleMonthFilterChange = (e) => {
    const val = e.target.value;
    setMonthFilter(val);
    fetchBills(search, statusFilter, val);
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

  // Generate Bill Submit
  const handleGenerateBillSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.customer_id) return alert('Please select a customer.');
    if (!addForm.billing_month) return alert('Please specify a billing month.');
    if (!addForm.due_date) return alert('Please specify a due date.');

    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate customer bill.');

      setShowAddModal(false);
      alert('Invoice generated successfully.');
      fetchBills(search, statusFilter, monthFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch Specific Invoice Details
  const fetchBillDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/bills/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load bill transaction logs.');
      const data = await response.json();
      setSelectedBillDetails(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenViewModal = (id) => {
    setShowViewModal(true);
    fetchBillDetails(id);
  };

  const handleOpenPaymentModal = (bill) => {
    // Calculate remaining balance dynamically
    const remaining = bill.remaining_balance !== undefined ? bill.remaining_balance : bill.amount - bill.total_paid;
    setPaymentForm({
      bill_id: bill.id,
      amount: remaining.toFixed(2),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      transaction_reference: ''
    });
    setShowPaymentModal(true);
  };

  // Record Payment Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(paymentForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) return alert('Please enter a valid payment amount.');

    const confirmSubmit = window.confirm(`Are you sure you want to log a payment of Rs. ${amountVal.toLocaleString()} for this invoice?`);
    if (!confirmSubmit) return;

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/bills/${paymentForm.bill_id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to log payment transaction.');

      setShowPaymentModal(false);
      alert('Payment transaction logged successfully.');
      fetchBills(search, statusFilter, monthFilter);
      // If view modal is open, refresh detail files
      if (showViewModal && selectedBillDetails?.bill?.id === paymentForm.bill_id) {
        fetchBillDetails(paymentForm.bill_id);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans w-full selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-400 text-sm shadow-xl flex items-center space-x-3 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md hidden md:flex flex-col h-screen sticky top-0 animate-fade-in">
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">ISP Management</span>
          </div>
        </div>

        {/* Scrollable sidebar items list */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleSidebarClick(item.name)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeTab === item.name
                  ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent'
              }`}
            >
              <svg className={`w-5 h-5 transition-transform group-hover:scale-105 ${activeTab === item.name ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-350'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 border border-transparent transition-all duration-250"
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
        <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between sticky top-0 z-35">
          <div className="flex items-center space-x-4 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm uppercase text-white">ISP Admin</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Billing & Invoices</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{user?.name || 'Administrator'}</p>
              <p className="text-slate-500 text-xs mt-0.5 tracking-wider uppercase">{user?.role || 'admin'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-650/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-sm">
              {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <button onClick={handleLogout} className="md:hidden p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Pane */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* Header controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-900">
            <div>
              <h2 className="text-2xl font-black text-white">Billing Management</h2>
              <p className="text-slate-500 text-xs mt-0.5">Generate monthly customer invoices, track balances, and record payments</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-655 font-semibold text-white text-xs hover:scale-[1.01] hover:shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Generate Bill</span>
            </button>
          </div>

          {/* Filtering Area */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 backdrop-blur-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Box */}
              <div className="relative w-full md:flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search bills by customer name, customer code, or phone..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-655 focus:outline-none focus:border-cyan-500 transition-colors text-xs"
                />
              </div>

              {/* Month Selector Filter */}
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Month:</label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={handleMonthFilterChange}
                  className="w-full md:w-40 px-3 py-2 rounded-lg bg-slate-950 border border-slate-900 text-slate-350 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
            </div>

            {/* Status tab filters */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900/50">
              {[
                { name: 'All Invoices', value: '' },
                { name: 'Paid', value: 'paid' },
                { name: 'Unpaid', value: 'unpaid' },
                { name: 'Overdue', value: 'overdue' }
              ].map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => handleStatusTabChange(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    statusFilter === tab.value
                      ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/20 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">Customer Details</th>
                    <th className="py-4 px-4">Internet Package</th>
                    <th className="py-4 px-4">Billing Month</th>
                    <th className="py-4 px-4">Amount</th>
                    <th className="py-4 px-4">Due Date</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500">
                        <div className="flex justify-center items-center space-x-2 animate-pulse">
                          <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Resolving billing files...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-red-400 font-medium italic">{error}</td>
                    </tr>
                  ) : bills.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-650 font-medium italic">
                        No invoices generated matching filters.
                      </td>
                    </tr>
                  ) : (
                    bills.map((b) => (
                      <tr key={b.id} className="border-b border-slate-950/60 hover:bg-slate-900/10 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-sm">{b.customer_name}</div>
                          <div className="text-slate-500 font-light text-[10px] tracking-wider uppercase mt-0.5">{b.customer_code}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {b.package_name || <span className="text-slate-600 italic">Expired package</span>}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-350">{b.billing_month}</td>
                        <td className="py-4 px-4 font-bold text-slate-200">
                          <div>{formatPKR(b.amount)}</div>
                          {b.remaining_balance > 0 && b.status !== 'paid' && (
                            <div className="text-[10px] text-amber-500 font-normal">Bal: {formatPKR(b.remaining_balance)}</div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-400">{new Date(b.due_date).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            b.status === 'paid'
                              ? 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400'
                              : b.status === 'overdue'
                              ? 'bg-red-950/40 border border-red-800/30 text-red-400 animate-pulse'
                              : 'bg-amber-950/40 border border-amber-800/30 text-amber-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenViewModal(b.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            View
                          </button>
                          {b.status !== 'paid' && (
                            <button
                              onClick={() => handleOpenPaymentModal(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-emerald-400 hover:text-emerald-305 transition-colors"
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* 3. MODAL: Generate Bill */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white">Generate Customer Invoice</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleGenerateBillSubmit} className="space-y-4 text-xs">
              
              {/* Select Customer */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Customer</label>
                <select
                  required
                  value={addForm.customer_id}
                  onChange={(e) => setAddForm({ ...addForm, customer_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.customer_code}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Month Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Billing Month</label>
                <input
                  type="month"
                  required
                  value={addForm.billing_month}
                  onChange={(e) => setAddForm({ ...addForm, billing_month: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Due Date Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={addForm.due_date}
                  onChange={(e) => setAddForm({ ...addForm, due_date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-655 text-white font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {actionLoading ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: Bill Details */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto relative scrollbar-thin">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <div>
                <h3 className="text-lg font-bold text-white">Invoice Details Sheet</h3>
                {selectedBillDetails?.bill && (
                  <p className="text-slate-500 text-[10px] tracking-wider uppercase mt-0.5">Month: {selectedBillDetails.bill.billing_month}</p>
                )}
              </div>
              <button onClick={() => { setShowViewModal(false); setSelectedBillDetails(null); }} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {detailsLoading || !selectedBillDetails ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <svg className="animate-spin h-7 w-7 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading details ledger...</span>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-4 rounded-xl border border-slate-850 text-[11px]">
                  
                  {/* Left Column: Customer Profile */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Customer Profile</h4>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Name:</span>
                      <span className="col-span-2 text-white font-medium">{selectedBillDetails.bill.customer_name}</span>

                      <span className="text-slate-500">Code:</span>
                      <span className="col-span-2 text-slate-300 uppercase">{selectedBillDetails.bill.customer_code}</span>

                      <span className="text-slate-500">Phone:</span>
                      <span className="col-span-2 text-slate-300">{selectedBillDetails.bill.customer_phone}</span>
                    </div>
                  </div>

                  {/* Right Column: Package specs */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">Package Specifications</h4>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Plan:</span>
                      <span className="col-span-2 text-white font-medium">{selectedBillDetails.bill.package_name || 'Expired Package'}</span>

                      <span className="text-slate-500">Speed:</span>
                      <span className="col-span-2 text-slate-300">{selectedBillDetails.bill.speed_mbps ? `${selectedBillDetails.bill.speed_mbps} Mbps` : 'N/A'}</span>

                      <span className="text-slate-500">Price:</span>
                      <span className="col-span-2 text-slate-350">{selectedBillDetails.bill.package_price ? formatPKR(selectedBillDetails.bill.package_price) : 'Rs. 0'}</span>
                    </div>
                  </div>

                </div>

                {/* Ledger metrics */}
                <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-850 space-y-2.5 text-[11px]">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Invoice Summary</h4>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-slate-500">Billing Month:</span>
                    <span className="text-white font-bold text-right">{selectedBillDetails.bill.billing_month}</span>

                    <span className="text-slate-500">Total Invoice Amount:</span>
                    <span className="text-white font-black text-right">{formatPKR(selectedBillDetails.bill.amount)}</span>

                    <span className="text-slate-500">Due Date:</span>
                    <span className="text-slate-300 text-right">{new Date(selectedBillDetails.bill.due_date).toLocaleDateString()}</span>

                    <span className="text-slate-500">Status:</span>
                    <span className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedBillDetails.bill.status === 'paid' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'
                      }`}>
                        {selectedBillDetails.bill.status}
                      </span>
                    </span>

                    <span className="text-slate-500">Paid Date:</span>
                    <span className="text-slate-300 text-right">
                      {selectedBillDetails.bill.paid_at ? new Date(selectedBillDetails.bill.paid_at).toLocaleDateString() : 'N/A'}
                    </span>

                    {/* Show remaining balance if unpaid */}
                    {selectedBillDetails.bill.status !== 'paid' && (
                      <>
                        <span className="text-slate-450 font-bold border-t border-slate-900 pt-2">Remaining Balance:</span>
                        <span className="text-amber-400 font-extrabold text-right border-t border-slate-900 pt-2">
                          {formatPKR(selectedBillDetails.bill.remaining_balance)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Payments logged subtable */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payments Recorded</h4>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-850">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-500 font-bold uppercase">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBillDetails.payments.length > 0 ? (
                          selectedBillDetails.payments.map((p) => (
                            <tr key={p.id} className="border-b border-slate-950/20 text-slate-300 hover:bg-slate-900/5">
                              <td className="py-2.5 px-3">{new Date(p.payment_date).toLocaleDateString()}</td>
                              <td className="py-2.5 px-3 uppercase text-slate-400">{p.payment_method}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">{p.transaction_reference || '-'}</td>
                              <td className="py-2.5 px-3 font-bold text-white text-right">{formatPKR(p.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-slate-600 italic">No payments have been recorded for this bill.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL: Record Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h3 className="text-lg font-bold text-white">Record Bill Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              
              {/* Payment Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payment Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Transaction Reference */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-98471203"
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-805 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-650 text-white font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Commit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default BillingManagement;
