import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'officer' | 'admin'>('citizen');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, user } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register({
        fullName,
        email,
        phone,
        password,
        role
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="w-12 h-12 rounded bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] mb-8 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-slate-50 tracking-tight leading-tight">
            Join the Civic <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Resolution Network</span>
          </h2>
          <p className="text-lg text-slate-400 font-medium">
            Register today to track, report, and manage your local community infrastructure with our next-generation platform.
          </p>
        </div>
      </div>

      {/* Right Panel: The Form */}
      <div className="flex-[1.2] flex items-center justify-center bg-slate-950 p-4 sm:p-8 relative overflow-hidden overflow-y-auto">
        {/* Subtle mobile glow */}
        <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[80px] rounded-full"></div>

        <div className="w-full max-w-md relative z-10 my-4">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-50 tracking-tight">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-slate-300 hover:text-cyan-400 transition-colors duration-200"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <form className="space-y-4" onSubmit={handleSubmit}>
              
              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-400">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="email" className="block text-sm font-medium text-slate-400">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-400">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="password" className="block text-sm font-medium text-slate-400">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label htmlFor="role" className="block text-sm font-medium text-slate-400">
                  Account Type
                </label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'citizen' | 'officer' | 'admin')}
                  className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="citizen" className="bg-slate-900">Citizen</option>
                  <option value="officer" className="bg-slate-900">Officer</option>
                  <option value="admin" className="bg-slate-900">Admin</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm font-medium mt-4">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
