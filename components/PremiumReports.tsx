
import React, { useMemo } from 'react';
import { RasedSummary, TeacherMapping, Period } from '../types';

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
              const teachers = teacherMapping[saf]?.[fasel]?.[subject] || ["غير معرف"];
              teachers.forEach(t => {
                if (!stats[t]) stats[t] = { lam: 0, rasid: 0, details: [] };
                stats[t].lam += data.lamRasidCount;
                stats[t].rasid += data.rasidCount;
                stats[t].details.push(`${subject} (${saf}-${fasel})`);
              });
            }
          }
        });
      }
    }
    return Object.entries(stats).map(([name, data]) => {
      const total = data.lam + data.rasid;
      return { name, lam: data.lam, percentage: Number(((data.rasid / total) * 100).toFixed(1)), details: Array.from(new Set(data.details)) };
    }).sort((a, b) => a.percentage - b.percentage);
  }, [rasedSummary, teacherMapping, period, hasTeacherMapping]);

  if (!hasTeacherMapping || teacherDefaulters.length === 0) return null;

  return (
    <div className="print-page-teachers">
      <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden print:border-black print-card">
        <div className="bg-slate-900 p-8 text-white print:bg-black">
          <h3 className="text-2xl font-black">تقرير المعلمين المتبقي لديهم رصد</h3>
          <p className="text-slate-400 text-sm mt-1">صفحة 2 - إحصائية المتابعة للمعلمين</p>
        </div>
        <div className="p-6">
          <table className="w-full text-right border-collapse print-compact-table">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-black">
                <th className="px-4 py-3">اسم المعلم</th>
                <th className="px-4 py-3">المواد</th>
                <th className="px-4 py-3 text-center">متبقي</th>
                <th className="px-4 py-3 text-center">الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              {teacherDefaulters.map((t, i) => (
                <tr key={i} className="border-b print:border-black">
                  <td className="px-4 py-3 font-black">{t.name}</td>
                  <td className="px-4 py-3 text-xs">{t.details.join(' ، ')}</td>
                  <td className="px-4 py-3 text-center text-rose-700 font-black color-low">{t.lam}</td>
                  <td className={`px-4 py-3 text-center font-black ${t.percentage < 75 ? 'color-low' : 'color-mid'}`}>{t.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PremiumReports;
