
import React from 'react';
import { RasedSummary, TeacherMapping, Period } from '../types';

interface SummaryTablesProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

const SummaryTables: React.FC<SummaryTablesProps> = ({ rasedSummary, teacherMapping, period }) => {
  const hasTeachers = Object.keys(teacherMapping).length > 0;
  const getColorClass = (val: number) => val < 75 ? 'color-low' : val < 95 ? 'color-mid' : 'color-high';

  return (
    <div className="space-y-12">
      {Object.entries(rasedSummary).map(([saf, fasels]) => (
        <React.Fragment key={saf}>
          {Object.entries(fasels).map(([fasel, periodsData]) => {
            const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];
            const hasData = targetPeriods.some(p => periodsData[p]);
            if (!hasData) return null;

            return (
              <div key={`${saf}-${fasel}`} className="print-page keep-together">
                <div className="bg-white border p-8 rounded-[2.5rem] shadow-lg text-center mb-8 print:border-black print-card">
                  <h3 className="text-2xl font-black text-slate-900">إحصائيات رصد الفصل: {saf} - {fasel}</h3>
                  <p className="text-slate-500 font-bold mt-1 text-sm">تفصيل المواد لكل فترة دراسية</p>
                </div>

                <div className={`grid gap-8 ${period === 'both' ? 'lg:grid-cols-2 print:grid-cols-2' : 'grid-cols-1'}`}>
                  {targetPeriods.map(p => {
                    const subjects = periodsData[p];
                    if (!subjects) return null;

                    return (
                      <div key={p} className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden print:border-black print-card">
                        <div className={`py-3 px-6 text-white font-black text-xs print:bg-black ${p === 'أولى' ? 'bg-blue-800' : 'bg-indigo-900'}`}>الفترة {p}</div>
                        <div className="p-4">
                          <table className="w-full text-right border-collapse print-compact-table">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] font-black text-slate-400">
                                <th className="px-4 py-3">المادة الدراسية</th>
                                {hasTeachers && <th className="px-4 py-3">المعلم</th>}
                                <th className="px-4 py-3 text-center">الإنجاز</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(subjects).map(([subj, rawData]: any, idx) => (
                                <tr key={idx} className="border-b print:border-black">
                                  <td className="px-4 py-3 font-black text-sm">{subj}</td>
                                  {hasTeachers && <td className="px-4 py-3 text-xs text-slate-500 print:text-black">{(teacherMapping[saf]?.[fasel]?.[subj] || ["---"]).join('، ')}</td>}
                                  <td className="px-4 py-3 text-center">
                                    <span className={`text-sm font-black ${getColorClass(rawData.percentage)}`}>{rawData.percentage}%</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default SummaryTables;
