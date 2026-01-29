import React, { useState } from 'react';
import { Home, BookOpen, Star, MessageSquare, LayoutGrid, LogOut, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { UW_SCHOOLS } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const NavItem = ({ icon: Icon, label, id, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-uw-subtle text-uw-red shadow-sm' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={18} className={`transition-colors ${active ? 'text-uw-red' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) => {
  const [showAllSchools, setShowAllSchools] = useState(false);
  
  const visibleSchools = showAllSchools ? UW_SCHOOLS : UW_SCHOOLS.slice(0, 6);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col
        lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <div className="px-3 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Platform
          </div>
          <NavItem 
            icon={Home} 
            label="Overview" 
            id="overview" 
            active={activeTab === 'overview'} 
            onClick={setActiveTab} 
          />
          <NavItem 
            icon={BookOpen} 
            label="Courses" 
            id="courses" 
            active={activeTab === 'courses'} 
            onClick={setActiveTab} 
          />
          
          <div className="mt-8 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Collection
          </div>
          <NavItem 
            icon={Star} 
            label="Favourites" 
            id="favourites" 
            active={activeTab === 'favourites'} 
            onClick={setActiveTab} 
          />
          <NavItem 
            icon={LayoutGrid} 
            label="My Courses" 
            id="my-courses" 
            active={activeTab === 'my-courses'} 
            onClick={setActiveTab} 
          />
           <NavItem 
            icon={MessageSquare} 
            label="My Reviews" 
            id="my-reviews" 
            active={activeTab === 'my-reviews'} 
            onClick={setActiveTab} 
          />

          <div className="mt-8 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Departments
          </div>
          <div className="space-y-0.5">
            {visibleSchools.map((school) => (
                <button
                key={school}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-600 hover:text-uw-red hover:bg-slate-50 rounded-md group text-left transition-colors"
                title={school}
                >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-uw-red transition-colors flex-shrink-0"></div>
                    <span className="truncate">{school.replace(', School of', '').replace(', College of', '')}</span>
                </div>
                </button>
            ))}
            
            <button 
                onClick={() => setShowAllSchools(!showAllSchools)}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
                {showAllSchools ? (
                    <>
                        <ChevronUp size={14} />
                        Show Less
                    </>
                ) : (
                    <>
                        <ChevronDown size={14} />
                        Show All Schools
                    </>
                )}
            </button>
          </div>
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-slate-50/50">
          <button className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-slate-900 w-full px-2 py-1 transition-colors">
            <LogOut size={18} className="text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};