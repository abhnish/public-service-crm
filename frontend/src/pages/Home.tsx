import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="relative flex-1 bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30 transition-colors duration-300">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col gap-24">
        
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Typography & CTA */}
          <div className="flex flex-col items-start space-y-8">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] text-slate-50">
              Smart Public <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Service CRM</span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-xl font-medium tracking-wide leading-relaxed">
              Efficient, transparent, and structured public service management. Empowering citizens and officials to resolve community issues with uncompromising speed.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row items-baseline gap-4">
              <Link 
                to="/submit-complaint" 
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
              >
                <span>File a Report</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </Link>
              <Link
                to="/transparency"
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-cyan-400 bg-slate-900 border border-cyan-400/30 hover:border-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
              >
                <span>Transparency Portal</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </Link>
            </div>
          </div>

          {/* Right Column: Abstract Bento Dashboard Preview */}
          <div className="relative w-full h-[500px] hidden md:block">
            {/* Card 1: Main Status */}
            <div className="absolute top-10 right-10 w-72 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl z-20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Resolved</span>
              </div>
              <p className="text-sm text-slate-400 font-medium">Issue #CR-9942</p>
              <h4 className="text-lg font-bold text-slate-50 mt-1">Streetlight outage fixed</h4>
            </div>

            {/* Card 2: Analytics Chart Mockup */}
            <div className="absolute bottom-10 left-10 w-80 bg-slate-900/80 backdrop-blur-lg border border-slate-800 p-6 rounded-2xl shadow-2xl z-10">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase">Avg Response</h3>
                  <div className="text-3xl font-extrabold text-slate-50 mt-1">1.2h</div>
                </div>
                <div className="text-cyan-400 text-sm font-semibold flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  24%
                </div>
              </div>
              <div className="flex items-end gap-2 h-20">
                {[30, 45, 25, 60, 40, 75, 55, 90, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-800 rounded-t-sm relative group overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-cyan-500/80 rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Floating UI element behind */}
            <div className="absolute top-32 left-0 w-64 h-48 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl z-0 transform -rotate-6"></div>
          </div>
        </section>

        {/* Features Section: Asymmetric Bento Grid */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-50 tracking-tight">Streamlined Resolution Workflow</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">Our platform accelerates civic improvements through optimized data structuring and multi-tier monitoring.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
            
            {/* Feature 1: Spans 2 rows or cols depending on structure, Let's span 2 rows on desktop */}
            <div className="group md:row-span-2 md:col-span-1 bg-slate-900/60 backdrop-blur-sm border border-slate-800 hover:border-cyan-400/50 rounded-2xl p-8 transition-colors duration-300 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-50 mb-3 tracking-tight">Submit Complaints</h3>
              <p className="text-slate-400 leading-relaxed flex-1">
                Easily file structured reports with geolocation, images, and smart tagging. Our system automatically categorizes your submission and routes it to the exact departmental desk responsible for that specific civic zone.
              </p>
            </div>

            {/* Feature 2: Top Right */}
            <div className="group md:col-span-2 bg-slate-900/60 backdrop-blur-sm border border-slate-800 hover:border-cyan-400/50 rounded-2xl p-8 transition-colors duration-300 flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-50 mb-2 tracking-tight">Track Progress in Real-time</h3>
                <p className="text-slate-400 leading-relaxed">
                  Monitor the status of your submissions via a transparent, multi-stage timeline. Receive automated alerts whenever a department official updates, reassigns, or remarks on your active case.
                </p>
              </div>
            </div>

            {/* Feature 3: Bottom Right */}
            <div className="group md:col-span-2 bg-slate-900/60 backdrop-blur-sm border border-slate-800 hover:border-cyan-400/50 rounded-2xl p-8 transition-colors duration-300 flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-50 mb-2 tracking-tight">Rapid Automated Resolution</h3>
                <p className="text-slate-400 leading-relaxed">
                  Experience unprecedented SLAs. Machine learning driven priority algorithms ensure that critical safety and infrastructure issues are triaged to field officers within minutes.
                </p>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;