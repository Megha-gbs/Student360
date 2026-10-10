import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckSquare,
  FileText,
  Clock,
  Calendar,
  BrainCircuit,
  ArrowRight,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import TimetableWidget from '../../components/TimetableWidget';
import AnnouncementPanel from '../../components/AnnouncementPanel';
import { useAuth } from '../../context/AuthContext';
import { timetableApi, assignmentsApi, announcementsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const facultyId = user?.id || 'FAC-CS101';

  const [timetable, setTimetable] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      timetableApi.getTimetable({ faculty_id: facultyId }).catch(() => []),
      assignmentsApi.listAssignments({ faculty_id: facultyId }).catch(() => []),
      announcementsApi.listAnnouncements({ audience: 'faculty', user_id: facultyId }).catch(() => []),
    ]).then(([tt, asn, ann]) => {
      setTimetable(tt || []);
      setAssignments(asn || []);
      setAnnouncements(ann || []);
      setLoading(false);
    });
  }, [facultyId]);

  return (
    <div className="space-y-5">
      {/* Faculty Profile Banner (Enterprise Reference) */}
      <div className="bg-white border border-[#D0D0D0] rounded p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Faculty'}
              className="w-16 h-16 rounded object-cover border border-[#D0D0D0] flex-shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                  {user?.name || 'Dr. Alan Turing'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#00338D]/10 text-[#00338D] border border-[#00338D]/20">
                  {user?.designation || 'Professor & Head of Department'}
                </span>
                <span className="text-xs text-[#767676] font-mono">
                  Faculty ID: {facultyId}
                </span>
              </div>
              <p className="text-xs text-[#4A4A4A] mt-1">
                {user?.department || 'Computer Science & Engineering'} • 3 Active Course Sections Assigned • Academic Year 2024–2025
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={() => navigate('/faculty/attendance')}
              className="px-3.5 py-1.5 bg-[#00338D] hover:bg-[#002266] text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Mark Class Attendance
            </button>
            <button
              onClick={() => navigate('/faculty/retention')}
              className="px-3.5 py-1.5 bg-[#483698] hover:bg-[#382680] text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              Priority Retention Queue
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          title="Assigned Students"
          value="128"
          subtitle="Across 3 sections"
          icon={Users}
          colorScheme="indigo"
          onClick={() => navigate('/faculty/students')}
        />
        <MetricCard
          title="Today's Classes"
          value="2 Sessions"
          subtitle="Hall 301 & Lab 2"
          icon={Calendar}
          colorScheme="emerald"
          onClick={() => navigate('/faculty/timetable')}
        />
        <MetricCard
          title="Attendance Marking"
          value="Pending"
          subtitle="Morning session open"
          icon={CheckSquare}
          colorScheme="amber"
          badge="Action Required"
          badgeColor="amber"
          onClick={() => navigate('/faculty/attendance')}
        />
        <MetricCard
          title="Submissions to Grade"
          value="18"
          subtitle="DSA & Software Eng"
          icon={FileText}
          colorScheme="purple"
          onClick={() => navigate('/faculty/assignments')}
        />
        <MetricCard
          title="At-Risk Retention"
          value="3 Students"
          subtitle="High priority warning"
          icon={BrainCircuit}
          colorScheme="rose"
          badge="ML Alert"
          badgeColor="rose"
          onClick={() => navigate('/faculty/retention')}
        />
      </div>

      {/* Teaching Timetable & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <TimetableWidget
            schedule={timetable}
            title="Faculty Teaching Schedule"
          />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#D0D0D0] rounded p-4 space-y-3">
            <h2 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00338D]" />
              Faculty Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/faculty/attendance')}
                className="w-full p-2.5 rounded bg-[#FAFAFA] hover:bg-[#F5F5F5] border border-[#D0D0D0] text-xs font-semibold text-left flex items-center justify-between group transition-colors text-[#1A1A1A]"
              >
                <span className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#00338D]" />
                  Take Class Attendance Sheet
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#767676] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/faculty/marks')}
                className="w-full p-2.5 rounded bg-[#FAFAFA] hover:bg-[#F5F5F5] border border-[#D0D0D0] text-xs font-semibold text-left flex items-center justify-between group transition-colors text-[#1A1A1A]"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  Enter Internal Assessment Marks
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#767676] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/faculty/assignments')}
                className="w-full p-2.5 rounded bg-[#FAFAFA] hover:bg-[#F5F5F5] border border-[#D0D0D0] text-xs font-semibold text-left flex items-center justify-between group transition-colors text-[#1A1A1A]"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#483698]" />
                  Create New Assignment
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#767676] group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/faculty/retention')}
                className="w-full p-2.5 rounded bg-[#483698]/10 hover:bg-[#483698]/15 border border-[#483698]/30 text-xs font-bold text-left flex items-center justify-between group transition-colors text-[#483698]"
              >
                <span className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-[#483698]" />
                  View Retention Priority Queue
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#483698] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <AnnouncementPanel
            announcements={announcements}
            userId={facultyId}
          />
        </div>
      </div>
    </div>
  );
}

