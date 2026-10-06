import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { LayoutDashboard, FolderKanban, CheckSquare2 } from 'lucide-react';

export const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('projecto_sidebar_collapsed') === 'true';
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('projecto_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Full-Height Desktop Sidebar with attached large logo */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onToggleMobileMenu={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-around z-30 shadow-lg">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium py-1 ${
              isActive ? 'text-primary font-semibold' : 'text-slate-500'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium py-1 ${
              isActive ? 'text-primary font-semibold' : 'text-slate-500'
            }`
          }
        >
          <FolderKanban className="w-5 h-5" />
          <span>Projects</span>
        </NavLink>
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium py-1 ${
              isActive ? 'text-primary font-semibold' : 'text-slate-500'
            }`
          }
        >
          <CheckSquare2 className="w-5 h-5" />
          <span>Tasks</span>
        </NavLink>
      </nav>
    </div>
  );
};
