import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/80 border-b border-white/5 transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-slate-50 tracking-tight flex items-center gap-2">
              <img src="/logo.png" alt="Smart CRM Logo" className="h-10 w-auto object-contain" />
              Smart <span className="text-cyan-400">CRM</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 text-sm font-medium">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-300 hover:text-white transition-colors hover:bg-slate-800 rounded-full flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              )}
            </button>

            {!user && (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md">
                  Login
                </Link>
                <Link to="/register" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2 rounded-md shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all transform hover:-translate-y-0.5 font-bold">
                  Register
                </Link>
              </>
            )}
            
            {user && (
              <>
                <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md">
                  Dashboard
                </Link>
                
                {user.role === 'citizen' && (
                  <>
                    <Link to="/submit-complaint" className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md">
                      Submit Complaint
                    </Link>
                    <Link to="/my-complaints" className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md">
                      My Complaints
                    </Link>
                  </>
                )}
                
                {user.role === 'admin' && (
                    <>
                      <Link to="/admin" className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md">
                        Admin Dashboard
                      </Link>
                      <Link to="/admin/complaints" className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md">
                        Manage Complaints
                      </Link>
                    </>
                  )}

                {user.role === 'officer' && (
                  <Link to="/officer" className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md">
                    Officer Dashboard
                  </Link>
                )}
                
                <button
                  onClick={logout}
                  className="text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-800 ml-2"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
