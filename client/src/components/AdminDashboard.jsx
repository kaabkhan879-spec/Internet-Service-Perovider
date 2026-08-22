import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard({ user, onLogoutSuccess }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        // Crucial: Include credentials to clear backend session cookies
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout request failed.');
      }

      onLogoutSuccess();
      navigate('/admin/login');
    } catch (err) {
      console.error('[Dashboard] Logout error:', err.message);
      // Fallback clean-up on client-side anyway
      onLogoutSuccess();
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-8 relative overflow-hidden animate-fade-in">
      {/* Glow disk */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main card header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-white">ISP Admin Portal</h2>
          <p className="text-slate-400 text-sm font-light">
            Welcome, <span className="text-cyan-400 font-semibold">{user?.name || 'Administrator'}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/30 hover:bg-red-950/20 hover:text-red-300 text-slate-400 transition-all duration-350 disabled:opacity-50 inline-flex items-center space-x-2 self-start"
        >
          {loading ? (
            <span>Logging out...</span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout Session</span>
            </>
          )}
        </button>
      </div>

      {/* Dashboard modules placeholder */}
      <div className="p-8 rounded-2xl bg-slate-950 border border-slate-850/80 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/30 flex items-center justify-center text-cyan-400 animate-pulse">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">System Modules Pending</h3>
          <p className="text-slate-500 text-sm font-light px-4">
            Dashboard modules (Customers, Packages, Billing, Complaints, and Monitoring) will be added in the next step.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
