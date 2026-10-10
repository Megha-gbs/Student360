import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';

// Auth Page
import Login from './pages/Login';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentMarks from './pages/student/StudentMarks';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentExams from './pages/student/StudentExams';
import StudentFees from './pages/student/StudentFees';
import StudentTimeline from './pages/student/StudentTimeline';
import StudentMLRetention from './pages/student/StudentMLRetention';
import StudentProfile from './pages/student/StudentProfile';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyTimetable from './pages/faculty/FacultyTimetable';
import FacultyStudents from './pages/faculty/FacultyStudents';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyMarks from './pages/faculty/FacultyMarks';
import FacultyAssignments from './pages/faculty/FacultyAssignments';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';
import FacultyRetentionQueue from './pages/faculty/FacultyRetentionQueue';
import FacultyProfile from './pages/faculty/FacultyProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminTimetable from './pages/admin/AdminTimetable';
import AdminAttendanceReports from './pages/admin/AdminAttendanceReports';
import AdminExams from './pages/admin/AdminExams';
import AdminFees from './pages/admin/AdminFees';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminUsersAudit from './pages/admin/AdminUsersAudit';
import AdminCohortIntelligence from './pages/admin/AdminCohortIntelligence';
import AdminProfile from './pages/admin/AdminProfile';

// Preserved ML Pages
import PriorityQueue from './pages/PriorityQueue';
import Student360 from './pages/Student360';
import CohortInsights from './pages/CohortInsights';

function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const { role, isAuthenticated } = useAuth();

  // Redirect root to current role dashboard
  const getRoleDashboardRedirect = () => {
    if (!isAuthenticated) return '/login';
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  return (
    <Routes>
      {/* Auth Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={getRoleDashboardRedirect()} replace /> : <Login />
        }
      />

      {/* Main Shell Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Root Redirect */}
        <Route path="/" element={<Navigate to={getRoleDashboardRedirect()} replace />} />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/marks"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/assignments"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/fees"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/timeline"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentTimeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/ml-retention"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentMLRetention />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/timetable"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/students"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/attendance"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/marks"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/assignments"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/announcements"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/retention"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyRetentionQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/profile"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/faculty"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminFaculty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timetable"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance-reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAttendanceReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users-audit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersAudit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cohort-intelligence"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCohortIntelligence />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        {/* Preserved ML Deep Links */}
        <Route
          path="/priority-queue"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <PriorityQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute>
              <Student360 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student360/:id"
          element={
            <ProtectedRoute>
              <Student360 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cohort"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <CohortInsights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cohort-insights"
          element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <CohortInsights />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

