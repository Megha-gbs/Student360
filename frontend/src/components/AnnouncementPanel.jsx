import React, { useState } from 'react';
import { BellRing, Calendar, Check, ExternalLink, Filter, Sparkles, User } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { announcementsApi } from '../services/api';

export default function AnnouncementPanel({ announcements = [], userId, onRefresh }) {
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['all', 'Academic', 'Examination', 'Campus', 'Administrative'];

  const filtered = announcements.filter((a) => {
    if (filterCategory === 'all') return true;
    return a.category?.toLowerCase() === filterCategory.toLowerCase();
  });

  const handleMarkRead = async (annId) => {
    try {
      await announcementsApi.markRead(annId, userId || 'S1001');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="card-panel p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-surface-darkborder">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Institutional Announcements & Circulars
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official communications from Academic Directorate and Faculty Deans
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No announcements found in this category.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                !item.is_read
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-surface-darkborder'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={item.priority} />
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.publisher} ({item.publisher_role})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.created_at}
                    </span>
                  </div>
                </div>

                {!item.is_read && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
