import React, { useState } from 'react';
import { LayoutDashboard, Database, BarChart3, Settings, Library, Home, Globe, Menu, X, BookOpen } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Home', icon: Home },
    { id: AppView.METADATA, label: 'Item Search', icon: Database },
    { id: AppView.SCRAPING, label: 'Deep Search', icon: Library },
    { id: AppView.WAYBACK, label: 'Wayback Machine', icon: Globe },
    { id: AppView.ANALYTICS, label: 'View Analytics', icon: BarChart3 },
    { id: AppView.BLOG, label: 'Blog', icon: BookOpen },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (view: AppView) => {
    onChangeView(view);
    setIsOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors shadow-lg"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="bg-teal-500/10 p-2 rounded-lg" aria-hidden="true">
            <LayoutDashboard className="w-6 h-6 text-teal-400" />
          </div>
          <span className="tracking-tight">OmniDash</span>
        </h1>
        <p className="text-xs text-gray-500 mt-2 ml-1">Archive.org Toolkit</p>
      </div>

        <nav className="flex-1 px-3 space-y-1.5 mt-2" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 font-semibold shadow-sm border border-teal-500/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
                }`}
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'}`} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-600 px-2" role="status" aria-label="System status">
            <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></div>
            <span>System Operational</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;