
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

  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'إجمالي الفترتين الدراسيتين';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* القسم الأول: إنجاز المدرسة (صفحة واحدة في الطباعة) */}
      <div className="print-avoid-break">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center relative overflow-hidden print:p-12 print:rounded-3xl print-card">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50/50 -skew-x-12 translate-x-1/2 no-print"></div>
          
          <div className="relative z-10 text-center md:text-right space-y-6 print:space-y-4">
            <div>
              <span className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider mb-4 shadow-lg print:mb-2 print:bg-black print:text-white print:text-sm">
                تقرير الحالة الراهنة للمدرسة
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-tight print:text-5xl print:text-black print:font-black">تقرير إنجاز رصد المدرسة</h2>
              <p className="text-slate-500 font-bold text-lg mt-2 print:text-2xl print:text-black print:mt-1">{periodLabel}</p>
            </div>
            
            <button 
              onClick={() => window.print()} 
              className="no-print bg-slate-950 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-4 mx-auto md:mr-0 shadow-xl shadow-slate-200"
            >
              ⎙ طباعة التقارير المعتمدة
            </button>
          </div>

          <div className="relative z-10 mt-12 md:mt-0 text-center flex flex-col items-center print:mt-0">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-48 h-48 md:w-56 md:h-56 transform -rotate-90 print:w-52 print:h-52">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-100 print:text-slate-200" />
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="14" fill="transparent" strokeDasharray="283" strokeDashoffset={283 - (283 * Number(stats.percentage)) / 100} className="text-blue-600 transition-all duration-1000 ease-out print:text-black" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl md:text-6xl font-black text-slate-950 print:text-6xl print:text-black">{stats.percentage}%</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 print:text-sm print:text-black">نسبة الإنجاز</span>
              </div>
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة - تكبير الخطوط والأيقونات في الطباعة */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6 print:gap-5 print:mt-8">
          <StatCard title="إجمالي الطلاب" value={stats.studentCount} color="blue" icon="👥" />
          <StatCard title="عدد المواد" value={stats.subjectCount} color="emerald" icon="📚" />
          <StatCard title="عدد الفصول" value={stats.classesCount} color="amber" icon="🏫" />
          <StatCard title="طاقم المعلمين" value={stats.teacherCount || "---"} color="indigo" icon="👨‍🏫" />
        </div>
      </div>

      {/* القسم الثاني: ترتيب الفصول (صفحة جديدة في الطباعة) */}
      <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm print:p-12 print:mt-10 print-page-break print-card">
        <div className="flex justify-between items-center mb-10 print:mb-8 border-b-2 print:border-black pb-5">
          <h3 className="text-xl font-black text-slate-950 flex items-center gap-3 print:text-3xl print:text-black">
            <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600 no-print">🏆</span>
            ترتيب الفصول المكتملة (Top 10)
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter print:text-sm print:text-black">بناءً على دقة الرصد</span>
        </div>
        <div className="space-y-7 print:space-y-8">
          {stats.classesList.slice(0, 10).map((cls, idx) => (
            <div key={idx} className="group">
              <div className="flex justify-between items-center mb-3 px-1 print:mb-4">
                <div className="flex items-center gap-5 print:gap-6">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black bg-slate-50 text-slate-400 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all print:w-12 print:h-12 print:text-2xl print:bg-black print:text-white print:border-none">{idx + 1}</span>
                  <span className="font-bold text-slate-800 text-sm md:text-base print:text-2xl print:text-black print:font-black">{cls.name}</span>
                </div>
                <span className={`text-xs font-black md:text-sm print:text-2xl print:font-black ${cls.percentage === 100 ? 'text-emerald-600 print:text-black' : 'text-slate-950 print:text-black'}`}>{cls.percentage}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50 print:h-5 print:bg-slate-200">
                <div className={`h-full transition-all duration-1000 ${cls.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600 print:bg-black'}`} style={{ width: `${cls.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }: any) => {
  const colors: any = { 
    blue: 'text-blue-600 bg-blue-50 border-blue-100 print:text-black print:bg-slate-50 print:border-black', 
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 print:text-black print:bg-slate-50 print:border-black', 
    amber: 'text-amber-600 bg-amber-50 border-amber-100 print:text-black print:bg-slate-50 print:border-black', 
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 print:text-black print:bg-slate-50 print:border-black' 
  };
  
  return (
    <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 transition-all group print:p-8 print:rounded-2xl print:gap-8 print:border-black">
      <div className={`p-4 rounded-2xl ${colors[color]} border transition-transform group-hover:scale-110 print:p-0 print:border-none print:bg-transparent`}>
        <div className="w-8 h-8 flex items-center justify-center text-2xl print:text-4xl">{icon}</div>
      </div>
      <div>
        <span className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 print:text-xs print:text-black print:mb-1">{title}</span>
        <span className="text-2xl font-black text-slate-950 print:text-3xl print:text-black print:font-black">{value}</span>
      </div>
    </div>
  );
};

export default Dashboard;
