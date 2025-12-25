
import React, { useState } from 'react';
import { RasedSummary, TeacherMapping, Period, SubjectData } from '../types';

interface SummaryTablesProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

interface DetailModalProps {
  saf: string;
  fasel: string;
  period: string;
  subject: string;
  data: SubjectData;
  teacherName?: string;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ saf, fasel, period, subject, data, teacherName, onClose }) => {
  const students = Object.entries(data.studentRasidStatus).sort((a, b) => {
    // إظهار غير المرصودين أولاً
    if (a[1] === b[1]) return a[0].localeCompare(b[0]);
    return a[1] ? 1 : -1;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md no-print animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-white relative">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📚</div>
            <div>
              <h4 className="text-2xl font-black">{subject}</h4>
              <p className="text-blue-200 text-sm font-bold mt-1">
                {saf} - {fasel} | الفترة: {period}
              </p>
              {teacherName && (
                <p className="text-emerald-400 text-xs font-black mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  المعلم: {teacherName}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-8 left-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-500 transition-all text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {students.map(([name, status], idx) => (
              <div 
                key={idx} 
                className={`flex justify-between items-center p-4 rounded-2xl border transition-all hover:scale-[1.02] ${
                  status ? 'bg-white border-emerald-100 shadow-sm' : 'bg-rose-50 border-rose-100 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${status ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {idx + 1}
                  </div>
                  <span className={`font-black text-sm ${status ? 'text-slate-700' : 'text-rose-900'}`}>{name}</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${
                  status ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {status ? '✓ تم الرصد' : '⚠ متبقي'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase">تم الرصد</span>
              <span className="text-xl font-black text-emerald-600">{data.rasidCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase">متبقي رصد</span>
              <span className="text-xl font-black text-rose-600">{data.lamRasidCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase">نسبة الإنجاز</span>
              <span className="text-xl font-black text-blue-600">{data.percentage}%</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};

const SummaryTables: React.FC<SummaryTablesProps> = ({ rasedSummary, teacherMapping, period }) => {
  const [selectedDetails, setSelectedDetails] = useState<{
    saf: string;
    fasel: string;
    period: string;
    subject: string;
    data: SubjectData;
    teacherName?: string;
  } | null>(null);

  const hasTeachers = Object.keys(teacherMapping).length > 0;
  const getColorClass = (val: number) => val < 75 ? 'color-low' : val < 95 ? 'color-mid' : 'color-high';

  return (
    <div className="space-y-12">
      {selectedDetails && (
        <DetailModal 
          {...selectedDetails} 
          onClose={() => setSelectedDetails(null)} 
        />
      )}

      {Object.entries(rasedSummary).map(([saf, fasels]) => (
        <React.Fragment key={saf}>
          {Object.entries(fasels).map(([fasel, periodsData]) => {
            const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];
            const hasData = targetPeriods.some(p => periodsData[p]);
            if (!hasData) return null;

            return (
              <div key={`${saf}-${fasel}`} className="keep-together print:mt-8">
                <div className="bg-white border p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] text-center mb-6 border-slate-100 print:border-black print-card print:mb-4">
                  <h3 className="text-2xl font-black text-slate-900">إحصائيات رصد الفصل: {saf} - {fasel}</h3>
                  <p className="text-slate-500 font-bold mt-1 text-sm print:text-xs italic">تنبيه: اضغط على المادة لعرض قوائم الطلاب وتفاصيل الرصد</p>
                </div>

                <div className={`grid gap-6 ${period === 'both' ? 'lg:grid-cols-2 print:grid-cols-2' : 'grid-cols-1'}`}>
                  {targetPeriods.map(p => {
                    const subjects = periodsData[p];
                    if (!subjects) return null;

                    return (
                      <div key={p} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden print:border-black print-card">
                        <div className={`py-4 px-8 text-white font-black text-sm print:bg-black print:text-center flex justify-between items-center ${p === 'أولى' ? 'bg-blue-800' : 'bg-indigo-900'}`}>
                          <span>الفترة {p}</span>
                          <span className="text-[10px] opacity-80">{Object.keys(subjects).length} مادة مسجلة</span>
                        </div>
                        <div className="p-6">
                          <table className="w-full text-right border-separate border-spacing-y-2 print-compact-table">
                            <thead>
                              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-4 py-2">المادة الدراسية</th>
                                {hasTeachers && <th className="px-4 py-2">المعلم</th>}
                                <th className="px-4 py-2 text-center">الإنجاز</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(subjects).map(([subj, rawData]: any, idx) => {
                                const teachersArr = teacherMapping[saf]?.[fasel]?.[subj] || ["---"];
                                const teachersText = teachersArr.join('، ');
                                
                                return (
                                  <tr 
                                    key={idx} 
                                    onClick={() => setSelectedDetails({ saf, fasel, period: p, subject: subj, data: rawData, teacherName: teachersText })}
                                    className="hover:bg-blue-50/50 cursor-pointer transition-all group rounded-2xl"
                                  >
                                    <td className="px-4 py-4 font-black text-sm text-slate-900 group-hover:text-blue-700 transition-colors border-y border-r border-transparent first:rounded-r-2xl first:border-r-slate-50">
                                      {subj}
                                    </td>
                                    {hasTeachers && (
                                      <td className="px-4 py-4 text-xs text-black font-black group-hover:text-blue-900 border-y border-transparent">
                                        {teachersText}
                                      </td>
                                    )}
                                    <td className="px-4 py-4 text-center border-y border-l border-transparent last:rounded-l-2xl last:border-l-slate-50">
                                      <div className="flex flex-col items-center">
                                        <span className={`text-sm font-black ${getColorClass(rawData.percentage)}`}>
                                          {rawData.percentage}%
                                        </span>
                                        <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden no-print">
                                          <div className={`h-full ${rawData.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${rawData.percentage}%` }}></div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
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
