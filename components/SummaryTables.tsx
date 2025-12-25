
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

  return (
    <div className="space-y-10 relative">
      {/* Modal for Detailed Stats */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-start shrink-0">
              <div>
                <h4 className="text-xl font-black">تفاصيل المادة: {selectedDetails.subject}</h4>
                <div className="flex gap-4 mt-2 text-slate-400 text-[10px] font-bold">
                  <span className="bg-white/5 px-2 py-0.5 rounded-lg">{selectedDetails.saf} - {selectedDetails.fasel}</span>
                  <span className="bg-white/5 px-2 py-0.5 rounded-lg">الفترة: {selectedDetails.period}</span>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-600 transition-colors text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="تم الرصد" val={selectedDetails.data.rasidCount} color="emerald" />
                <StatBox label="لم يرصد" val={selectedDetails.data.lamRasidCount} color="rose" />
                <StatBox label="النسبة" val={`${selectedDetails.data.percentage}%`} color="blue" />
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 w-12 text-center">م</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400">اسم الطالب كاملاً</th>
                      <th className="px-5 py-3 text-[10px] font-black text-slate-400 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetails.data.studentsList.map((student, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-2.5 text-[10px] font-bold text-slate-300 text-center">{idx + 1}</td>
                        <td className="px-5 py-2.5 text-[11px] font-bold text-slate-800">{student}</td>
                        <td className="px-5 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black ${selectedDetails.data.studentRasidStatus[student] ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
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
               <button 
                 onClick={closeModal}
                 className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-sm hover:bg-slate-800 transition-all"
               >
                 إغلاق
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Tables Section */}
      {Object.entries(rasedSummary).map(([saf, fasels]) => (
        <div key={saf} className="space-y-6">
          {Object.entries(fasels).map(([fasel, periodsData]) => {
            const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];
            const hasData = targetPeriods.some(p => periodsData[p] && Object.keys(periodsData[p]).length > 0);
            if (!hasData) return null;

            return (
              <div key={`${saf}-${fasel}`} className="space-y-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center print-card">
                  <h3 className="text-lg font-black text-slate-900">إحصائيات {saf} - {fasel}</h3>
                  <p className="text-blue-600 text-[10px] font-black uppercase mt-1">{periodLabel}</p>
                </div>

                <div className={`grid gap-5 ${period === 'both' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  {targetPeriods.map(p => {
                    const subjects = periodsData[p];
                    if (!subjects) return null;

                    return (
                      <div key={p} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print-card">
                        <div className={`py-2.5 px-5 text-white font-black text-[11px] flex justify-between items-center ${p === 'أولى' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                          <span>الفترة {p}</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[9px]">المواد: {Object.keys(subjects).length}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase">
                                <th className="px-4 py-3">المادة</th>
                                {hasTeachers && <th className="px-4 py-3">المعلم</th>}
                                <th className="px-4 py-3 text-center">الطلاب</th>
                                <th className="px-4 py-3 text-center">الإنجاز</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(subjects).map(([subj, rawData], idx) => {
                                const data = rawData as SubjectData;
                                const teachers = teacherMapping[saf]?.[fasel]?.[subj] || ["---"];
                                return (
                                  <tr key={idx} className="border-b border-slate-50 transition-colors hover:bg-blue-50/20">
                                    <td className="px-4 py-3">
                                      <button 
                                        onClick={() => setSelectedDetails({ saf, fasel, period: p, subject: subj, teachers, data })} 
                                        className="font-bold text-slate-800 text-[11px] text-right hover:text-blue-600"
                                      >
                                        {subj}
                                      </button>
                                    </td>
                                    {hasTeachers && <td className="px-4 py-3 text-slate-500 text-[9px] font-bold">{teachers.join('، ')}</td>}
                                    <td className="px-4 py-3 text-center text-[9px] font-black text-slate-400">
                                      {data.rasidCount} / {data.rasidCount + data.lamRasidCount}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`text-[9px] font-black ${data.percentage === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>{data.percentage}%</span>
                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${data.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${data.percentage}%` }}></div>
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
        </div>
      ))}
    </div>
  );
};

const StatBox = ({ label, val, color }: any) => (
  <div className={`p-4 rounded-2xl text-center border shadow-sm ${color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
    <span className="block text-[9px] font-black uppercase opacity-60 mb-1">{label}</span>
    <span className="text-lg font-black">{val}</span>
  </div>
);

export default SummaryTables;
