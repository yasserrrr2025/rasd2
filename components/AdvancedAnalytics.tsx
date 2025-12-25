
import React, { useState, useMemo, useEffect } from 'react';
import { RasedSummary, Period, TeacherMapping } from '../types';

interface AdvancedAnalyticsProps {
  rasedSummary: RasedSummary;
  teacherMapping: TeacherMapping;
  period: Period;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ rasedSummary, teacherMapping, period }) => {
  const [snapshot, setSnapshot] = useState<RasedSummary | null>(() => {
    const saved = localStorage.getItem('rased_snapshot');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!snapshot && Object.keys(rasedSummary).length > 0) {
      localStorage.setItem('rased_snapshot', JSON.stringify(rasedSummary));
      setSnapshot(rasedSummary);
    }
  }, [rasedSummary, snapshot]);

  const heatmapData = useMemo(() => {
    const classes: string[] = [];
    const subjectsSet = new Set<string>();
    const data: Record<string, Record<string, { current: number; old?: number }>> = {};
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        const className = `${saf} - ${fasel}`;
        classes.push(className);
        data[className] = {};
        
        targetPeriods.forEach(p => {
          const pData = rasedSummary[saf][fasel][p];
          if (!pData) return;
          
          Object.keys(pData).forEach(sub => {
            subjectsSet.add(sub);
            const currentVal = pData[sub].percentage;
            
            let oldVal: number | undefined = undefined;
            if (snapshot?.[saf]?.[fasel]?.[p]?.[sub]) {
              oldVal = snapshot[saf][fasel][p][sub].percentage;
            }

            data[className][sub] = { 
              current: currentVal, 
              old: oldVal 
            };
          });
        });
      }
    }
    return { 
      classList: classes, 
      subjectList: Array.from(subjectsSet).sort(), 
      values: data 
    };
  }, [rasedSummary, period, snapshot]);

  const getHeatStyles = (val: number | undefined) => {
    if (val === undefined) return 'bg-slate-200 dark:bg-slate-800 text-slate-500';
    if (val === 100) return 'bg-emerald-700 text-white';
    if (val >= 80) return 'bg-emerald-600 text-white';
    if (val >= 50) return 'bg-amber-500 text-slate-950 font-black';
    if (val >= 25) return 'bg-orange-600 text-white';
    return 'bg-rose-700 text-white';
  };

  const renderTrend = (current: number, old?: number) => {
    if (old === undefined || current === old) return null;
    const diff = Number((current - old).toFixed(1));
    if (diff > 0) return <span className="text-[11px] font-black text-white bg-black/20 rounded-md px-1.5 py-0.5 shadow-sm">↑ {diff}%</span>;
    return <span className="text-[11px] font-black text-white bg-black/20 rounded-md px-1.5 py-0.5 shadow-sm">↓ {Math.abs(diff)}%</span>;
  };

  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'الفترتين الأولى والثانية';

  return (
    <div className="animate-in fade-in duration-700 w-full px-0">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-8 px-6">
        <div className="flex items-center gap-7">
          <span className="bg-blue-800 p-5 rounded-[2rem] text-3xl shadow-2xl text-white border-2 border-blue-400/20">📊</span>
          <div>
            <h3 className="text-4xl font-black text-slate-950 dark:text-white tracking-tight">خريطة الإنجاز والمتابعة الميدانية</h3>
            <p className="text-slate-800 dark:text-slate-400 text-lg font-bold mt-2">عرض موسّع وشامل لنتائج {periodLabel}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-5 p-5 bg-white dark:bg-slate-800/80 rounded-[2.5rem] border-2 border-slate-300 dark:border-slate-700 shadow-2xl no-print">
          <div className="flex gap-4">
            <LegendItem color="bg-rose-700" label="تأخر كبير" />
            <LegendItem color="bg-amber-500" label="تقدم متوسط" />
            <LegendItem color="bg-emerald-700" label="رصد مكتمل" />
          </div>
          <button 
            onClick={() => window.print()}
            className="bg-slate-950 text-white px-10 py-3 rounded-2xl text-sm font-black hover:bg-blue-800 transition-all shadow-xl border border-slate-800"
          >
            ⎙ طباعة الخريطة بالكامل
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto bg-white dark:bg-slate-950 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border-y-2 border-slate-300 dark:border-slate-800">
        <table className="w-full text-center border-collapse table-fixed min-w-[2000px]">
          <thead>
            <tr className="bg-slate-200 dark:bg-slate-800">
              <th className="p-8 border-b-4 border-slate-300 dark:border-slate-700 text-xl font-black sticky right-0 z-40 bg-slate-300 dark:bg-slate-800 shadow-[10px_0_30px_rgba(0,0,0,0.1)] w-64 text-slate-950 dark:text-white border-l-2 border-slate-400/30">الفصل الدراسي / المادة</th>
              {heatmapData.subjectList.map((sub) => (
                <th key={sub} className="p-5 border-b-4 border-slate-300 dark:border-slate-700 text-[12px] font-black text-slate-950 dark:text-slate-300">
                  <div className="rotate-0 md:rotate-[-35deg] whitespace-normal h-28 flex items-center justify-center text-center leading-tight px-2">
                    {sub}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.classList.map((cls) => {
              const parts = cls.split(' - ');
              const saf = parts[0];
              const fasel = parts[1];

              return (
                <tr key={cls} className="group/row">
                  <td className="p-7 bg-slate-100 dark:bg-slate-900 font-black text-lg sticky right-0 z-30 text-right border-l-4 border-slate-400 dark:border-slate-800 shadow-2xl group-hover/row:bg-slate-300 dark:group-hover/row:bg-slate-800 transition-colors w-64 text-slate-950 dark:text-white">
                    {cls}
                  </td>
                  {heatmapData.subjectList.map(sub => {
                    const valObj = heatmapData.values[cls][sub];
                    const currentVal = valObj?.current;
                    const oldVal = valObj?.old;
                    const teachers = teacherMapping[saf]?.[fasel]?.[sub] || [];
                    
                    return (
                      <td 
                        key={`${cls}-${sub}`} 
                        className={`
                          relative p-5 border-2 border-slate-300 dark:border-slate-800 transition-all duration-300
                          hover:z-50 hover:scale-[1.25] hover:shadow-[0_25px_70px_rgba(0,0,0,0.5)] hover:rounded-3xl cursor-default
                          ${getHeatStyles(currentVal)}
                        `}
                      >
                        <div className="flex flex-col items-center justify-center gap-3 min-h-[90px]">
                          <span className="text-[22px] font-black leading-none tabular-nums drop-shadow-md">{currentVal !== undefined ? `${currentVal}%` : '-'}</span>
                          {renderTrend(currentVal || 0, oldVal)}
                          {teachers.length > 0 && (
                            <span className="text-[11px] font-black mt-2 truncate max-w-[140px] text-center bg-black/10 dark:bg-white/20 rounded-lg px-3 py-1 border border-white/10" title={teachers.join(' ، ')}>
                              {teachers[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-4 px-4 py-1">
    <div className={`w-6 h-6 rounded-xl ${color} shadow-xl border-2 border-white/30`}></div>
    <span className="text-sm font-black text-slate-950 dark:text-slate-200">{label}</span>
  </div>
);

export default AdvancedAnalytics;
