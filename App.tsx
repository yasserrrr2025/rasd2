
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
    <div className="min-h-screen bg-slate-50">
      <header className="max-w-7xl mx-auto pt-12 pb-8 px-6 no-print text-center relative">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black mb-4 border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          النسخة الاحترافية الموحدة v3.5
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-900">نظام رصد المواد</h1>
        <p className="text-slate-600 text-lg font-bold max-w-2xl mx-auto mb-8">تحليل ذكي واقتصادي لتقارير نظام نور لخدمة الميدان التعليمي</p>
        
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-lg"
        >
          {showInstructions ? 'إخفاء الدليل ▲' : 'خطوات استخراج الملفات؟ ▼'}
        </button>

        {showInstructions && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-right max-w-5xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600"></div>
              <h4 className="font-black text-blue-700 mb-6 flex items-center gap-3 text-xl">
                <span>ℹ️</span> خطوات استخراج ملفات الرصد:
              </h4>
              <ol className="text-sm space-y-4 text-slate-700 font-bold">
                <li className="flex gap-3 items-start"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs">1</span> من نظام نور، توجه إلى قائمة "التقارير"</li>
                <li className="flex gap-3 items-start"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs">2</span> اختر "تقارير نظام المسارات"</li>
                <li className="flex gap-3 items-start"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs">3</span> اختر تقرير "متابعة رصد الدرجات"</li>
                <li className="flex gap-3 items-start"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs">4</span> حدد الصف والفصل الدراسي المطلوب</li>
                <li className="flex gap-3 items-start"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs">5</span> اضغط على زر "عرض"</li>
                <li className="flex gap-3 items-start flex-col">
                  <div className="flex gap-3 items-start">
                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs">6</span> 
                    <span>يجب توفر إضافة "مدرستي بلس" لتحميل الملف</span>
                  </div>
                  <a href="https://chromewebstore.google.com/detail/maogiolhkdhjobnlobpkcpnmamnmilno?utm_source=item-share-cb" target="_blank" className="mr-9 mt-2 bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] hover:bg-blue-700 transition-all font-black inline-block">تحميل الإضافة ➜</a>
                </li>
                <li className="flex gap-3 items-start"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs">7</span> حمل جميع الفصول واحفظها في مجلد واحد للرفع</li>
              </ol>
            </div>
            
            <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center text-center">
              <span className="text-4xl mb-4 block">⚖️</span>
              <h4 className="text-xl font-black text-slate-900 mb-2">منطق الرصد المعتمد</h4>
              <p className="text-slate-500 text-sm mb-6">يقوم النظام بتمييز الطلاب بناءً على القيم الرقمية</p>
              <div className="flex gap-4 justify-center">
                <div className="bg-emerald-50 p-4 rounded-2xl flex-1 border border-emerald-100">
                  <span className="text-2xl font-black text-emerald-700 block">0</span>
                  <span className="text-[10px] font-bold">مكتمل</span>
                </div>
                <div className="bg-rose-50 p-4 rounded-2xl flex-1 border border-rose-100">
                  <span className="text-2xl font-black text-rose-700 block">1</span>
                  <span className="text-[10px] font-bold">متبقي</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24 space-y-10">
        <section className="no-print glass-card p-8 rounded-[2rem] border border-slate-200 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-black text-slate-700">
                <span className="bg-blue-600 p-2 rounded-lg text-white text-xs">📁</span> رفع ملفات رصد نور
              </label>
              <input type="file" multiple onChange={(e) => handleRasedFiles(e.target.files)} className="block w-full text-xs file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-black cursor-pointer bg-slate-50 rounded-2xl p-2 border-2 border-dashed border-slate-200 hover:border-blue-500 transition-all" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm font-black text-slate-700">
                <span className="bg-emerald-600 p-2 rounded-lg text-white text-xs">👨‍🏫</span> ملف المعلمين (إكسل)
              </label>
              <input type="file" onChange={handleTeacherFile} className="block w-full text-xs file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white file:font-black cursor-pointer bg-slate-50 rounded-2xl p-2 border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-all" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-center gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {(['dashboard', 'analytics', 'reports'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{tab === 'dashboard' ? '📊 لوحة القيادة' : tab === 'analytics' ? '📈 التحليلات' : '📄 التقارير'}</button>
              ))}
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {(['أولى', 'ثانية', 'both'] as const).map(p => (
                <button key={p} onClick={() => setSelectedPeriod(p)} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${selectedPeriod === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{p === 'أولى' ? 'ف1' : p === 'ثانية' ? 'ف2' : 'شامل'}</button>
              ))}
            </div>
            <button onClick={clearAllData} className="px-6 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-black text-xs hover:bg-rose-100 transition-all border border-rose-100">🗑️ مسح الأرشيف</button>
          </div>
        </section>

        {isProcessing && (
          <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
            <p className="font-black text-slate-600">جاري معالجة البيانات...</p>
          </div>
        )}

        {hasData && !isProcessing && (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'dashboard' && (
              <div className="space-y-12">
                <Dashboard rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <SummaryTables rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <TrackingTables rasedSummary={rasedSummary} period={selectedPeriod} />
              </div>
            )}
            {activeTab === 'analytics' && <AdvancedAnalytics rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
            {activeTab === 'reports' && <PremiumReports rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
          </div>
        )}
      </main>
      
      <footer className="no-print py-10 text-center border-t border-slate-200">
        <p className="text-slate-500 font-bold">
          نظام رصد المواد • تطوير <span className="text-slate-900 font-black">ياسر الهذلي</span> • 2025
        </p>
      </footer>
    </div>
  );
};

export default App;
