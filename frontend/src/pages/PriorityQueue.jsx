import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  BrainCircuit
} from 'lucide-react';
import { getStudents } from '../services/api';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/UIStateComponents';

export default function PriorityQueue() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [sortBy, setSortBy] = useState('risk_desc');

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudents();
      if (res.success && res.data) {
        setStudents(res.data);
      } else {
        setError(res.error || 'Failed to load student priority queue.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to student queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter & Sort Logic
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch = student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.course_name && student.course_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLevel = filterLevel === 'ALL' || student.risk_level?.toUpperCase() === filterLevel;
      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => {
      if (sortBy === 'risk_desc') return (b.risk_score || 0) - (a.risk_score || 0);
      if (sortBy === 'risk_asc') return (a.risk_score || 0) - (b.risk_score || 0);
      if (sortBy === 'id') return a.student_id.localeCompare(b.student_id);
      return 0;
    });

  // Summary Metrics
  const highRiskCount = students.filter(s => s.risk_level?.toLowerCase() === 'high').length;
  const mediumRiskCount = students.filter(s => s.risk_level?.toLowerCase() === 'medium').length;
  const lowRiskCount = students.filter(s => s.risk_level?.toLowerCase() === 'low').length;
  const avgRiskScore = students.length > 0
    ? (students.reduce((acc, s) => acc + (s.risk_score || 0), 0) / students.length).toFixed(1)
    : 0;

  const getRiskBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600 dark:text-rose-400" />
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
            Medium Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
            Low Risk
          </span>
        );
    }
  };

  const getTrendIcon = (trend) => {
    if (trend?.toLowerCase().includes('deteriorat')) {
      return (
        <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-semibold text-xs">
          <TrendingUp className="w-3.5 h-3.5 mr-1" />
          Deteriorating
        </span>
      );
    }
    if (trend?.toLowerCase().includes('improv')) {
      return (
        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          <TrendingDown className="w-3.5 h-3.5 mr-1" />
          Improving
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-slate-500 dark:text-slate-400 font-medium text-xs">
        <Minus className="w-3.5 h-3.5 mr-1" />
        Stable
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'immediate':
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white uppercase tracking-wider">Immediate</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500 text-white uppercase tracking-wider">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase tracking-wider">Standard</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 dark:border-surface-darkborder gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-md">
              Advisor Queue
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Updated from XGBoost v2 Inference Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Student Dropout Priority Queue
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Proactive triage of at-risk students ranked by real XGBoost dropout probabilities.
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="self-start md:self-auto px-4 py-2 bg-white dark:bg-surface-darkcard border border-slate-300 dark:border-surface-darkborder hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Cohort Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white dark:bg-surface-darkcard rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Monitored Students</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">{students.length}</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Total verified profiles</span>
        </div>

        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm">
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-400 block">High Risk (&ge;65%)</span>
          <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1 block">{highRiskCount}</span>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Requires immediate outreach</span>
        </div>

        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-sm">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 block">Medium Risk (35-64%)</span>
          <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1 block">{mediumRiskCount}</span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Watchlist check-in</span>
        </div>

        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 block">Low Risk (&lt;35%)</span>
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 block">{lowRiskCount}</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">On-track for graduation</span>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 bg-slate-900 dark:bg-[#151c2e] text-white rounded-2xl border border-slate-800 dark:border-surface-darkborder shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block">Cohort Avg Risk</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">
            {avgRiskScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </span>
          <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1 mt-1">
            <BrainCircuit className="w-3 h-3" /> XGBoost v2 Model
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-surface-darkcard p-4 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Student ID or Degree Program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-surface-darkborder rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Risk Level Filter Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-surface-darkborder text-xs font-semibold">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterLevel === level
                    ? 'bg-white dark:bg-surface-darkpanel text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {level === 'ALL' ? 'All' : level.charAt(0) + level.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-surface-darkborder rounded-xl px-3 py-2 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="risk_desc">Highest Risk First</option>
              <option value="risk_asc">Lowest Risk First</option>
              <option value="id">Student ID</option>
            </select>
          </div>
        </div>
      </div>

      {/* Priority Queue Table */}
      <div className="bg-white dark:bg-surface-darkcard rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton count={4} height="h-16" />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState
              title="Priority Queue Unavailable"
              message={error}
              onRetry={fetchStudents}
            />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No Students Match Filter"
              description="No student records found matching your active search query or risk filter."
              actionText="Reset Filters"
              onAction={() => {
                setSearchTerm('');
                setFilterLevel('ALL');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 pl-6">Student ID</th>
                  <th className="py-3.5">Degree Program</th>
                  <th className="py-3.5 text-center">Risk Score</th>
                  <th className="py-3.5 text-center">Risk Level</th>
                  <th className="py-3.5 text-center">Trend</th>
                  <th className="py-3.5 text-center">Priority</th>
                  <th className="py-3.5 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((student) => {
                  const isHigh = student.risk_level?.toLowerCase() === 'high';
                  return (
                    <tr
                      key={student.student_id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isHigh ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Student ID */}
                      <td className="py-4 pl-6 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isHigh 
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {student.student_id.substring(0, 3)}
                          </div>
                          <div>
                            <span className="block text-slate-900 dark:text-white font-bold">{student.student_id}</span>
                            <span className="text-[10px] text-slate-400">UCI Record</span>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-4 font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {student.course_name || 'Higher Education Degree Program'}
                      </td>

                      {/* Risk Score */}
                      <td className="py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-base font-extrabold ${
                            isHigh ? 'text-rose-600 dark:text-rose-400' : student.risk_level?.toLowerCase() === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {student.risk_score}
                            <span className="text-xs font-normal text-slate-400">/100</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            p={student.dropout_probability ? student.dropout_probability.toFixed(3) : (student.risk_score/100).toFixed(3)}
                          </span>
                        </div>
                      </td>

                      {/* Risk Level Badge */}
                      <td className="py-4 text-center">
                        {getRiskBadge(student.risk_level)}
                      </td>

                      {/* Trend */}
                      <td className="py-4 text-center">
                        {getTrendIcon(student.trend)}
                      </td>

                      {/* Priority */}
                      <td className="py-4 text-center">
                        {getPriorityBadge(student.priority)}
                      </td>

                      {/* Action */}
                      <td className="py-4 text-right pr-6">
                        <Link
                          to={`/students/${student.student_id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all group"
                        >
                          <span>View 360</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
