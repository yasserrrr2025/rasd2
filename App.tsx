
import React, { useState, useEffect } from 'react';
import { RasedSummary, TeacherMapping, Period } from './types';
import { processRasedFile, extractSummaryData, normalizeString } from './utils/excelProcessor';
import * as XLSX from 'xlsx';
import Dashboard from './components/Dashboard';
import SummaryTables from './components/SummaryTables';
import TrackingTables from './components/TrackingTables';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import PremiumReports from './components/PremiumReports';
import RankingTable from './components/RankingTable';
import IncompleteStudentsReport from './components/IncompleteStudentsReport';

const App: React.FC = () => {
  const [rasedSummary, setRasedSummary] = useState<RasedSummary>(() => {
    const saved = localStorage.getItem('rased_data');
    return saved ? JSON.parse(saved) : {};
  });
  const [teacherMapping, setTeacherMapping] = useState<TeacherMapping>(() => {
    const saved = localStorage.getItem('teacher_mapping');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('both');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'reports'>('dashboard');
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    localStorage.setItem('rased_data', JSON.stringify(rasedSummary));
  }, [rasedSummary]);

  useEffect(() => {
    localStorage.setItem('teacher_mapping', JSON.stringify(teacherMapping));
  }, [teacherMapping]);

  const handleRasedFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    let updatedSummary = { ...rasedSummary };
    for (let i = 0; i < files.length; i++) {
      try {
        const { data } = await processRasedFile(files[i]);
        updatedSummary = extractSummaryData(data, updatedSummary);
      } catch (err) {
        console.error("Error processing file:", files[i].name, err);
      }
    }
    setRasedSummary({ ...updatedSummary });
    setIsProcessing(false);
  };

  const handleTeacherFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const mapping: TeacherMapping = {};
        jsonData.slice(1).forEach(row => {
          if (row.length < 4) return;
          const teacher = normalizeString(row[0]);
          const saf = normalizeString(row[1]);
          const subject = normalizeString(row[2]);
          const fasel = normalizeString(row[3]);
          if (!mapping[saf]) mapping[saf] = {};
          if (!mapping[saf][fasel]) mapping[saf][fasel] = {};
          if (!mapping[saf][fasel][subject]) mapping[saf][fasel][subject] = [];
          mapping[saf][fasel][subject].push(teacher);
        });
        setTeacherMapping(mapping);
        alert("✅ تم ربط بيانات المعلمين بنجاح");
      } catch (err) {
        alert("⚠️ حدث خطأ في التنسيق، تأكد من ترتيب الأعمدة: المعلم، الصف، المادة، الفصل");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearAllData = () => {
    if (window.confirm("⚠️ تنبيه: سيتم حذف كافة البيانات المسجلة، هل أنت متأكد؟")) {
      setRasedSummary({});
      setTeacherMapping({});
      localStorage.clear();
      window.location.reload();
    }
  };

  const hasData = Object.keys(rasedSummary).length > 0;

  return (
    <div className="min-h-screen pb-20 bg-[#F4F7FA]">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto pt-16 pb-12 px-6 no-print text-center">
        <div className="inline-block mb-4 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-black tracking-widest uppercase">نظام ذكي متطور</div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-black drop-shadow-sm">
          نظام متابعة رصد المواد للمرحلة الثانوية
        </h1>
        <p className="text-slate-500 font-bold text-lg mb-10 max-w-2xl mx-auto">
          الأداة الأكثر دقة لتحليل تقارير نظام نور واستخراج بيانات الرصد الشاملة بضغطة زر.
        </p>
        
        <div className="flex flex-wrap justify-center gap-5">
          <button 
            onClick={() => setShowInstructions(!showInstructions)} 
            className={`px-10 py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-lg flex items-center gap-3 ${showInstructions ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
          >
            <span>{showInstructions ? 'إغلاق دليل الاستخدام' : 'إظهار دليل الاستخدام'}</span>
            <span className="text-xl">ℹ️</span>
          </button>
        </div>

        {/* Onboarding Guide - Professional Layout */}
        {showInstructions && (
          <div className="mt-12 animate-in fade-in slide-in-from-top-6 duration-700 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
              <StepCard number="1" icon="📊" title="الدخول لنظام نور" desc="من القائمة الرئيسية، توجه مباشرة إلى أيقونة 'التقارير'." />
              <StepCard number="2" icon="🛣️" title="تقارير المسارات" desc="اختر 'تقارير نظام المسارات' للوصول لخيارات المرحلة الثانوية." />
              <StepCard number="3" icon="📝" title="متابعة الرصد" desc="اختر تقرير 'متابعة رصد الدرجات' وهو التقرير الأساسي للتحليل." />
              <StepCard number="4" icon="🔍" title="تحديد النطاق" desc="حدد الصف الدراسي والفصل، أو اختر 'الكل' للمدرسة كاملة." />
              <StepCard number="5" icon="👁️" title="عرض البيانات" desc="اضغط على زر 'عرض' لتوليد التقرير داخل المتصفح." />
              <StepCard number="6" icon="🧩" title="تحميل الإضافة" desc="يجب توفر إضافة 'مدرستي بلس' لتفعيل خيار تحميل الإكسيل." />
            </div>

            <div className="mt-8 bg-blue-600 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-200">
              <div className="text-right text-white">
                <h3 className="text-2xl font-black mb-2">هل تملك إضافة مدرستي بلس؟</h3>
                <p className="text-blue-100 font-bold opacity-90">الإضافة ضرورية لتحميل ملفات الرصد الشاملة من نظام نور.</p>
              </div>
              <a 
                href="https://chromewebstore.google.com/detail/maogiolhkdhjobnlobpkcpnmamnmilno?utm_source=item-share-cb" 
                target="_blank" 
                className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl flex items-center gap-3 whitespace-nowrap group"
              >
                <span>تحميل الإضافة الآن</span>
                <span className="group-hover:translate-x-[-4px] transition-transform">➜</span>
              </a>
            </div>

            <div className="mt-6 p-6 bg-amber-50 rounded-3xl border border-amber-200 text-right flex items-start gap-4 shadow-sm">
              <span className="text-3xl">📂</span>
              <div>
                <h4 className="font-black text-amber-900 text-lg">الخطوة السابعة والأخيرة</h4>
                <p className="text-amber-800 font-bold text-sm leading-relaxed">
                  حمل ملفات جميع الفصول التي ترغب بمتابعتها، واحفظها في مجلد واحد على جهازك، ثم ارفعها دفعة واحدة في خانة "ملفات رصد نور" بالأسفل.
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Upload Section */}
        <section className="no-print bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative group">
              <div className="absolute -top-3 right-8 px-4 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full shadow-lg z-10">إجباري</div>
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 group-hover:border-blue-400 transition-all duration-300 h-full flex flex-col justify-center">
                <label className="block text-sm font-black mb-4 text-slate-800 flex items-center gap-2">
                  <span>📥 ملفات رصد نور (متعدد)</span>
                </label>
                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => handleRasedFiles(e.target.files)} 
                  className="block w-full text-xs file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-black cursor-pointer" 
                />
                <p className="mt-3 text-[10px] font-bold text-slate-400">يمكنك اختيار جميع ملفات الفصول معاً بضغطة واحدة.</p>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -top-3 right-8 px-4 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-full shadow-lg z-10">اختياري</div>
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 group-hover:border-emerald-400 transition-all duration-300">
                <label className="block text-sm font-black mb-4 text-slate-800 flex items-center gap-2">
                  <span>👨‍🏫 ربط المعلمين (Excel)</span>
                </label>
                <input 
                  type="file" 
                  onChange={handleTeacherFile} 
                  className="block w-full text-xs file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white file:font-black cursor-pointer mb-6" 
                />
                
                {/* المعاينة الاحترافية لشكل الجدول */}
                <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <h5 className="text-[11px] font-black text-slate-600 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    معاينة شكل ملف المعلمين المطلوب:
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-[9px] font-bold">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 border-b border-slate-200">
                          <th className="p-2">المعلم</th>
                          <th className="p-2">الصف</th>
                          <th className="p-2">المادة</th>
                          <th className="p-2">الفصل</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-50 text-slate-600">
                          <td className="p-2 font-black text-black">أ. محمد العتيبي</td>
                          <td className="p-2 bg-emerald-50 text-emerald-900 font-black">الثاني الثانوي</td>
                          <td className="p-2 text-blue-700">التقنية الرقمية</td>
                          <td className="p-2">101</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td className="p-2 font-black text-black">أ. نورة القحطاني</td>
                          <td className="p-2 bg-emerald-50 text-emerald-900 font-black">الثاني الثانوي</td>
                          <td className="p-2 text-blue-700">اللغة الإنجليزية</td>
                          <td className="p-2">102</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-[10px] font-bold text-slate-500 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-100">
                  ⚠️ <span className="text-amber-900">ملاحظة هامة جداً:</span> يجب أن يتطابق <b>"اسم المادة"</b> و <b>"اسم الصف"</b> في ملف المعلمين مع المسميات الموجودة في ملفات نظام نور تماماً ليتم الربط بنجاح.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-6 pt-6 border-t border-slate-50">
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200">
              {(['dashboard', 'analytics', 'reports'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-8 py-3 rounded-xl font-black text-xs transition-all duration-300 ${activeTab === tab ? 'bg-white text-blue-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab === 'dashboard' ? '📊 لوحة الإنجاز' : tab === 'analytics' ? '📈 التحليل البصري' : '📄 الكشوف والتقارير'}
                </button>
              ))}
            </div>
            
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200">
              {(['أولى', 'ثانية', 'both'] as const).map(p => (
                <button 
                  key={p} 
                  onClick={() => setSelectedPeriod(p)} 
                  className={`px-8 py-3 rounded-xl font-black text-xs transition-all duration-300 ${selectedPeriod === p ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-500'}`}
                >
                  {p === 'أولى' ? 'الفترة 1' : p === 'ثانية' ? 'الفترة 2' : 'الفترتين'}
                </button>
              ))}
            </div>
            
            <button 
              onClick={clearAllData} 
              className="px-8 py-3.5 bg-rose-50 text-rose-600 font-black text-xs rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              تصفير البيانات المؤرشفة
            </button>
          </div>
        </section>

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
            <div className="text-center">
              <p className="font-black text-2xl text-slate-900">جاري تحليل البيانات بدقة...</p>
              <p className="text-slate-400 font-bold mt-2">نقوم الآن بمعالجة ملفات الإكسيل واستخراج الإحصائيات</p>
            </div>
          </div>
        )}

        {hasData && !isProcessing && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {activeTab === 'dashboard' && (
              <>
                <Dashboard rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <PremiumReports rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <RankingTable rasedSummary={rasedSummary} period={selectedPeriod} />
                <SummaryTables rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <TrackingTables rasedSummary={rasedSummary} period={selectedPeriod} />
              </>
            )}
            {activeTab === 'analytics' && (
              <AdvancedAnalytics rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
            )}
            {activeTab === 'reports' && (
              <div className="space-y-12">
                <div className="no-print bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-right">
                    <h2 className="text-3xl font-black">جاهز للطباعة؟</h2>
                    <p className="text-slate-400 font-bold mt-2 text-lg">تم تحسين كافة الكشوف لتظهر بجودة عالية عند الطباعة الورقية.</p>
                  </div>
                  <button onClick={() => window.print()} className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-[1.5rem] font-black text-lg hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-4">
                    <span>⎙ بدء طباعة التقارير</span>
                  </button>
                </div>
                
                <section className="space-y-8">
                  <div className="bg-white py-4 px-10 rounded-2xl shadow-sm border border-slate-100 text-right no-print">
                    <h3 className="font-black text-slate-800 flex items-center gap-3">
                      <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                      أولاً: تقارير متبقي الرصد (المعلمين والطلاب)
                    </h3>
                  </div>
                  <PremiumReports rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                </section>

                <section className="space-y-8">
                  <div className="bg-white py-4 px-10 rounded-2xl shadow-sm border border-slate-100 text-right no-print">
                    <h3 className="font-black text-slate-800 flex items-center gap-3">
                      <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                      ثانياً: كشف الطلاب من لم يتم الرصد مادة فأكثر
                    </h3>
                  </div>
                  <IncompleteStudentsReport rasedSummary={rasedSummary} period={selectedPeriod} />
                </section>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Sub-component for Step Cards
const StepCard = ({ number, icon, title, desc }: { number: string, icon: string, title: string, desc: string }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      <span className="text-4xl">{icon}</span>
      <span className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg">{number}</span>
    </div>
    <h4 className="text-lg font-black text-slate-900 mb-2">{title}</h4>
    <p className="text-slate-500 font-bold text-xs leading-relaxed">{desc}</p>
  </div>
);

export default App;
