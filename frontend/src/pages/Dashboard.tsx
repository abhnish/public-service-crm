import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-6xl mx-auto mt-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-slate-50 text-3xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/50 px-5 py-2 rounded-lg transition-all"
        >
          Logout
        </button>
      </div>
      
      <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 p-8 rounded-2xl mb-8">
        <h2 className="text-slate-50 text-2xl font-semibold mb-2">Welcome, {user?.fullName}!</h2>
        <p className="text-slate-400 mb-4">You are logged in as a <span className="text-cyan-400 font-medium tracking-wide uppercase text-sm">{user?.role}</span></p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {user?.role === 'citizen' && (
            <>
              <div className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-2xl flex flex-col h-full hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
                <h3 className="text-slate-50 text-lg font-semibold mb-2">Submit Complaint</h3>
                <p className="text-slate-400 text-sm flex-grow mb-6">File a new complaint with the city</p>
                <button
                  onClick={() => window.location.href = '/submit-complaint'}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2.5 rounded-lg transition-all w-full mt-auto"
                >
                  New Complaint
                </button>
              </div>
              
              <div className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-2xl flex flex-col h-full hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
                <h3 className="text-slate-50 text-lg font-semibold mb-2">My Complaints</h3>
                <p className="text-slate-400 text-sm flex-grow mb-6">View and track your complaints</p>
                <button
                  onClick={() => window.location.href = '/my-complaints'}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 px-4 py-2.5 rounded-lg transition-all w-full mt-auto"
                >
                  View Complaints
                </button>
              </div>
            </>
          )}
          
          {user?.role === 'officer' && (
            <div className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-2xl flex flex-col h-full hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
              <h3 className="text-slate-50 text-lg font-semibold mb-2">Assigned Complaints</h3>
              <p className="text-slate-400 text-sm flex-grow mb-6">View complaints assigned to you</p>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2.5 rounded-lg transition-all w-full mt-auto">
                View Assigned
              </button>
            </div>
          )}
          
          {user?.role === 'admin' && (
            <div className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-2xl flex flex-col h-full hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
              <h3 className="text-slate-50 text-lg font-semibold mb-2">Admin Panel</h3>
              <p className="text-slate-400 text-sm flex-grow mb-6">Manage all complaints and users</p>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2.5 rounded-lg transition-all w-full mt-auto">
                Admin Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
