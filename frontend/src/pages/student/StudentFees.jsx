import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Download, Receipt, ArrowRight, X } from 'lucide-react';
import { feesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { formatINR } from '../../utils/currency';

export default function StudentFees() {
  const { user } = useAuth();
  const [feeDetails, setFeeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [payAmount, setPayAmount] = useState('500');
  const [payMethod, setPayMethod] = useState('Campus Card');
  const [successMsg, setSuccessMsg] = useState('');

  const loadFees = async () => {
    try {
      const data = await feesApi.getStudentFees(user?.id || 'S1001');
      setFeeDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [user]);

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const numPay = parseFloat(payAmount) || 0;
      await feesApi.payFees({
        student_id: user?.id || 'S1001',
        amount: numPay,
        payment_method: payMethod,
      });
      setIsPaying(false);
      setSuccessMsg(`Payment of ${formatINR(numPay)} processed successfully. Official receipt issued.`);
      loadFees();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!feeDetails) {
    return <div className="p-8 text-center text-slate-400">Loading fee records...</div>;
  }

  const { total_fees, scholarship_discount, paid_amount, outstanding_balance, due_date, status, transactions = [] } = feeDetails;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Tuition Fees & Payment Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Account statement, scholarship credits, and digital payment receipts
          </p>
        </div>

        {outstanding_balance > 0 && (
          <button
            onClick={() => setIsPaying(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Pay Outstanding Dues ({formatINR(outstanding_balance)})
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-panel p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Program Fee</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatINR(total_fees)}</h3>
          <p className="text-xs text-slate-400 mt-2">Billed for Year 2024</p>
        </div>

        <div className="card-panel p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Scholarship Credit</p>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {scholarship_discount > 0 ? `-${formatINR(scholarship_discount)}` : formatINR(0)}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Merit Institutional Grant</p>
        </div>

        <div className="card-panel p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Paid to Date</p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatINR(paid_amount)}</h3>
          <p className="text-xs text-slate-400 mt-2">Verified Receipts</p>
        </div>

        <div className="card-panel p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Outstanding Balance</p>
          <h3 className={`text-2xl font-black mt-1 ${outstanding_balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
            {formatINR(outstanding_balance)}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Due by {due_date}</p>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="card-panel p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkborder">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Transaction Log & Receipts
          </h3>
          <span className="text-xs text-slate-400">{transactions.length} record(s)</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-surface-darkborder">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold">Receipt No</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Transaction ID</th>
                <th className="py-3 px-4 font-bold">Payment Method</th>
                <th className="py-3 px-4 font-bold text-right">Amount</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {transactions.map((tx) => (
                <tr key={tx.transaction_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {tx.receipt_no}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                    {tx.date}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {tx.transaction_id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                    {tx.payment_method}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900 dark:text-white">
                    {formatINR(tx.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => window.print()}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Download receipt"
                    >
                      <Download className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {isPaying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-darkpanel w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkborder pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pay Tuition Installment
              </h3>
              <button onClick={() => setIsPaying(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="50"
                  max={outstanding_balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Total outstanding balance: {formatINR(outstanding_balance)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Gateway / Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Online NetBanking (HDFC)">Online NetBanking (HDFC)</option>
                  <option value="Campus SmartCard">Campus SmartCard</option>
                  <option value="Debit Card">Debit / Credit Card</option>
                  <option value="UPI / Wire Transfer">UPI / Wire Transfer</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-800 dark:text-indigo-300">
                Payment confirmation issues immediate digital receipt registered in University financial ledger.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaying(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  Confirm & Pay {formatINR(parseFloat(payAmount) || 0)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
