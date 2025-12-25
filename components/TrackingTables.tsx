
import React from 'react';
import { RasedSummary, Period } from '../types';

interface TrackingTablesProps {
  rasedSummary: RasedSummary;
  period: Period;
}

const TrackingTables: React.FC<TrackingTablesProps> = ({ rasedSummary, period }) => {
  // 55 طالباً في الصفحة الواحدة للطباعة لتوفير الورق
  const STUDENTS_PER_PAGE = 55; 

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
    <div className="space-y-10">
      <div className="no-print bg-blue-50 border-r-4 border-blue-600 p-4 rounded-xl text-blue-800 text-sm font-bold flex items-center gap-3">
        <span>💡</span> تم تفعيل الاحتواء التلقائي: يتمدد عمود الاسم الآن حسب طول اسم الطالب كاملاً.
      </div>
      
      {pages.map((page, pIdx) => (
        <div key={pIdx} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 print-card">
          <div className="bg-slate-50 px-6 py-3 flex justify-between items-center border-b border-slate-200 print-bg-none">
            <div>
              <h3 className="font-black text-slate-800 text-sm">متابعة الرصد: {page.saf} - {page.fasel}</h3>
              <p className="text-[10px] text-slate-500 font-bold">{isBoth ? 'الفترتين' : period} • صفحة {page.page}/{page.totalPages}</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse table-auto print-compact-table">
              <thead>
                <tr className="bg-slate-50">
                  <th className="w-10 border border-slate-200 text-center text-[10px] font-black">م</th>
                  <th className="border border-slate-200 text-[10px] font-black px-4 whitespace-nowrap bg-slate-50/50">اسم الطالب كاملاً</th>
                  {page.subjects.map(s => (
                    <th key={s} colSpan={isBoth ? 2 : 1} className="border border-slate-200 text-center font-black text-slate-700 min-w-[50px]">
                      <div className="text-[8px] leading-tight py-1">{s}</div>
                    </th>
                  ))}
                </tr>
                {isBoth && (
                  <tr>
                    <th className="border border-slate-200"></th>
                    <th className="border border-slate-200"></th>
                    {page.subjects.map(s => (
                      <React.Fragment key={`${s}-sub`}>
                        <th className="border border-slate-200 text-center text-[7px] font-black text-blue-600 bg-blue-50/10">ف1</th>
                        <th className="border border-slate-200 text-center text-[7px] font-black text-purple-600 bg-purple-50/10">ف2</th>
                      </React.Fragment>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {page.students.map((student, sIdx) => (
                  <tr key={student} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="text-center font-bold text-slate-400 border border-slate-200 text-[10px]">{page.startIdx + sIdx + 1}</td>
                    <td className="px-4 py-1.5 font-bold text-slate-800 border border-slate-200 text-[11px] whitespace-nowrap">{student}</td>
                    {page.subjects.map(subj => {
                      const isP1 = page.p1Data[subj]?.studentRasidStatus[student];
                      const isP2 = page.p2Data[subj]?.studentRasidStatus[student];
                      
                      if (isBoth) {
                        return (
                          <React.Fragment key={subj}>
                            <td className="border border-slate-200 text-center">
                              {isP1 !== undefined && <div className={`w-2 h-2 mx-auto rounded-full ${isP1 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>}
                            </td>
                            <td className="border border-slate-200 text-center">
                              {isP2 !== undefined && <div className={`w-2 h-2 mx-auto rounded-full ${isP2 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>}
                            </td>
                          </React.Fragment>
                        );
                      } else {
                        const rec = period === 'أولى' ? isP1 : isP2;
                        return (
                          <td key={subj} className="border border-slate-200 text-center">
                            {rec !== undefined && <div className={`w-2.5 h-2.5 mx-auto rounded-full ${rec ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>}
                          </td>
                        );
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 px-6 py-2 border-t border-slate-200 text-[9px] text-slate-400 font-bold flex justify-between items-center print-text-small">
            <span>نظام رصد المواد • {new Date().toLocaleDateString('ar-SA')}</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> مكتمل</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> متبقي</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrackingTables;
