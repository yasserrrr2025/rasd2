
import * as XLSX from 'xlsx';
import { RasedSummary, SubjectData } from '../types';

export const normalizeString = (str: any): string => {
  if (str === null || str === undefined) return "";
  return str.toString().replace(/\u00A0/g, " ").trim();
};

export const processRasedFile = async (file: File): Promise<{ saf: string; fasel: string; data: any[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // الأولوية لـ A7 و A14 للملفات الرسمية، ثم البحث البديل للملفات الأخرى
        let safRaw = jsonData[6]?.[0] || jsonData[2]?.[1] || "غير معروف";
        let faselRaw = jsonData[13]?.[0] || jsonData[8]?.[1] || "غير معروف";
        
        let saf = normalizeString(safRaw).replace(/الصف\s*:?/g, "").trim();
        let fasel = normalizeString(faselRaw).replace(/الفصل\s*:?/g, "").trim();
        
        resolve({ saf, fasel, data: jsonData });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const extractSummaryData = (data: any[][], currentSummary: RasedSummary): RasedSummary => {
  if (data.length < 8) return currentSummary;

  let headersIdx = -1;
  let periodIdx = -1;
  let nameIdx = -1;

  // مسح ديناميكي شامل للبحث عن العناوين في أول 35 صف
  for (let i = 0; i < Math.min(data.length, 35); i++) {
    const row = data[i] || [];
    const pIdx = row.findIndex(cell => {
      const s = normalizeString(cell);
      return s.includes("الفترة") || s === "أولى" || s === "ثانية";
    });
    
    if (pIdx !== -1) {
      headersIdx = i;
      periodIdx = pIdx;
      // البحث عن عمود الاسم بجانب الفترة أو البحث عن كلمة "طالب"
      nameIdx = row.findIndex(cell => {
        const s = normalizeString(cell);
        return s.includes("اسم") || s.includes("الطالب");
      });
      if (nameIdx === -1) nameIdx = periodIdx + 1; 
      break;
    }
  }

  if (periodIdx === -1) return currentSummary;

  const headers = data[headersIdx] || [];
  const rows = data.slice(headersIdx + 1);

  const saf = normalizeString(data[6]?.[0] || data[2]?.[1]).replace(/الصف\s*:?/g, "").trim();
  const fasel = normalizeString(data[13]?.[0] || data[8]?.[1]).replace(/الفصل\s*:?/g, "").trim();

  if (!currentSummary[saf]) currentSummary[saf] = {};
  if (!currentSummary[saf][fasel]) currentSummary[saf][fasel] = {};

  const excludedKeywords = ["م", "السلوك", "المواظبة", "الاسم", "الطالب", "الفترة", "رقم الهوية", "السجل", "رقم"];
  let lastValidName = "";

  rows.forEach(row => {
    // استخراج الاسم كاملاً مع تنظيف السجل المدني فقط
    let rawName = normalizeString(row[nameIdx]);
    if (rawName) {
      // حذف السجل المدني المكون من 10 أرقام وما شابه، مع الحفاظ على باقي النص (الاسم)
      rawName = rawName.replace(/رقم\s*الهوية\s*:?\s*-?\d+/g, "");
      rawName = rawName.replace(/-?\d{9,}/g, ""); 
      rawName = rawName.replace(/الاسم\s*:?/g, "").trim();
      
      if (rawName.length > 3) lastValidName = rawName;
    }

    let pRaw = normalizeString(row[periodIdx]);
    let pVal = pRaw.includes("أولى") ? "أولى" : pRaw.includes("ثانية") ? "ثانية" : "";

    if (!pVal || !lastValidName) return;

    if (!currentSummary[saf][fasel][pVal]) currentSummary[saf][fasel][pVal] = {};

    headers.forEach((subj, sIdx) => {
      const subName = normalizeString(subj);
      if (!subName || excludedKeywords.some(ex => subName.includes(ex))) return;
      if (sIdx === nameIdx || sIdx === periodIdx) return;

      if (!currentSummary[saf][fasel][pVal][subName]) {
        currentSummary[saf][fasel][pVal][subName] = {
          rasidCount: 0,
          lamRasidCount: 0,
          percentage: 0,
          studentRasidStatus: {},
          studentsList: []
        };
      }

      const val = row[sIdx];
      // 0 = تم الرصد، 1 = متبقي
      const isRasid = (val === 0 || val === "0");
      const isLamRasid = (val === 1 || val === "1");

      if (isRasid || isLamRasid) {
        const subData = currentSummary[saf][fasel][pVal][subName];
        if (!subData.studentsList.includes(lastValidName)) {
          subData.studentsList.push(lastValidName);
        }
        subData.studentRasidStatus[lastValidName] = isRasid;
        if (isRasid) subData.rasidCount++;
        else subData.lamRasidCount++;
      }
    });
  });

  // حساب النسب المئوية
  for (const p in currentSummary[saf][fasel]) {
    for (const s in currentSummary[saf][fasel][p]) {
      const d = currentSummary[saf][fasel][p][s];
      const total = d.rasidCount + d.lamRasidCount;
      d.percentage = total > 0 ? Number(((d.rasidCount / total) * 100).toFixed(1)) : 0;
    }
  }

  return currentSummary;
};
