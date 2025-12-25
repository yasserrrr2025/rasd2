
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

  // تقرير المعلمين المقصرين - مرتب من الأعلى نسبة تقصير
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

    return Object.entries(stats)
      .map(([name, data]) => {
        const total = data.lam + data.rasid;
        return {
          name,
          lam: data.lam,
          rasid: data.rasid,
          percentage: Number(((data.lam / total) * 100).toFixed(1)),
          details: Array.from(new Set(data.details))
        };
      })
      .sort((a, b) => b.percentage - a.percentage); // الترتيب من الأعلى نسبة تقصير
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
          if (stat.count >= 3) {
            students.push({
              name,
              saf,
              fasel,
              missingCount: stat.count,
              missingSubjects: stat.subs
            });
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
          // Fix: Explicitly cast the data object in Object.entries to SubjectData
          Object.entries(pData).forEach(([sub, rawData]) => {
            const data = rawData as SubjectData;
            summaryRows.push({
              "الصف": saf,
              "الفصل": fasel,
              "الفترة": p,
              "المادة": sub,
              "تم الرصد": data.rasidCount,
              "لم يرصد": data.lamRasidCount,
              "النسبة": `${data.percentage}%`,
              "المعلم": (teacherMapping[saf]?.[fasel]?.[sub] || []).join(' ، ')
            });
          });
        });
      }
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "إحصائيات الرصد");
    XLSX.writeFile(wb, `تقرير_رصد_شامل_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
  };

  return (
    <div className="space-y-12 max-w-[98%] mx-auto">
      {/* تقرير المعلمين المتبقي لديهم رصد */}
      <section className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-6 duration-700">
        <div className="bg-rose-700 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-5">
            <span className="text-4xl bg-white/20 p-3 rounded-2xl">👨‍🏫</span>
            <div>
              <h3 className="text-2xl md:text-3xl font-black">المعلمين المتبقي لديهم رصد - {periodLabel}</h3>
              <p className="text-rose-100 text-sm font-bold mt-2">تقرير الأولوية للمتابعة (مرتب حسب نسبة التأخر)</p>
            </div>
          </div>
          {hasTeacherMapping && teacherDefaulters.length > 0 && (
            <button onClick={() => window.print()} className="bg-white text-rose-700 px-8 py-3 rounded-2xl font-black text-sm hover:bg-rose-50 transition-all shadow-xl no-print border border-rose-200">
              ⎙ طباعة الكشف
            </button>
          )}
        </div>

        {!hasTeacherMapping ? (
          <div className="p-20 text-center bg-slate-50 dark:bg-slate-900">
            <div className="text-6xl mb-6">⚠️</div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">ملف المعلمين غير متوفر</h4>
            <p className="text-slate-600 dark:text-slate-400 font-bold max-w-lg mx-auto">يرجى رفع ملف إكسل يحتوي على بيانات المعلمين (الاسم، الصف، المادة، الفصل) لتتمكن من عرض هذا التقرير وتحديد المقصرين بالاسم.</p>
          </div>
        ) : teacherDefaulters.length === 0 ? (
          <div className="p-20 text-center bg-emerald-50 dark:bg-emerald-900/10">
            <div className="text-6xl mb-6">🎉</div>
            <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-400 mb-2">إنجاز رائع!</h4>
            <p className="text-slate-600 dark:text-slate-400 font-bold">تم اكتمال رصد جميع المواد لجميع المعلمين في {periodLabel}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 text-sm font-black">
                  <th className="px-8 py-6 border-b-2 border-rose-200 dark:border-rose-900/40">اسم المعلم</th>
                  <th className="px-8 py-6 border-b-2 border-rose-200 dark:border-rose-900/40">المواد والفصول المتبقية</th>
                  <th className="px-8 py-6 border-b-2 border-rose-200 dark:border-rose-900/40 text-center">عدد الطلاب</th>
                  <th className="px-8 py-6 border-b-2 border-rose-200 dark:border-rose-900/40 text-center">نسبة التأخر</th>
                </tr>
              </thead>
              <tbody>
                {teacherDefaulters.map((t, i) => (
                  <tr key={i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-950 dark:text-white text-lg">{t.name}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        {t.details.map((d, di) => (
                          <span key={di} className="text-[11px] bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold shadow-sm">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center text-rose-700 dark:text-rose-400 font-black tabular-nums text-2xl">{t.lam}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-rose-800 dark:text-rose-400 font-black text-lg tabular-nums">{t.percentage}%</span>
                        <div className="w-40 h-3 bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden border border-rose-300 dark:border-rose-800">
                          <div className="h-full bg-rose-600" style={{ width: `${t.percentage}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* تقرير الطلاب المتأخرين */}
        <section className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border-2 border-slate-300 dark:border-slate-800">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black flex items-center gap-4 text-slate-950 dark:text-white">
              <span className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-2xl text-2xl shadow-inner text-amber-700 border border-amber-200">🔍</span>
              طلاب متبقي لهم رصد (3 مواد فأكثر)
            </h3>
            <span className="bg-amber-700 text-white px-5 py-2 rounded-2xl text-xs font-black shadow-xl">
              {lostStudents.length} طلاب
            </span>
          </div>
          
          <div className="space-y-5 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            {lostStudents.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-700 font-bold text-xl">لا يوجد طلاب متأخرين حالياً ✨</p>
              </div>
            ) : (
              lostStudents.map((s, i) => (
                <div key={i} className="group p-7 bg-white dark:bg-slate-800/80 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 transition-all shadow-lg">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h4 className="font-black text-xl text-slate-950 dark:text-white leading-tight">{s.name}</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-400 font-black mt-2 bg-slate-100 dark:bg-slate-900 inline-block px-3 py-1 rounded-lg">{s.saf} - فصل {s.fasel}</p>
                    </div>
                    <div className="bg-rose-700 text-white px-4 py-2 rounded-2xl text-xs font-black shadow-lg">
                      {s.missingCount} مادة متبقية
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.missingSubjects.map((sub, si) => (
                      <span key={si} className="text-[10px] bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-950 dark:text-slate-200 font-black">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* أدوات المتابعة والتصدير */}
        <div className="space-y-10">
          <section className="bg-slate-950 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-2 border-slate-800">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:bg-emerald-600/20 transition-all duration-1000"></div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-10">
              <div className="w-24 h-24 bg-emerald-700 text-white rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl border-4 border-emerald-500/20">📑</div>
              <div>
                <h3 className="text-3xl font-black mb-4">تصدير التقرير الشامل</h3>
                <p className="text-slate-400 text-lg font-bold leading-relaxed max-w-sm mx-auto">
                  قم بتحميل ملف Excel احترافي يحتوي على جميع إحصائيات الرصد لجميع الفترات، بيانات المعلمين، وقوائم الطلاب للتوثيق الإداري.
                </p>
              </div>
              <button 
                onClick={exportFullExcel}
                className="w-full py-6 bg-emerald-700 hover:bg-emerald-600 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-emerald-950/50 hover:-translate-y-2 transition-all flex items-center justify-center gap-5 border border-emerald-400/20"
              >
                تصدير إكسل الشامل ➜
              </button>
            </div>
          </section>

          <section className="bg-blue-700 p-10 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden border-2 border-blue-600">
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none"></div>
            <h4 className="text-2xl font-black mb-6 flex items-center gap-5">
              <span className="bg-white/20 p-3 rounded-2xl text-2xl">💡</span> تنبيه ذكي
            </h4>
            <div className="space-y-4 text-blue-50 text-base font-bold leading-relaxed">
              <p>• التقرير أعلاه يعتمد كلياً على ملف المعلمين. في حال عدم رفعه، لن يظهر تقرير المقصرين.</p>
              <p>• تأكد من تطابق أسماء المواد في ملف المعلمين مع ملفات نور لضمان دقة الربط.</p>
              <p>• الفرز التلقائي يضع "المعلمين الأكثر تأخراً" في بداية القائمة لتسهيل عملية المتابعة الميدانية.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PremiumReports;
