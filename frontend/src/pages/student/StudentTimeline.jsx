import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Award,
  BookOpen,
  Briefcase,
  Code2,
  Trophy,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Layers,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { timelineApi } from '../../services/api';

const CATEGORIES = [
  { id: 'All', label: 'All Milestones', icon: Layers },
  { id: 'Education', label: 'Education', icon: GraduationCap },
  { id: 'Semesters', label: 'Semesters', icon: BookOpen },
  { id: 'Projects', label: 'Projects', icon: Code2 },
  { id: 'Hackathons', label: 'Hackathons', icon: Trophy },
  { id: 'Certifications', label: 'Certifications', icon: Award },
  { id: 'Internships', label: 'Internships', icon: Briefcase },
  { id: 'Awards', label: 'Awards', icon: Sparkles },
  { id: 'Placement Milestones', label: 'Placement Milestones', icon: ShieldCheck },
];

export default function StudentTimeline() {
  const { user } = useAuth();
  const studentId = user?.id || 'S1001';

  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Projects',
    academic_year: '2024-2025',
    date: new Date().toISOString().split('T')[0],
    description: '',
    organization: '',
    evidence_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTimeline = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await timelineApi.getTimeline(studentId, {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        academic_year: selectedYear !== 'All' ? selectedYear : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });
      setTimeline(data);
    } catch (err) {
      setError('Failed to load education and career timeline records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [studentId, selectedCategory, selectedYear, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Projects',
      academic_year: '2024-2025',
      date: new Date().toISOString().split('T')[0],
      description: '',
      organization: '',
      evidence_url: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      academic_year: item.academic_year || '2024-2025',
      date: item.date,
      description: item.description,
      organization: item.organization || '',
      evidence_url: item.evidence_url || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this milestone entry?')) return;
    try {
      await timelineApi.deleteTimelineEntry(studentId, entryId);
      setTimeline((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      alert('Failed to delete timeline entry.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.description) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        const updated = await timelineApi.updateTimelineEntry(studentId, editingItem.id, formData);
        setTimeline((prev) => prev.map((e) => (e.id === editingItem.id ? updated : e)));
      } else {
        const created = await timelineApi.createTimelineEntry(studentId, formData);
        setTimeline((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      alert('Failed to save timeline milestone. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category) => {
    const found = CATEGORIES.find((c) => c.id === category);
    const Icon = found ? found.icon : Award;
    return <Icon className="w-4 h-4 text-[#00338D]" />;
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded bg-white border border-[#D0D0D0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#00338D]/10 text-[#00338D] border border-[#00338D]/20">
              Student Career & Academic Timeline
            </span>
            <span className="text-xs text-[#767676] font-mono">• ID: {studentId}</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">
            Education, Milestones & Achievements Portfolio
          </h1>
          <p className="text-xs text-[#4A4A4A] mt-0.5">
            Chronological documentation of coursework milestones, accredited certifications, hackathons, and career development.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#00338D] hover:bg-[#002266] text-white font-bold text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Milestone / Achievement</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded bg-white border border-[#D0D0D0] space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#00338D] text-white'
                    : 'bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#4A4A4A] border border-[#D0D0D0]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#00338D]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-[#D0D0D0] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#767676] font-medium">Academic Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] text-xs focus:border-[#00338D] outline-none"
            >
              <option value="All">All Years</option>
              <option value="2023-2024">2023–2024</option>
              <option value="2024-2025">2024–2025</option>
              <option value="2025-2026">2025–2026</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#767676] font-medium">Verification Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] text-xs focus:border-[#00338D] outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Institution-Verified">Institution-Verified</option>
              <option value="Self-Reported">Self-Reported (Pending Review)</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="ml-auto text-[#767676] text-xs">
            Showing <strong className="text-[#1A1A1A]">{timeline.length}</strong> milestones
          </div>
        </div>
      </div>

      {/* Main Timeline Stream */}
      {loading ? (
        <div className="p-12 text-center text-[#767676] text-xs">
          Loading timeline entries...
        </div>
      ) : error ? (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : timeline.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D0D0D0] rounded">
          <GraduationCap className="w-10 h-10 text-[#767676] mx-auto mb-2 opacity-40" />
          <p className="text-sm font-bold text-[#1A1A1A]">No Milestones Found</p>
          <p className="text-xs text-[#767676] mt-1">Try resetting filters or click "Add Milestone" to submit a new entry.</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-[#00338D]/30 space-y-4 my-3">
          {timeline.map((item) => {
            const isVerified = item.verification_status === 'Institution-Verified';
            const isRejected = item.verification_status === 'Rejected';
            const isPending = item.verification_status === 'Self-Reported';

            return (
              <div key={item.id} className="relative group">
                {/* Node Bullet */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-2 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                    isVerified
                      ? 'bg-emerald-600 text-white'
                      : isRejected
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {isVerified ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isRejected ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Card */}
                <div className="p-4 rounded bg-white border border-[#D0D0D0] hover:border-[#00338D] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F5F5] text-[#1A1A1A] border border-[#D0D0D0]">
                          {getCategoryIcon(item.category)}
                          <span>{item.category}</span>
                        </span>

                        <span className="text-xs text-[#767676] font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{item.date}</span>
                          {item.academic_year && <span>({item.academic_year})</span>}
                        </span>

                        {/* Status Badge */}
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Institution-Verified</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Self-Reported (Under Review)</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Verification Rejected</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-base font-bold text-[#1A1A1A] pt-0.5">
                        {item.title}
                      </h2>

                      {item.organization && (
                        <p className="text-xs font-semibold text-[#00338D]">
                          {item.organization}
                        </p>
                      )}
                    </div>

                    {/* Action buttons for self-reported items */}
                    <div className="flex items-center gap-1 self-end sm:self-start opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit milestone"
                        className="p-1 rounded hover:bg-[#F5F5F5] text-[#767676] hover:text-[#1A1A1A] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete milestone"
                        className="p-1 rounded hover:bg-red-50 text-[#767676] hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A4A4A] leading-relaxed mt-1.5">
                    {item.description}
                  </p>

                  {/* Rejection Note if applicable */}
                  {isRejected && item.rejection_reason && (
                    <div className="mt-2.5 p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <strong>Reviewer Remarks:</strong> {item.rejection_reason}
                    </div>
                  )}

                  {/* Verification & Evidence Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#D0D0D0] text-[11px] text-[#767676]">
                    <div className="flex items-center gap-2">
                      {isVerified && item.verified_by_name && (
                        <span>Verified by {item.verified_by_name} on {item.verified_at}</span>
                      )}
                      {isPending && (
                        <span>Pending institutional review by faculty advisor</span>
                      )}
                    </div>

                    {item.evidence_url && (
                      <a
                        href={item.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#00338D] hover:underline"
                      >
                        <span>View Evidence Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Milestone Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D0D0D0] rounded shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#D0D0D0]">
              <h2 className="text-base font-bold text-[#1A1A1A]">
                {editingItem ? 'Edit Milestone Entry' : 'Add Milestone / Achievement'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-[#767676] hover:text-[#1A1A1A]"
              >
                &times;
              </button>
            </div>

            <div className="p-2.5 rounded bg-[#00338D]/10 border border-[#00338D]/20 text-[11px] text-[#00338D] flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Submissions by students are categorized as <strong>Self-Reported</strong> and queued for review by assigned faculty or administrators.
              </span>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Winner of Smart Campus Hackathon, Figma Certification"
                  className="w-full px-3 py-1.5 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] focus:border-[#00338D] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] focus:border-[#00338D] outline-none"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'All').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] focus:border-[#00338D] outline-none"
                  >
                    <option value="2023-2024">2023–2024</option>
                    <option value="2024-2025">2024–2025</option>
                    <option value="2025-2026">2025–2026</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] focus:border-[#00338D] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">
                    Organization / Issuer
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. ACM Chapter, Microsoft, Horizon Studios"
                    className="w-full px-3 py-1.5 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] focus:border-[#00338D] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">
                  Evidence Document / Verification Link
                </label>
                <input
                  type="url"
                  value={formData.evidence_url}
                  onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
                  placeholder="https://credentials.org/verify/... or GitHub repository"
                  className="w-full px-3 py-1.5 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] focus:border-[#00338D] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">
                  Description & Impact Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize the project outcome, skills demonstrated, or competition result..."
                  className="w-full px-3 py-1.5 rounded bg-white border border-[#D0D0D0] text-[#1A1A1A] focus:border-[#00338D] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D0D0D0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded border border-[#D0D0D0] text-[#4A4A4A] hover:bg-[#F5F5F5] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded bg-[#00338D] hover:bg-[#002266] text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Submit Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

