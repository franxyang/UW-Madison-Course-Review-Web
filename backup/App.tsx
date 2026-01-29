import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CourseDetail } from './components/CourseDetail';
import { Dashboard } from './components/Dashboard';
import { CourseList } from './components/CourseList';
import { ReviewForm } from './components/ReviewForm';
import { QUICK_LINKS } from './constants';
import { Course } from './types';
import { Logo } from './components/Logo';
import { Search, Bell, User, Menu, Link as LinkIcon, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Handle navigation logic
  const handleViewCourseList = () => {
    setActiveTab('courses');
    setSelectedCourse(undefined); // Reset selection when going to list
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setActiveTab('course-detail');
  };

  const handleBackToCourses = () => {
    setActiveTab('courses');
    setSelectedCourse(undefined);
  };

  const handleGoToWriteReview = () => {
    if (selectedCourse) {
      setActiveTab('write-review');
    }
  };

  const handleSubmitReview = () => {
    // Mock submission
    alert("Review Submitted! (Prototype Only)");
    setActiveTab('course-detail');
  };

  const handleCancelReview = () => {
    setActiveTab('course-detail');
  };

  // Simple view router
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Dashboard onViewCourse={handleViewCourseList} />;
      case 'courses':
        return <CourseList onCourseSelect={handleCourseSelect} />;
      case 'course-detail':
        return (
          <CourseDetail 
            course={selectedCourse} 
            onBack={handleBackToCourses} 
            onWriteReview={handleGoToWriteReview}
          />
        );
      case 'write-review':
        if (!selectedCourse) {
          // Fallback if refresh happens or direct link (mock)
          return <CourseList onCourseSelect={handleCourseSelect} />;
        }
        return (
          <ReviewForm 
            course={selectedCourse} 
            onBack={handleCancelReview}
            onSubmit={handleSubmitReview}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <div className="text-6xl mb-4 opacity-20">🚧</div>
            <p className="text-lg font-medium">Page under construction</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab === 'course-detail' || activeTab === 'write-review' ? 'courses' : activeTab} 
        setActiveTab={(tab) => {
            if (tab === 'courses') {
                handleViewCourseList();
            } else {
                setActiveTab(tab);
            }
            setMobileOpen(false);
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setMobileOpen(true)}
                className="lg:hidden text-slate-500 hover:text-slate-900 p-1 hover:bg-slate-100 rounded"
            >
                <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-3 select-none cursor-pointer group" onClick={() => setActiveTab('overview')}>
                 <Logo className="transition-transform group-hover:rotate-3" size={36} />
                 <div className="flex flex-col justify-center">
                     <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                        Wisc<span className="text-uw-red">Flow</span>
                     </span>
                     <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none mt-0.5">
                        UW Madison
                     </span>
                 </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Search Bar */}
            <div className="relative hidden md:block group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-uw-red transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-64 lg:w-80 pl-10 pr-3 py-1.5 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-uw-red sm:text-sm transition-all"
                    placeholder="Jump to course..."
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                    <kbd className="inline-flex items-center border border-slate-200 rounded px-2 text-[10px] font-sans font-medium text-slate-400">
                        /
                    </kbd>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-slate-700 transition-colors relative p-2 hover:bg-slate-50 rounded-full">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-2 block h-2 w-2 rounded-full ring-2 ring-white bg-uw-red"></span>
                </button>
                <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>
                <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 p-1 pr-2 hover:bg-slate-50 rounded-full transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                        <User size={16} className="text-slate-500" />
                    </div>
                    <span className="hidden md:block">My Account</span>
                </button>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col xl:flex-row gap-8">
                
                {/* Center Content */}
                <div className="flex-1 min-w-0">
                     {/* Breadcrumb Area */}
                     <div className="mb-6 flex items-center text-sm text-slate-500">
                        <span onClick={() => setActiveTab('overview')} className="hover:text-uw-red cursor-pointer transition-colors">Home</span>
                        {activeTab !== 'overview' && (
                            <>
                                <span className="mx-2 text-slate-300">/</span>
                                <span 
                                    onClick={() => (activeTab === 'course-detail' || activeTab === 'write-review') ? handleBackToCourses() : null}
                                    className={`font-medium capitalize px-2 py-0.5 rounded transition-colors ${activeTab === 'course-detail' || activeTab === 'write-review' ? 'text-slate-500 hover:text-uw-red cursor-pointer' : 'text-slate-800 bg-slate-100'}`}
                                >
                                    {activeTab === 'course-detail' || activeTab === 'write-review' ? 'Courses' : activeTab}
                                </span>
                            </>
                        )}
                        {(activeTab === 'course-detail' || activeTab === 'write-review') && selectedCourse && (
                             <>
                                <span className="mx-2 text-slate-300">/</span>
                                <span 
                                  onClick={activeTab === 'write-review' ? handleCancelReview : undefined}
                                  className={`font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded ${activeTab === 'write-review' ? 'hover:text-uw-red cursor-pointer' : ''}`}
                                >
                                  {selectedCourse.code}
                                </span>
                            </>
                        )}
                        {activeTab === 'write-review' && (
                             <>
                                <span className="mx-2 text-slate-300">/</span>
                                <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">Write Review</span>
                            </>
                        )}
                     </div>
                     
                     <div className="animate-slide-in">
                        {renderContent()}
                     </div>
                </div>

                {/* Right Sidebar (Widgets) - Only Show on Overview */}
                {activeTab === 'overview' && (
                    <div className="w-full xl:w-80 flex-shrink-0 space-y-6">
                         {/* Quick Links Widget */}
                         <div className="bg-white border border-slate-200 rounded-xl shadow-soft p-5">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 pb-3 border-b border-slate-50">
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                                    <LinkIcon size={16} />
                                </div>
                                Campus Links
                            </h3>
                            
                            <div className="space-y-5">
                                {['Essentials', 'Curriculum'].map(cat => (
                                    <div key={cat}>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">{cat}</h4>
                                        <ul className="space-y-1">
                                            {QUICK_LINKS.filter(l => l.category === cat).map(link => (
                                                <li key={link.name}>
                                                    <a href={link.url} className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-indigo-400"></span>
                                                            {link.name}
                                                        </span>
                                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-slate-50 text-center">
                                <button className="text-xs text-slate-500 hover:text-indigo-600 font-medium">View All Resources</button>
                            </div>
                         </div>

                         {/* Trending Mini List */}
                         <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-lg shadow-slate-200 text-white p-5 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-[0.03] rounded-full -translate-y-16 translate-x-8 pointer-events-none"></div>
                            
                            <h3 className="font-bold text-white mb-4 flex items-center justify-between">
                                <span>Popular Now</span>
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Live</span>
                            </h3>
                            <ul className="space-y-3 relative z-10">
                                {[
                                    {code: "MATH 5473", name: "Data Topology", rank: 1, trend: '+12%'},
                                    {code: "CHEM 343", name: "Organic Chem I", rank: 2, trend: '+5%'},
                                    {code: "PSYCH 202", name: "Intro Psych", rank: 3, trend: '+8%'},
                                ].map((c) => (
                                    <li key={c.code} className="flex items-center gap-3 group cursor-pointer">
                                        <div className="w-6 h-6 flex items-center justify-center rounded bg-white/10 text-xs font-bold text-white/80 border border-white/10">
                                            {c.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate group-hover:text-red-200 transition-colors">{c.code}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{c.name}</div>
                                        </div>
                                        <div className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                            {c.trend}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                         </div>
                    </div>
                )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;