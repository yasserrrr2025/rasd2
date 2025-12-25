
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
      <header className="max-w-7xl mx-auto pt-16 pb-12 px-6 no-print text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-950">نظام متابعة رصد المواد</h1>
        <p className="text-slate-500 font-bold mb-8">تحليل رصد درجات الفترتين بذكاء ودقة</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => setShowInstructions(!showInstructions)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-sm">{showInstructions ? 'إغلاق التعليمات' : 'دليل الاستخدام ℹ️'}</button>
          <a href="https://chromewebstore.google.com/detail/maogiolhkdhjobnlobpkcpnmamnmilno" target="_blank" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-sm">إضافة مدرستي بلس ➜</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24 space-y-10">
        <section className="no-print bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-black">رفع ملفات رصد نظام نور:</label>
              <input type="file" multiple onChange={(e) => handleRasedFiles(e.target.files)} className="block w-full text-xs file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-black bg-slate-50 rounded-2xl p-2 border-2 border-dashed" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black">رفع ملف بيانات المعلمين:</label>
              <input type="file" onChange={handleTeacherFile} className="block w-full text-xs file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white file:font-black bg-slate-50 rounded-2xl p-2 border-2 border-dashed" />
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-6">
            <div className="flex bg-slate-100 p-1.5 rounded-xl border">
              {(['dashboard', 'analytics', 'reports'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                  {tab === 'dashboard' ? '📊 لوحة الإنجاز' : tab === 'analytics' ? '📈 التحليل البصري' : '📄 كشوف المتابعة'}
                </button>
              ))}
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-xl border">
              {(['أولى', 'ثانية', 'both'] as const).map(p => (
                <button key={p} onClick={() => setSelectedPeriod(p)} className={`px-6 py-2 rounded-lg font-black text-xs ${selectedPeriod === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{p === 'أولى' ? 'ف1' : p === 'ثانية' ? 'ف2' : 'الفترتين'}</button>
              ))}
            </div>
            <button onClick={clearAllData} className="px-6 py-2 bg-rose-50 text-rose-600 font-black text-xs rounded-xl border border-rose-100 hover:bg-rose-100">مسح البيانات</button>
          </div>
        </section>

        {isProcessing && <div className="text-center py-20 font-black text-xl animate-pulse">جاري معالجة الملفات...</div>}

        {hasData && !isProcessing && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* ترتيب الطباعة المطلوب */}
            {activeTab === 'dashboard' && (
              <>
                <Dashboard rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <PremiumReports rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <RankingTable rasedSummary={rasedSummary} period={selectedPeriod} />
                <SummaryTables rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />
                <TrackingTables rasedSummary={rasedSummary} period={selectedPeriod} />
              </>
            )}
            {activeTab === 'analytics' && <AdvancedAnalytics rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
            {activeTab === 'reports' && <PremiumReports rasedSummary={rasedSummary} teacherMapping={teacherMapping} period={selectedPeriod} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
