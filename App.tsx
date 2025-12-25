
import React, { useState, useEffect } from 'react';
import { RasedSummary, TeacherMapping, Period } from './types';
import { processRasedFile, extractSummaryData, normalizeString } from './utils/excelProcessor';
import * as XLSX from 'xlsx';
import Dashboard from './components/Dashboard';
import SummaryTables from './components/SummaryTables';
import TeachersReport from './components/TeachersReport';
import TrackingTables from './components/TrackingTables';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import PremiumReports from './components/PremiumReports';

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
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isDragging, setIsDragging] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    localStorage.setItem('rased_data', JSON.stringify(rasedSummary));
  }, [rasedSummary]);

  useEffect(() => {
    localStorage.setItem('teacher_mapping', JSON.stringify(teacherMapping));
  }, [teacherMapping]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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
    setRasedSummary(updatedSummary);
    setIsProcessing(false);
  };

  const handleTeacherFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
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
    };
    reader.readAsArrayBuffer(file);
  };

  const clearAllData = () => {
    if (window.confirm("سيتم حذف جميع البيانات المؤرشفة، هل أنت متأكد؟")) {
      setRasedSummary({});
      setTeacherMapping({});
      localStorage.clear();
    }
  };

  const hasData = Object.keys(rasedSummary).length > 0;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-200 text-slate-900'}`}>
      <header className="max-w-[98%] mx-auto text-center py-12 px-6 no-print relative">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-4 left-4 p-4 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border-2 border-slate-300 dark:border-slate-800 hover:scale-110 transition-all z-50">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <div className="inline-block bg-blue-800 text-white px-6 py-1.5 rounded-full text-[11px] font-black uppercase mb-6 shadow-xl border border-blue-600/30">الإصدار الاحترافي v2.5</div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter dark:text-white text-slate-950">نظام متابعة رصد المواد</h1>
        <p className="text-slate-800 dark:text-slate-400 text-xl font-bold max-w-3xl mx-auto mb-10 leading-relaxed">أداة إدارية متكاملة لمتابعة وتحليل عمليات رصد الدرجات في نظام نور بدقة عالية</p>
        
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="bg-white dark:bg-slate-800 px-8 py-3 rounded-2xl text-sm font-black hover:bg-blue-800 hover:text-white transition-all shadow-xl border-2 border-slate-300 dark:border-slate-700"
        >
          {showInstructions ? 'إخفاء دليل الاستخدام ▲' : 'كيفية استخراج ملفات الرصد؟ ▼'}
        </button>

        {showInstructions && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-right animate-in fade-in slide-in-from-top-6 duration-700 max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl border-2 border-slate-300 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-3 h-full bg-blue-700"></div>
              <h4 className="font-black text-blue-800 dark:text-blue-500 mb-8 flex items-center gap-4 text-2xl">
                <span className="text-3xl">ℹ️</span> خطوات استخراج ملفات الرصد من نظام نور:
              </h4>
              <ol className="text-sm space-y-5 text-slate-950 dark:text-slate-400 font-black">
                <li className="flex gap-4 items-start"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-blue-200">1</span> من نظام نور، توجه إلى قائمة "التقارير"</li>
                <li className="flex gap-4 items-start"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-blue-200">2</span> اختر "تقارير الدرجات"</li>
                <li className="flex gap-4 items-start"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-blue-200">3</span> اختر تقرير "متابعة رصد الفترات"</li>
                <li className="flex gap-4 items-start"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-blue-200">4</span> حدد الصف والفصل الدراسي المطلوب</li>
                <li className="flex gap-4 items-start"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-blue-200">5</span> اضغط على زر "عرض"</li>
                <li className="flex gap-4 items-start flex-col">
                  <div className="flex gap-4 items-start">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-blue-200">6</span> 
                    <span>يجب توفر إضافة "مدرستي بلس" لتحميل الملف</span>
                  </div>
                  <a href="https://chromewebstore.google.com/detail/maogiolhkdhjobnlobpkcpnmamnmilno?utm_source=item-share-cb" target="_blank" className="mr-11 mt-2 bg-blue-700 text-white px-4 py-1.5 rounded-xl text-[10px] hover:bg-blue-600 transition-all font-black inline-block shadow-md">تحميل الإضافة ➜</a>
                </li>
                <li className="flex gap-4 items-start"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-blue-200">7</span> حمل ملفات جميع الفصول واحفظها في مجلد واحد لسهولة الرفع</li>
              </ol>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl border-2 border-slate-300 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-3 h-full bg-teal-700"></div>
              <h4 className="font-black text-teal-800 dark:text-teal-500 mb-8 flex items-center gap-4 text-2xl">
                <span className="text-3xl">💡</span> ملاحظة المعالجة:
              </h4>
              <div className="space-y-6">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                  <h5 className="font-black text-slate-900 dark:text-white mb-4 text-lg">المنطق البرمجي الجديد (حسب طلبك):</h5>
                  <div className="flex gap-4 justify-center">
                    <div className="bg-emerald-100 dark:bg-emerald-900/40 p-4 rounded-2xl text-center border border-emerald-200 flex-1">
                      <span className="text-2xl block">0</span>
                      <span className="text-[10px] font-black text-emerald-700">تم الرصد</span>
                    </div>
                    <div className="bg-rose-100 dark:bg-rose-900/40 p-4 rounded-2xl text-center border border-rose-200 flex-1">
                      <span className="text-2xl block">1</span>
                      <span className="text-[10px] font-black text-rose-700">لم يرصد</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                  <h5 className="font-black text-slate-900 dark:text-white mb-2 text-sm">مثال تنسيق ملف المعلمين:</h5>
                  <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                    <p className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1"><span>اسم المعلم</span> <span>خالد الشمري</span></p>
                    <p className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1"><span>الصف</span> <span>أول ثانوي</span></p>
                    <p className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1"><span>المادة</span> <span>الكيمياء</span></p>
                    <p className="flex justify-between"><span>الفصل</span> <span>1</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={`mx-auto px-6 space-y-12 pb-24 ${activeTab === 'analytics' ? 'max-w-[100%]' : 'max-w-[98%]'}`}>
        <section 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleRasedFiles(e.dataTransfer.files); }}
          className={`no-print p-10 md:p-16 rounded-[4rem] shadow-2xl border-4 border-dashed transition-all duration-500 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800'}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-6">
              <label className="flex items-center gap-4 text-lg font-black text-slate-950 dark:text-white">
                <span className="bg-blue-800 p-3 rounded-2xl text-white shadow-xl border border-blue-600">📁</span> رفع ملفات رصد نظام نور
              </label>
              <input type="file" multiple onChange={(e) => handleRasedFiles(e.target.files)} className="block w-full text-sm file:py-4 file:px-10 file:rounded-2xl file:border-0 file:bg-blue-800 file:text-white file:font-black cursor-pointer bg-slate-100 dark:bg-slate-800 rounded-3xl p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors" />
            </div>
            <div className="space-y-6">
              <label className="flex items-center gap-4 text-lg font-black text-slate-950 dark:text-white">
                <span className="bg-teal-700 p-3 rounded-2xl text-white shadow-xl border border-teal-600">👨‍🏫</span> رفع ملف بيانات المعلمين
              </label>
              <input type="file" onChange={handleTeacherFile} className="block w-full text-sm file:py-4 file:px-10 file:rounded-2xl file:border-0 file:bg-teal-700 file:text-white file:font-black cursor-pointer bg-slate-100 dark:bg-slate-800 rounded-3xl p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-teal-400 transition-colors" />
            </div>
          </div>

          <div className="mt-14 pt-14 border-t-2 border-slate-200 dark:border-slate-800 flex flex-wrap justify-center items-center gap-8">
            <div className="flex bg-slate-200 dark:bg-slate-800 p-2 rounded-[2.5rem] shadow-inner border-2 border-slate-300 dark:border-slate-700">
              {(['dashboard', 'analytics', 'reports'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-10 py-4 rounded-[2rem] font-black text-sm transition-all duration-300 ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-400 shadow-2xl scale-105' : 'text-slate-600 hover:text-slate-900'}`}>{tab === 'dashboard' ? '📊 لوحة التحكم' : tab === 'analytics' ? '📈 التحليلات' : '📄 التقارير'}</button>
              ))}
            </div>
            <div className="flex bg-slate-200 dark:bg-slate-800 p-2 rounded-[2.5rem] shadow-inner border-2 border-slate-300 dark:border-slate-700">
              {(['أولى', 'ثانية', 'both'] as const).map(p => (
                <button key={p} onClick={() => setSelectedPeriod(p)} className={`px-8 py-4 rounded-[2rem] font-black text-sm transition-all duration-300 ${selectedPeriod === p ? 'bg-white dark:bg-slate-700 text-indigo-800 shadow-2xl scale-105' : 'text-slate-600 hover:text-slate-900'}`}>{p === 'أولى' ? 'ف1' : p === 'ثانية' ? 'ف2' : 'شامل'}</button>
              ))}
            </div>
            <button onClick={clearAllData} className="px-10 py-4 rounded-3xl bg-rose-100 dark:bg-rose-900/20 text-rose-800 font-black text-sm hover:bg-rose-200 transition-all border-2 border-rose-200">🗑️ مسح الأرشيف</button>
          </div>
        </section>

        {!hasData && !isProcessing && (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[4rem] border-2 border-slate-300 dark:border-slate-800 shadow-2xl opacity-90 max-w-6xl mx-auto">
            <div className="text-8xl mb-10 drop-shadow-lg">📂</div>
            <h3 className="text-3xl font-black mb-4 text-slate-950 dark:text-white">لا توجد بيانات للمعالجة</h3>
            <p className="text-lg font-bold text-slate-600 dark:text-slate-400">يرجى رفع ملفات الرصد المستخرجة من نظام نور للبدء بالتحليل التلقائي</p>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl max-w-6xl mx-auto border-2 border-slate-300 dark:border-slate-800">
            <div className="animate-spin rounded-full h-24 w-24 border-t-8 border-blue-800 mx-auto mb-10 shadow-[0_0_20px_rgba(30,64,175,0.4)]"></div>
            <p className="font-black text-3xl text-slate-950 dark:text-white animate-pulse">جاري فحص ومعالجة البيانات...</p>
          </div>
        )}

        {hasData && !isProcessing && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {activeTab === 'dashboard' && (
              <div className="space-y-20">
                <Dashboard rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <SummaryTables rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <TrackingTables rasedSummary={rasedSummary} period={selectedPeriod} />
              </div>
            )}
            {activeTab === 'analytics' && <AdvancedAnalytics rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
            {activeTab === 'reports' && (
               <div className="space-y-20">
                <PremiumReports rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
               </div>
            )}
          </div>
        )}
      </main>
      <footer className="max-w-[98%] mx-auto mt-24 pb-20 text-center no-print border-t-2 border-slate-300 dark:border-slate-800">
        <div className="pt-16 flex flex-col items-center gap-6">
          <p className="text-slate-950 dark:text-slate-300 text-3xl font-bold">
            تم التطوير بواسطة <span className="bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent font-black">ياسر الهذلي</span>
          </p>
          <p className="text-slate-600 text-xs font-black uppercase tracking-[0.5em] opacity-60">نظام إدارة الرصد المدرسي المتكامل • 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
