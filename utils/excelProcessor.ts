import * as XLSX from 'xlsx';

// ---------------------------------------------------------
// 1. تعريف الأنواع (Types)
// إذا كانت هذه الأنواع موجودة في ملف منفصل (../types)، يمكنك حذف هذا الجزء واستيرادها.
// وضعتها هنا لضمان عمل الكود فوراً عند النسخ.
// ---------------------------------------------------------

export interface SubjectData {
  rasidCount: number;
  lamRasidCount: number;
  percentage: number;
  studentRasidStatus: { [studentName: string]: boolean }; // true = تم الرصد، false = لم يرصد
  studentsList: string[];
}

export interface RasedSummary {
  [saf: string]: {
    [fasel: string]: {
      [period: string]: {
        [subject: string]: SubjectData;
      };
    };
  };
}

// ---------------------------------------------------------
// 2. الدوال المساعدة (Helpers)
// ---------------------------------------------------------

export const normalizeString = (str: any): string => {
  if (str === null || str === undefined) return "";
  return str.toString().replace(/\u00A0/g, " ").trim();
};

// ---------------------------------------------------------
// 3. دالة معالجة الملف الأولية (Process Rased File)
// ---------------------------------------------------------

export const processRasedFile = async (file: File): Promise<{ saf: string; fasel: string; data: any[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // دالة داخلية للبحث عن البيانات الوصفية (الصف، الفصل) في أول 20 سطر
        const findMetadata = (keyword: string): string => {
            for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                const row = jsonData[i] || [];
                // البحث عن الخلية التي تحتوي الكلمة المفتاحية
                const keyIndex = row.findIndex((cell: any) => normalizeString(cell).includes(keyword));
                if (keyIndex !== -1) {
                    // البحث عن أول قيمة نصية في نفس الصف تختلف عن المفتاح
                    const value = row.find((cell: any, idx: number) => idx !== keyIndex && normalizeString(cell).length > 1);
                    return value ? normalizeString(value) : "غير معروف";
                }
            }
            return "غير معروف";
        };

        let safRaw = findMetadata("الصف");
        let faselRaw = findMetadata("الفصل"); // قد يلتقط "الفصل الدراسي" خطأً

        // تنظيف القيم المستخرجة
        if (safRaw.includes("الدراسي")) safRaw = "غير معروف"; 
        
        let saf = safRaw.replace(/الصف\s*:?/g, "").trim();
        let fasel = faselRaw.replace(/الفصل\s*:?/g, "").trim();
        
        // قيم افتراضية في حال الفشل التام في الاستخراج
        if (saf === "غير معروف" || saf === "") saf = "الصف العام";
        if (fasel === "غير معروف" || fasel.includes("الدراسي") || fasel === "") fasel = "الكل";

        resolve({ saf, fasel, data: jsonData });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

// ---------------------------------------------------------
// 4. دالة استخراج بيانات الملخص (Extract Summary Data)
// ---------------------------------------------------------

export const extractSummaryData = (data: any[][], currentSummary: RasedSummary): RasedSummary => {
  if (data.length < 8) return currentSummary;

  let headersIdx = -1;
  let periodIdx = -1;
  let nameIdx = -1;

  // أ: تحديد صف العناوين ديناميكياً
  // نبحث عن صف يحتوي على كلمة "الطالب" و كلمة "الفترة"
  for (let i = 0; i < Math.min(data.length, 40); i++) {
    const row = data[i] || [];
    
    const nIdx = row.findIndex(cell => {
       const s = normalizeString(cell);
       return s.includes("الطالب") || s.includes("اسم الطالب");
    });

    const pIdx = row.findIndex(cell => {
      const s = normalizeString(cell);
      return s === "الفترة" || s.includes("فترة");
    });
    
    if (nIdx !== -1 && pIdx !== -1) {
      headersIdx = i;
      periodIdx = pIdx;
      nameIdx = nIdx;
      break;
    }
  }

  // إذا لم نجد العناوين، نعيد البيانات كما هي
  if (headersIdx === -1 || periodIdx === -1) return currentSummary;

  const headers = data[headersIdx] || [];
  const rows = data.slice(headersIdx + 1);

  // ب: إعادة استخراج الصف والفصل (احتياطي) لضمان صحة المفاتيح
  let saf = "الصف";
  let fasel = "الكل";
  
  for(let i=0; i<20; i++) {
      const r = data[i] || [];
      // محاولة إيجاد الصف
      if(r.some((c:any) => normalizeString(c).includes("الصف"))) {
          const val = r.find((c:any) => c && !normalizeString(c).includes("الصف"));
          if(val && !val.includes("الدراسي")) saf = normalizeString(val);
      }
      // محاولة إيجاد الفصل (تجنب الفصل الدراسي)
      if(r.some((c:any) => normalizeString(c) === "الفصل" || normalizeString(c).includes(": الفصل"))) {
           const val = r.find((c:any) => c && !normalizeString(c).includes("الفصل"));
           if(val) fasel = normalizeString(val);
      }
  }

  // تهيئة الهيكل
  if (!currentSummary[saf]) currentSummary[saf] = {};
  if (!currentSummary[saf][fasel]) currentSummary[saf][fasel] = {};

  // ج: قوائم الاستبعاد (تم تعديلها لتكون دقيقة جداً)
  // نستبعد فقط الكلمات التي لا يمكن أن تكون مواد دراسية
  const excludedExactMatches = ["م", "رقم", "السجل", "ملاحظات", "مسلسل"]; 
  const excludedPartialMatches = ["السلوك", "المواظبة", "اسم الطالب", "الطالب", "الفترة", "رقم الهوية", "السجل المدني"];

  let lastValidName = "";

  rows.forEach(row => {
    // 1. معالجة اسم الطالب (لأنه مدموج مع رقم الهوية)
    let rawCellContent = normalizeString(row[nameIdx]);
    let studentName = "";

    if (rawCellContent) {
      // السيناريو: "رقم الهوية: 123... \n الاسم: فلان..."
      if (rawCellContent.includes("الاسم")) {
        const splitArr = rawCellContent.split(/الاسم\s*:?/);
        if (splitArr.length > 1) {
            studentName = splitArr[1].trim();
        }
      } 
      // محاولة احتياطية: حذف الأرقام وكلمة هوية
      if (!studentName && rawCellContent.length > 5) {
          studentName = rawCellContent.replace(/[0-9:]/g, '').replace("رقم الهوية", "").trim();
      }

      if (studentName.length > 2) lastValidName = studentName;
    }

    // 2. تحديد الفترة (أولى / ثانية)
    let pRaw = normalizeString(row[periodIdx]);
    let pVal = pRaw.includes("أولى") ? "أولى" : pRaw.includes("ثانية") ? "ثانية" : "";

    // تجاهل الصف إذا لم نتمكن من تحديد الفترة أو لا يوجد اسم طالب سابق
    if (!pVal || !lastValidName) return;

    if (!currentSummary[saf][fasel][pVal]) currentSummary[saf][fasel][pVal] = {};

    // 3. المرور على الأعمدة لاستخراج المواد والدرجات
    headers.forEach((subj, sIdx) => {
      const subName = normalizeString(subj);
      
      // -- فلترة العناوين --
      if (!subName) return; // عنوان فارغ
      if (sIdx === nameIdx || sIdx === periodIdx) return; // عمود الاسم أو الفترة
      
      // هل الاسم موجود في قائمة الحظر التام؟ (مثل "م")
      if (excludedExactMatches.includes(subName)) return;
      
      // هل الاسم يحتوي على كلمات محظورة؟ (مثل "المواظبة")
      if (excludedPartialMatches.some(ex => subName.includes(ex))) return;

      // تهيئة كائن المادة
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
      // التأكد من أن الخلية ليست فارغة (قد تكون المادة اختيارية لطالب معين)
      if (val === undefined || val === null || val === "") return;

      // المنطق الخاص بملفك: 0 = تم الرصد، 1 = متبقي
      const isRasid = (val == 0 || val === "0");
      const isLamRasid = (val == 1 || val === "1");

      if (isRasid || isLamRasid) {
        const subData = currentSummary[saf][fasel][pVal][subName];
        
        // إضافة الطالب للقائمة إذا لم يكن موجوداً
        if (!subData.studentsList.includes(lastValidName)) {
          subData.studentsList.push(lastValidName);
        }
        
        // تسجيل حالة الطالب
        subData.studentRasidStatus[lastValidName] = isRasid;
        
        // زيادة العدادات
        if (isRasid) subData.rasidCount++;
        else subData.lamRasidCount++;
      }
    });
  });

  // د: حساب النسب المئوية النهائية
  for (const p in currentSummary[saf][fasel]) {
    for (const s in currentSummary[saf][fasel][p]) {
      const d = currentSummary[saf][fasel][p][s];
      const total = d.rasidCount + d.lamRasidCount;
      // المعادلة: (عدد المرصود / الإجمالي) * 100
      d.percentage = total > 0 ? Number(((d.rasidCount / total) * 100).toFixed(1)) : 0;
    }
  }

  return currentSummary;
};