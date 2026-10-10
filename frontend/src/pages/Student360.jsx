import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw,
  AlertTriangle,
  GraduationCap,
  Award,
  BookOpen
} from 'lucide-react';
import { getStudent } from '../services/api';
import RiskCard from '../components/RiskCard';
import RiskTrajectory from '../components/RiskTrajectory';
import ShapReasons from '../components/ShapReasons';
import WhatIfPanel from '../components/WhatIfPanel';
import InterventionPanel from '../components/InterventionPanel';
import OutcomePanel from '../components/OutcomePanel';
import AchievementsSection from '../components/AchievementsSection';
import { LoadingSkeleton, ErrorState } from '../components/UIStateComponents';

export default function Student360() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchStudentData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getStudent(id);
        if (isCancelled) return;
        if (res.success && res.data) {
          setStudent(res.data);
        } else {
          setError(res.error || `Student profile ${id} could not be retrieved.`);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || `Error fetching student ${id}`);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchStudentData();
    }

    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center space-x-2 text-xs text-[#767676]">
          <Link to="/priority-queue" className="inline-flex items-center space-x-1.5 hover:text-[#00338D]">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Priority Retention Queue</span>
          </Link>
        </div>
        <LoadingSkeleton count={3} height="h-28" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorState
          title="Student Profile Error"
          message={error || `Student ${id} could not be found in the system.`}
          onRetry={() => window.location.reload()}
        />
        <div className="mt-4 text-center">
          <Link
            to="/priority-queue"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#00338D] text-white text-xs font-semibold rounded shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Priority Retention Queue</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Navigation Breadcrumb & Student Header */}
      <div>
        <Link
          to="/priority-queue"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#767676] hover:text-[#00338D] transition-colors mb-2.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Priority Retention Queue</span>
        </Link>

        {/* Section A: Student Header Profile Banner (Screenshot 2 Reference) */}
        <div className="bg-white border border-[#D0D0D0] rounded p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded bg-[#00338D] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {student.student_id.substring(0, 3)}
              </div>
              <div>
                <div className="flex flex-wrap items-center space-x-2">
                  <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                    {student.student_id}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#00338D]/10 text-[#00338D] border border-[#00338D]/20">
                    Active Student Record
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Cohort Verified
                  </span>
                </div>
                <p className="text-xs text-[#4A4A4A] mt-0.5 font-medium">
                  {student.course_name || 'Higher Education Degree Program'}
                </p>
              </div>
            </div>

            {/* Student Metadata Badges (Real UCI Demographics) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-[#FAFAFA] rounded border border-[#D0D0D0]">
                <span className="text-[#767676] block text-[11px]">Age at Matriculation</span>
                <span className="font-bold text-[#1A1A1A]">{student.age_at_enrollment ?? 20} Years</span>
              </div>
              <div className="p-2.5 bg-[#FAFAFA] rounded border border-[#D0D0D0]">
                <span className="text-[#767676] block text-[11px]">Tuition Status</span>
                <span className={`font-bold ${student.tuition_fees_up_to_date === 1 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {student.tuition_fees_up_to_date === 1 ? 'Up to date' : 'Overdue Hold'}
                </span>
              </div>
              <div className="p-2.5 bg-[#FAFAFA] rounded border border-[#D0D0D0]">
                <span className="text-[#767676] block text-[11px]">Debtor Status</span>
                <span className={`font-bold ${student.debtor === 1 ? 'text-rose-700' : 'text-[#1A1A1A]'}`}>
                  {student.debtor === 1 ? 'Active Debt' : 'Clear'}
                </span>
              </div>
              <div className="p-2.5 bg-[#FAFAFA] rounded border border-[#D0D0D0]">
                <span className="text-[#767676] block text-[11px]">Scholarship</span>
                <span className="font-bold text-[#1A1A1A]">
                  {student.scholarship_holder === 1 ? 'Scholarship Holder' : 'Self-Funded'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Risk Score + Risk Level + Trend */}
      <RiskCard
        riskScore={student.risk_score}
        riskLevel={student.risk_level}
        dropoutProbability={student.dropout_probability}
        trend={student.trend}
        modelVersion={student.model_version || 'student360_xgb_v2_real_features'}
      />

      {/* Section 4: Achievements & Student Development Portfolio */}
      <AchievementsSection studentId={student.student_id} allowVerify={true} />

      {/* Section C: Real Sem 1 -> Sem 2 Trajectory */}
      <RiskTrajectory trajectory={student.trajectory} />

      {/* Section D: Why? — SHAP Explanations */}
      <ShapReasons reasons={student.top_reasons} />

      {/* Section E: What-If Simulation */}
      <WhatIfPanel
        studentId={student.student_id}
        originalRisk={student.risk_score}
        studentData={student}
      />

      {/* Section F & G: Recommended Intervention + Human Approval */}
      <InterventionPanel
        studentId={student.student_id}
        recommendedIntervention={student.recommended_intervention}
      />

      {/* Section H: Simulated Post-Intervention Outcome */}
      <OutcomePanel
        studentId={student.student_id}
        currentRisk={student.risk_score}
      />
    </div>
  );
}

