import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function EmployeeLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom deactivated error states
  const [deactivatedError, setDeactivatedError] = useState(null);
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDeactivatedError(null);
    setGeneralError('');

    try {
      const response = await fetch('http://localhost:5000/api/employee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        // Assert specific deactivated context response structure
        if (data.error === 'Account Deactivated') {
          setDeactivatedError({
            title: data.error,
            message: data.message || 'Your account has been deactivated by the administrator. Please contact your administrator for assistance.'
          });
        } else {
          setGeneralError(data.error || 'Failed to authenticate.');
        }
        return;
      }

      // Login success
      onLoginSuccess(data.user);
      navigate('/employee');
    } catch (err) {
      setGeneralError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-cyan-500 selection:text-slate-950 relative">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-650/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/50 border border-slate-900 backdrop-blur-md shadow-2xl relative space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-655 items-center justify-center shadow-lg shadow-cyan-500/10 mb-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white">Staff Member Portal</h2>
          <p className="text-slate-500 text-xs font-light">Log in with employee credentials provided by administration</p>
        </div>

        {/* Custom Deactivated Status Warning Display */}
        {deactivatedError && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/30 text-red-300 space-y-1 text-xs animate-pulse">
            <div className="font-bold flex items-center space-x-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{deactivatedError.title}</span>
            </div>
            <p className="leading-relaxed text-slate-400 font-light">{deactivatedError.message}</p>
          </div>
        )}

        {/* General Authentication Error Warn */}
        {generalError && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/30 text-red-400 text-xs font-medium italic flex items-center space-x-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{generalError}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Work Email</label>
            <input
              type="email"
              required
              placeholder="e.g. employee@yourisp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Login Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-white placeholder:text-slate-655 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-655 font-bold text-white shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span>Verify credentials & Login</span>
            )}
          </button>
        </form>

        {/* Back Link to Admin Portal */}
        <div className="pt-2 text-center border-t border-slate-900/60">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-[11px] font-semibold text-slate-500 hover:text-cyan-400 transition-colors"
          >
            Go back to Administrator Login
          </button>
        </div>

      </div>
    </div>
  );
}

export default EmployeeLogin;
