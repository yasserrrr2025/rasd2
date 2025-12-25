
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
      const achievement = Number(((data.rasid / total) * 100).toFixed(1));
      return { name, lam: data.lam, rasid: data.rasid, percentage: achievement, details: Array.from(new Set(data.details)) };
    }).sort((a, b) => a.percentage - b.percentage);
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

  const getColorClass = (val: number) => {
    if (val < 75) return 'color-low';
    if (val < 95) return 'color-mid';
    return 'color-high';
  };

  return (
    <div className="space-y-12">
      
      <div className="no-print flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">التقارير المعتمدة للطباعة</h2>
          <p className="text-slate-500 font-bold mt-1">كشوف المعلمين والطلاب مرتبة للصفحات المطلوبة</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-slate-950 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-blue-800 transition-all shadow-xl flex items-center gap-3"
        >
          <span>⎙ طباعة كافة الصفحات</span>
        </button>
      </div>

      {/* الصفحة الثانية: إحصائية المعلمين (تظهر فقط إذا وجدت بيانات) */}
      {hasTeacherMapping && teacherDefaulters.length > 0 && (
        <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden print:border-black print-card print:page-break-before-always print-page-2">
          <div className="bg-slate-900 p-8 text-white flex justify-between items-center print:bg-black print:p-6">
            <div className="flex items-center gap-5">
              <span className="text-4xl no-print">👨‍🏫</span>
              <div>
                <h3 className="text-2xl font-black">تقرير المعلمين المتبقي لديهم رصد</h3>
                <p className="text-slate-400 font-bold text-sm mt-1">قائمة المعلمين المطالبين بإكمال الرصد</p>
              </div>
            </div>
            <button onClick={() => window.print()} className="no-print bg-white text-slate-900 px-8 py-3 rounded-xl font-black text-xs hover:bg-slate-100 transition-all">⎙ طباعة</button>
          </div>

          <div className="p-6">
            <table className="w-full text-right border-collapse print-compact-table">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-black">
                  <th className="px-6 py-4">اسم المعلم</th>
                  <th className="px-6 py-4">المواد والفصول</th>
                  <th className="px-6 py-4 text-center w-32">طلاب متبقيين</th>
                  <th className="px-6 py-4 text-center w-32">نسبة الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {teacherDefaulters.map((t, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-black">
                    <td className="px-6 py-4 font-black text-slate-950">{t.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {t.details.map((d, di) => (
                          <span key={di} className="text-[10px] bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 font-black text-slate-700 print:border-black print:bg-white">{d}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-rose-700 font-black text-xl color-low">{t.lam}</td>
                    <td className={`px-6 py-4 text-center font-black text-base ${getColorClass(t.percentage)}`}>{t.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* كشوف الطلاب المتبقيين (تظهر كصفحات إضافية) */}
      <section className="space-y-12">
        <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white flex justify-between items-center no-print">
            <h3 className="text-2xl font-black">كشوف متابعة الطلاب الميدانية</h3>
            <span className="bg-blue-600 px-6 py-2 rounded-2xl text-lg font-black">
                {(Object.values(lostStudents) as LostStudent[][]).reduce((a, b) => a + b.length, 0)} حالة معلقة
            </span>
        </div>

        {(Object.entries(lostStudents) as [string, LostStudent[]][]).map(([className, students], idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] shadow-lg border border-slate-200 overflow-hidden print:border-black print-card print:page-break-before-always">
            <div className="bg-slate-50 px-8 py-6 border-b-2 border-slate-200 flex justify-between items-center print:bg-white print:border-black print:py-4">
              <h4 className="text-xl font-black print:text-lg">كشف متابعة طلاب: {className}</h4>
              <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-sm font-black print:bg-black">{students.length} طلاب</span>
            </div>
            
            <div className="p-4">
              <table className="w-full text-right border-collapse print-compact-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-black">
                    <th className="px-4 py-3 w-12 text-center">م</th>
                    <th className="px-4 py-3">اسم الطالب</th>
                    <th className="px-4 py-3 w-20 text-center">النقص</th>
                    <th className="px-4 py-3">المواد المتبقية</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, si) => (
                    <tr key={si} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-black">
                      <td className="px-4 py-3 text-center font-black text-slate-400">{si + 1}</td>
                      <td className="px-4 py-3 font-black text-slate-950">{s.name}</td>
                      <td className="px-4 py-3 text-center text-rose-700 font-black text-lg color-low">{s.missingCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {s.missingSubjects.map((sub, ssi) => (
                            <span key={ssi} className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-bold text-slate-700 print:border-black">{sub}</span>
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
