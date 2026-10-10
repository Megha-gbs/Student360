import React, { useState } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AppHeader({ onToggleMobileSidebar, pageTitle, pageSubtitle }) {
  const { user, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-[#483698]/10 text-[#483698] border-[#483698]/30';
      case 'faculty':
        return 'bg-[#00338D]/10 text-[#00338D] border-[#00338D]/30';
      case 'student':
        return 'bg-[#1A7F37]/10 text-[#1A7F37] border-[#1A7F37]/30';
      default:
        return 'bg-[#F0F0F0] text-[#4A4A4A] border-[#D0D0D0]';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#D0D0D0] flex items-center justify-between px-4 lg:px-6">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 rounded-[3px] text-[#4A4A4A] hover:text-[#1A1A1A] hover:bg-[#F0F0F0] lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-[15px] font-bold text-[#1A1A1A] tracking-tight leading-tight">
              {pageTitle || 'Student360 Platform'}
            </h1>
            {pageSubtitle && (
              <p className="hidden md:block text-[11.5px] text-[#767676]">
                {pageSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Institutional Identity Badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-[#F5F5F5] border border-[#D0D0D0] rounded-[3px]">
          <span className="w-2 h-2 rounded-full bg-[#1A7F37]" />
          <span className="text-[12px] font-medium text-[#4A4A4A]">
            {user?.department || 'Department of Computer Science & Engineering'} &bull; KPMG Smart Campus Analytics
          </span>
        </div>

        {/* Right: Actions (Notifications, User Profile) */}
        <div className="flex items-center gap-2">
          {/* Notification Center Trigger with Badge */}
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-1.5 rounded-[3px] text-[#4A4A4A] hover:text-[#1A1A1A] hover:bg-[#F0F0F0] transition-colors"
            title="Notifications & Schedule"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 px-2 rounded-[3px] hover:bg-[#F5F5F5] border border-transparent hover:border-[#D0D0D0] transition-colors"
            >
              <div className="w-7 h-7 rounded-[3px] bg-[#00338D] text-white font-bold text-xs flex items-center justify-center">
                {(user?.name || 'U')[0]}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-bold text-[#1A1A1A] leading-tight">
                  {user?.name || 'User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1 py-0.2 text-[9.5px] font-bold rounded-[2px] uppercase border ${getRoleBadgeStyle(role)}`}>
                    {role}
                  </span>
                  {user?.id && (
                    <span className="text-[10px] text-[#767676] font-mono">
                      {user.id}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#767676] hidden sm:block ml-0.5" />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white rounded-[3px] border border-[#D0D0D0] shadow-sm py-1.5 z-50"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-3 py-2 border-b border-[#D0D0D0]">
                  <p className="text-[12px] font-bold text-[#1A1A1A] truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-[#767676] truncate">{user?.email}</p>
                </div>

                <div className="px-3 py-1.5 text-[11px] text-[#4A4A4A] space-y-1 border-b border-[#D0D0D0]">
                  <div>Department: <span className="font-semibold text-[#1A1A1A]">{user?.department || 'Computer Science'}</span></div>
                  {user?.designation && <div>Role: <span className="font-semibold text-[#1A1A1A]">{user.designation}</span></div>}
                </div>

                <div className="pt-1 px-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2 py-1.5 text-[12px] text-[#B91C1C] hover:bg-[#F5F5F5] rounded-[2px] font-bold flex items-center justify-between transition-colors"
                  >
                    <span>Sign Out</span>
                    <span className="text-[11px]">&rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Notification Drawer */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
