
import React from 'react';
import { RasedSummary, Period } from '../types';

interface RankingTableProps {
  rasedSummary: RasedSummary;
  period: Period;
}

const RankingTable: React.FC<RankingTableProps> = ({ rasedSummary, period }) => {
  const classesList = React.useMemo(() => {
    let list: any[] = [];
    const targetPeriods = period === 'both' ? ['أولى', 'ثانية'] : [period];

    for (const saf in rasedSummary) {
      for (const fasel in rasedSummary[saf]) {
        let classRasid = 0, classTotal = 0;
        targetPeriods.forEach(p => {
          const periodData = rasedSummary[saf][fasel][p];
          if (!periodData) return;
          for (const subject in periodData) {
            classRasid += periodData[subject].rasidCount;
            classTotal += (periodData[subject].rasidCount + periodData[subject].lamRasidCount);
          }
        });
        if (classTotal > 0) {
          list.push({ name: `${saf} - ${fasel}`, percentage: Number(((classRasid / classTotal) * 100).toFixed(1)) });
        }
      }
    }
    return list.sort((a, b) => b.percentage - a.percentage);
  }, [rasedSummary, period]);

  const getColorClass = (val: number) => val < 75 ? 'color-low' : val < 95 ? 'color-mid' : 'color-high';
  const getBgClass = (val: number) => val < 75 ? 'bg-low' : val < 95 ? 'bg-mid' : 'bg-high';

  if (classesList.length === 0) return null;

  return (
    <div className="print-page">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl print:border-black print-card">
        <h3 className="text-2xl font-black mb-8 border-b pb-4 print:border-black flex items-center gap-3">
          <span className="no-print">🏆</span> ترتيب الفصول حسب نسبة الإنجاز
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 print:grid-cols-2 print:gap-y-6">
          {classesList.map((cls, idx) => (
            <div key={idx} className="print-avoid-break">
              <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black ${idx < 3 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'} print:bg-black print:text-white`}>
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800 text-base print:text-black">{cls.name}</span>
                </div>
                <span className={`font-black ${getColorClass(cls.percentage)}`}>{cls.percentage}%</span>
              </div>
              <div className="progress-container print:border print:border-black">
                <div className={`h-full ${getBgClass(cls.percentage)}`} style={{ width: `${cls.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RankingTable;
