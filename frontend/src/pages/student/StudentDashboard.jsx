import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckSquare,
  Clock,
  CreditCard,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
  User,
  ShieldCheck,
} from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import TimetableWidget from '../../components/TimetableWidget';
import AttendanceOverview from '../../components/AttendanceOverview';
import AssignmentTable from '../../components/AssignmentTable';
import AnnouncementPanel from '../../components/AnnouncementPanel';
import AcademicPerformanceChart from '../../components/AcademicPerformanceChart';
import AchievementsSection from '../../components/AchievementsSection';
import { useAuth } from '../../context/AuthContext';
import {
  attendanceApi,
  marksApi,
  timetableApi,
  assignmentsApi,
  announcementsApi,
  feesApi,
} from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { formatINR } from '../../utils/currency';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id || 'S1001';

  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [attData, marksData, ttData, asnData, annData, feesData] = await Promise.all([
        attendanceApi.getStudentAttendance(studentId).catch(() => null),
        marksApi.getStudentMarks(studentId).catch(() => null),
        timetableApi.getTimetable().catch(() => []),
        assignmentsApi.listAssignments({ student_id: studentId }).catch(() => []),
        announcementsApi.listAnnouncements({ audience: 'students', user_id: studentId }).catch(() => []),
        feesApi.getStudentFees(studentId).catch(() => null),
      ]);

      setAttendance(attData);
      setMarks(marksData);
      setTimetable(ttData || []);
      setAssignments(asnData || []);
      setAnnouncements(annData || []);
      setFees(feesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const pendingAssignments = assignments.filter((a) => !a.my_submission).length;

  return (
    <div className="space-y-5">
      {/* A. Institutional Student Identity Card (Screenshot 2 Reference) */}
      <div className="bg-white border border-[#D0D0D0] rounded p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Student'}
              className="w-16 h-16 rounded object-cover border border-[#D0D0D0] flex-shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                  {user?.name || 'Sarah Connor'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#00338D]/10 text-[#00338D] border border-[#00338D]/20">
                  {user?.program || 'B.Des Animation & Multimedia'}
                </span>
                <span className="text-xs text-[#767676] font-mono">
                  Roll: {user?.roll_number || '2024-AMD-001'}
                </span>
              </div>
              <p className="text-xs text-[#4A4A4A] mt-1">
                Student ID: <strong className="font-mono text-[#1A1A1A]">{studentId}</strong> • Academic Year 2024–2025 • Semester {user?.semester || 2} • {user?.department || 'Animation & Multimedia Design'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={() => navigate('/student/timeline')}
              className="px-3 py-1.5 bg-white hover:bg-[#F5F5F5] text-[#1A1A1A] font-semibold rounded text-xs border border-[#D0D0D0] transition-colors flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-[#00338D]" />
              Career Timeline
            </button>
            <button
              onClick={() => navigate('/student/timetable')}
              className="px-3 py-1.5 bg-white hover:bg-[#F5F5F5] text-[#1A1A1A] font-semibold rounded text-xs border border-[#D0D0D0] transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#0091DA]" />
              Today's Classes
            </button>
            <button
              onClick={() => navigate('/student/ml-retention')}
              className="px-3.5 py-1.5 bg-[#00338D] hover:bg-[#002266] text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ML Retention Insights
            </button>
          </div>
        </div>
      </div>

      {/* B. Academic Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Current GPA"
          value={marks?.current_gpa || '2.85'}
          subtitle={`CGPA: ${marks?.cgpa || '3.08'}`}
          icon={Award}
          colorScheme="indigo"
          trend="+0.15"
          trendType="positive"
          onClick={() => navigate('/student/marks')}
        />

        <MetricCard
          title="Attendance"
          value={`${attendance?.overall_percentage || 68.5}%`}
          subtitle="Target: 75%"
          icon={CheckSquare}
          colorScheme={attendance?.overall_percentage < 75 ? 'rose' : 'emerald'}
          badge={attendance?.overall_percentage < 75 ? 'Low' : 'Good'}
          badgeColor={attendance?.overall_percentage < 75 ? 'rose' : 'emerald'}
          onClick={() => navigate('/student/attendance')}
        />

        <MetricCard
          title="Credits Earned"
          value={`${marks?.earned_credits || 20} / ${marks?.total_credits || 40}`}
          subtitle="50% completed"
          icon={BookOpen}
          colorScheme="purple"
          onClick={() => navigate('/student/marks')}
        />

        <MetricCard
          title="Assignments"
          value={pendingAssignments}
          subtitle="Awaiting Submission"
          icon={FileText}
          colorScheme={pendingAssignments > 0 ? 'amber' : 'emerald'}
          badge={pendingAssignments > 0 ? 'Due Soon' : 'Done'}
          badgeColor={pendingAssignments > 0 ? 'amber' : 'emerald'}
          onClick={() => navigate('/student/assignments')}
        />

        <MetricCard
          title="Examinations"
          value="3 Upcoming"
          subtitle="Starts Oct 28"
          icon={Clock}
          colorScheme="indigo"
          onClick={() => navigate('/student/exams')}
        />

        <MetricCard
          title="Tuition Fees"
          value={fees?.outstanding_balance ? formatINR(fees.outstanding_balance) : 'Paid'}
          subtitle={fees?.status || 'Partially Paid'}
          icon={CreditCard}
          colorScheme={fees?.outstanding_balance > 0 ? 'amber' : 'emerald'}
          badge={fees?.status || 'Dues'}
          badgeColor={fees?.outstanding_balance > 0 ? 'amber' : 'emerald'}
          onClick={() => navigate('/student/fees')}
        />
      </div>

      {/* Section 4: Achievements & Student Development Portfolio */}
      <AchievementsSection studentId={studentId} allowSubmit={true} />

      {/* C & D. Timetable and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <TimetableWidget schedule={timetable} />
        </div>
        <div className="lg:col-span-5">
          <AttendanceOverview attendanceData={attendance} />
        </div>
      </div>

      {/* Performance Analytics Chart */}
      <AcademicPerformanceChart marksData={marks} />

      {/* Assignments & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <AssignmentTable
            assignments={assignments}
            studentId={studentId}
            onAssignmentUpdated={loadData}
          />
        </div>
        <div className="lg:col-span-5">
          <AnnouncementPanel
            announcements={announcements}
            userId={studentId}
            onRefresh={loadData}
          />
        </div>
      </div>
    </div>
  );
}

