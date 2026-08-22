import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Input Validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        // Crucial: Send and store HTTP-only cookies in browser session
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please try again.');
      }

      // Execute login parent callback and redirect to admin dashboard
      onLoginSuccess(data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex items-center justify-center overflow-hidden font-sans select-none">
      
      {/* 1. Subtle Radial Glow Background Behind centered Card */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-cyan-500/5 to-indigo-500/5 blur-[140px] opacity-80" />
      </div>

      {/* 2. Technical Decorative Faint Labels */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden md:block text-[9px] font-mono text-slate-700/25 tracking-widest uppercase">
        <div className="absolute top-10 left-10">ISP CORE SYSTEM // AUTH_SVC</div>
        <div className="absolute bottom-10 left-10">DATA LINK STATUS: SECURED</div>
        <div className="absolute top-10 right-10">PORTAL ROLE: ADMINISTRATOR</div>
        <div className="absolute bottom-10 right-10">NODE ROUTE: NAS_CORE_01</div>
      </div>

      {/* 3. Left Side Network Visualization Backdrop */}
      <div className="absolute top-0 bottom-0 left-0 w-1/3 z-0 pointer-events-none hidden md:block opacity-40">
        <svg className="w-full h-full text-cyan-500/15" viewBox="0 0 300 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Connection Lines */}
          <line x1="60" y1="120" x2="180" y2="250" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="180" y1="250" x2="80" y2="380" stroke="currentColor" strokeWidth="1" />
          <line x1="80" y1="380" x2="220" y2="520" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="180" y1="250" x2="220" y2="520" stroke="currentColor" strokeWidth="1" />

          {/* Glowing Network Nodes */}
          <circle cx="60" cy="120" r="4.5" className="fill-slate-950 stroke-cyan-500/40 stroke-2" />
          <circle cx="180" cy="250" r="6" className="fill-slate-950 stroke-cyan-500/60 stroke-2" />
          <circle cx="80" cy="380" r="4.5" className="fill-slate-950 stroke-cyan-500/40 stroke-2" />
          <circle cx="220" cy="520" r="5" className="fill-slate-950 stroke-cyan-500/50 stroke-2" />

          {/* Drifting Data Packets */}
          <circle r="3" fill="#22d3ee" className="shadow-lg">
            <animate attributeName="cx" values="60;180;80;60" dur="10s" repeatCount="indefinite" />
            <animate attributeName="cy" values="120;250;380;120" dur="10s" repeatCount="indefinite" />
          </circle>

          <circle r="2.5" fill="#818cf8">
            <animate attributeName="cx" values="180;220;180" dur="7s" repeatCount="indefinite" />
            <animate attributeName="cy" values="250;520;250" dur="7s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* 4. Right Side Network Visualization Backdrop */}
      <div className="absolute top-0 bottom-0 right-0 w-1/3 z-0 pointer-events-none hidden md:block opacity-40">
        <svg className="w-full h-full text-indigo-500/15" viewBox="0 0 300 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Connection Lines */}
          <line x1="240" y1="100" x2="120" y2="240" stroke="currentColor" strokeWidth="1" />
          <line x1="120" y1="240" x2="200" y2="420" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="200" y1="420" x2="90" y2="560" stroke="currentColor" strokeWidth="1" />

          {/* Radar pulsing ring */}
          <g className="opacity-80">
            <circle cx="200" cy="420" r="25" stroke="currentColor" strokeWidth="0.75" className="animate-ping" />
            <circle cx="200" cy="420" r="10" stroke="currentColor" strokeWidth="1" />
          </g>

          {/* Glowing Network Nodes */}
          <circle cx="240" cy="100" r="5" className="fill-slate-950 stroke-indigo-500/50 stroke-2" />
          <circle cx="120" cy="240" r="4" className="fill-slate-950 stroke-indigo-500/40 stroke-2" />
          <circle cx="200" cy="420" r="6" className="fill-slate-950 stroke-indigo-500/60 stroke-2" />
          <circle cx="90" cy="560" r="4.5" className="fill-slate-950 stroke-indigo-500/40 stroke-2" />

          {/* Drifting Data Packets */}
          <circle r="3" fill="#818cf8">
            <animate attributeName="cx" values="240;120;200;240" dur="12s" repeatCount="indefinite" />
            <animate attributeName="cy" values="100;240;420;100" dur="12s" repeatCount="indefinite" />
          </circle>

          <circle r="2.5" fill="#22d3ee">
            <animate attributeName="cx" values="200;90;200" dur="8s" repeatCount="indefinite" />
            <animate attributeName="cy" values="420;560;420" dur="8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* 5. Centered Glass Login Card Component */}
      <div className="w-[440px] max-w-[90%] p-8 rounded-[26px] bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden flex flex-col space-y-6 animate-fade-in-up duration-[350ms] border-cyan-500/10">
        
        {/* Subtle top edge glow */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Card Header & Logo */}
        <div className="text-center space-y-3.5 animate-fade-in duration-[500ms]">
          {/* Logo container with float hover animation */}
          <div className="w-15 h-15 w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-650 flex items-center justify-center shadow-lg shadow-cyan-500/15 animate-float relative ring-1 ring-cyan-500/25">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold tracking-widest text-cyan-405 text-cyan-400 uppercase">ISP Management</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admin Control Portal</p>
          </div>
        </div>

        {/* Welcome titles */}
        <div className="text-center space-y-1 animate-fade-in duration-[600ms]">
          <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="text-slate-400 text-xs font-light">Sign in to continue to your ISP command center</p>
        </div>

        {/* Auth Forms */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/35 text-red-400 text-xs flex items-center space-x-2.5 animate-pulse">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Email input field */}
          <div className="space-y-1.5 animate-fade-in duration-[650ms]">
            <label className="text-[10px] font-bold tracking-wider text-slate-405 text-slate-400 uppercase" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                👤
              </div>
              <input
                id="email"
                type="email"
                placeholder="admin@yourisp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-655 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/80 transition-colors text-sm disabled:opacity-50 font-medium"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-1.5 animate-fade-in duration-[700ms]">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold tracking-wider text-slate-405 text-slate-400 uppercase" htmlFor="password">
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert('Password recovery operations require system administrator intervention.'); }}
                className="text-[9px] font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-wider"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                🔒
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-950 border border-slate-900 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/80 transition-colors text-sm disabled:opacity-50 font-bold"
              />
              {/* Show/Hide password toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-505 text-slate-500 hover:text-white focus:outline-none disabled:opacity-50 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit action button */}
          <div className="pt-2 animate-fade-in duration-[750ms]">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-cyan-500/15 disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-2 text-sm border border-cyan-400/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>

        </form>

        {/* Footer info links */}
        <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-900/60 animate-fade-in duration-[800ms] leading-normal font-light">
          ISP secure connection active. Login attempts are monitored and logged to system database files.
        </div>

      </div>

    </div>
  );
}

export default AdminLogin;
