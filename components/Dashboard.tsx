
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

  const percentageNum = Number(stats.percentage);
  
  const getPercentageColorClass = (val: number) => {
    if (val < 75) return 'color-low';
    if (val < 95) return 'color-mid';
    return 'color-high';
  };

  const getPercentageBgClass = (val: number) => {
    if (val < 75) return 'bg-low';
    if (val < 95) return 'bg-mid';
    return 'bg-high';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* القسم الأول: نظرة عامة وإنجاز المدرسة - مصغر للطباعة */}
      <div className="print:block print:page-break-after-avoid">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center relative overflow-hidden print:border-black print-card print:p-6 print:mb-4">
          <div className="relative z-10 text-center md:text-right space-y-4">
            <div>
              <span className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 print:bg-black print:text-white">
                تقرير الحالة الراهنة للمدرسة
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight print:text-black print:text-2xl">إنجاز رصد المدرسة</h2>
              <p className="text-slate-500 font-bold text-base mt-1 print:text-black print:text-sm">{period === 'both' ? 'إجمالي الفترتين الدراسيتين' : `الفترة الدراسيـة: ${period}`}</p>
            </div>
            
            <button 
              onClick={() => window.print()} 
              className="no-print bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-blue-800 transition-all flex items-center gap-4 mx-auto md:mr-0 shadow-lg"
            >
              ⎙ طباعة التقارير المعتمدة
            </button>
          </div>

          <div className="relative z-10 mt-8 md:mt-0 text-center flex flex-col items-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-40 h-40 md:w-48 md:h-48 transform -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="50%" cy="50%" r="45%" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * percentageNum) / 100} 
                  className={`${getPercentageColorClass(percentageNum)} transition-all duration-1000 ease-out`} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl md:text-5xl font-black ${getPercentageColorClass(percentageNum)}`}>{stats.percentage}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 print:text-black">نسبة الإنجاز</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 print:gap-2">
          <StatCard title="إجمالي الطلاب" value={stats.studentCount} color="blue" icon="👥" />
          <StatCard title="عدد المواد" value={stats.subjectCount} color="emerald" icon="📚" />
          <StatCard title="عدد الفصول" value={stats.classesCount} color="amber" icon="🏫" />
          <StatCard title="طاقم المعلمين" value={stats.teacherCount || "---"} color="rose" icon="👨‍🏫" />
        </div>
      </div>

      {/* القسم الثاني: ترتيب الفصول - يفضل أن يكون في نفس الصفحة للطباعة إذا أمكن */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm print:border-black print-card print:p-6 print:mt-4 print:page-break-after-always">
        <div className="flex justify-between items-center mb-6 border-b-2 pb-3 print:border-black">
          <h3 className="text-lg font-black text-slate-950 flex items-center gap-3 print:text-xl">
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600 no-print">🏆</span>
            ترتيب إنجاز الفصول
          </h3>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter print:text-black">بناءً على دقة الرصد</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 print:grid-cols-2 print:gap-x-8 print:gap-y-2">
          {stats.classesList.map((cls, idx) => (
            <div key={idx} className="group">
              <div className="flex justify-between items-center mb-1.5 px-1">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black bg-slate-50 text-slate-400 border border-slate-200 print:bg-black print:text-white`}>{idx + 1}</span>
                  <span className="font-bold text-slate-800 text-sm print:text-black print:font-black">{cls.name}</span>
                </div>
                <span className={`text-[11px] font-black ${getPercentageColorClass(cls.percentage)}`}>{cls.percentage}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50 print:bg-slate-200">
                <div className={`h-full transition-all duration-1000 ${getPercentageBgClass(cls.percentage)}`} style={{ width: `${cls.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }: any) => {
  const themes: any = { 
    blue: 'text-blue-700 bg-blue-50 border-blue-100', 
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100', 
    amber: 'text-amber-700 bg-amber-50 border-amber-100', 
    rose: 'text-rose-700 bg-rose-50 border-rose-100' 
  };
  
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:border-blue-300 print:border-black print-card print:p-3">
      <div className={`p-3 rounded-xl ${themes[color]} border print:bg-transparent print:border-none print:p-0`}>
        <div className="w-6 h-6 flex items-center justify-center text-xl print:text-2xl">{icon}</div>
      </div>
      <div>
        <span className="block text-slate-400 text-[9px] font-black uppercase tracking-widest mb-0.5 print:text-black">{title}</span>
        <span className="text-xl font-black text-slate-900 print:text-black print:text-lg">{value}</span>
      </div>
    </div>
  );
};

export default Dashboard;
