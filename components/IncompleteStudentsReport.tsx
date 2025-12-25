
import React, { useMemo } from 'react';
import { RasedSummary, Period } from '../types';

interface IncompleteStudentsReportProps {
  rasedSummary: RasedSummary;
  period: Period;
}

const IncompleteStudentsReport: React.FC<IncompleteStudentsReportProps> = ({ rasedSummary, period }) => {
  const incompleteData = useMemo(() => {
    const studentsMap: Record<string, {
      name: string;
      saf: string;
      fasel: string;
      periods: Record<string, string[]>; // 'أولى': ['مادة1', 'مادة2']
      totalCount: number;
    }> = {};

    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;

          for (const subject in pData) {
            const data = pData[subject];
            // المرور على حالة رصد الطلاب في هذه المادة
            Object.entries(data.studentRasidStatus).forEach(([studentName, isRecorded]) => {
              if (!isRecorded) {
                const key = `${saf}-${fasel}-${studentName}`;
                if (!studentsMap[key]) {
                  studentsMap[key] = {
                    name: studentName,
                    saf: saf,
                    fasel: fasel,
                    periods: {},
                    totalCount: 0
                  };
                }
                if (!studentsMap[key].periods[p]) {
                  studentsMap[key].periods[p] = [];
                }
                studentsMap[key].periods[p].push(subject);
                studentsMap[key].totalCount++;
              }
            });
          }
        });
      }
    }

    return Object.values(studentsMap).sort((a, b) => b.totalCount - a.totalCount);
  }, [rasedSummary, period]);

  if (incompleteData.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-12 rounded-[2.5rem] text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h4 className="text-xl font-black text-emerald-900">تم اكتمال رصد جميع الطلاب!</h4>
        <p className="text-emerald-700 font-bold mt-2">لا يوجد أي طلاب متبقين في الفترات المحددة.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden print:border-black print-card">
        <div className="bg-slate-900 text-white p-8 flex justify-between items-center print:bg-white print:text-black print:border-b print:border-black">
          <div className="text-right">
            <h3 className="text-2xl font-black">كشف الطلاب (متبقي رصد مادة فأكثر)</h3>
            <p className="text-slate-400 text-sm font-bold mt-1 print:text-black">
              إجمالي الطلاب المتبقين: {incompleteData.length} طالباً
            </p>
          </div>
          <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/20 text-center no-print">
            <span className="text-[10px] font-black uppercase block opacity-70">حسب الفلترة</span>
            <span className="text-lg font-black">{period === 'both' ? 'الفترتين' : `فترة ${period}`}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse print-compact-table">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 w-12">م</th>
                <th className="px-6 py-4">اسم الطالب</th>
                <th className="px-6 py-4">الصف والفصل</th>
                <th className="px-6 py-4 text-center">عدد المواد</th>
                <th className="px-6 py-4">تفاصيل المواد المتبقية</th>
              </tr>
            </thead>
            <tbody>
              {incompleteData.map((student, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-slate-400 font-bold text-xs">{idx + 1}</td>
                  <td className="px-6 py-4 font-black text-black group-hover:text-blue-700 transition-colors">
                    {student.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black">
                      {student.saf} - {student.fasel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-rose-100 text-rose-600 w-8 h-8 rounded-full inline-flex items-center justify-center font-black text-sm border border-rose-200 shadow-sm">
                      {student.totalCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {Object.entries(student.periods).map(([pName, subjects]) => (
                        <div key={pName} className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${pName === 'أولى' ? 'bg-blue-600 text-white' : 'bg-indigo-900 text-white'}`}>
                            {pName === 'أولى' ? 'ف1' : 'ف2'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {subjects.map((s, si) => (
                              <span key={si} className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center print:bg-white">
          <p className="text-[10px] font-bold text-slate-400">تنبيه: البيانات مستخرجة بناءً على آخر ملفات تم رفعها من نظام نور.</p>
          <div className="flex gap-4 no-print">
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-lg">
              طباعة هذا الكشف ⎙
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncompleteStudentsReport;
