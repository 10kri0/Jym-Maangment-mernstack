import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineDocumentReport,
  HiOutlineBell,
  HiOutlineLogout,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineCog,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { FaDumbbell } from 'react-icons/fa';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { adminName, adminRole, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = adminRole === 'superadmin'
    ? [
        { path: '/admins', icon: HiOutlineShieldCheck, label: 'Clients' },
        { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
      ]
    : [
        { path: '/', icon: HiOutlineHome, label: 'Dashboard' },
        { path: '/members', icon: HiOutlineUsers, label: 'Members' },
        { path: '/plans', icon: HiOutlineCreditCard, label: 'Plans' },
        { path: '/revenue', icon: HiOutlineChartBar, label: 'Revenue' },
        { path: '/reports', icon: HiOutlineDocumentReport, label: 'Reports' },
        { path: '/notifications', icon: HiOutlineBell, label: 'Alerts' },
        { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
      ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          bg-white/80 dark:bg-dark-800/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50
          flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
            <FaDumbbell className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">GymPro</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              end={item.path === '/'}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {adminName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{adminName || 'Admin'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {adminRole === 'superadmin' ? 'Super Admin' : 'Administrator'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="sidebar-link w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600"
          >
            <HiOutlineLogout className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
            >
              <HiOutlineMenu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold hidden sm:block">
              {navItems.find((item) => {
                if (item.path === '/') return location.pathname === '/';
                return location.pathname.startsWith(item.path);
              })?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? (
                <HiOutlineSun className="w-5 h-5 text-amber-400" />
              ) : (
                <HiOutlineMoon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {adminRole !== 'superadmin' && (
              <NavLink
                to="/notifications"
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200 relative"
              >
                <HiOutlineBell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </NavLink>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/90 dark:bg-dark-800/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200
                ${isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary-500'
                }`
              }
              end={item.path === '/'}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
