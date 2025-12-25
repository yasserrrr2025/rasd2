
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
    let classesList: any[] = [];
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        let classRasid = 0, classTotal = 0;
        targetPeriods.forEach(p => {
          const periodData = rasedSummary[saf][fasel][p];
          if (!periodData) return;
          for (const subject in periodData) {
            const data = periodData[subject];
            subjectsSet.add(subject);
            totalRasid += data.rasidCount;
            totalLamRasid += data.lamRasidCount;
            classRasid += data.rasidCount;
            classTotal += (data.rasidCount + data.lamRasidCount);
            data.studentsList.forEach(s => studentsSet.add(`${saf}-${fasel}-${s}`));
            const teachers = teacherMapping[saf]?.[fasel]?.[subject] || [];
            teachers.forEach(t => teachersSet.add(t));
          }
        });
        if (classTotal > 0) {
          classesList.push({ name: `${saf} - ${fasel}`, percentage: Number(((classRasid / classTotal) * 100).toFixed(1)) });
        }
      }
    }
    const total = totalRasid + totalLamRasid;
    const percentage = total > 0 ? ((totalRasid / total) * 100).toFixed(1) : "0";
    classesList.sort((a, b) => b.percentage - a.percentage);

    return { totalRasid, totalLamRasid, total, percentage, studentCount: studentsSet.size, subjectCount: subjectsSet.size, teacherCount: teachersSet.size, classesCount: classesList.length, classesList };
  }, [rasedSummary, teacherMapping, period]);

  const percentageNum = Number(stats.percentage);
  const getColorClass = (val: number) => val < 75 ? 'color-low' : val < 95 ? 'color-mid' : 'color-high';
  const getBgClass = (val: number) => val < 75 ? 'bg-low' : val < 95 ? 'bg-mid' : 'bg-high';

  return (
    <div className="space-y-12">
      {/* صفحة 1: الداش بورد (نظرة عامة) */}
      <div className="print-page-dashboard">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center relative print:border-black print-card">
          <div className="text-center md:text-right space-y-4">
            <span className="inline-flex bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-black print:bg-black">نظرة عامة على المدرسة</span>
            <h2 className="text-4xl font-black text-slate-900 print:text-black">ملخص الإنجاز العام</h2>
            <p className="text-slate-500 font-bold print:text-black">{period === 'both' ? 'تحليل الفترتين' : `الفترة: ${period}`}</p>
          </div>
          <div className="mt-8 md:mt-0 relative">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-100" />
              <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="14" fill="transparent" strokeDasharray="283" strokeDashoffset={283 - (283 * percentageNum) / 100} className={getColorClass(percentageNum)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-black ${getColorClass(percentageNum)}`}>{stats.percentage}%</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 print:gap-4">
          <StatCard title="إجمالي الطلاب" value={stats.studentCount} icon="👥" color="blue" />
          <StatCard title="عدد المواد" value={stats.subjectCount} icon="📚" color="emerald" />
          <StatCard title="عدد الفصول" value={stats.classesCount} icon="🏫" color="amber" />
          <StatCard title="طاقم المعلمين" value={stats.teacherCount || "---"} icon="👨‍🏫" color="rose" />
        </div>
      </div>

      {/* صفحة 3: ترتيب الفصول */}
      <div className="print-page-ranking">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl print:border-black print-card">
          <h3 className="text-2xl font-black mb-8 border-b pb-4 print:border-black">ترتيب الفصول حسب نسبة الإنجاز</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
            {stats.classesList.map((cls, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{idx + 1}. {cls.name}</span>
                  <span className={`font-black ${getColorClass(cls.percentage)}`}>{cls.percentage}%</span>
                </div>
                <div className="progress-container print:border print:border-black">
                  <div className={`h-full ${getBgClass(cls.percentage)}`} style={{ width: `${cls.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
