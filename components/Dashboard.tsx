
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

  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'إجمالي الفترتين';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* صفحة 1 عند الطباعة: إنجاز المدرسة والإحصائيات */}
      <div className="print-avoid-break">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center relative overflow-hidden print:p-10 print:rounded-3xl print-card">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50/50 -skew-x-12 translate-x-1/2 no-print"></div>
          
          <div className="relative z-10 text-center md:text-right space-y-6 print:space-y-4">
            <div>
              <span className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 shadow-lg shadow-blue-200 print:mb-2 print:bg-black print:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse print:hidden"></span>
                تقرير الحالة الراهنة للمدرسة
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-tight print:text-4xl print-text-bold">إنجاز رصد المدرسة العام</h2>
              <p className="text-slate-500 font-bold text-lg mt-2 print:text-xl print:text-black">{periodLabel}</p>
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
              <svg className="w-48 h-48 md:w-56 md:h-56 transform -rotate-90 print:w-44 print:h-44">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 print:text-slate-200" />
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="283" strokeDashoffset={283 - (283 * Number(stats.percentage)) / 100} className="text-blue-600 transition-all duration-1000 ease-out print:text-black" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl md:text-6xl font-black text-slate-950 print:text-5xl print-text-bold">{stats.percentage}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 print:text-[10pt] print:text-black">نسبة الاكتمال</span>
              </div>
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة أسفل الهيرو في الطباعة */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6 print:gap-4 print:mt-6">
          <StatCard title="إجمالي الطلاب" value={stats.studentCount} color="blue" />
          <StatCard title="عدد المواد" value={stats.subjectCount} color="emerald" />
          <StatCard title="عدد الفصول" value={stats.classesCount} color="amber" />
          <StatCard title="طاقم المعلمين" value={stats.teacherCount || "---"} color="indigo" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        {/* صفحة 2 عند الطباعة: ترتيب الفصول */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm print:p-10 print:mt-10 print-page-break print-card">
          <div className="flex justify-between items-center mb-10 print:mb-6 border-b print:border-black pb-4">
            <h3 className="text-xl font-black text-slate-950 flex items-center gap-3 print:text-2xl print-text-bold">
              <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600 no-print">🏆</span>
              ترتيب الفصول المكتملة (أفضل 10)
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter print:text-[11pt] print:text-black">بناءً على نسبة الرصد</span>
          </div>
          <div className="space-y-7 print:space-y-6">
            {stats.classesList.slice(0, 10).map((cls, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-2.5 px-1 print:mb-2">
                  <div className="flex items-center gap-4 print:gap-3">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-slate-50 text-slate-400 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all print:w-10 print:h-10 print:text-[14pt] print:bg-black print:text-white print:border-none">{idx + 1}</span>
                    <span className="font-bold text-slate-800 text-sm print:text-xl print-text-bold">{cls.name}</span>
                  </div>
                  <span className={`text-xs font-black print:text-[16pt] print-text-bold ${cls.percentage === 100 ? 'text-emerald-600' : 'text-slate-950 print:text-black'}`}>{cls.percentage}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50 print:h-4 print:bg-slate-200">
                  <div className={`h-full transition-all duration-1000 ${cls.percentage === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-blue-600 print:bg-black'}`} style={{ width: `${cls.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* تفاصيل الرصد - تظهر كملخص صغير جداً أسفل الترتيب في الطباعة أو تختفي */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between print:hidden">
           <div className="text-center p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
             <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
             </div>
             <span className="text-4xl font-black text-emerald-700 tracking-tighter">{stats.totalRasid}</span>
             <p className="text-[10px] font-black text-emerald-900/60 mt-2 uppercase tracking-widest">درجات مكتملة</p>
           </div>
           <div className="relative h-px flex items-center justify-center my-6">
              <div className="absolute inset-0 bg-slate-100 h-px"></div>
              <span className="relative bg-white px-4 text-[10px] font-black text-slate-300">مقابل</span>
           </div>
           <div className="text-center p-8 bg-rose-50/50 rounded-3xl border border-rose-100/50">
             <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <span className="text-4xl font-black text-rose-700 tracking-tighter">{stats.totalLamRasid}</span>
             <p className="text-[10px] font-black text-rose-900/60 mt-2 uppercase tracking-widest">درجات متبقية</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }: any) => {
  const colors: any = { 
    blue: 'text-blue-600 bg-blue-50 border-blue-100 print:text-black print:bg-slate-100 print:border-black', 
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 print:text-black print:bg-slate-100 print:border-black', 
    amber: 'text-amber-600 bg-amber-50 border-amber-100 print:text-black print:bg-slate-100 print:border-black', 
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 print:text-black print:bg-slate-100 print:border-black' 
  };
  
  return (
    <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 transition-all group print:p-6 print:rounded-2xl print:gap-6 print:border-black">
      <div className={`p-4 rounded-2xl ${colors[color]} border transition-transform group-hover:scale-110 print:p-0 print:border-none print:bg-transparent`}>
        <div className="w-7 h-7 flex items-center justify-center print-icon-medium">✨</div>
      </div>
      <div>
        <span className="block text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 print:text-[10pt] print:text-black print:mb-1">{title}</span>
        <span className="text-2xl font-black text-slate-950 print:text-[18pt] print-text-bold">{value}</span>
      </div>
    </div>
  );
};

export default Dashboard;
