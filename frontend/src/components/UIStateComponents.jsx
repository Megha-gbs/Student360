import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle, Info, X } from 'lucide-react';

export function LoadingSkeleton({ count = 3, height = 'h-16' }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full ${height} bg-slate-200 dark:bg-slate-800 rounded-2xl`}
        />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title = 'No records found', description, actionText, onAction }) {
  return (
    <div className="card-panel p-8 text-center flex flex-col items-center justify-center space-y-3">
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-sm">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="card-panel p-6 border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
      <div className="p-3 bg-rose-100 dark:bg-rose-900/60 rounded-2xl text-rose-600 dark:text-rose-400 w-fit mx-auto">
        <XCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">{title}</h4>
      {message && <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
}

export function ConfirmationDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface-darkpanel w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl text-white transition-all ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
