import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import Student360Assistant from './Student360Assistant';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { role } = useAuth();

  // Page title resolution from path
  const getPageInfo = () => {
    const p = location.pathname;
    if (p.includes('/student/dashboard')) return { title: 'Student Academic Portal', sub: 'Academic summary & daily schedule' };
    if (p.includes('/student/timetable')) return { title: 'Class Timetable', sub: 'Weekly lectures and laboratory periods' };
    if (p.includes('/student/attendance')) return { title: 'Attendance Health', sub: 'Subject-wise 75% eligibility tracker' };
    if (p.includes('/student/marks')) return { title: 'Marks & Transcripts', sub: 'Continuous internal assessments and CGPA' };
    if (p.includes('/student/assignments')) return { title: 'Coursework Deliverables', sub: 'Project submissions and grading feedback' };
    if (p.includes('/student/exams')) return { title: 'Examination Timetable', sub: 'Hall tickets, dates, and test venues' };
    if (p.includes('/student/fees')) return { title: 'Tuition Fee Accounts', sub: 'Invoices, scholarship grants, and payment history' };
    if (p.includes('/student/timeline')) return { title: 'Achievements & Career Timeline', sub: 'Verified accomplishments & development portfolio' };
    if (p.includes('/student/ml-retention')) return { title: 'ML Retention Intelligence', sub: 'Explainable XGBoost early warning & trajectory' };
    if (p.includes('/student/profile')) return { title: 'Student Profile', sub: 'Identity records and credential settings' };

    if (p.includes('/faculty/dashboard')) return { title: 'Faculty Control Center', sub: 'Teaching schedule & pending reviews' };
    if (p.includes('/faculty/timetable')) return { title: 'Teaching Schedule', sub: 'Assigned classrooms & lab slots' };
    if (p.includes('/faculty/students')) return { title: 'Enrolled Student Directory', sub: 'Assigned courses and mentorship rosters' };
    if (p.includes('/faculty/attendance')) return { title: 'Mark Class Attendance', sub: 'Session attendance sheet submission' };
    if (p.includes('/faculty/marks')) return { title: 'Continuous Assessment Gradebook', sub: 'Enter internals and midterm evaluations' };
    if (p.includes('/faculty/assignments')) return { title: 'Coursework & Grading Studio', sub: 'Publish assignments and review submissions' };
    if (p.includes('/faculty/announcements')) return { title: 'Department Announcements', sub: 'Broadcast class circulars' };
    if (p.includes('/faculty/retention')) return { title: 'Retention Priority Queue', sub: 'At-risk triage and causal intervention engine' };
    if (p.includes('/faculty/profile')) return { title: 'Faculty Profile', sub: 'Academic credentials and appointments' };

    if (p.includes('/admin/dashboard')) return { title: 'Directorate Executive Dashboard', sub: 'Institution-wide metrics & KPIs' };
    if (p.includes('/admin/students')) return { title: 'Student Lifecycle & Registrar', sub: 'Enrollment, status, and CSV batch import' };
    if (p.includes('/admin/faculty')) return { title: 'Faculty Directory & Appointments', sub: 'Staff appointments & department allocations' };
    if (p.includes('/admin/departments')) return { title: 'Departments & Curricula', sub: 'Divisions, programs, and course catalogues' };
    if (p.includes('/admin/timetable')) return { title: 'Master Timetable Scheduling', sub: 'Room and professor conflict validation' };
    if (p.includes('/admin/attendance-reports')) return { title: 'Institutional Attendance Audits', sub: 'Department-level compliance metrics' };
    if (p.includes('/admin/exams')) return { title: 'Central Examination Board', sub: 'Testing dates, venues, and grade publication' };
    if (p.includes('/admin/fees')) return { title: 'Tuition Accounts & Finance Ledger', sub: 'Billing, collections, and dues' };
    if (p.includes('/admin/announcements')) return { title: 'Official Campus Notices', sub: 'Institutional circulars and broadcasts' };
    if (p.includes('/admin/users-audit')) return { title: 'User Roles & Security Audit Trail', sub: 'Account privileges and administrative logs' };
    if (p.includes('/admin/cohort-intelligence')) return { title: 'ML Cohort Risk Intelligence', sub: 'Global SHAP drivers & retention triage' };
    if (p.includes('/admin/profile')) return { title: 'Administrator Settings', sub: 'Superuser credentials and keys' };

    if (p.startsWith('/students/')) return { title: 'Student360 Diagnostic Profile', sub: 'Explainable AI explainability & trajectory' };
    if (p.includes('/cohort')) return { title: 'Cohort Insights & Global SHAP', sub: 'Cohort-wide retention risk distribution' };

    return { title: 'Student360 Platform', sub: 'Integrated Campus Operating System' };
  };

  const { title, sub } = getPageInfo();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5] text-[#1A1A1A]">
      <AppSidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col lg:pl-[240px] min-w-0">
        <AppHeader
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          pageTitle={title}
          pageSubtitle={sub}
        />

        <main className="flex-1 p-3.5 sm:p-5 w-full max-w-[1600px] mx-auto min-w-0">
          <Outlet />
        </main>

        <footer className="border-t border-[#D0D0D0] py-2.5 px-5 bg-white text-[11.5px] text-[#767676] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Student360 &mdash; KPMG India Smart Campus Analytics Platform</span>
          <span className="font-mono text-[11px] text-[#767676]">
            Engine: FastAPI &bull; XGBoost UCI Retained Model (4,424 Records)
          </span>
        </footer>
      </div>

      {/* Institutional AI Voice & Text Assistant */}
      <Student360Assistant />
    </div>
  );
}
