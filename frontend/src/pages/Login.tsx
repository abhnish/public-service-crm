import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex">
      {/* Left Panel: Visual/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center p-16 border-r border-slate-800">
        {/* Abstract Tech-Forward Background Pattern */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Glowing Accent Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="w-12 h-12 rounded bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] mb-8"></div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-slate-50 tracking-tight leading-tight">
            Secure & Transparent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Public Services</span>
          </h2>
          <p className="text-lg text-slate-400 font-medium">
            Access your unified dashboard to streamline workflows, track active reports, and resolve community anomalies with AI-driven precision.
          </p>
        </div>
      </div>

      {/* Right Panel: The Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle mobile glow */}
        <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[80px] rounded-full"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-slate-50 tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Or{' '}
              <Link
                to="/register"
                className="font-medium text-slate-300 hover:text-cyan-400 transition-colors duration-200"
              >
                create a new account
              </Link>
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-400">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-400">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm font-medium mt-4">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Authenticating...' : 'Sign in to Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
