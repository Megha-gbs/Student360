import React, { useState, useEffect } from 'react';
import {
  Save,
  UserCheck,
  UserX,
  Check,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { attendanceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FacultyAttendance() {
  const { user } = useAuth();
  const [classId, setClassId] = useState('CS-Sem2');
  const [subjectCode, setSubjectCode] = useState('CS301');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState('Morning');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ text: '', type: '' });

  const loadAttendanceSheet = async () => {
    setLoading(true);
    setSaveStatus({ text: '', type: '' });
    try {
      const data = await attendanceApi.getClassAttendanceSheet({
        class_id: classId,
        subject_code: subjectCode,
        date: date,
      });
      setStudents(data || []);
    } catch (err) {
      console.error('Error loading attendance sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceSheet();
  }, [classId, subjectCode, date]);

  const handleStatusChange = (studentId, newStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleRemarksChange = (studentId, remarks) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, remarks } : s))
    );
  };

  const handleMarkAll = (status) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (students.length === 0) return;

    setSubmitting(true);
    setSaveStatus({ text: '', type: '' });

    try {
      const payload = {
        class_id: classId,
        subject_code: subjectCode,
        date: date,
        session: session,
        faculty_id: user?.id || 'FAC-CS101',
        records: students.map((s) => ({
          student_id: s.student_id,
          student_name: s.student_name,
          roll_number: s.roll_number,
          status: s.status || 'Present',
          remarks: s.remarks || '',
        })),
      };

      const res = await attendanceApi.submitAttendance(payload);
      const count = res.records_processed ?? res.records_count ?? students.length;
      setSaveStatus({
        text: `Saved: ${count} records (${res.present_count ?? presentCount} Present, ${res.absent_count ?? absentCount} Absent, ${res.late_count ?? lateCount} Late)`,
        type: 'success',
      });
      setTimeout(() => {
        setSaveStatus((prev) => (prev.type === 'success' ? { text: '', type: '' } : prev));
      }, 5000);
    } catch (err) {
      setSaveStatus({
        text: err.response?.data?.detail || 'Failed to submit attendance records.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = students.filter((s) => s.status === 'Present').length;
  const absentCount = students.filter((s) => s.status === 'Absent').length;
  const lateCount = students.filter((s) => s.status === 'Late').length;

  return (
    <div className="space-y-3.5">
      {/* Compact Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#D0D0D0]">
        <div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-[#767676] mb-0.5">
            <span>Attendance</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-[#1A1A1A]">Mark Attendance</span>
          </div>
          <h2 className="text-[16px] font-bold text-[#1A1A1A] tracking-tight">
            Class Attendance Management
          </h2>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-3">
          {saveStatus.text && (
            <span
              className={`inline-flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-[3px] ${
                saveStatus.type === 'success'
                  ? 'bg-[#1A7F37]/10 text-[#1A7F37] border border-[#1A7F37]/30'
                  : 'bg-[#B91C1C]/10 text-[#B91C1C] border border-[#B91C1C]/30'
              }`}
            >
              {saveStatus.type === 'success' ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              {saveStatus.text}
            </span>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
            className="px-3.5 py-1.5 bg-[#00338D] hover:bg-[#002B7A] text-white text-[12.5px] font-semibold rounded-[3px] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {submitting ? 'Saving...' : 'Save & Submit'}
          </button>
        </div>
      </div>

      {/* Single-Row Filter Bar */}
      <div className="p-3 bg-[#F5F5F5] border border-[#D0D0D0] rounded-[4px] grid grid-cols-1 sm:grid-cols-4 gap-3 text-[12.5px]">
        <div>
          <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
            Course Subject
          </label>
          <select
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            className="w-full p-1.5 bg-white border border-[#D0D0D0] text-[#1A1A1A] rounded-[3px] outline-none focus:border-[#00338D]"
          >
            <option value="CS301">CS301 — Data Structures & Algorithms</option>
            <option value="CS305">CS305 — Software Engineering</option>
            <option value="CS402">CS402 — Machine Learning Fundamentals</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
            Class Section
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full p-1.5 bg-white border border-[#D0D0D0] text-[#1A1A1A] rounded-[3px] outline-none focus:border-[#00338D]"
          >
            <option value="CS-Sem2">CS-Sem2 (Design & Core - 10 students)</option>
            <option value="CS-Sem3-A">CS-Sem3 Section A (5 students)</option>
            <option value="CS-Sem3-B">CS-Sem3 Section B (5 students)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-1.5 bg-white border border-[#D0D0D0] text-[#1A1A1A] rounded-[3px] outline-none font-mono text-[12px] focus:border-[#00338D]"
          />
        </div>

        <div>
          <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
            Session Period
          </label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="w-full p-1.5 bg-white border border-[#D0D0D0] text-[#1A1A1A] rounded-[3px] outline-none focus:border-[#00338D]"
          >
            <option value="Morning">Morning Lecture (09:00 - 10:15)</option>
            <option value="Afternoon">Afternoon Lab (13:30 - 15:00)</option>
          </select>
        </div>
      </div>

      {/* Roster Controls & Dynamic Inline Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[12.5px]">
        <div className="font-semibold text-[#1A1A1A] flex items-center gap-2">
          <span>
            {students.length} students &middot;{' '}
            <span className="text-[#1A7F37] font-bold">{presentCount} Present</span> &middot;{' '}
            <span className="text-[#B91C1C] font-bold">{absentCount} Absent</span> &middot;{' '}
            <span className="text-[#92600A] font-bold">{lateCount} Late</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMarkAll('Present')}
            className="px-2.5 py-1 bg-white hover:bg-[#F5F5F5] text-[#1A7F37] border border-[#D0D0D0] font-semibold rounded-[3px] text-[12px] transition-colors flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('Absent')}
            className="px-2.5 py-1 bg-white hover:bg-[#F5F5F5] text-[#B91C1C] border border-[#D0D0D0] font-semibold rounded-[3px] text-[12px] transition-colors flex items-center gap-1"
          >
            <UserX className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="border border-[#D0D0D0] rounded-[4px] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse table-zebra">
          <thead>
            <tr className="bg-[#F0F0F0] border-b border-[#D0D0D0] text-[#4A4A4A] text-[12px] font-bold">
              <th className="py-2 px-3 w-28">Student ID</th>
              <th className="py-2 px-3 w-32">Roll Number</th>
              <th className="py-2 px-3">Full Name</th>
              <th className="py-2 px-3 text-center w-56">Attendance Status</th>
              <th className="py-2 px-3 w-64">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-[12.5px]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[#767676]">
                  Loading section roster...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[#767676]">
                  No students found for this section.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.student_id}>
                  <td className="py-2 px-3 font-mono font-bold text-[#00338D]">
                    {student.student_id}
                  </td>
                  <td className="py-2 px-3 font-mono text-[#767676]">
                    {student.roll_number}
                  </td>
                  <td className="py-2 px-3 font-bold text-[#1A1A1A]">
                    {student.student_name}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.student_id, 'Present')}
                        className={`px-2.5 py-0.5 text-[11.5px] font-bold rounded-[3px] border transition-colors ${
                          student.status === 'Present'
                            ? 'bg-[#1A7F37] text-white border-[#1A7F37]'
                            : 'bg-white text-[#4A4A4A] border-[#D0D0D0] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.student_id, 'Absent')}
                        className={`px-2.5 py-0.5 text-[11.5px] font-bold rounded-[3px] border transition-colors ${
                          student.status === 'Absent'
                            ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                            : 'bg-white text-[#4A4A4A] border-[#D0D0D0] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(student.student_id, 'Late')}
                        className={`px-2.5 py-0.5 text-[11.5px] font-bold rounded-[3px] border transition-colors ${
                          student.status === 'Late'
                            ? 'bg-[#92600A] text-white border-[#92600A]'
                            : 'bg-white text-[#4A4A4A] border-[#D0D0D0] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Add note..."
                      value={student.remarks || ''}
                      onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                      className="w-full py-0.5 bg-transparent border-b border-[#D0D0D0] text-[12px] text-[#1A1A1A] placeholder-[#A0A0A0] outline-none focus:border-[#00338D]"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
