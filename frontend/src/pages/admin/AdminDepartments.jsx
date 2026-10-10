import React, { useState, useEffect } from 'react';
import { Building2, Users, GraduationCap, Award } from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getDepartments()
      .then((data) => setDepartments(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Academic Departments & Degree Curricula
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Faculty divisions, degree programs, course codes, and enrollment quotas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.code} className="card-panel p-5 space-y-4 hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkborder">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                Code: {dept.code}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {dept.students_count} Enrolled
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {dept.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Division Dean: <span className="font-semibold text-slate-700 dark:text-slate-300">{dept.dean}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-surface-darkborder flex items-center justify-between text-xs text-slate-400">
              <span>Undergraduate & Graduate</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active Division</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
