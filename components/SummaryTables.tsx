
import React, { useState } from 'react';
import { RasedSummary, TeacherMapping, Period, SubjectData } from '../types';

interface SummaryTablesProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

interface SelectedDetails {
  saf: string;
  fasel: string;
  period: string;
  subject: string;
  teachers: string[];
  data: SubjectData;
}

const SummaryTables: React.FC<SummaryTablesProps> = ({ rasedSummary, teacherMapping, period }) => {
  const [selectedDetails, setSelectedDetails] = useState<SelectedDetails | null>(null);
  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'مقارنة الفترتين الشاملة';
  const hasTeachers = Object.keys(teacherMapping).length > 0;

  const closeModal = () => setSelectedDetails(null);

  const getColorClass = (val: number) => {
    if (val < 75) return 'color-low';
    if (val < 95) return 'color-mid';
    return 'color-high';
  };

  const getBgClass = (val: number) => {
    if (val < 75) return 'bg-low';
    if (val < 95) return 'bg-mid';
    return 'bg-high';
  };

  return (
    <div className="space-y-12 relative">
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-start shrink-0">
              <div>
                <h4 className="text-xl font-black">تفاصيل المادة: {selectedDetails.subject}</h4>
                <div className="flex gap-4 mt-2 text-slate-400 text-[10px] font-bold">
                  <span className="bg-white/10 px-2 py-0.5 rounded-lg">{selectedDetails.saf} - {selectedDetails.fasel}</span>
                </div>
              </div>
              <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-600 transition-colors text-2xl font-bold">×</button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="تم الرصد" val={selectedDetails.data.rasidCount} color="emerald" />
                <StatBox label="لم يرصد" val={selectedDetails.data.lamRasidCount} color="rose" />
                <StatBox label="النسبة" val={`${selectedDetails.data.percentage}%`} colorClass={getColorClass(selectedDetails.data.percentage)} />
              </div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 w-12 text-center">م</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400">اسم الطالب</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetails.data.studentsList.map((student, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-2 text-[10px] font-bold text-slate-300 text-center">{idx + 1}</td>
                        <td className="px-5 py-2 text-[11px] font-bold text-slate-800">{student}</td>
                        <td className="px-5 py-2 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-black ${selectedDetails.data.studentRasidStatus[student] ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {selectedDetails.data.studentRasidStatus[student] ? 'مكتمل' : 'متبقي'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
               <button onClick={closeModal} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-sm">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {Object.entries(rasedSummary).map(([saf, fasels]) => (
        <React.Fragment key={saf}>
          {Object.entries(fasels).map(([fasel, periodsData]) => {
            const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];
            const hasData = targetPeriods.some(p => periodsData[p] && Object.keys(periodsData[p]).length > 0);
            if (!hasData) return null;

            return (
              <div key={`${saf}-${fasel}`} className="space-y-8 print:page-break-before-always">
                <div className="bg-white border p-8 rounded-[2.5rem] shadow-lg text-center print:border-black print-card print:p-6">
                  <h3 className="text-3xl font-black text-slate-900 print:text-xl">إحصائيات رصد الفصل: {saf} - {fasel}</h3>
                  <div className="flex justify-center gap-4 mt-2">
                      <span className="bg-slate-100 px-4 py-1.5 rounded-xl text-[10px] font-black text-slate-500 uppercase">{periodLabel}</span>
                  </div>
                </div>

                <div className={`grid gap-8 ${period === 'both' ? 'grid-cols-1 xl:grid-cols-2 print:grid-cols-2' : 'grid-cols-1'}`}>
                  {targetPeriods.map(p => {
                    const subjects = periodsData[p];
                    if (!subjects) return null;

                    return (
                      <div key={p} className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden print:border-black print-card">
                        <div className={`py-4 px-8 text-white font-black text-xs flex justify-between items-center print:bg-black ${p === 'أولى' ? 'bg-blue-800' : 'bg-indigo-900'}`}>
                          <span>إحصائية الفترة {p}</span>
                          <span className="bg-white/10 px-3 py-1 rounded-lg">المواد: {Object.keys(subjects).length}</span>
                        </div>
                        <div className="overflow-x-auto p-4">
                          <table className="w-full text-right border-collapse print-compact-table">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 border-b">
                                <th className="px-5 py-3">المادة الدراسية</th>
                                {hasTeachers && <th className="px-5 py-3">المعلم</th>}
                                <th className="px-5 py-3 text-center w-24">الإنجاز</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(subjects).map(([subj, rawData], idx) => {
                                const data = rawData as SubjectData;
                                const teachers = teacherMapping[saf]?.[fasel]?.[subj] || ["---"];
                                return (
                                  <tr key={idx} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors print:border-black ${data.percentage === 100 ? 'print:bg-emerald-50' : data.percentage < 75 ? 'print:bg-rose-50' : ''}`}>
                                    <td className="px-5 py-4">
                                      <button 
                                        onClick={() => setSelectedDetails({ saf, fasel, period: p, subject: subj, teachers, data })} 
                                        className="font-black text-slate-950 text-base text-right hover:text-blue-700"
                                      >
                                        {subj}
                                      </button>
                                    </td>
                                    {hasTeachers && <td className="px-5 py-4 text-slate-500 text-xs font-bold print:text-black">{teachers.join('، ')}</td>}
                                    <td className="px-5 py-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className={`text-sm font-black ${getColorClass(data.percentage)}`}>{data.percentage}%</span>
                                        <div className="progress-container w-16 h-1.5 mt-1.5 no-print">
                                          <div className={`h-full transition-all duration-1000 ${getBgClass(data.percentage)}`} style={{ width: `${data.percentage}%` }}></div>
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

const StatBox = ({ label, val, color, colorClass }: any) => (
  <div className={`p-5 rounded-2xl text-center border shadow-sm ${color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100'} ${colorClass || ''}`}>
    <span className="block text-[10px] font-black uppercase opacity-60 mb-1">{label}</span>
    <span className="text-2xl font-black">{val}</span>
  </div>
);

export default SummaryTables;
