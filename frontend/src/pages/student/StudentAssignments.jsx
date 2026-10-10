import React, { useState, useEffect } from 'react';
import AssignmentTable from '../../components/AssignmentTable';
import { assignmentsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FileText, CheckCircle2, Clock } from 'lucide-react';

export default function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAssignments = async () => {
    try {
      const data = await assignmentsApi.listAssignments({ student_id: user?.id || 'S1001' });
      setAssignments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Coursework & Project Submissions
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload deliverable files, review submission deadlines, and verify faculty grading status
        </p>
      </div>

      <AssignmentTable
        assignments={assignments}
        studentId={user?.id || 'S1001'}
        onAssignmentUpdated={loadAssignments}
      />
    </div>
  );
}
