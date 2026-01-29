import React from 'react';
import { Info, Award, Search, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { GRADE_COLORS, POPULAR_SUBJECTS } from '../constants';
import { GradeType } from '../types';

// Calendar Component (Visual Only)
const CalendarWidget = () => {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dates = Array.from({length: 35}, (_, i) => {
    const d = i - 4; // Offset to start month
    return d > 0 && d <= 30 ? d : '';
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="font-semibold text-sm text-slate-700">September 2025</span>
            <div className="flex gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                 <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
        </div>
        <div className="p-3">
            <div className="grid grid-cols-7 mb-2">
                {days.map(d => <div key={d} className="text-center text-[10px] text-slate-400 font-bold">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                {dates.map((d, i) => (
                    <div key={i} className={`
                        h-8 flex items-center justify-center text-xs rounded-md transition-colors cursor-default
                        ${d === 16 
                            ? 'bg-uw-red text-white font-bold shadow-sm shadow-red-200' 
                            : 'text-slate-600 hover:bg-slate-50'}
                    `}>
                        {d}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export const Dashboard: React.FC<{ onViewCourse: () => void }> = ({ onViewCourse }) => {
  return (
    <div className="space-y-8">
        {/* Hero Search Section - Modern & Clean */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-soft text-center relative overflow-hidden group">
            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" 
                style={{ backgroundImage: 'radial-gradient(#64748b 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} 
            />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-uw-red text-xs font-medium mb-6 border border-red-100 animate-fade-in">
                    <Sparkles size={12} />
                    <span>New: Spring 2025 Course Catalog is live!</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                    Plan your perfect semester with <span className="text-uw-red relative inline-block">
                        WiscFlow
                        <svg className="absolute w-full h-2 -bottom-1 left-0 text-red-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                        </svg>
                    </span>
                </h1>
                <p className="text-slate-500 mb-8 text-lg max-w-2xl mx-auto">
                    Access 9,000+ course reviews, grade distributions, and visual prerequisite maps designed by Badgers, for Badgers.
                </p>
                
                <div className="relative mb-8 max-w-2xl mx-auto shadow-lg shadow-slate-200/50 rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red shadow-sm text-base transition-all"
                        placeholder="Search by course code (e.g. CS 577) or keyword..."
                    />
                    <div className="absolute inset-y-2 right-2">
                         <button className="h-full bg-uw-red text-white px-6 rounded-lg text-sm font-medium hover:bg-uw-dark transition-colors shadow-sm flex items-center gap-2">
                            Search
                         </button>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-3">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Trending:</span>
                    {POPULAR_SUBJECTS.slice(0, 4).map(subj => (
                         <button key={subj} className="px-3 py-1.5 bg-white hover:bg-slate-50 hover:text-uw-red border border-slate-200 hover:border-red-100 rounded-full text-xs text-slate-600 transition-all shadow-sm">
                            {subj.split('(')[0]}
                         </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Widgets */}
            <div className="space-y-6">
                 <CalendarWidget />
                 
                 <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-indigo-900 text-sm mb-3 flex items-center gap-2">
                        <Info size={18} className="text-indigo-600" />
                        Student Alerts
                    </h4>
                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"></div>
                             <p className="text-xs text-indigo-800 leading-relaxed">
                                <span className="font-semibold">Enrollment:</span> Fall 2025 wishlist opens next Monday. Check your cart.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"></div>
                             <p className="text-xs text-indigo-800 leading-relaxed">
                                <span className="font-semibold">System:</span> Canvas maintenance scheduled for Sunday 2AM - 4AM.
                            </p>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Middle Column - Content */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Award size={20} className="text-uw-red" />
                        Top Rated Courses
                    </h3>
                    <button onClick={onViewCourse} className="text-sm font-medium text-uw-red hover:text-uw-dark flex items-center gap-1 transition-colors group">
                        View All
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Card 1 */}
                    <div 
                        onClick={onViewCourse}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-hover hover:border-slate-300 transition-all duration-300 cursor-pointer relative group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 rounded-lg text-uw-red group-hover:bg-uw-red group-hover:text-white transition-colors">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 group-hover:text-uw-red transition-colors">CS 577</h4>
                                    <span className="text-xs text-slate-500">Comp Sci</span>
                                </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-md font-bold text-xs shadow-sm ${GRADE_COLORS[GradeType.AB]}`}>
                                AB
                            </div>
                        </div>
                        
                        <p className="text-sm font-medium text-slate-900 mb-1">Introduction to Algorithms</p>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                            Fundamental for interviews. Challenging but rewarding content. Focuses on dynamic programming and NP-completeness.
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                             <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                Prereq: CS 400
                             </span>
                             <span className="text-[10px] text-slate-400">1.3k reviews</span>
                        </div>
                    </div>

                    {/* Card 2 */}
                     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-hover hover:border-slate-300 transition-all duration-300 cursor-pointer relative group">
                        <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">MATH 222</h4>
                                    <span className="text-xs text-slate-500">Mathematics</span>
                                </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-md font-bold text-xs shadow-sm ${GRADE_COLORS[GradeType.A]}`}>
                                A
                            </div>
                        </div>
                        
                        <p className="text-sm font-medium text-slate-900 mb-1">Calculus & Analytic Geometry 2</p>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                            Integration techniques are the main focus. Do the practice problems and you will be fine.
                        </p>
                        
                         <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                             <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                Prereq: MATH 221
                             </span>
                             <span className="text-[10px] text-slate-400">856 reviews</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};