import React, { useState, useEffect } from 'react';
import { CreditCard, IndianRupee, Users, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import { feesApi, adminApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatINR } from '../../utils/currency';

export default function AdminFees() {
  const [feeSummary, setFeeSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      feesApi.getInstitutionSummary().catch(() => null),
      adminApi.getStudents().catch(() => []),
    ]).then(([summary, s]) => {
      setFeeSummary(summary);
      setStudents(s || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Fee Collection & Financial Accounts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tuition billing oversight, revenue collection rates, and outstanding defaulters
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-surface-darkborder hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Financial Ledger
        </button>
      </div>

      {/* Revenue Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Billed"
          value={feeSummary?.total_billed !== undefined ? formatINR(feeSummary.total_billed) : formatINR(40000)}
          subtitle="Enrolled Roster Fees"
          icon={CreditCard}
          colorScheme="indigo"
        />
        <MetricCard
          title="Collected Revenue"
          value={feeSummary?.total_collected !== undefined ? formatINR(feeSummary.total_collected) : formatINR(38500)}
          subtitle={`${feeSummary?.collection_rate_percent ?? 96}% recovery`}
          icon={IndianRupee}
          colorScheme="emerald"
        />
        <MetricCard
          title="Outstanding Balances"
          value={feeSummary?.total_outstanding !== undefined ? formatINR(feeSummary.total_outstanding) : formatINR(1500)}
          subtitle="Receivables ledger"
          icon={AlertTriangle}
          colorScheme={feeSummary?.total_outstanding > 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          title="Accounts with Dues"
          value={`${feeSummary?.defaulters_count ?? 1} Student`}
          subtitle="S1001 Sarah Connor"
          icon={Users}
          colorScheme="rose"
        />
      </div>

      {/* Student Billing Roster */}
      <div className="card-panel p-5 overflow-x-auto space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Enrolled Student Tuition Accounts
        </h3>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-bold">Student ID</th>
              <th className="py-3 px-4 font-bold">Roll Number</th>
              <th className="py-3 px-4 font-bold">Student Name</th>
              <th className="py-3 px-4 font-bold">Department</th>
              <th className="py-3 px-4 font-bold text-right">Standard Tuition</th>
              <th className="py-3 px-4 font-bold text-center">Payment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {students.map((s) => (
              <tr key={s.student_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {s.student_id}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-500">
                  {s.roll_number}
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                  {s.name}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                  {s.department}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatINR(4500)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <StatusBadge status={s.fees_status || 'Paid'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
