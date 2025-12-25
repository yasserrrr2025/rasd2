
import React from 'react';
import { RasedSummary, Period } from '../types';

interface TrackingTablesProps {
  rasedSummary: RasedSummary;
  period: Period;
}

const TrackingTables: React.FC<TrackingTablesProps> = ({ rasedSummary, period }) => {
  const STUDENTS_PER_PAGE = 45; 

  const pages = React.useMemo(() => {
    const result: any[] = [];
    const sortedSafs = Object.keys(rasedSummary).sort();

    for (const saf of sortedSafs) {
      const sortedFasels = Object.keys(rasedSummary[saf]).sort();
      for (const fasel of sortedFasels) {
        const allSubjectsSet = new Set<string>();
        const p1Data = rasedSummary[saf][fasel]['أولى'] || {};
        const p2Data = rasedSummary[saf][fasel]['ثانية'] || {};
        
        if (period === 'أولى' || period === 'both') Object.keys(p1Data).forEach(s => allSubjectsSet.add(s));
        if (period === 'ثانية' || period === 'both') Object.keys(p2Data).forEach(s => allSubjectsSet.add(s));
        
        const sortedSubjects = Array.from(allSubjectsSet).sort();
        if (sortedSubjects.length === 0) continue;

        const allStudentsSet = new Set<string>();
        sortedSubjects.forEach(s => {
          if (p1Data[s]) p1Data[s].studentsList.forEach(st => allStudentsSet.add(st));
          if (p2Data[s]) p2Data[s].studentsList.forEach(st => allStudentsSet.add(st));
        });
        
        const sortedStudents = Array.from(allStudentsSet).sort();
        const totalPages = Math.ceil(sortedStudents.length / STUDENTS_PER_PAGE);

        for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
          const start = pageIdx * STUDENTS_PER_PAGE;
          result.push({
            saf, fasel, subjects: sortedSubjects,
            students: sortedStudents.slice(start, start + STUDENTS_PER_PAGE),
            page: pageIdx + 1, totalPages, startIdx: start,
            p1Data, p2Data
          });
        }
      }
    }
    return result;
  }, [rasedSummary, period]);

  const isBoth = period === 'both';

  return (
    <div className="space-y-8 print:space-y-0">
      <div className="no-print bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-2xl">🖨️</div>
        <div>
          <h4 className="font-black text-sm">كشوف متابعة الرصد جاهزة للطباعة</h4>
          <p className="text-slate-400 text-xs font-bold mt-1">تم تنسيق الجداول لتناسب مقاس الورق A4 مع وضوح الرموز.</p>
        </div>
      </div>
      
      {pages.map((page, pIdx) => (
        <div key={pIdx} className="bg-white rounded-[1.5rem] shadow-sm overflow-hidden border border-slate-200 print-card print:page-break-before-always print:border-black">
          <div className="bg-slate-50 px-8 py-4 flex justify-between items-center border-b border-slate-200 print:py-2 print:px-4 print:border-black print:bg-white">
            <div>
              <h3 className="font-black text-slate-950 text-base print:text-[10pt]">كشف متابعة الرصد: {page.saf} - {page.fasel}</h3>
              <p className="text-[10px] text-slate-500 font-black mt-0.5 uppercase tracking-wider print:text-[7pt] print:mt-0">{isBoth ? 'الفترتين الأولى والثانية' : `الفترة ${period}`} • صفحة {page.page} من {page.totalPages}</p>
            </div>
          </div>
          
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-right border-collapse print-compact-table">
              <thead className="print-table-header">
                <tr className="bg-slate-50">
                  <th className="w-8 border border-slate-200 text-center text-[10px] font-black text-slate-400 print:w-6 print:text-[6pt]">م</th>
                  <th className="border border-slate-200 text-[10px] font-black px-4 whitespace-nowrap bg-slate-100 text-slate-950 print:px-2 print:text-[7pt]">اسم الطالب الرباعي</th>
                  {page.subjects.map(s => (
                    <th key={s} colSpan={isBoth ? 2 : 1} className="border border-slate-200 text-center font-black text-slate-700 bg-slate-50/50 print:bg-white">
                      <div className="text-[8px] leading-tight py-1.5 px-1 print:text-[6pt] print:py-0.5 overflow-hidden text-ellipsis">{s}</div>
                    </th>
                  ))}
                </tr>
                {isBoth && (
                  <tr className="print:bg-white">
                    <th className="border border-slate-200 print:py-0"></th>
                    <th className="border border-slate-200 print:py-0"></th>
                    {page.subjects.map(s => (
                      <React.Fragment key={`${s}-sub`}>
                        <th className="border border-slate-200 text-center text-[7px] font-black text-blue-700 bg-blue-50/20 print:text-[5pt] print:py-0 print:text-black">ف1</th>
                        <th className="border border-slate-200 text-center text-[7px] font-black text-purple-700 bg-purple-50/20 print:text-[5pt] print:py-0 print:text-black">ف2</th>
                      </React.Fragment>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {page.students.map((student, sIdx) => (
                  <tr key={student} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors print:h-5 print:border-black">
                    <td className="text-center font-bold text-slate-300 border border-slate-200 text-[9px] print:text-[6pt] print:text-black">{page.startIdx + sIdx + 1}</td>
                    <td className="px-4 py-1.5 font-bold text-slate-950 border border-slate-200 text-xs whitespace-nowrap print:px-2 print:py-0.5 print:text-[7pt]">{student}</td>
                    {page.subjects.map(subj => {
                      const isP1 = page.p1Data[subj]?.studentRasidStatus[student];
                      const isP2 = page.p2Data[subj]?.studentRasidStatus[student];
                      if (isBoth) {
                        return (
                          <React.Fragment key={subj}>
                            <td className="border border-slate-200 text-center p-0 print:p-0">
                              {isP1 !== undefined && <div className={`w-2.5 h-2.5 mx-auto rounded-full print:w-2 print:h-2 ${isP1 ? 'bg-emerald-600 bg-high' : 'bg-rose-600 bg-low'}`}></div>}
                            </td>
                            <td className="border border-slate-200 text-center p-0 print:p-0">
                              {isP2 !== undefined && <div className={`w-2.5 h-2.5 mx-auto rounded-full print:w-2 print:h-2 ${isP2 ? 'bg-emerald-600 bg-high' : 'bg-rose-600 bg-low'}`}></div>}
                            </td>
                          </React.Fragment>
                        );
                      } else {
                        const rec = period === 'أولى' ? isP1 : isP2;
                        return (
                          <td key={subj} className="border border-slate-200 text-center p-0 print:p-0">
                            {rec !== undefined && <div className={`w-3 h-3 mx-auto rounded-full print:w-2.5 print:h-2.5 ${rec ? 'bg-emerald-600 bg-high' : 'bg-rose-600 bg-low'}`}></div>}
                          </td>
                        );
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-900 px-8 py-2.5 text-[9px] text-slate-400 font-bold flex justify-between items-center print:bg-white print:text-black print:py-1 print:border-t print:border-black print:px-4">
            <span className="print:text-[6pt]">نظام متابعة رصد المواد • إصدار 2025</span>
            <div className="flex gap-4 print:gap-3 print:text-[6pt]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600 bg-high"></span> مكتمل</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-600 bg-low"></span> متبقي</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrackingTables;
