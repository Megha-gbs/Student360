import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationCenter({ isOpen, onClose }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [filter, setFilter] = useState('all');
  const [syncStatus, setSyncStatus] = useState(null); // { type: 'success' | 'info' | 'error', message: string }

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.warn('Could not fetch notifications from backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, user]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification read', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await notificationsApi.markAllRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications read', err);
    }
  };

  const handleTriggerDailySchedule = async (customDate = null) => {
    if (triggering) return;
    setTriggering(true);
    setSyncStatus(null);
    try {
      const res = await notificationsApi.triggerDailySchedule(customDate);
      if (res.status === 'error') {
        setSyncStatus({
          type: 'error',
          message: res.message || 'Error triggering backend notification engine.',
        });
      } else if (res.notifications_created > 0) {
        setSyncStatus({
          type: 'success',
          message: `Synced: ${res.notifications_created} in-app notification(s) generated (${res.skipped_duplicates} duplicate(s) skipped).`,
        });
      } else if (res.skipped_duplicates > 0) {
        setSyncStatus({
          type: 'info',
          message: `All ${res.skipped_duplicates} schedule notifications are already up to date for ${res.day_of_week || 'target date'}.`,
        });
      } else {
        setSyncStatus({
          type: 'info',
          message: res.message || 'No classes scheduled for this date. No in-app notifications generated.',
        });
      }
      await loadNotifications();
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.message ||
        'Error triggering backend notification engine.';
      setSyncStatus({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setTriggering(false);
      setTimeout(() => setSyncStatus(null), 8000);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const scheduleCount = notifications.filter((n) => n.type === 'daily_schedule').length;
  const systemCount = notifications.filter((n) => n.type !== 'daily_schedule').length;

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'schedule') return n.type === 'daily_schedule';
    if (filter === 'system') return n.type !== 'daily_schedule';
    return true;
  });

  const isWeekend = [0, 6].includes(new Date().getDay());

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-surface-darkpanel h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-surface-darkborder z-10 transition-transform">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-surface-darkborder flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-[#00338D] rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500 text-white rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                In-app schedule alerts & institutional notices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule Trigger Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/60 dark:to-indigo-950/30 border-b border-blue-100 dark:border-indigo-900/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00338D] dark:text-indigo-300 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> In-App Timetable Sync
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Generate in-app schedule notifications for enrolled students and instructors based on timetable entries.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleTriggerDailySchedule()}
                disabled={triggering}
                className="px-3 py-1.5 bg-[#00338D] hover:bg-[#00266B] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Generate in-app schedule notifications for today"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${triggering ? 'animate-spin' : ''}`} />
                {triggering ? 'Syncing...' : 'Sync Today'}
              </button>
              {isWeekend && (
                <button
                  onClick={() => handleTriggerDailySchedule('2026-10-12')}
                  disabled={triggering}
                  className="text-[11px] font-medium text-[#00338D] dark:text-indigo-400 hover:underline disabled:opacity-50"
                  title="Test timetable sync with next scheduled class day (Monday)"
                >
                  &rarr; Sync Monday classes
                </button>
              )}
            </div>
          </div>

          {/* Sync Status Feedback Banner */}
          {syncStatus && (
            <div
              className={`mt-2.5 p-2 rounded-lg text-xs font-medium flex items-start gap-2 border ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : syncStatus.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              }`}
            >
              {syncStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : syncStatus.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-snug">{syncStatus.message}</span>
            </div>
          )}
        </div>

        {/* Filter bar & Actions */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-surface-darkborder flex items-center justify-between text-xs bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('schedule')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'schedule'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Schedule ({scheduleCount})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'system'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              System ({systemCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[#00338D] dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00338D]" />
              Loading notifications...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No notifications in this view
              </p>
              <p className="text-xs mt-1">
                {filter === 'schedule'
                  ? 'Click "Sync Today" to generate in-app schedule notifications.'
                  : "You're all caught up on class timetables and campus announcements!"}
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const isSchedule = notif.type === 'daily_schedule';
              const isHigh = notif.priority === 'high';

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    !notif.read
                      ? 'bg-blue-50/40 dark:bg-indigo-950/20 border-blue-200 dark:border-indigo-900/60 shadow-sm'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-surface-darkborder hover:border-slate-300'
                  }`}
                >
                  {!notif.read && (
                    <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#00338D] animate-pulse" />
                  )}

                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSchedule
                          ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400'
                          : isHigh
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isSchedule ? (
                        <Calendar className="w-4 h-4" />
                      ) : isHigh ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] uppercase px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {notif.delivery_channel || 'in_app'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{notif.created_at}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {notif.read ? 'Read' : 'Delivered (In-App)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
