
import React, { useMemo } from 'react';
import { RasedSummary, TeacherMapping, Period, SubjectData } from '../types';
import * as XLSX from 'xlsx';

interface PremiumReportsProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

interface LostStudent {
  name: string;
  missingCount: number;
  missingSubjects: string[];
}

const PremiumReports: React.FC<PremiumReportsProps> = ({ rasedSummary, teacherMapping, period }) => {
  
  const hasTeacherMapping = Object.keys(teacherMapping).length > 0;

  const teacherDefaulters = useMemo(() => {
    if (!hasTeacherMapping) return [];
    const stats: Record<string, { lam: number; rasid: number; details: string[] }> = {};
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];
    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;
          for (const subject in pData) {
            const data = pData[subject];
            if (data.lamRasidCount > 0) {
              const teachers = teacherMapping[saf]?.[fasel]?.[subject] || ["معلم غير معرف"];
              teachers.forEach(t => {
                if (!stats[t]) stats[t] = { lam: 0, rasid: 0, details: [] };
                stats[t].lam += data.lamRasidCount;
                stats[t].rasid += data.rasidCount;
                stats[t].details.push(`${subject} (${saf} - ${fasel}) [${p}]`);
              });
            }
          }
        });
      }
    }
    return Object.entries(stats).map(([name, data]) => {
      const total = data.lam + data.rasid;
      return { name, lam: data.lam, rasid: data.rasid, percentage: Number(((data.lam / total) * 100).toFixed(1)), details: Array.from(new Set(data.details)) };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [rasedSummary, teacherMapping, period, hasTeacherMapping]);

  const lostStudents = useMemo<Record<string, LostStudent[]>>(() => {
    const studentsByClass: Record<string, LostStudent[]> = {};
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];
    
    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        const classKey = `${saf} - ${fasel}`;
        const studentStats: Record<string, { count: number; subs: string[] }> = {};
        
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;
          for (const sub in pData) {
            const statusMap = pData[sub].studentRasidStatus;
            for (const student in statusMap) {
              if (statusMap[student] === false) {
                if (!studentStats[student]) studentStats[student] = { count: 0, subs: [] };
                studentStats[student].count++;
                studentStats[student].subs.push(`${sub} (${p})`);
              }
            }
          }
        });
        
        Object.entries(studentStats).forEach(([name, stat]) => {
          if (stat.count >= 1) {
            if (!studentsByClass[classKey]) studentsByClass[classKey] = [];
            studentsByClass[classKey].push({ name, missingCount: stat.count, missingSubjects: stat.subs });
          }
        });
      }
    }
    return studentsByClass;
  }, [rasedSummary, period]);

  const exportFullExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryRows: any[] = [];
    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        ['أولى', 'ثانية'].forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;
          Object.entries(pData).forEach(([sub, rawData]) => {
            const data = rawData as SubjectData;
            summaryRows.push({ "الصف": saf, "الفصل": fasel, "الفترة": p, "المادة": sub, "تم الرصد": data.rasidCount, "لم يرصد": data.lamRasidCount, "النسبة": `${data.percentage}%`, "المعلم": (teacherMapping[saf]?.[fasel]?.[sub] || []).join(' ، ') });
          });
        });
      }
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "إحصائيات الرصد");
    XLSX.writeFile(wb, `تقرير_رصد_شامل_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
  };

  return (
    <div className="space-y-12 max-w-full mx-auto print:space-y-6">
      
      <div className="no-print flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900">مركز التقارير المعتمدة</h2>
          <p className="text-slate-500 font-bold mt-1">طباعة كافة كشوف المعلمين والطلاب بضغطة واحدة</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-blue-800 transition-all shadow-2xl flex items-center gap-4"
        >
          <span>⎙ طباعة كافة الكشوف والتقارير</span>
        </button>
      </div>

      {/* تقرير المعلمين - أحمر صريح للتحذير */}
      <section className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-300 overflow-hidden print:border-black print-card print:mb-8">
        <div className="bg-rose-700 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-4 print:bg-black print:text-white print:p-5">
          <div className="flex items-center gap-5">
            <span className="text-4xl bg-white/10 p-4 rounded-3xl no-print">👨‍🏫</span>
            <div>
              <h3 className="text-2xl md:text-3xl font-black print:text-[11pt]">كشف المعلمين المتبقي لديهم رصد</h3>
              <p className="text-rose-100 text-sm font-bold mt-1 print:text-[8pt] print:text-white">قائمة المعلمين المطالبين بإكمال الرصد</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="bg-white text-rose-700 px-8 py-3 rounded-2xl font-black text-sm hover:bg-rose-50 transition-all no-print">⎙ طباعة</button>
        </div>

        {!hasTeacherMapping ? (
          <div className="p-20 text-center bg-slate-50 print:p-10">
            <h4 className="text-xl font-black text-slate-900 print:text-sm">يرجى رفع ملف المعلمين لربط الأسماء</h4>
          </div>
        ) : teacherDefaulters.length === 0 ? (
          <div className="p-20 text-center bg-emerald-50 print:p-10">
            <h4 className="text-2xl font-black text-emerald-800 print:text-sm">تم اكتمال الرصد لجميع المعلمين 🎉</h4>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-right border-collapse print-compact-table">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-black">
                  <th className="px-8 py-6 print:py-2 print:text-[8pt] print-col-name">اسم المعلم</th>
                  <th className="px-8 py-6 print:py-2 print:text-[8pt]">المواد والفصول</th>
                  <th className="px-8 py-6 text-center print:py-2 print:text-[8pt] print-col-min">الطلاب</th>
                  <th className="px-8 py-6 text-center print:py-2 print:text-[8pt] print-col-min">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {teacherDefaulters.map((t, i) => (
                  <tr key={i} className="border-b border-slate-200 hover:bg-rose-50/50 print:border-black">
                    <td className="px-8 py-6 font-black text-slate-950 text-xl print:py-1 print:text-[8pt] print:text-black print-col-name">{t.name}</td>
                    <td className="px-8 py-6 print:py-1">
                      <div className="flex flex-wrap gap-2 print:gap-1">
                        {t.details.map((d, di) => (
                          <span key={di} className="text-[11px] bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 font-black text-rose-800 print:text-[7pt] print:bg-white print:border-black print:px-1 print:py-0">{d}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center text-rose-700 font-black text-2xl print:py-1 print:text-[9pt] print-col-min">{t.lam}</td>
                    <td className="px-8 py-6 text-center text-rose-800 font-black text-xl print:py-1 print:text-[8pt] print-col-min">{t.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* تقرير الطلاب المتبقين - أزرق داكن للتنظيم */}
      <section className="space-y-8 print:space-y-4">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 no-print shadow-xl">
          <div className="flex items-center gap-6">
             <div className="bg-white/10 p-5 rounded-[2rem]">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
             </div>
             <div>
               <h3 className="text-3xl font-black">كشوف متابعة الطلاب المتبقيين</h3>
               <p className="text-slate-400 font-bold mt-1">كشوف مفصلة لكل فصل لتسهيل المتابعة الميدانية</p>
             </div>
          </div>
          <span className="bg-blue-600 text-white px-8 py-4 rounded-3xl text-2xl font-black shadow-lg">
            {(Object.values(lostStudents) as LostStudent[][]).reduce((a: number, b: LostStudent[]) => a + b.length, 0)} طالب متبقي
          </span>
        </div>

        {(Object.entries(lostStudents) as [string, LostStudent[]][]).map(([className, students], idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-300 overflow-hidden print-card print:border-black print-avoid-break">
            <div className="bg-blue-900 px-8 py-6 border-b-2 border-slate-200 flex justify-between items-center print:bg-white print:border-black print:py-3 print:px-4">
              <div className="text-white print:text-black">
                <h4 className="text-2xl font-black print:text-[10pt]">كشف متابعة طلاب: {className}</h4>
                <p className="text-blue-100 text-sm font-bold mt-1 print:text-[7pt] print:text-black">الطلاب المتبقيين: {students.length}</p>
              </div>
              <button 
                onClick={() => window.print()} 
                className="no-print bg-white text-blue-900 px-8 py-3 rounded-2xl text-sm font-black hover:bg-slate-100 transition-all shadow-lg"
              >
                ⎙ طباعة الفصل
              </button>
            </div>
            
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-right border-collapse print-compact-table">
                <thead>
                  <tr className="bg-slate-50 text-slate-900 font-black">
                    <th className="px-6 py-5 print:py-2 print:text-[8pt] print-col-min">م</th>
                    <th className="px-6 py-5 print:py-2 print:text-[8pt] print-col-name">اسم الطالب الرباعي</th>
                    <th className="px-6 py-5 print:py-2 print:text-[8pt] print-col-min">المواد</th>
                    <th className="px-6 py-5 print:py-2 print:text-[8pt]">المواد المتبقية</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, si) => (
                    <tr key={si} className="border-b border-slate-200 hover:bg-blue-50/30 transition-colors print:border-black">
                      <td className="px-6 py-5 text-center font-black text-slate-400 print:py-1 print:text-[8pt] print:text-black print-col-min">{si + 1}</td>
                      <td className="px-6 py-5 font-black text-slate-950 text-lg print:py-1 print:text-[7.5pt] print:text-black print-col-name">{s.name}</td>
                      <td className="px-6 py-5 text-center text-rose-700 font-black text-2xl print:py-1 print:text-[9pt] print:text-black print-col-min">{s.missingCount}</td>
                      <td className="px-6 py-5 print:py-1">
                        <div className="flex flex-wrap gap-2 print:gap-1">
                          {s.missingSubjects.map((sub: string, ssi: number) => (
                            <span key={ssi} className="text-[11px] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-700 print:text-[7pt] print:bg-white print:border-black print:px-1 print:py-0">{sub}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default PremiumReports;
