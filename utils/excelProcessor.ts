
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
        
        /**
         * تحديث مواقع البيانات بناءً على توجيه المستخدم:
         * الصف في الخلية A7 (المؤشر [6][0])
         * الفصل في الخلية A14 (المؤشر [13][0])
         * الخلايا مدموجة، لذا القيمة ستكون في الخلية الأولى من الدمج.
         */
        let safRaw = jsonData[6]?.[0] || "غير معروف";
        let faselRaw = jsonData[13]?.[0] || "غير معروف";
        
        // تنظيف النصوص من المسميات الزائدة إذا وجدت داخل الخلية
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
  if (data.length < 15) return currentSummary;

  // البحث عن صف العناوين (المواد الدراسية)
  let headersIdx = 10;
  for (let i = 8; i < 25; i++) {
    if (data[i]?.some(cell => {
      const s = normalizeString(cell);
      return s.includes("الفترة") || s.includes("الطالب") || s.includes("الاسم");
    })) {
      headersIdx = i;
      break;
    }
  }

  const headers = data[headersIdx];
  const rows = data.slice(headersIdx + 1);

  // تحديد مواقع الأعمدة الأساسية
  let periodIdx = headers.findIndex(h => normalizeString(h).includes("الفترة"));
  let nameIdx = headers.findIndex(h => normalizeString(h).includes("الطالب") || normalizeString(h).includes("الاسم"));

  if (periodIdx === -1 || nameIdx === -1) return currentSummary;

  // استخراج الصف والفصل من المواقع المحددة (A7 و A14)
  const saf = normalizeString(data[6]?.[0]).replace(/الصف\s*:?/g, "").trim();
  const fasel = normalizeString(data[13]?.[0]).replace(/الفصل\s*:?/g, "").trim();

  if (!currentSummary[saf]) currentSummary[saf] = {};
  if (!currentSummary[saf][fasel]) currentSummary[saf][fasel] = {};

  const excluded = ["م", "السلوك", "المواظبة", "الاسم", "الطالب", "الفترة", "رقم الهوية"];
  let currentStudentName = "";

  rows.forEach(row => {
    let nameVal = normalizeString(row[nameIdx]);
    
    if (nameVal) {
      // إزالة رقم الهوية وأي أرقام طويلة (بما في ذلك السالبة) نهائياً
      // النمط يعالج "رقم الهوية: -2299094157" أو الأرقام الطويلة المجردة
      nameVal = nameVal.replace(/رقم\s*الهوية\s*:?\s*-?\d+/g, "");
      nameVal = nameVal.replace(/-?\d{8,}/g, ""); // حذف أي تسلسل رقمي طويل (8 أرقام فأكثر)
      nameVal = nameVal.replace(/الاسم\s*:?/g, "");
      nameVal = nameVal.trim();

      if (nameVal !== "" && nameVal.length > 3) {
        currentStudentName = nameVal;
      }
    }

    let periodValRaw = normalizeString(row[periodIdx]);
    let periodVal = "";
    
    if (periodValRaw.includes("أولى")) periodVal = "أولى";
    else if (periodValRaw.includes("ثانية")) periodVal = "ثانية";

    if (!periodVal || !currentStudentName) return;

    if (!currentSummary[saf][fasel][periodVal]) {
      currentSummary[saf][fasel][periodVal] = {};
    }

    headers.forEach((subj, sIdx) => {
      const subjectName = normalizeString(subj);
      if (!subjectName || excluded.some(ex => subjectName.includes(ex))) return;

      if (!currentSummary[saf][fasel][periodVal][subjectName]) {
        currentSummary[saf][fasel][periodVal][subjectName] = {
          rasidCount: 0,
          lamRasidCount: 0,
          percentage: 0,
          studentRasidStatus: {},
          studentsList: []
        };
      }

      const val = row[sIdx];
      // المنطق المعتمد: 0 = تم الرصد، 1 = لم يتم الرصد
      const isRasid = (val === 0 || val === "0");
      const isLamRasid = (val === 1 || val === "1");

      if (isRasid || isLamRasid) {
        const subData = currentSummary[saf][fasel][periodVal][subjectName];
        if (!subData.studentsList.includes(currentStudentName)) {
          subData.studentsList.push(currentStudentName);
        }
        
        subData.studentRasidStatus[currentStudentName] = isRasid;
        
        if (isRasid) {
          subData.rasidCount++;
        } else {
          subData.lamRasidCount++;
        }
      }
    });
  });

  // تحديث الحسابات النهائية للنسب المئوية
  for (const p in currentSummary[saf][fasel]) {
    for (const s in currentSummary[saf][fasel][p]) {
      const d = currentSummary[saf][fasel][p][s];
      const total = d.rasidCount + d.lamRasidCount;
      d.percentage = total > 0 ? Number(((d.rasidCount / total) * 100).toFixed(1)) : 0;
    }
  }

  return currentSummary;
};
