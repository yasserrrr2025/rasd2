
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
          classesList.push({ name: `${saf} - ${fasel}`, percentage: Number(((classRasid / classTotal) * 100).toFixed(1)), rasid: classRasid, total: classTotal });
        }
      }
    }
    const total = totalRasid + totalLamRasid;
    const percentage = total > 0 ? ((totalRasid / total) * 100).toFixed(1) : "0";
    classesList.sort((a, b) => b.percentage - a.percentage);

    return { totalRasid, totalLamRasid, total, percentage, studentCount: studentsSet.size, subjectCount: subjectsSet.size, teacherCount: teachersSet.size, classesCount: classesList.length, classesList };
  }, [rasedSummary, teacherMapping, period]);

  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'الفترتين الشاملة';

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="glass-card p-10 md:p-14 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center print-card border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 text-center md:text-right">
          <span className="inline-block bg-blue-600 text-white px-4 py-1 rounded-lg text-[10px] font-black mb-4">ملخص الحالة العامة</span>
          <h2 className="text-4xl font-black mb-2 text-slate-900 dark:text-white">إنجاز رصد المدرسة</h2>
          <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-8">{periodLabel}</p>
          <button onClick={() => window.print()} className="no-print bg-slate-900 dark:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:scale-105 transition-all flex items-center gap-3 mx-auto md:mr-0">
            <span>🖨️</span> طباعة التقرير الاقتصادي
          </button>
        </div>
        <div className="relative z-10 text-center mt-10 md:mt-0">
          <div className="text-7xl md:text-8xl font-black text-blue-600 drop-shadow-sm">{stats.percentage}%</div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 block">نسبة الاكتمال الكلية</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="الطلاب" value={stats.studentCount} icon="🎓" color="blue" />
        <StatCard title="المواد" value={stats.subjectCount} icon="📚" color="emerald" />
        <StatCard title="الفصول" value={stats.classesCount} icon="🏫" color="amber" />
        <StatCard title="المعلمين" value={stats.teacherCount || "---"} icon="👨‍🏫" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <span className="bg-amber-100 dark:bg-amber-900/40 p-2.5 rounded-2xl text-xl">🏆</span> ترتيب الفصول
          </h3>
          <div className="space-y-6">
            {stats.classesList.slice(0, 10).map((cls, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2 px-1">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">{idx + 1}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{cls.name}</span>
                  </div>
                  <span className={`text-xs font-black ${cls.percentage === 100 ? 'text-emerald-600' : 'text-slate-500'}`}>{cls.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${cls.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${cls.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-10 rounded-[3rem] shadow-xl flex flex-col justify-around text-center border border-slate-200 dark:border-slate-800">
           <div>
             <span className="text-4xl block mb-2">✅</span>
             <span className="text-4xl font-black text-emerald-600">{stats.totalRasid}</span>
             <p className="text-[10px] font-black text-slate-500 mt-2 uppercase">درجة مكتملة</p>
           </div>
           <div className="h-px bg-slate-200 dark:bg-slate-800 w-1/2 mx-auto"></div>
           <div>
             <span className="text-4xl block mb-2">⏳</span>
             <span className="text-4xl font-black text-rose-600">{stats.totalLamRasid}</span>
             <p className="text-[10px] font-black text-slate-500 mt-2 uppercase">درجة متبقية</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const colors: any = { blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' };
  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-5 transition-all hover:-translate-y-1">
      <div className={`text-2xl p-4 rounded-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <span className="block text-slate-400 text-[9px] font-black uppercase mb-1">{title}</span>
        <span className="text-2xl font-black text-slate-900 dark:text-white">{value}</span>
      </div>
    </div>
  );
};

export default Dashboard;
