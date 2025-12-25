
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
      {/* Hero Section */}
      <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center relative overflow-hidden print-card">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50/50 -skew-x-12 translate-x-1/2"></div>
        
        <div className="relative z-10 text-center md:text-right space-y-6">
          <div>
            <span className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 shadow-lg shadow-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              تقرير الحالة الراهنة
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-tight">إنجاز رصد المدرسة</h2>
            <p className="text-slate-500 font-bold text-lg mt-2">{periodLabel}</p>
          </div>
          
          <button 
            onClick={() => window.print()} 
            className="no-print bg-slate-950 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-4 mx-auto md:mr-0 shadow-xl shadow-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            طباعة التقارير المعتمدة
          </button>
        </div>

        <div className="relative z-10 mt-12 md:mt-0 text-center flex flex-col items-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-48 h-48 md:w-56 md:h-56 transform -rotate-90">
              <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="283" strokeDashoffset={283 - (283 * Number(stats.percentage)) / 100} className="text-blue-600 transition-all duration-1000 ease-out" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-6xl font-black text-slate-950">{stats.percentage}%</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">نسبة الاكتمال</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Professional Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="الطلاب" 
          value={stats.studentCount} 
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />}
          color="blue" 
        />
        <StatCard 
          title="المواد الدراسية" 
          value={stats.subjectCount} 
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
          color="emerald" 
        />
        <StatCard 
          title="الفصول الذكية" 
          value={stats.classesCount} 
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
          color="amber" 
        />
        <StatCard 
          title="الكادر التعليمي" 
          value={stats.teacherCount || "---"} 
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
          color="indigo" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm print-card">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-slate-950 flex items-center gap-3">
              <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600">🏆</span>
              ترتيب الفصول المكتملة
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">أفضل 10 فصول</span>
          </div>
          <div className="space-y-7">
            {stats.classesList.slice(0, 10).map((cls, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-2.5 px-1">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black bg-slate-50 text-slate-400 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">{idx + 1}</span>
                    <span className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black ${cls.percentage === 100 ? 'text-emerald-600' : 'text-slate-950'}`}>{cls.percentage}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div className={`h-full transition-all duration-1000 ${cls.percentage === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-blue-600'}`} style={{ width: `${cls.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Circular Detail Stats */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between print-card">
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

const StatCard = ({ title, value, icon, color }: any) => {
  const colors: any = { 
    blue: 'text-blue-600 bg-blue-50 border-blue-100', 
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100', 
    amber: 'text-amber-600 bg-amber-50 border-amber-100', 
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100' 
  };
  
  return (
    <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 hover:shadow-md hover:-translate-y-1 transition-all group">
      <div className={`p-4 rounded-2xl ${colors[color]} border transition-transform group-hover:scale-110`}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div>
        <span className="block text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{title}</span>
        <span className="text-2xl font-black text-slate-950">{value}</span>
      </div>
    </div>
  );
};

export default Dashboard;
