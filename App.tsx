
import React, { useState, useEffect } from 'react';
import { RasedSummary, TeacherMapping, Period } from './types';
import { processRasedFile, extractSummaryData, normalizeString } from './utils/excelProcessor';
import * as XLSX from 'xlsx';
import Dashboard from './components/Dashboard';
import SummaryTables from './components/SummaryTables';
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
  const [showInstructions, setShowInstructions] = useState(false);

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
    <div className="min-h-screen">
      {/* Premium Header */}
      <header className="max-w-7xl mx-auto pt-20 pb-16 px-6 no-print text-center">
        <div className="flex flex-col items-center">
          <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-2xl shadow-blue-200 mb-8 animate-bounce duration-[3000ms]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-950">نظام متابعة رصد المواد للمرحلة الثانوية</h1>
          <p className="text-slate-500 text-xl font-bold max-w-2xl mx-auto mb-12 leading-relaxed opacity-80">المنصة الاحترافية لتحليل تقارير "نور" بذكاء رقمي متطور</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowInstructions(!showInstructions)}
              className={`px-12 py-4 rounded-2xl text-sm font-black transition-all shadow-xl ${showInstructions ? 'bg-slate-200 text-slate-700' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
            >
              {showInstructions ? 'إغلاق الدليل' : 'دليل استخراج التقارير ℹ️'}
            </button>
            <a 
              href="https://chromewebstore.google.com/detail/maogiolhkdhjobnlobpkcpnmamnmilno?utm_source=item-share-cb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl flex items-center gap-3"
            >
              تحميل الإضافة ➜
            </a>
          </div>
        </div>

        {showInstructions && (
          <div className="mt-16 text-right max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white p-1 md:p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden">
              <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-10 border border-slate-100 flex items-center gap-6">
                <span className="text-4xl">💡</span>
                <div>
                  <h4 className="text-xl font-black text-slate-900">خطوات استخراج ملفات الرصد من نظام نور</h4>
                  <p className="text-slate-500 text-sm font-bold mt-1">اتبع التعليمات التالية للحصول على البيانات بشكل صحيح</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { step: "01", text: "من نظام نور، توجه إلى قائمة 'التقارير'" },
                  { step: "02", text: "اختر 'تقارير نظام المسارات'" },
                  { step: "03", text: "اختر تقرير 'متابعة رصد الدرجات'" },
                  { step: "04", text: "حدد الصف والفصل الدراسي المطلوب" },
                  { step: "05", text: "اضغط على زر 'عرض'" },
                  { step: "06", text: "استخدم إضافة 'مدرستي بلس' لتحميل الملف" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all group">
                    <span className="text-3xl font-black text-slate-100 group-hover:text-blue-100 transition-colors block mb-4">{item.step}</span>
                    <p className="text-sm font-black text-slate-700 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-8 bg-blue-600 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  </div>
                  <div>
                    <h5 className="text-lg font-black italic">ملاحظة هامة جداً</h5>
                    <p className="text-blue-100 text-sm font-bold mt-1">حمل ملفات جميع الفصول واحفظها في مجلد واحد لسهولة الرفع دفعة واحدة</p>
                  </div>
                </div>
                <a 
                  href="https://chromewebstore.google.com/detail/maogiolhkdhjobnlobpkcpnmamnmilno?utm_source=item-share-cb" 
                  target="_blank"
                  className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-2xl"
                >
                  تحميل الإضافة الآن ➜
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Control Center */}
      <main className="max-w-7xl mx-auto px-6 pb-24 space-y-12">
        <section className="no-print bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-black text-slate-900">
                <span className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px]">📁</span> رفع ملفات الرصد (Excel)
              </label>
              <input type="file" multiple onChange={(e) => handleRasedFiles(e.target.files)} className="block w-full text-xs file:py-4 file:px-8 file:rounded-2xl file:border-0 file:bg-blue-600 file:text-white file:font-black cursor-pointer bg-slate-50 rounded-3xl p-3 border-2 border-dashed border-slate-200 hover:border-blue-500 transition-all hover:bg-blue-50/30" />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-black text-slate-900">
                <span className="bg-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px]">👨‍🏫</span> رفع بيانات المعلمين (Excel) <span className="text-emerald-600 font-bold mr-1">(اختياري)</span>
              </label>
              <input type="file" onChange={handleTeacherFile} className="block w-full text-xs file:py-4 file:px-8 file:rounded-2xl file:border-0 file:bg-emerald-600 file:text-white file:font-black cursor-pointer bg-slate-50 rounded-3xl p-3 border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-all hover:bg-emerald-50/30" />
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                <p className="text-[11px] font-black text-emerald-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  متطلبات ملف المعلمين لربط البيانات:
                </p>
                <p className="text-[10px] text-slate-600 font-bold leading-relaxed pr-4">
                  يجب أن يحتوي الملف على الأعمدة بالترتيب التالي: (اسم المعلم، الصف، المادة، الفصل).
                  <br />
                  <span className="text-rose-600">⚠️ ملاحظة حاسمة:</span> يجب أن يتطابق "اسم الصف" (مثلاً: الأول الثانوي) و "اسم المادة" تماماً مع المسميات الموجودة في نظام نور لضمان نجاح عملية الربط التلقائي.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-wrap justify-between items-center gap-6">
            <nav className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200 shadow-inner">
              {(['dashboard', 'analytics', 'reports'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm tab-active' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab === 'dashboard' ? '📊 نظرة عامة' : tab === 'analytics' ? '📈 الخرائط' : '📄 التقارير'}
                </button>
              ))}
            </nav>
            
            <div className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200 shadow-inner">
              {(['أولى', 'ثانية', 'both'] as const).map(p => (
                <button key={p} onClick={() => setSelectedPeriod(p)} className={`px-8 py-3 rounded-xl font-black text-xs transition-all ${selectedPeriod === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{p === 'أولى' ? 'الفترة ف1' : p === 'ثانية' ? 'الفترة ف2' : 'شامل الفترتين'}</button>
              ))}
            </div>

            <button onClick={clearAllData} className="px-8 py-3 rounded-xl bg-rose-50 text-rose-700 font-black text-xs hover:bg-rose-100 border border-rose-200 transition-all">🗑️ مسح الأرشيف</button>
          </div>
        </section>

        {isProcessing && (
          <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-slate-200 animate-pulse">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-r-4 border-r-transparent mx-auto mb-6"></div>
            <p className="font-black text-slate-800 text-xl">جاري معالجة البيانات وبناء التقارير...</p>
            <p className="text-slate-400 font-bold mt-2">لحظات من فضلك</p>
          </div>
        )}

        {hasData && !isProcessing && (
          <div className="space-y-16 animate-in fade-in duration-1000">
            {activeTab === 'dashboard' && (
              <>
                <Dashboard rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <SummaryTables rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <TrackingTables rasedSummary={rasedSummary} period={selectedPeriod} />
              </>
            )}
            {activeTab === 'analytics' && <AdvancedAnalytics rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
            {activeTab === 'reports' && <PremiumReports rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
          </div>
        )}
      </main>

      <footer className="no-print py-16 text-center border-t border-slate-200 bg-white">
        <p className="text-slate-400 font-black text-sm tracking-widest uppercase">
          نظام رصد المواد • إصدار 2025 • هندسة <span className="text-slate-950 underline decoration-blue-500 underline-offset-4">ياسر الهذلي</span>
        </p>
      </footer>
    </div>
  );
};

export default App;
