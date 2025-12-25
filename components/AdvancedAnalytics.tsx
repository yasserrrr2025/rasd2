
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
    if (val === undefined) return 'bg-slate-100 text-slate-300';
    if (val === 100) return 'bg-emerald-600 text-white font-black';
    if (val >= 85) return 'bg-emerald-500/80 text-white font-bold';
    if (val >= 60) return 'bg-amber-400 text-amber-900 font-bold';
    if (val >= 30) return 'bg-orange-500 text-white font-bold';
    return 'bg-rose-600 text-white font-bold';
  };

  const renderTrend = (current: number, old?: number) => {
    if (old === undefined || current === old) return null;
    const diff = Number((current - old).toFixed(1));
    return (
      <div className={`text-[10px] px-1.5 py-0.5 rounded-md mt-1 font-black shadow-sm flex items-center gap-1 ${diff > 0 ? 'bg-emerald-900/20 text-emerald-900' : 'bg-rose-900/20 text-rose-900'}`}>
        {diff > 0 ? '▲' : '▼'} {Math.abs(diff)}%
      </div>
    );
  };

  const periodLabel = period === 'أولى' ? 'الفترة الأولى' : period === 'ثانية' ? 'الفترة الثانية' : 'الفترتين الشاملة';

  return (
    <div className="animate-in fade-in duration-500 w-full">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 px-6 no-print">
        <div className="flex items-center gap-5">
          <span className="bg-slate-900 p-4 rounded-2xl text-2xl text-white shadow-lg">🗺️</span>
          <div>
            <h3 className="text-2xl font-black text-slate-900">خريطة الإنجاز الميدانية</h3>
            <p className="text-slate-500 text-sm font-bold mt-1">تحليل بصري شامل لنسب الرصد في {periodLabel}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex gap-4">
            <LegendItem color="bg-rose-600" label="متأخر" />
            <LegendItem color="bg-amber-400" label="متوسط" />
            <LegendItem color="bg-emerald-600" label="مكتمل" />
          </div>
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-md"
          >
            ⎙ طباعة الخريطة
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto bg-white border-y border-slate-200 shadow-sm">
        <table className="w-full text-center border-collapse table-auto min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-4 border-b border-slate-200 text-sm font-black sticky right-0 z-40 bg-slate-100 shadow-md w-48 text-slate-900">المادة / الفصل</th>
              {heatmapData.subjectList.map((sub) => (
                <th key={sub} className="p-2 border-b border-slate-200 text-[10px] font-black text-slate-600 vertical-header">
                  <div className="flex items-center justify-center h-32 leading-tight">
                    <span className="whitespace-nowrap -rotate-45 transform origin-center inline-block w-32">
                      {sub}
                    </span>
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
                <tr key={cls} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 bg-slate-50 font-black text-xs sticky right-0 z-30 text-right border-l border-slate-200 shadow-sm w-48 text-slate-800">
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
                          p-2 border border-slate-200 transition-all duration-200 min-w-[80px]
                          ${getHeatStyles(currentVal)}
                        `}
                      >
                        <div className="flex flex-col items-center justify-center py-2">
                          <span className="text-sm font-black drop-shadow-sm">{currentVal !== undefined ? `${Math.round(currentVal)}%` : '-'}</span>
                          {renderTrend(currentVal || 0, oldVal)}
                          {teachers.length > 0 && (
                            <div className="text-[8px] mt-2 opacity-80 font-bold truncate max-w-[70px]" title={teachers.join('، ')}>
                              {teachers[0].split(' ').slice(0, 2).join(' ')}
                            </div>
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
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 rounded-md ${color}`}></div>
    <span className="text-[10px] font-black text-slate-600">{label}</span>
  </div>
);

export default AdvancedAnalytics;
