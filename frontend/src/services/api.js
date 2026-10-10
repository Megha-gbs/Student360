/**
 * Student360 Centralized API Service
 * ===================================
 * Manages all HTTP communications with the backend.
 * Points directly to the FastAPI backend root without forced /api prefixes.
 * Normalizes backend responses into the exact shape expected by React components.
 * Retains isolated demo dataset purely as an offline fallback safety net.
 */

import axios from 'axios';

// Ensure base URL points to the backend root without trailing /api
const defaultBaseUrl =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://student360-gy0b.onrender.com'
    : 'http://localhost:8000';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || defaultBaseUrl;
export const API_BASE_URL = rawBaseUrl.replace(/\/api\/?$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatic authorization header attachment
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('student360_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Canonical mapping of UCI Course Codes to Friendly Degree Titles
export const COURSE_NAMES = {
  171: "Animation and Multimedia Design (171)",
  9254: "Agronomy (9254)",
  9070: "Communication Design (9070)",
  9773: "Veterinary Nursing (9773)",
  9238: "Basic Education (9238)",
  9147: "Management (9147)",
  9003: "Social Service (9003)",
  9119: "Informatics Engineering (9119)",
  9500: "Nursing (9500)",
  9085: "Journalism and Communication (9085)",
  9239: "Tourism (9239)",
};

export const getCourseName = (courseId) => {
  if (!courseId) return "Higher Education Degree Program";
  const cid = Number(courseId);
  return COURSE_NAMES[cid] || `Degree Program (${courseId})`;
};

// ============================================================================
// ISOLATED DEMO FALLBACK DATA (Derived strictly from docs/DEMO_STUDENTS.json)
// Used only as an offline safety net when backend server is unreachable.
// ============================================================================
const FALLBACK_DEMO_STUDENTS = [
  {
    student_id: "S1001",
    risk_score: 74,
    risk_level: "High",
    dropout_probability: 0.7449,
    trend: "Stable",
    priority: "Immediate",
    model_version: "student360_xgb_v2_real_features",
    course_name: "Animation and Multimedia Design (171)",
    gender: 1,
    age_at_enrollment: 20,
    tuition_fees_up_to_date: 1,
    debtor: 0,
    scholarship_holder: 0,
    displaced: 1,
    trajectory: {
      has_data: true,
      trajectory_type: "real_sem1_to_sem2",
      note: "Based on actual 1st vs 2nd semester curricular units from the dataset",
      sem1: { enrolled: 0, approved: 0, grade: 0.0, evaluations: 0, risk_score: 75 },
      sem2: { enrolled: 0, approved: 0, grade: 0.0, evaluations: 0, risk_score: 74 }
    },
    top_reasons: [
      { feature: "Curricular units 2nd sem (approved)", value: 0, impact: "high", direction: "increases_risk" },
      { feature: "Curricular units 1st sem (approved)", value: 0, impact: "high", direction: "increases_risk" },
      { feature: "Age at enrollment", value: 20, impact: "medium", direction: "increases_risk" },
      { feature: "Tuition fees up to date", value: 1, impact: "medium", direction: "decreases_risk" }
    ],
    recommended_intervention: {
      action_type: "Subject Tutoring & Academic Recovery Plan",
      description: "Student has 0 approved units across semesters. Enroll in 1-on-1 tutoring and bi-weekly faculty mentoring.",
      priority: "Immediate",
      status: "Pending Human Approval"
    }
  },
  {
    student_id: "S1002",
    risk_score: 10,
    risk_level: "Low",
    dropout_probability: 0.0976,
    trend: "Improving",
    priority: "Standard",
    model_version: "student360_xgb_v2_real_features",
    course_name: "Agronomy (9254)",
    gender: 1,
    age_at_enrollment: 19,
    tuition_fees_up_to_date: 0,
    debtor: 0,
    scholarship_holder: 0,
    displaced: 1,
    trajectory: {
      has_data: true,
      trajectory_type: "real_sem1_to_sem2",
      note: "Based on actual 1st vs 2nd semester curricular units from the dataset",
      sem1: { enrolled: 6, approved: 6, grade: 14.0, evaluations: 6, risk_score: 12 },
      sem2: { enrolled: 6, approved: 6, grade: 13.67, evaluations: 6, risk_score: 10 }
    },
    top_reasons: [
      { feature: "Curricular units 2nd sem (approved)", value: 6, impact: "high", direction: "decreases_risk" },
      { feature: "Curricular units 1st sem (approved)", value: 6, impact: "high", direction: "decreases_risk" },
      { feature: "Curricular units 2nd sem (grade)", value: 13.67, impact: "medium", direction: "decreases_risk" },
      { feature: "Tuition fees up to date", value: 0, impact: "medium", direction: "increases_risk" }
    ],
    recommended_intervention: {
      action_type: "Tuition Payment Plan Consultation",
      description: "Strong academic standing (12/12 units passed). Review bursar payment plan to resolve pending tuition fee.",
      priority: "Low",
      status: "Pending Human Approval"
    }
  }
];

const FALLBACK_COHORT_INSIGHTS = {
  total_students: 10,
  high_risk_count: 3,
  medium_risk_count: 1,
  low_risk_count: 6,
  risk_distribution: {
    High: 3,
    Medium: 1,
    Low: 6
  },
  global_shap: [
    { feature: "Curricular units 2nd sem (approved)", mean_abs_shap: 0.28 },
    { feature: "Curricular units 1st sem (approved)", mean_abs_shap: 0.24 },
    { feature: "Tuition fees up to date", mean_abs_shap: 0.19 },
    { feature: "Curricular units 2nd sem (grade)", mean_abs_shap: 0.15 },
    { feature: "Curricular units 1st sem (grade)", mean_abs_shap: 0.12 },
    { feature: "Age at enrollment", mean_abs_shap: 0.09 },
    { feature: "Scholarship holder", mean_abs_shap: 0.08 },
    { feature: "Debtor", mean_abs_shap: 0.06 }
  ],
  segments: [
    { name: "High academic risk (Approved units <= 2)", count: 3, risk_tier: "High" },
    { name: "Financial risk (Debtor or Tuition overdue)", count: 1, risk_tier: "Medium" },
    { name: "Retention transition risk (Age > 25)", count: 1, risk_tier: "Low / Moderate" }
  ],
  by_course: [
    { course: "Animation and Multimedia Design (171)", total: 1, count: 1, high_risk_count: 1, high_risk_pct: 100.0, avg_risk: 74 },
    { course: "Communication Design (9070)", total: 1, count: 1, high_risk_count: 1, high_risk_pct: 100.0, avg_risk: 99 },
    { course: "Agronomy (9254)", total: 2, count: 2, high_risk_count: 1, high_risk_pct: 50.0, avg_risk: 54 },
    { course: "Nursing (9500)", total: 1, count: 1, high_risk_count: 0, high_risk_pct: 0.0, avg_risk: 47 },
    { course: "Informatics Engineering (9119)", total: 1, count: 1, high_risk_count: 0, high_risk_pct: 0.0, avg_risk: 26 },
    { course: "Social Service (9003)", total: 1, count: 1, high_risk_count: 0, high_risk_pct: 0.0, avg_risk: 17 },
    { course: "Veterinary Nursing (9773)", total: 1, count: 1, high_risk_count: 0, high_risk_pct: 0.0, avg_risk: 9 },
    { course: "Management (9147)", total: 1, count: 1, high_risk_count: 0, high_risk_pct: 0.0, avg_risk: 3 },
    { course: "Basic Education (9238)", total: 1, count: 1, high_risk_count: 0, high_risk_pct: 0.0, avg_risk: 1 }
  ]
};

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

/**
 * Normalizes an individual student payload from the backend into component state.
 */
export const normalizeStudentPayload = (raw) => {
  if (!raw) return null;
  const f = raw.features || {};

  // Build real Sem1 -> Sem2 trajectory data structure
  const pts = raw.trajectory_data?.points || [];
  const p1 = pts.find(p => p.semester === 'Sem 1') || pts[0] || {};
  const p2 = pts.find(p => p.semester === 'Sem 2') || pts[1] || {};

  const sem1 = {
    enrolled: p1.enrolled_units ?? f["Curricular units 1st sem (enrolled)"] ?? 0,
    approved: p1.approved_units ?? f["Curricular units 1st sem (approved)"] ?? 0,
    grade: Number(p1.grade ?? f["Curricular units 1st sem (grade)"] ?? 0),
    evaluations: f["Curricular units 1st sem (evaluations)"] ?? (p1.approved_units ?? 0),
    risk_score: p1.risk_score ?? 75,
  };

  const sem2 = {
    enrolled: p2.enrolled_units ?? f["Curricular units 2nd sem (enrolled)"] ?? 0,
    approved: p2.approved_units ?? f["Curricular units 2nd sem (approved)"] ?? 0,
    grade: Number(p2.grade ?? f["Curricular units 2nd sem (grade)"] ?? 0),
    evaluations: f["Curricular units 2nd sem (evaluations)"] ?? (p2.approved_units ?? 0),
    risk_score: p2.risk_score ?? raw.risk_score ?? 74,
  };

  const trajectory = {
    has_data: true,
    trajectory_type: "real_sem1_to_sem2",
    note: raw.trajectory_data?.note || "Based on actual 1st vs 2nd semester curricular units from the dataset",
    points: pts,
    sem1,
    sem2,
  };

  // Derive human-in-the-loop intervention draft grounded in real risk drivers
  let intervention = {
    action_type: "Comprehensive Academic Counseling",
    description: `Standard academic monitoring for student ${raw.student_id}. Schedule faculty mentor check-in.`,
    priority: raw.risk_level === "High" ? "Immediate" : "Standard",
    status: "Pending Human Approval",
  };

  const isDebtor = Number(f["Debtor"]) === 1;
  const isTuitionOverdue = Number(f["Tuition fees up to date"]) === 0;
  const approvedSem2 = Number(f["Curricular units 2nd sem (approved)"] ?? sem2.approved);

  if (isDebtor || isTuitionOverdue) {
    intervention = {
      action_type: "Financial Aid Counseling & Bursar Planning",
      description: `Student has financial holds or outstanding tuition status. Consult with bursar's office regarding emergency grants or deferred payment schedules.`,
      priority: "Immediate",
      status: "Pending Human Approval",
    };
  } else if (approvedSem2 <= 2) {
    intervention = {
      action_type: "Subject Tutoring & Academic Recovery Plan",
      description: `Student completed ${approvedSem2} approved units in 2nd semester. Assign dedicated subject tutor and bi-weekly progress review with academic advisor.`,
      priority: "Immediate",
      status: "Pending Human Approval",
    };
  }

  const courseTitle = raw.course_name || getCourseName(f["Course"]);

  return {
    student_id: raw.student_id,
    risk_score: raw.risk_score,
    risk_level: raw.risk_level,
    dropout_probability: raw.dropout_probability,
    model_version: raw.model_version || "student360_xgb_v2_real_features",
    trend: raw.trend || "Stable",
    priority: raw.priority || (raw.risk_level === "High" ? "Immediate" : raw.risk_level === "Medium" ? "Medium" : "Standard"),
    course_name: courseTitle,
    age_at_enrollment: f["Age at enrollment"] ?? 20,
    tuition_fees_up_to_date: f["Tuition fees up to date"] ?? 1,
    debtor: f["Debtor"] ?? 0,
    scholarship_holder: f["Scholarship holder"] ?? 0,
    displaced: f["Displaced"] ?? 0,
    gender: f["Gender"] ?? 0,
    features: f,
    top_reasons: raw.top_reasons || [],
    trajectory_data: raw.trajectory_data,
    trajectory,
    recommended_intervention: intervention,
    actual_outcome_reference: raw.actual_outcome_reference,
  };
};

// ============================================================================
// EXPORTED API FUNCTIONS (Direct Backend Integration)
// ============================================================================

/**
 * Health check endpoint
 * GET /health
 */
export const getHealth = async () => {
  try {
    const res = await apiClient.get('/health');
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Priority Queue student list
 * GET /students/priority-queue (or GET /students)
 */
export const getStudents = async () => {
  try {
    const res = await apiClient.get('/students/priority-queue');
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.students || []);
    const normalized = rawList.map(item => ({
      student_id: item.student_id,
      risk_score: item.risk_score,
      risk_level: item.risk_level,
      dropout_probability: item.dropout_probability,
      model_version: item.model_version,
      trend: item.trend || 'Stable',
      priority: item.priority || (item.risk_level === 'High' ? 'Immediate' : item.risk_level === 'Medium' ? 'Medium' : 'Standard'),
      course_name: item.course_name || getCourseName(item.course_id),
    }));
    return { success: true, data: normalized };
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || 'Error connecting to student queue.';
    console.error(`[Student360 API] /students/priority-queue error:`, errorMsg);
    return { success: false, error: errorMsg, status: err.response?.status };
  }
};

/**
 * Individual Student 360 Full Profile
 * GET /students/{id}
 */
export const getStudent = async (studentId) => {
  try {
    const res = await apiClient.get(`/students/${studentId}`);
    const normalized = normalizeStudentPayload(res.data);
    return { success: true, data: normalized };
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || `Student ${studentId} not found.`;
    console.error(`[Student360 API] /students/${studentId} error:`, errorMsg);
    return { success: false, error: errorMsg, status: err.response?.status };
  }
};

/**
 * What-If Counterfactual Simulation
 * POST /students/{id}/what-if (or POST /simulate)
 */
export const simulateStudent = async (payload) => {
  const targetId = payload.student_id || 'S1001';
  try {
    // Send changes so backend applies partial delta to real student baseline
    const reqBody = {
      student_id: targetId,
      changes: payload.features || payload.changes,
    };
    const res = await apiClient.post(`/students/${targetId}/what-if`, reqBody);
    const orig = res.data.original_risk ?? payload.original_risk ?? 74;
    const sim = res.data.simulated_risk ?? res.data.risk_score ?? orig;
    return {
      success: true,
      data: {
        ...res.data,
        student_id: targetId,
        original_risk: orig,
        simulated_risk: sim,
        risk_change: sim - orig,
        simulation_type: res.data.simulation_type || "model_based_counterfactual",
        note: res.data.note,
      },
    };
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || 'Simulation error from backend.';
    console.error(`[Student360 API] Simulation error:`, errorMsg);
    return { success: false, error: errorMsg, status: err.response?.status };
  }
};

/**
 * Human-in-the-Loop Intervention Submission / Approval
 * POST /intervention (or POST /intervene)
 */
export const intervene = async (payload) => {
  try {
    const reqBody = {
      student_id: payload.student_id,
      intervention_type: payload.action_type || payload.intervention_type || "Academic Counseling",
      approved: true,
      notes: payload.notes || "Approved intervention plan",
    };
    const res = await apiClient.post('/intervention', reqBody);
    return {
      success: true,
      data: {
        ...res.data,
        advisor: payload.advisor || "Senior Academic Advisor",
        timestamp: payload.timestamp || new Date().toISOString(),
        action_type: res.data.intervention_type,
        status: res.data.status === "approved" ? "Approved" : res.data.status,
      },
    };
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || 'Intervention submission failed.';
    console.error(`[Student360 API] Intervention error:`, errorMsg);
    return { success: false, error: errorMsg, status: err.response?.status };
  }
};

/**
 * Simulated Outcome Post-Intervention
 * POST /students/{id}/simulate-outcome
 */
export const simulateOutcome = async (studentId, payload = {}) => {
  try {
    const res = await apiClient.post(`/students/${studentId}/simulate-outcome`, payload);
    const projRisk = res.data.simulated_risk_score ?? Math.max(8, Math.round((payload.current_risk || 70) * 0.45));
    return {
      success: true,
      data: {
        student_id: studentId,
        projected_dropout_risk: projRisk,
        projected_retention_probability: Number(((100 - projRisk) / 100).toFixed(2)),
        projected_graduation_timeline: projRisk < 35 ? "On-Track for On-Time Graduation" : "On-Track with 1 Retake Term",
        confidence: "High",
        projection_type: res.data.badge || "SIMULATED DEMONSTRATION OUTCOME",
        badge: res.data.badge,
        note: res.data.note,
      },
    };
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || 'Failed to simulate outcome.';
    console.error(`[Student360 API] Simulate outcome error:`, errorMsg);
    return { success: false, error: errorMsg, status: err.response?.status };
  }
};

/**
 * Cohort Insights & Global SHAP
 * GET /cohort/insights
 */
export const getCohortInsights = async () => {
  try {
    const res = await apiClient.get('/cohort/insights');
    const raw = res.data || {};

    // Normalize segments
    const segments = (raw.segments || []).map(seg => ({
      name: seg.name,
      count: seg.count,
      risk_tier: seg.name?.toLowerCase().includes('high') ? 'High' : (seg.name?.toLowerCase().includes('financial') ? 'Medium' : 'Low / Moderate'),
    }));

    // Normalize course breakdown
    const by_course = (raw.by_course || []).map(item => {
      const highRatio = item.high_risk_pct > 1 ? item.high_risk_pct / 100 : item.high_risk_pct;
      const totalCount = item.total ?? item.count ?? 1;
      const highCount = item.high_risk_count ?? Math.round(highRatio * totalCount);
      const highPct = Number((highRatio * 100).toFixed(1));
      return {
        course: item.course,
        total: totalCount,
        count: totalCount,
        high_risk_count: highCount,
        high_risk_pct: highPct,
        avg_risk: Math.round(highPct),
      };
    });

    return {
      success: true,
      data: {
        total_students: raw.total_students,
        high_risk_count: raw.high_risk_count,
        medium_risk_count: raw.medium_risk_count,
        low_risk_count: raw.low_risk_count,
        risk_distribution: raw.risk_distribution || { High: 0, Medium: 0, Low: 0 },
        global_shap: raw.global_shap || [],
        segments,
        by_course,
      },
    };
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message || 'Cohort insights unavailable.';
    console.error(`[Student360 API] Cohort insights error:`, errorMsg);
    return { success: false, error: errorMsg, status: err.response?.status };
  }
};

// ============================================================================
// COLLEGE MANAGEMENT API SERVICES
// ============================================================================

export const authApi = {
  login: async (username, password, role) => {
    const res = await apiClient.post('/auth/login', { username, password, role });
    return res.data;
  },
  getMe: async (token) => {
    const res = await apiClient.get('/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },
  changePassword: async (old_password, new_password, user_id) => {
    const res = await apiClient.post(`/auth/change-password?user_id=${user_id || 'S1001'}`, {
      old_password,
      new_password,
    });
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
};

export const timetableApi = {
  getTimetable: async (params = {}) => {
    const res = await apiClient.get('/timetable', { params });
    return res.data;
  },
  addEntry: async (entryData) => {
    const res = await apiClient.post('/timetable', entryData);
    return res.data;
  },
  deleteEntry: async (id) => {
    const res = await apiClient.delete(`/timetable/${id}`);
    return res.data;
  },
};

export const attendanceApi = {
  getStudentAttendance: async (studentId) => {
    const res = await apiClient.get(`/attendance/student/${studentId}`);
    return res.data;
  },
  getClassAttendanceSheet: async (params = {}) => {
    const res = await apiClient.get('/attendance/class', { params });
    return res.data;
  },
  submitAttendance: async (payload) => {
    const res = await apiClient.post('/attendance/submit', payload);
    return res.data;
  },
  getReports: async () => {
    const res = await apiClient.get('/attendance/report');
    return res.data;
  },
};

export const marksApi = {
  getStudentMarks: async (studentId) => {
    const res = await apiClient.get(`/marks/student/${studentId}`);
    return res.data;
  },
  updateMarks: async (payload) => {
    const res = await apiClient.post('/marks/update', payload);
    return res.data;
  },
};

export const assignmentsApi = {
  listAssignments: async (params = {}) => {
    const res = await apiClient.get('/assignments', { params });
    return res.data;
  },
  createAssignment: async (payload) => {
    const res = await apiClient.post('/assignments', payload);
    return res.data;
  },
  submitAssignment: async (assignmentId, payload) => {
    const res = await apiClient.post(`/assignments/${assignmentId}/submit`, payload);
    return res.data;
  },
  gradeAssignment: async (assignmentId, studentId, payload) => {
    const res = await apiClient.post(`/assignments/${assignmentId}/grade?student_id=${studentId}`, payload);
    return res.data;
  },
};

export const announcementsApi = {
  listAnnouncements: async (params = {}) => {
    const res = await apiClient.get('/announcements', { params });
    return res.data;
  },
  createAnnouncement: async (payload) => {
    const res = await apiClient.post('/announcements', payload);
    return res.data;
  },
  markRead: async (announcementId, userId) => {
    const res = await apiClient.post(`/announcements/${announcementId}/read?user_id=${userId}`);
    return res.data;
  },
  deleteAnnouncement: async (announcementId) => {
    const res = await apiClient.delete(`/announcements/${announcementId}`);
    return res.data;
  },
};

export const examinationsApi = {
  listExaminations: async (params = {}) => {
    const res = await apiClient.get('/examinations', { params });
    return res.data;
  },
  createExamination: async (payload) => {
    const res = await apiClient.post('/examinations', payload);
    return res.data;
  },
  updateExamination: async (examId, updates) => {
    const res = await apiClient.put(`/examinations/${examId}`, updates);
    return res.data;
  },
};

export const feesApi = {
  getStudentFees: async (studentId) => {
    const res = await apiClient.get(`/fees/student/${studentId}`);
    return res.data;
  },
  payFees: async (payload) => {
    const res = await apiClient.post('/fees/pay', payload);
    return res.data;
  },
  getInstitutionSummary: async () => {
    const res = await apiClient.get('/fees/summary');
    return res.data;
  },
};

export const notificationsApi = {
  getNotifications: async (userId = 'S1001') => {
    const res = await apiClient.get(`/notifications?user_id=${userId}`);
    return res.data;
  },
  markRead: async (id) => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async (userId = 'S1001') => {
    const res = await apiClient.post(`/notifications/read-all?user_id=${userId}`);
    return res.data;
  },
  triggerDailySchedule: async (targetDate, checkQuietHours = false) => {
    const params = {};
    if (targetDate) params.target_date = targetDate;
    if (checkQuietHours) params.check_quiet_hours = checkQuietHours;
    const res = await apiClient.post('/notifications/trigger-daily-schedule', {}, { params });
    return res.data;
  },
};

export const adminApi = {
  getStudents: async (params = {}) => {
    const res = await apiClient.get('/admin/students', { params });
    return res.data;
  },
  createStudent: async (payload) => {
    const res = await apiClient.post('/admin/students', payload);
    return res.data;
  },
  updateStudent: async (studentId, updates) => {
    const res = await apiClient.put(`/admin/students/${studentId}`, updates);
    return res.data;
  },
  importCsv: async (rows) => {
    const res = await apiClient.post('/admin/students/import-csv', rows);
    return res.data;
  },
  getFaculty: async () => {
    const res = await apiClient.get('/faculty');
    return res.data;
  },
  createFaculty: async (payload) => {
    const res = await apiClient.post('/faculty', payload);
    return res.data;
  },
  updateFaculty: async (facultyId, updates) => {
    const res = await apiClient.put(`/faculty/${facultyId}`, updates);
    return res.data;
  },
  getAuditLogs: async (limit = 50) => {
    const res = await apiClient.get(`/admin/audit-logs?limit=${limit}`);
    return res.data;
  },
  getDepartments: async () => {
    const res = await apiClient.get('/departments');
    return res.data;
  },
  getUsers: async () => {
    const res = await apiClient.get('/auth/users');
    return res.data;
  },
  createUser: async (payload) => {
    const res = await apiClient.post('/auth/users', payload);
    return res.data;
  },
  updateUserStatus: async (userId, status) => {
    const res = await apiClient.patch(`/auth/users/${userId}/status`, { status });
    return res.data;
  },
  assignStudentsToFaculty: async (facultyId, studentIds) => {
    const res = await apiClient.post(`/auth/faculty/${facultyId}/assign-students`, { student_ids: studentIds });
    return res.data;
  },
  getImportHistory: async () => {
    const res = await apiClient.get('/admin/import-history');
    return res.data;
  },
};

export const timelineApi = {
  getTimeline: async (studentId, params = {}) => {
    const res = await apiClient.get(`/students/${studentId}/timeline`, { params });
    return res.data;
  },
  createTimelineEntry: async (studentId, payload) => {
    const res = await apiClient.post(`/students/${studentId}/timeline`, payload);
    return res.data;
  },
  updateTimelineEntry: async (studentId, entryId, payload) => {
    const res = await apiClient.put(`/students/${studentId}/timeline/${entryId}`, payload);
    return res.data;
  },
  deleteTimelineEntry: async (studentId, entryId) => {
    const res = await apiClient.delete(`/students/${studentId}/timeline/${entryId}`);
    return res.data;
  },
};

export const verificationApi = {
  getPendingVerifications: async () => {
    const res = await apiClient.get('/achievements/pending-verification');
    return res.data;
  },
  verifyAchievement: async (entryId, status, rejectionReason = null) => {
    const res = await apiClient.post(`/achievements/${entryId}/verify`, {
      status,
      rejection_reason: rejectionReason,
    });
    return res.data;
  },
};

export const assistantApi = {
  chat: async (payload) => {
    const res = await apiClient.post('/assistant/chat', payload);
    return res.data;
  },
  getStatus: async () => {
    const res = await apiClient.get('/assistant/status');
    return res.data;
  },
};


export default {
  API_BASE_URL,
  COURSE_NAMES,
  getHealth,
  getStudents,
  getStudent,
  simulateStudent,
  intervene,
  simulateOutcome,
  getCohortInsights,
  normalizeStudentPayload,
  authApi,
  timetableApi,
  attendanceApi,
  marksApi,
  assignmentsApi,
  announcementsApi,
  examinationsApi,
  feesApi,
  notificationsApi,
  adminApi,
  timelineApi,
  verificationApi,
  assistantApi,
};


