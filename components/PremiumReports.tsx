
import React, { useMemo, useState } from 'react';
import { RasedSummary, TeacherMapping, Period } from '../types';

interface PremiumReportsProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

interface TeacherDetail {
  subject: string;
  saf: string;
  fasel: string;
  period: string;
  percentage: number;
  lam: number;
}

const TeacherDetailModal = ({ 
  name, 
  details, 
  onClose 
}: { 
  name: string; 
  details: TeacherDetail[]; 
  onClose: () => void 
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md no-print animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white relative">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner">👨‍🏫</div>
            <div>
              <h4 className="text-2xl font-black">{name}</h4>
              <p className="text-slate-400 text-sm font-bold mt-1">تفاصيل المواد والحالة الأكاديمية</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {details.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{item.saf} - {item.fasel}</span>
                    <span className="font-black text-slate-800 text-sm mt-1">{item.subject}</span>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black ${item.percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.period}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-400">نسبة الرصد</span>
                    <span className={`text-sm font-black ${item.percentage === 100 ? 'text-emerald-600' : 'text-slate-900'}`}>{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${item.percentage === 100 ? 'bg-emerald-500' : item.percentage > 70 ? 'bg-blue-500' : 'bg-rose-500'}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  {item.lam > 0 && (
                    <div className="flex items-center gap-2 mt-2 bg-rose-50 p-2 rounded-xl border border-rose-100">
                      <span className="text-rose-600 text-xs">⚠️</span>
                      <span className="text-[10px] font-black text-rose-800">متبقي رصد لعدد ({item.lam}) طالب</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg"
          >
            فهمت، إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

const PremiumReports: React.FC<PremiumReportsProps> = ({ rasedSummary, teacherMapping, period }) => {
  const [selectedTeacher, setSelectedTeacher] = useState<{name: string, details: TeacherDetail[]} | null>(null);
  const hasTeacherMapping = Object.keys(teacherMapping).length > 0;

  const stats = useMemo(() => {
    if (!hasTeacherMapping) return [];
    const teacherMap: Record<string, TeacherDetail[]> = {};
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;
          for (const subject in pData) {
            const data = pData[subject];
            const teachers = teacherMapping[saf]?.[fasel]?.[subject] || ["غير معرف"];
            teachers.forEach(t => {
              if (!teacherMap[t]) teacherMap[t] = [];
              teacherMap[t].push({
                subject,
                saf,
                fasel,
                period: p,
                percentage: data.percentage,
                lam: data.lamRasidCount
              });
            });
          }
        });
      }
    }

    return Object.entries(teacherMap)
      .map(([name, details]) => {
        // Fix for Error: Property 'size' does not exist on type 'TeacherDetail[]'. Changed to 'length'.
        const avgCompletion = details.reduce((acc, curr) => acc + curr.percentage, 0) / details.length; 
        const totalLam = details.reduce((acc, curr) => acc + curr.lam, 0);
        const overallCompletion = Number((details.reduce((acc, d) => acc + d.percentage, 0) / details.length).toFixed(1));
        
        return { name, details, overallCompletion, totalLam };
      })
      .sort((a, b) => a.overallCompletion - b.overallCompletion);
  }, [rasedSummary, teacherMapping, period, hasTeacherMapping]);

  // فقط المعلمين الذين لم يكملوا (نسبة إنجاز أقل من 100%)
  const incompleteTeachers = stats.filter(t => t.overallCompletion < 100);

  if (!hasTeacherMapping || incompleteTeachers.length === 0) return null;

  return (
    <div className="space-y-8 no-print">
      {selectedTeacher && (
        <TeacherDetailModal 
          name={selectedTeacher.name} 
          details={selectedTeacher.details} 
          onClose={() => setSelectedTeacher(null)} 
        />
      )}

      <section className="bg-white rounded-[3.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden print-card">
        <div className="bg-gradient-to-l from-rose-600 to-rose-500 p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-right">
            <div className="inline-block bg-white/20 px-4 py-1 rounded-full text-[10px] font-black mb-3 backdrop-blur-sm">تنبيه المتابعة الأكاديمية</div>
            <h3 className="text-3xl font-black">المعلمون المتبقي لديهم رصد</h3>
            <p className="text-rose-100 text-lg font-bold mt-2 opacity-90">قائمة الكوادر التعليمية التي تتطلب استكمال الرصد في نظام نور.</p>
          </div>
          <div className="bg-white/10 p-6 rounded-[2rem] backdrop-blur-md border border-white/20 text-center">
            <span className="block text-4xl font-black">{incompleteTeachers.length}</span>
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">معلم متأخر</span>
          </div>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incompleteTeachers.map((teacher, i) => (
              <div 
                key={i} 
                className="bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all duration-300 group cursor-pointer"
                onClick={() => setSelectedTeacher({ name: teacher.name, details: teacher.details })}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">👤</div>
                  <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black ${teacher.overallCompletion < 50 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                    إنجاز {teacher.overallCompletion}%
                  </div>
                </div>
                
                <h4 className="text-lg font-black text-black mb-1 group-hover:text-blue-700 transition-colors">{teacher.name}</h4>
                <p className="text-slate-400 text-xs font-bold mb-6">متبقي رصد لعدد ({teacher.totalLam}) طالب</p>
                
                <div className="space-y-4">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 transition-all duration-1000 group-hover:bg-blue-600"
                      style={{ width: `${teacher.overallCompletion}%` }}
                    ></div>
                  </div>
                  <button className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm">
                    عرض تقرير المواد المتبقية
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PremiumReports;
