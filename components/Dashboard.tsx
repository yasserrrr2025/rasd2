
import React from 'react';
import { RasedSummary, TeacherMapping, Period } from '../types';

interface DashboardProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

const Dashboard: React.FC<DashboardProps> = ({ rasedSummary, teacherMapping, period }) => {
  const stats = React.useMemo(() => {
    let totalRasid = 0, totalLamRasid = 0;
    let studentsSet = new Set<string>(), subjectsSet = new Set<string>(), teachersSet = new Set<string>();
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        targetPeriods.forEach(p => {
          const periodData = rasedSummary[saf][fasel][p];
          if (!periodData) return;
          for (const subject in periodData) {
            const data = periodData[subject];
            subjectsSet.add(subject);
            totalRasid += data.rasidCount;
            totalLamRasid += data.lamRasidCount;
            data.studentsList.forEach(s => studentsSet.add(`${saf}-${fasel}-${s}`));
            const teachers = teacherMapping[saf]?.[fasel]?.[subject] || [];
            teachers.forEach(t => teachersSet.add(t));
          }
        });
      }
    }
    const total = totalRasid + totalLamRasid;
    const percentage = total > 0 ? ((totalRasid / total) * 100).toFixed(1) : "0";

    return { totalRasid, totalLamRasid, total, percentage, studentCount: studentsSet.size, subjectCount: subjectsSet.size, teacherCount: teachersSet.size };
  }, [rasedSummary, teacherMapping, period]);

  const percentageNum = Number(stats.percentage);
  const getColorClass = (val: number) => val < 75 ? 'color-low' : val < 95 ? 'color-mid' : 'color-high';

  return (
    <div className="print-page">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center relative print:border-black print-card">
        <div className="text-center md:text-right space-y-4">
          <span className="inline-flex bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-black print:bg-black">نظرة عامة على المدرسة</span>
          <h2 className="text-4xl font-black text-slate-900 print:text-black">ملخص الإنجاز العام</h2>
          <p className="text-slate-500 font-bold print:text-black">{period === 'both' ? 'تحليل الفترتين الأولى والثانية' : `الفترة: ${period}`}</p>
          <button onClick={() => window.print()} className="no-print bg-slate-950 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center gap-3 mt-4">
            <span>⎙ طباعة التقارير</span>
          </button>
        </div>
        <div className="mt-8 md:mt-0 relative">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-100" />
            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="14" fill="transparent" strokeDasharray="283" strokeDashoffset={283 - (283 * percentageNum) / 100} className={getColorClass(percentageNum)} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-black ${getColorClass(percentageNum)}`}>{stats.percentage}%</span>
            <span className="text-[10px] font-bold text-slate-400 print:text-black mt-1">نسبة الإنجاز</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 print:gap-4">
        <StatCard title="إجمالي الطلاب" value={stats.studentCount} icon="👥" color="blue" />
        <StatCard title="عدد المواد" value={stats.subjectCount} icon="📚" color="emerald" />
        <StatCard title="إجمالي المعلمين" value={stats.teacherCount || "---"} icon="👨‍🏫" color="rose" />
        <StatCard title="إجمالي الفصول" value={Object.keys(rasedSummary).length} icon="🏫" color="amber" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-6 print:border-black print-card">
    <div className="text-3xl">{icon}</div>
    <div>
      <span className="block text-slate-400 text-[10px] font-black uppercase print:text-black">{title}</span>
      <span className="text-2xl font-black text-slate-900 print:text-black">{value}</span>
    </div>
  </div>
);

export default Dashboard;
