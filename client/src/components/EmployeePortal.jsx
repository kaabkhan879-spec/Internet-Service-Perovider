import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function EmployeePortal({ user, onLogoutSuccess }) {
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const loadEmployeeProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/employee/profile', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          // Deactivated user or unauthenticated session
          onLogoutSuccess();
          navigate('/employee/login');
          return;
        }
        throw new Error('Failed to load employee profile files.');
      }
      const data = await response.json();
      setProfile(data);

      // Fetch assigned complaints
      const complaintsRes = await fetch(`http://localhost:5000/api/admin/employees/${data.employee_id}`, { credentials: 'include' });
      if (complaintsRes.ok) {
        const details = await complaintsRes.json();
        setComplaints(details.complaints || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeeProfile();
  }, []);

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans w-full selection:bg-cyan-500 selection:text-slate-950">
      
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">Employee Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500/10 to-indigo-550/5 border border-cyan-500/20 text-cyan-400">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>My Profile Workspace</span>
          </button>
        </nav>

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
            <span className="font-extrabold text-sm uppercase text-white">Staff Portal</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">My Workspace</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{profile?.name || user?.name}</p>
              <p className="text-cyan-500 text-xs mt-0.5 tracking-wider uppercase">{profile?.employee_role || 'Employee'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-650/20 border border-slate-800 flex items-center justify-center text-cyan-400 font-extrabold text-sm animate-pulse">
              {(profile?.name || user?.name)?.slice(0, 2).toUpperCase() || 'ST'}
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
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Syncing staff profile logs...</span>
            </div>
          ) : error ? (
            <div className="p-5 rounded-2xl bg-red-950/40 border border-red-800/30 text-red-400 text-center font-medium italic">
              {error}
            </div>
          ) : !profile ? (
            <div className="text-center py-10 text-slate-655">No employee records were found.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              
              {/* Profile Card Summary */}
              <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900/30 border border-slate-900 space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-655 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl">
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{profile.name}</h3>
                    <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">{profile.employee_role}</p>
                    <p className="text-slate-500 text-[10px] font-mono mt-1">{profile.employee_code}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-850 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-white font-medium">{profile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="text-slate-300 font-medium">{profile.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CNIC:</span>
                    <span className="text-slate-300 font-mono font-medium">{profile.cnic || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Designation:</span>
                    <span className="text-slate-300 font-medium">{profile.designation || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Joined:</span>
                    <span className="text-slate-350">{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Assignments / Tasks Grid */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Tickets Roster */}
                <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 space-y-4">
                  <h3 className="text-lg font-black text-white">Assigned Complaint Tickets</h3>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-850">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-400 font-bold uppercase">
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Assigned Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complaints.length > 0 ? (
                          complaints.map((c) => (
                            <tr key={c.id} className="border-b border-slate-950/20 text-slate-300 hover:bg-slate-905/10">
                              <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[220px]">{c.subject}</td>
                              <td className="py-2.5 px-3 uppercase">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  c.priority === 'high' ? 'bg-red-950/30 text-red-400' : 'bg-slate-950 text-slate-450'
                                }`}>
                                  {c.priority}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 uppercase text-[10px] font-semibold text-cyan-400">{c.status}</td>
                              <td className="py-2.5 px-3 text-slate-500 text-right">{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-6 text-center text-slate-655 italic">You have no assigned support complaints.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assigned Tasks lists (Empty states) */}
                <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 space-y-3">
                  <h3 className="text-lg font-black text-white">Assigned Technical Tasks</h3>
                  <div className="p-8 rounded-2xl border border-slate-850 border-dashed text-center text-slate-600 italic text-xs">
                    No technical deployment tasks currently assigned to you.
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}

export default EmployeePortal;
