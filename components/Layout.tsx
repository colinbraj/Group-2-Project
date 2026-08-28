import React from 'react';
import { ViewState, User } from '../types';
import { NAV_ITEMS } from '../constants';
import { LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user: User;
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  onNavigate,
  user,
  children,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 overflow-hidden text-slate-900">
      {/* Sidebar - Dark Theme with refined styling */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-slate-800 text-slate-300 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 mb-2 border-b border-slate-800/50">
          <img
            src="/logo.png"
            alt="KadoshAI Logo"
            className="w-11 h-11 rounded-xl shadow-lg shadow-blue-900/30"
          />
          <span className="text-xl font-bold text-white tracking-tight">KadoshAI</span>
        </div>

        {/* Navigation List - Enhanced styling */}
        <nav className="px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar-dark py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id || (item.id === 'vault' && currentView === 'studio');

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as ViewState);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 ease-out group relative overflow-hidden
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:scale-[1.01]'}
                `}
              >
                {/* Subtle glow effect on active */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl"></div>
                )}

                {/* Icon */}
                <span className={`relative z-10 transition-all duration-200 ${isActive ? 'text-white scale-110' : 'text-slate-500 group-hover:text-white group-hover:scale-110'}`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { size: 20, strokeWidth: 2.5 })}
                </span>

                {/* Label */}
                <span className="relative z-10 text-sm">{item.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-lg shadow-white/50"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: User & Logout - Enhanced */}
        <div className="p-4 mt-auto space-y-3 border-t border-slate-800/50 bg-slate-900/50">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all cursor-pointer group">
            <img
              src={user.avatar}
              alt="User"
              className="w-10 h-10 rounded-xl border-2 border-slate-700 group-hover:border-blue-500 object-cover transition-all shadow-md"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200 ease-out group"
          >
            <LogOut size={20} strokeWidth={2.5} className="text-slate-500 group-hover:text-red-400 transition-colors" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Light Theme with enhanced visuals */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Subtle Background Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Mobile Menu Toggle Only */}
        <div className="md:hidden p-4 shrink-0 z-40">
          <button
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* View Content - Enhanced with better spacing */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative z-10">
          {children}
        </main>
      </div>

      {/* Mobile Overlay - Enhanced */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};