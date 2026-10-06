import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: FolderKanban,
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: CheckSquare2,
  },
];

export const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  return (
    <aside
      className={`bg-white border-r border-slate-200 hidden md:flex flex-col justify-between py-5 px-3 shrink-0 transition-all duration-300 min-h-screen ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="space-y-6">
        {/* Logo attached directly to the top of Sidebar (Large & No Wording) */}
        <div
          className={`flex items-center pb-4 border-b border-slate-100 ${
            isCollapsed ? 'justify-center' : 'px-3'
          }`}
        >
          <img
            src={logoImg}
            alt="Logo"
            className={`object-contain rounded-xl transition-all duration-300 ${
              isCollapsed ? 'w-10 h-10' : 'w-14 h-14'
            }`}
          />
        </div>

        {/* Navigation list */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary-light text-primary font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Tooltip in collapsed mode */}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Collapse / Expand Toggle Button */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
