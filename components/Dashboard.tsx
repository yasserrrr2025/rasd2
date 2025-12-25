
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
          classesList.push({ 
            name: `${saf} - ${fasel}`, 
            percentage: Number(((classRasid / classTotal) * 100).toFixed(1)), 
            rasid: classRasid, 
            total: classTotal 
          });
        }
      }
    }
    const total = totalRasid + totalLamRasid;
    const percentage = total > 0 ? ((totalRasid / total) * 100).toFixed(1) : "0";
    classesList.sort((a, b) => b.percentage - a.percentage);

    return { totalRasid, totalLamRasid, total, percentage, studentCount: studentsSet.size, subjectCount: subjectsSet.size, teacherCount: teachersSet.size, classesCount: classesList.length, classesList };
  }, [rasedSummary, teacherMapping, period]);

  const percentageNum = Number(stats.percentage);
  
  const getColorClass = (val: number) => {
    if (val < 75) return 'color-low';
    if (val < 95) return 'color-mid';
    return 'color-high';
  };

  const getBgClass = (val: number) => {
    if (val < 75) return 'bg-low';
    if (val < 95) return 'bg-mid';
    return 'bg-high';
  };

  return (
    <div className="space-y-12">
      
      {/* الصفحة الأولى: نظرة عامة (الداش بورد) */}
      <div className="print-page-1">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center relative overflow-hidden print:border-black print-card">
          <div className="relative z-10 text-center md:text-right space-y-4">
            <span className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider mb-2 print:bg-black">
              إنجاز المدرسة العام
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight print:text-black">ملخص حالة الرصد</h2>
            <p className="text-slate-500 font-bold text-lg mt-1 print:text-black">
              {period === 'both' ? 'تحليل شامل للفترتين' : `الفترة الدراسيـة: ${period}`}
            </p>
            <button onClick={() => window.print()} className="no-print bg-slate-950 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center gap-3 mt-4 shadow-lg">
              <span>⎙ طباعة التقرير المعتمد</span>
            </button>
          </div>

          <div className="relative z-10 mt-8 md:mt-0">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="50%" cy="50%" r="45%" 
                  stroke="currentColor" 
                  strokeWidth="14" 
                  fill="transparent" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * percentageNum) / 100} 
                  className={`${getColorClass(percentageNum)} transition-all duration-1000`} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-black ${getColorClass(percentageNum)}`}>{stats.percentage}%</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 print:text-black">الإنجاز الكلي</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 print:gap-4 print:mt-6">
          <StatCard title="إجمالي الطلاب" value={stats.studentCount} color="blue" icon="👥" />
          <StatCard title="عدد المواد" value={stats.subjectCount} color="emerald" icon="📚" />
          <StatCard title="عدد الفصول" value={stats.classesCount} color="amber" icon="🏫" />
          <StatCard title="طاقم المعلمين" value={stats.teacherCount || "---"} color="rose" icon="👨‍🏫" />
        </div>
      </div>

      {/* الصفحة الثالثة: ترتيب الفصول حسب الإنجاز */}
      <div className="print-new-page print-page-3">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl print:border-black print-card">
          <div className="flex justify-between items-center mb-10 border-b pb-6 print:border-black">
            <h3 className="text-2xl font-black text-slate-950 flex items-center gap-4">
              <span className="p-3 bg-emerald-50 rounded-2xl text-2xl no-print">🏆</span>
              ترتيب الفصول حسب نسبة الإنجاز
            </h3>
            <span className="text-[11px] font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full uppercase print:text-black print:border print:border-black">تصنيف تنازلي</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 print:grid-cols-2 print:gap-y-6">
            {stats.classesList.map((cls, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-3 px-1">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black ${idx < 3 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'} print:bg-black print:text-white`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 text-base print:text-black">{cls.name}</span>
                  </div>
                  <span className={`text-base font-black ${getColorClass(cls.percentage)}`}>{cls.percentage}%</span>
                </div>
                <div className="progress-container print:progress-bar-print print:border print:border-black">
                  <div 
                    className={`h-full transition-all duration-1000 ${getBgClass(cls.percentage)}`} 
                    style={{ width: `${cls.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }: any) => {
  const themes: any = { 
    blue: 'text-blue-700 bg-blue-50/50 border-blue-100', 
    emerald: 'text-emerald-700 bg-emerald-50/50 border-emerald-100', 
    amber: 'text-amber-700 bg-amber-50/50 border-amber-100', 
    rose: 'text-rose-700 bg-rose-50/50 border-rose-100' 
  };
  
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-6 transition-all hover:scale-[1.02] print:border-black print-card print:p-4">
      <div className={`p-4 rounded-xl ${themes[color]} border print:bg-transparent print:border-none print:p-0`}>
        <div className="w-8 h-8 flex items-center justify-center text-3xl print:text-4xl">{icon}</div>
      </div>
      <div>
        <span className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 print:text-black">{title}</span>
        <span className="text-2xl font-black text-slate-900 print:text-black">{value}</span>
      </div>
    </div>
  );
};

export default Dashboard;
