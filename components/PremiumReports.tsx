
import React, { useMemo } from 'react';
import { RasedSummary, TeacherMapping, Period, SubjectData } from '../types';
import * as XLSX from 'xlsx';

interface PremiumReportsProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
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

  const lostStudents = useMemo(() => {
    const students: Array<{ name: string; saf: string; fasel: string; missingCount: number; missingSubjects: string[] }> = [];
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];
    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
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
            students.push({ name, saf, fasel, missingCount: stat.count, missingSubjects: stat.subs });
          }
        });
      }
    }
    return students.sort((a, b) => b.missingCount - a.missingCount);
  }, [rasedSummary, period]);

  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'الفترتين الأولى والثانية';

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
    <div className="space-y-12 max-w-[98%] mx-auto print:space-y-6">
      
      {/* تقرير المعلمين - يبدأ دائماً في صفحة جديدة عند الطباعة */}
      <section className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden print:rounded-2xl print:border-rose-700 print-page-break print-card">
        <div className="bg-rose-700 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-4 print:p-4">
          <div className="flex items-center gap-5">
            <span className="text-4xl bg-white/20 p-3 rounded-2xl no-print">👨‍🏫</span>
            <div>
              <h3 className="text-2xl md:text-3xl font-black print:text-base">المعلمين المتبقي لديهم رصد - {periodLabel}</h3>
              <p className="text-rose-100 text-sm font-bold mt-2 no-print">تقرير الأولوية للمتابعة (مرتب حسب نسبة التأخر)</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="bg-white text-rose-700 px-8 py-3 rounded-2xl font-black text-sm hover:bg-rose-50 transition-all shadow-xl no-print border border-rose-200">⎙ طباعة الكشف</button>
        </div>

        {!hasTeacherMapping ? (
          <div className="p-20 text-center bg-slate-50 print:p-10">
            <h4 className="text-xl font-black text-slate-900 mb-2 print:text-sm">ملف المعلمين غير متوفر لربط التقارير بالأسماء</h4>
          </div>
        ) : teacherDefaulters.length === 0 ? (
          <div className="p-20 text-center bg-emerald-50 print:p-10">
            <h4 className="text-xl font-black text-emerald-700 mb-2 print:text-sm">تم اكتمال الرصد لجميع المعلمين 🎉</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse print-compact-table">
              <thead>
                <tr className="bg-rose-50 text-rose-950 text-sm font-black print:text-[8pt]">
                  <th className="px-8 py-6 print:py-1">اسم المعلم</th>
                  <th className="px-8 py-6 print:py-1">المواد والفصول المتبقية</th>
                  <th className="px-8 py-6 print:py-1 text-center">الطلاب</th>
                  <th className="px-8 py-6 print:py-1 text-center">التأخر</th>
                </tr>
              </thead>
              <tbody>
                {teacherDefaulters.map((t, i) => (
                  <tr key={i} className="border-b border-slate-200 hover:bg-rose-50/50 transition-colors print:border-slate-300">
                    <td className="px-8 py-6 font-black text-slate-950 text-lg print:py-1 print:px-2 print:text-xs">{t.name}</td>
                    <td className="px-8 py-6 print:py-1 print:px-2">
                      <div className="flex flex-wrap gap-2 print:gap-1">
                        {t.details.map((d, di) => (
                          <span key={di} className="text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 font-bold print:text-[7pt] print:bg-white print:border-slate-300">{d}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center text-rose-700 font-black text-2xl print:py-1 print:px-2 print:text-xs">{t.lam}</td>
                    <td className="px-8 py-6 text-center print:py-1 print:px-2 print:text-xs">
                      <span className="text-rose-800 font-black">{t.percentage}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* تقرير الطلاب - صفحة جديدة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 print:block print:space-y-6">
        <section className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-slate-300 print:rounded-2xl print:p-6 print-page-break print-card">
          <div className="flex justify-between items-center mb-10 print:mb-4">
            <h3 className="text-2xl font-black text-slate-950 print:text-base">طلاب متبقي لهم رصد (مادة فأكثر)</h3>
            <span className="bg-amber-700 text-white px-5 py-2 rounded-2xl text-xs font-black print:bg-white print:text-amber-800 print:border print:border-amber-700">{lostStudents.length} طلاب</span>
          </div>
          <div className="space-y-5 print:space-y-2">
            {lostStudents.slice(0, 50).map((s, i) => (
              <div key={i} className="p-7 bg-white rounded-[2.5rem] border-2 border-slate-200 print:p-2 print:rounded-xl print:border-slate-300 print-avoid-break">
                <div className="flex justify-between items-start mb-3 print:mb-1">
                  <div>
                    <h4 className="font-black text-xl text-slate-950 print:text-xs leading-none">{s.name}</h4>
                    <p className="text-xs text-slate-500 font-black mt-1 print:text-[8pt]">{s.saf} - فصل {s.fasel}</p>
                  </div>
                  <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-xl text-[10px] font-black print:text-[7pt]">{s.missingCount} متبقية</div>
                </div>
                <div className="flex flex-wrap gap-2 no-print">
                  {s.missingSubjects.map((sub, si) => <span key={si} className="text-[10px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">{sub}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* أدوات المتابعة - لا تظهر في الطباعة الورقية عادة أو تكون ثانوية */}
        <div className="space-y-10 no-print">
          <section className="bg-slate-950 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-2 border-slate-800">
            <h3 className="text-3xl font-black mb-4">تصدير التقرير الشامل</h3>
            <button onClick={exportFullExcel} className="w-full py-6 bg-emerald-700 hover:bg-emerald-600 text-white rounded-3xl font-black text-2xl transition-all">تصدير إكسل الشامل ➜</button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PremiumReports;
