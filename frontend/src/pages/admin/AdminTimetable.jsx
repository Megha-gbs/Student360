import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, AlertCircle, CheckCircle2, Clock, MapPin, User, X } from 'lucide-react';
import { timetableApi, adminApi } from '../../services/api';
import TimetableWidget from '../../components/TimetableWidget';

export default function AdminTimetable() {
  const [schedule, setSchedule] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [day, setDay] = useState('Monday');
  const [subCode, setSubCode] = useState('CS301');
  const [subName, setSubName] = useState('Data Structures & Algorithms');
  const [facId, setFacId] = useState('FAC-CS101');
  const [facName, setFacName] = useState('Dr. Alan Turing');
  const [room, setRoom] = useState('Lecture Hall 301');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:15');
  const [semester, setSemester] = useState(2);
  const [dept, setDept] = useState('Computer Science & Engineering');

  const loadData = async () => {
    try {
      const [tt, f] = await Promise.all([
        timetableApi.getTimetable(),
        adminApi.getFaculty(),
      ]);
      setSchedule(tt || []);
      setFaculty(f || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await timetableApi.addEntry({
        day,
        subject_code: subCode,
        subject_name: subName,
        faculty_id: facId,
        faculty_name: facName,
        room,
        start_time: startTime,
        end_time: endTime,
        semester: parseInt(semester),
        department: dept,
        class_id: `CS-Sem${semester}`,
      });
      setShowAddModal(false);
      setSuccessMsg(`Class slot successfully scheduled for ${day} in ${room}.`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Schedule conflict detected.');
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      await timetableApi.deleteEntry(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Master Timetable & Classroom Allocation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Schedule lecture periods with real-time room and professor conflict detection
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule New Class Slot
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Timetable View */}
      <TimetableWidget schedule={schedule} title="Master Institutional Timetable" />

      {/* Slots Table with Delete Actions */}
      <div className="card-panel p-5 overflow-x-auto space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Active Slot Allocations ({schedule.length})
        </h3>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-bold">Slot ID</th>
              <th className="py-3 px-4 font-bold">Day</th>
              <th className="py-3 px-4 font-bold">Time Window</th>
              <th className="py-3 px-4 font-bold">Subject</th>
              <th className="py-3 px-4 font-bold">Faculty</th>
              <th className="py-3 px-4 font-bold">Venue</th>
              <th className="py-3 px-4 font-bold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {schedule.map((slot) => (
              <tr key={slot.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {slot.id}
                </td>
                <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                  {slot.day}
                </td>
                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                  {slot.start_time} - {slot.end_time}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  {slot.subject_name} ({slot.subject_code})
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                  {slot.faculty_name}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  {slot.room}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove slot"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-darkpanel w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkborder pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Schedule Class Timetable Slot
                </h3>
                <p className="text-xs text-slate-500">
                  Automatic conflict checks on room and professor double-booking
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Day of Week</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Classroom / Venue</label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="Lecture Hall 301">Lecture Hall 301</option>
                    <option value="Lecture Hall 204">Lecture Hall 204</option>
                    <option value="Computing Lab 2">Computing Lab 2</option>
                    <option value="Studio A">Studio A</option>
                    <option value="Auditorium B">Auditorium B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Course</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Faculty Member</label>
                  <select
                    value={facId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setFacId(id);
                      const f = faculty.find((x) => x.id === id);
                      if (f) setFacName(f.name);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-surface-darkborder">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Confirm & Check Conflict
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
