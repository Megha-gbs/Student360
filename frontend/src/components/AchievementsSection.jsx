import React, { useState } from 'react';
import {
  Award,
  GraduationCap,
  Trophy,
  FolderCode,
  Briefcase,
  Layers,
  Users,
  HeartHandshake,
  Target,
  ShieldCheck,
  Clock,
  AlertCircle,
  ExternalLink,
  Plus,
  X,
  CheckCircle,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'Academic', label: 'Academic Excellence', icon: GraduationCap, color: '#00338D' },
  { id: 'Certifications', label: 'Certifications', icon: FileCheck, color: '#0091DA' },
  { id: 'Hackathons', label: 'Hackathons & Competitions', icon: Trophy, color: '#483698' },
  { id: 'Projects', label: 'Projects & Research', icon: FolderCode, color: '#00338D' },
  { id: 'Internships', label: 'Work Experience & Internships', icon: Briefcase, color: '#4A4A4A' },
  { id: 'Skills', label: 'Technical & Soft Skills', icon: Layers, color: '#0091DA' },
  { id: 'Clubs', label: 'Clubs & Extracurricular', icon: Users, color: '#483698' },
  { id: 'Leadership', label: 'Leadership & Volunteering', icon: HeartHandshake, color: '#1A7F37' },
  { id: 'Placement', label: 'Placement Milestones', icon: Target, color: '#92600A' },
];

export const getCategoryIcon = (category) => {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('academic') || cat.includes('semester')) return GraduationCap;
  if (cat.includes('certif')) return FileCheck;
  if (cat.includes('hackathon') || cat.includes('compet')) return Trophy;
  if (cat.includes('project') || cat.includes('research')) return FolderCode;
  if (cat.includes('intern') || cat.includes('work')) return Briefcase;
  if (cat.includes('skill')) return Layers;
  if (cat.includes('club') || cat.includes('event')) return Users;
  if (cat.includes('leader') || cat.includes('volunteer')) return HeartHandshake;
  if (cat.includes('placement')) return Target;
  return Award;
};

export default function AchievementsSection({
  achievements = [],
  onAddAchievement,
  onVerifyAchievement,
  canAdd = false,
  canVerify = false,
}) {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Projects');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [organization, setOrganization] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  const filtered = achievements.filter((a) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'VERIFIED') return a.verification_status === 'Institution-Verified' || a.is_verified;
    if (activeTab === 'PENDING') return a.verification_status === 'Self-Reported' && !a.is_verified;
    return a.category?.toLowerCase() === activeTab.toLowerCase();
  });

  const verifiedCount = achievements.filter(
    (a) => a.verification_status === 'Institution-Verified' || a.is_verified
  ).length;
  const pendingCount = achievements.filter(
    (a) => a.verification_status === 'Self-Reported' && !a.is_verified
  ).length;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (onAddAchievement) {
      onAddAchievement({
        title: title.trim(),
        category,
        date,
        academicYear,
        organization: organization.trim() || undefined,
        evidence_url: evidenceUrl.trim() || undefined,
        description: description.trim(),
        skills,
      });
    }

    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setOrganization('');
    setEvidenceUrl('');
    setSkillsInput('');
  };

  return (
    <div className="bg-white border border-[#D0D0D0] rounded-[4px] p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#D0D0D0]">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#00338D]/10 text-[#00338D] rounded-[3px]">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14.5px] font-bold text-[#1A1A1A] leading-tight">
              Achievements & Student Development Portfolio
            </h3>
            <p className="text-[11.5px] text-[#767676]">
              Verified academic, hackathon, project, and leadership milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-[#4A4A4A] font-semibold">
            {achievements.length} Total &bull;{' '}
            <span className="text-[#1A7F37] font-bold">{verifiedCount} Verified</span> &bull;{' '}
            <span className="text-[#92600A] font-bold">{pendingCount} Pending</span>
          </span>

          {canAdd && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1 bg-[#00338D] hover:bg-[#002B7A] text-white text-[12px] font-semibold rounded-[3px] transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Achievement
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#E5E5E5] text-[12px]">
        {[
          { id: 'ALL', label: `All (${achievements.length})` },
          { id: 'VERIFIED', label: `Verified (${verifiedCount})` },
          { id: 'PENDING', label: `Pending (${pendingCount})` },
          { id: 'Hackathons', label: 'Hackathons' },
          { id: 'Certifications', label: 'Certifications' },
          { id: 'Projects', label: 'Projects' },
          { id: 'Academic', label: 'Academic' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 rounded-[2px] font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#00338D] text-white'
                : 'text-[#4A4A4A] hover:bg-[#F0F0F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Achievement Cards */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center bg-[#FAFAFA] border border-[#D0D0D0] rounded-[3px] space-y-1.5">
          <p className="text-[13px] font-bold text-[#1A1A1A]">No Achievements in this Category</p>
          <p className="text-[12px] text-[#767676] max-w-sm mx-auto">
            {canAdd
              ? 'Click "Add Achievement" to record hackathon wins, research projects, certifications, or leadership milestones.'
              : 'No achievements currently recorded or pending verification for this student.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filtered.map((item) => {
            const IconComponent = getCategoryIcon(item.category);
            const isVerified =
              item.verification_status === 'Institution-Verified' || item.is_verified;
            const isRejected = item.verification_status === 'Rejected';

            return (
              <div
                key={item.id}
                className="p-3 bg-white border border-[#D0D0D0] rounded-[3px] flex flex-col justify-between hover:border-[#00338D] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#F5F5F5] border border-[#D0D0D0] rounded-[3px] text-[#00338D]">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-[#1A1A1A] leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#767676]">
                          {item.category} &bull; {item.organization || item.academic_year || '2025-2026'}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase border flex-shrink-0 ${
                        isVerified
                          ? 'bg-[#1A7F37]/10 text-[#1A7F37] border-[#1A7F37]/30'
                          : isRejected
                          ? 'bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30'
                          : 'bg-[#92600A]/10 text-[#92600A] border-[#92600A]/30'
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </>
                      ) : isRejected ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Rejected
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#4A4A4A] line-clamp-2">
                    {item.description}
                  </p>

                  {/* Skills tags if present */}
                  {item.skills && item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {item.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 bg-[#F5F5F5] text-[#4A4A4A] text-[10.5px] font-medium rounded-[2px] border border-[#D0D0D0]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Strip */}
                <div className="pt-2 mt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#767676]">
                  <span>Date: {item.date}</span>

                  <div className="flex items-center gap-2">
                    {item.evidence_url && (
                      <a
                        href={item.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00338D] font-semibold hover:underline inline-flex items-center gap-0.5"
                      >
                        Evidence
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {canVerify && !isVerified && !isRejected && onVerifyAchievement && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onVerifyAchievement(item.id, 'Institution-Verified')}
                          className="px-1.5 py-0.5 bg-[#1A7F37] text-white rounded-[2px] text-[10.5px] font-bold flex items-center gap-0.5"
                          title="Verify as Institution Officer"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Verify
                        </button>
                        <button
                          onClick={() => onVerifyAchievement(item.id, 'Rejected')}
                          className="px-1.5 py-0.5 bg-[#B91C1C] text-white rounded-[2px] text-[10.5px] font-bold flex items-center gap-0.5"
                          title="Reject Evidence"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Achievement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-md rounded-[4px] border border-[#D0D0D0] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D0D0D0] pb-2">
              <h3 className="text-[14px] font-bold text-[#1A1A1A]">
                Add Milestone / Achievement
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#767676] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-2.5 text-[12.5px]">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-0.5 text-[11.5px]">
                  Title / Milestone Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place - Smart Campus Hackathon 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-1.5 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-0.5 text-[11.5px]">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-1.5 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                  >
                    {ACHIEVEMENT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-0.5 text-[11.5px]">
                    Date Completed *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-1.5 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] font-mono text-[12px] outline-none focus:border-[#00338D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-0.5 text-[11.5px]">
                  Issuing Organization / Event Body
                </label>
                <input
                  type="text"
                  placeholder="e.g. ACM Student Chapter / AWS / IEEE"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full p-1.5 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-0.5 text-[11.5px]">
                  Evidence / Certificate URL
                </label>
                <input
                  type="url"
                  placeholder="https://credential.net/verify/12345"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full p-1.5 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-0.5 text-[11.5px]">
                  Skills Acquired (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, System Architecture, XGBoost"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full p-1.5 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-0.5 text-[11.5px]">
                  Description & Impact *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief summary of project scope, problem solved, or certification achievements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-1.5 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D0D0D0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 text-[#4A4A4A] hover:bg-[#F0F0F0] font-semibold rounded-[3px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-[#00338D] hover:bg-[#002B7A] text-white font-semibold rounded-[3px]"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
