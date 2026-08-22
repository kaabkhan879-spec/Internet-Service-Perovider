import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

// Layout wrapper for consistent look and feel
function Layout({ children, user }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 relative">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              ISP Management System
            </span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
            {user ? (
              <Link to="/admin" className="text-sm font-medium px-4 py-2 rounded-lg bg-cyan-950 border border-cyan-800/50 text-cyan-400 hover:bg-cyan-900 hover:text-cyan-300 transition-all duration-300">
                Dashboard
              </Link>
            ) : (
              <Link to="/admin/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-cyan-950 border border-cyan-800/50 text-cyan-400 hover:bg-cyan-900 hover:text-cyan-300 transition-all duration-300">
                Admin Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs text-slate-650">
        &copy; {new Date().getFullYear()} ISP Management System. All rights reserved.
      </footer>
    </div>
  );
}

// Landing Home Page Component
function Home() {
  return (
    <div className="w-full max-w-4xl text-center space-y-8 animate-fade-in">
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-cyan-400 tracking-wider uppercase shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>v1.0.0 Setup Ready</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
          Next-Generation <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500 bg-clip-text text-transparent">
            ISP Management System
          </span>
        </h1>
        <p className="max-w-xl mx-auto text-base md:text-lg text-slate-400 font-light">
          A high-performance administration and billing system designed for modern Internet Service Providers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300 group text-left">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Customer & Billing</h3>
          <p className="text-sm text-slate-500 font-light">Manage accounts, packages, invoices, and payment tracking seamlessly.</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300 group text-left">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Network Monitoring</h3>
          <p className="text-sm text-slate-500 font-light">Monitor bandwidth usage, client statuses, and infrastructure health dynamically.</p>
        </div>
      </div>

      <div className="pt-4">
        <Link to="/admin" className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all duration-300">
          <span>Go to Admin Portal</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Authenticate session cookie on startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('[App] Session check failed, user unauthenticated.');
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 relative">
        <svg className="animate-spin h-8 w-8 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs font-semibold tracking-widest uppercase">Securing Session Context...</span>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/admin/login" 
            element={user ? <Navigate to="/admin" replace /> : <AdminLogin onLoginSuccess={(u) => setUser(u)} />} 
          />
          <Route 
            path="/admin" 
            element={user ? <AdminDashboard user={user} onLogoutSuccess={() => setUser(null)} /> : <Navigate to="/admin/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
