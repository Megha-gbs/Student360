"""backend/app/schemas_college.py

Pydantic schemas for the Student360 College Management System:
Authentication, Timetable, Attendance, Marks, Assignments, Announcements,
Examinations, Fees, Faculty, and Admin Management.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth Schemas
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: Optional[str] = None
    username_or_email: Optional[str] = None
    email: Optional[str] = None
    password: str
    role: Optional[str] = None  # optional role hint


class UserProfile(BaseModel):
    id: str
    username: str
    name: str
    email: str
    role: str  # "student", "faculty", "admin"
    avatar: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    program: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None


class LoginResponse(BaseModel):
    token: str
    user: UserProfile
    message: str = "Login successful"


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


# ---------------------------------------------------------------------------
# Timetable Schemas
# ---------------------------------------------------------------------------
class TimetableEntry(BaseModel):
    id: str
    day: str  # "Monday", "Tuesday", etc.
    subject_code: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    room: str
    start_time: str  # "09:00"
    end_time: str    # "10:00"
    semester: int
    department: str
    class_id: str


class TimetableCreateRequest(BaseModel):
    day: str
    subject_code: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    room: str
    start_time: str
    end_time: str
    semester: int
    department: str
    class_id: str


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    conflict_type: Optional[str] = None  # "room_conflict", "faculty_conflict"
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Attendance Schemas
# ---------------------------------------------------------------------------
class SubjectAttendance(BaseModel):
    subject_code: str
    subject_name: str
    attended: int
    total: int
    percentage: float
    is_low_attendance: bool
    threshold: float = 75.0


class StudentAttendanceSummary(BaseModel):
    student_id: str
    overall_percentage: float
    total_attended: int
    total_classes: int
    subjects: List[SubjectAttendance]
    low_attendance_warning: bool


class AttendanceRecord(BaseModel):
    student_id: str
    student_name: str
    roll_number: str
    status: str  # "Present", "Absent", "Late"
    remarks: Optional[str] = None


class BulkAttendanceSubmit(BaseModel):
    class_id: str
    subject_code: str
    date: str  # "YYYY-MM-DD"
    session: str  # "Morning", "Afternoon", or "Period 1"
    faculty_id: str
    records: List[AttendanceRecord]


class AttendanceReportItem(BaseModel):
    department: str
    semester: int
    total_students: int
    avg_attendance: float
    below_threshold_count: int


# ---------------------------------------------------------------------------
# Marks Schemas
# ---------------------------------------------------------------------------
class SubjectMarks(BaseModel):
    subject_code: str
    subject_name: str
    credits: int
    internal_assessment: float
    midterm_exam: float
    final_exam: Optional[float] = None
    total_marks: float
    max_marks: float = 100.0
    grade: str
    status: str  # "Passed", "In Progress", "Needs Improvement"


class StudentAcademicResults(BaseModel):
    student_id: str
    current_gpa: float
    cgpa: float
    total_credits: int
    earned_credits: int
    subjects: List[SubjectMarks]
    semester_history: List[Dict[str, Any]]


class MarksUpdateRequest(BaseModel):
    student_id: str
    subject_code: str
    internal_assessment: Optional[float] = None
    midterm_exam: Optional[float] = None
    final_exam: Optional[float] = None


# ---------------------------------------------------------------------------
# Assignments Schemas
# ---------------------------------------------------------------------------
class AssignmentSubmission(BaseModel):
    submission_id: str
    student_id: str
    student_name: str
    submitted_at: str
    content: str
    file_name: Optional[str] = None
    status: str  # "Submitted", "Graded", "Late"
    grade: Optional[float] = None
    feedback: Optional[str] = None


class AssignmentItem(BaseModel):
    id: str
    title: str
    description: str
    subject_code: str
    subject_name: str
    faculty_id: str
    faculty_name: Optional[str] = "Dr. Alan Turing"
    class_id: str
    due_date: str
    due_time: str
    max_marks: float
    status: str  # "Active", "Closed"
    submissions_count: int = 0
    total_students: int = 0
    my_submission: Optional[AssignmentSubmission] = None


class AssignmentCreateRequest(BaseModel):
    title: str
    description: str
    subject_code: str
    subject_name: str
    faculty_id: str
    class_id: str
    due_date: str
    due_time: str
    max_marks: float = 100.0


class AssignmentSubmitRequest(BaseModel):
    student_id: str
    content: str
    file_name: Optional[str] = None


class AssignmentGradeRequest(BaseModel):
    grade: float
    feedback: Optional[str] = None


# ---------------------------------------------------------------------------
# Announcements Schemas
# ---------------------------------------------------------------------------
class AnnouncementItem(BaseModel):
    id: str
    title: str
    content: str
    category: str  # "Academic", "Administrative", "Examination", "Campus"
    target_audience: str  # "all", "students", "faculty", "department"
    priority: str  # "Urgent", "Important", "General"
    publisher: str
    publisher_role: str
    created_at: str
    is_read: bool = False


class AnnouncementCreateRequest(BaseModel):
    title: str
    content: str
    category: str
    target_audience: str
    priority: str
    publisher: str
    publisher_role: str


# ---------------------------------------------------------------------------
# Examinations Schemas
# ---------------------------------------------------------------------------
class ExaminationItem(BaseModel):
    id: str
    title: str
    subject_code: str
    subject_name: str
    exam_type: str  # "Midterm", "Final Semester", "Practical Lab"
    date: str
    start_time: str
    end_time: str
    venue: str
    semester: int
    department: str
    results_published: bool = False


class ExaminationCreateRequest(BaseModel):
    title: str
    subject_code: str
    subject_name: str
    exam_type: str
    date: str
    start_time: str
    end_time: str
    venue: str
    semester: int
    department: str


# ---------------------------------------------------------------------------
# Fees Schemas
# ---------------------------------------------------------------------------
class FeeTransaction(BaseModel):
    transaction_id: str
    date: str
    amount: float
    payment_method: str
    receipt_no: str
    status: str  # "Completed", "Pending"


class StudentFeeDetails(BaseModel):
    student_id: str
    student_name: str
    total_fees: float
    scholarship_discount: float
    paid_amount: float
    outstanding_balance: float
    due_date: str
    status: str  # "Paid", "Partially Paid", "Overdue"
    transactions: List[FeeTransaction]


class FeePaymentRequest(BaseModel):
    student_id: str
    amount: float
    payment_method: str = "Online NetBanking"


class InstitutionFeeSummary(BaseModel):
    total_billed: float
    total_collected: float
    total_outstanding: float
    collection_rate_percent: float
    total_students_billed: int
    defaulters_count: int


# ---------------------------------------------------------------------------
# Notifications & Daily Timetable Schedule Notifications
# ---------------------------------------------------------------------------
class NotificationItem(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str  # "daily_schedule", "assignment", "fee", "announcement", "system"
    priority: str  # "high", "normal", "low"
    created_at: str
    read: bool
    delivery_channel: str = "in_app"
    delivery_status: str = "delivered"
    metadata: Optional[Dict[str, Any]] = None


class DailyScheduleNotificationResult(BaseModel):
    target_date: str
    total_students_processed: int
    notifications_created: int
    skipped_duplicates: int
    skipped_quiet_hours: int
    status: str
    details: List[Dict[str, Any]]


# ---------------------------------------------------------------------------
# Admin Management & CSV Import Schemas
# ---------------------------------------------------------------------------
class AdminStudentItem(BaseModel):
    student_id: str
    roll_number: str
    name: str
    email: str
    phone: str
    department: str
    program: str
    semester: int
    admission_year: int
    status: str  # "Active", "Inactive", "On Leave"
    cgpa: float
    attendance_rate: float
    fees_status: str


class AdminStudentCreate(BaseModel):
    student_id: str
    roll_number: str
    name: str
    email: str
    phone: str
    department: str
    program: str
    semester: int
    admission_year: int = 2024


class CsvImportResult(BaseModel):
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    errors: List[Dict[str, Any]]
    message: str


class AuditLogItem(BaseModel):
    id: str
    timestamp: str
    actor: str
    actor_role: str
    action: str
    target: str
    details: str


# ---------------------------------------------------------------------------
# Timeline & Achievement Verification Schemas
# ---------------------------------------------------------------------------
class TimelineEntry(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    title: str
    category: str  # Education, Exams, Semesters, Projects, Hackathons, Events, Clubs, Internships, Certifications, Awards, Placement Milestones
    academic_year: str  # e.g., "2024-2025"
    date: str  # e.g., "2024-11-15"
    description: str
    organization: Optional[str] = None
    evidence_url: Optional[str] = None
    skills: Optional[List[str]] = None
    source: str = "student"  # "student", "faculty", "institution"
    verification_status: str = "Self-Reported"  # "Self-Reported", "Institution-Verified", "Rejected"
    is_verified: bool = False
    verified_by: Optional[str] = None
    verified_by_id: Optional[str] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None
    created_at: str


class TimelineEntryCreate(BaseModel):
    title: str
    category: str
    academic_year: str = "2024-2025"
    date: str
    description: str
    organization: Optional[str] = None
    evidence_url: Optional[str] = None
    skills: Optional[List[str]] = None


class TimelineEntryUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    academic_year: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    organization: Optional[str] = None
    evidence_url: Optional[str] = None
    skills: Optional[List[str]] = None


class AchievementVerificationRequest(BaseModel):
    status: str = Field(..., pattern="^(Institution-Verified|Rejected)$")
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None


class ImportHistoryItem(BaseModel):
    id: str
    timestamp: str
    imported_by: str
    filename: str
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    status: str
