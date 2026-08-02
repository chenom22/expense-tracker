/** פרסור CSV בסיסי התומך בשדות מצוטטים ובזיהוי אוטומטי של הפרדה בפסיק/נקודה-פסיק */
export function parseCsvRows(text: string): string[][] {
  const cleaned = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const sample = cleaned.split("\n")[0] ?? "";
  const delimiter = (sample.match(/;/g)?.length ?? 0) > (sample.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (inQuotes) {
      if (char === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/["'׳"]/g, "").replace(/\s+/g, " ");
}

const FIELD_ALIASES: Record<
  "date" | "amount" | "source" | "vendor" | "category" | "paymentMethod" | "channel" | "recurrence" | "note" | "recordType",
  string[]
> = {
  date: ["תאריך", "תאריך מכירה", "date"],
  amount: ["סכום", "סכום כולל", "סה\"כ", "סהכ", "total", "amount", "sum"],
  source: ["לקוח", "שם לקוח", "שם", "customer", "source", "מקור", "מקור הכנסה"],
  vendor: ["ספק", "שם ספק", "שם", "שם עסק", "vendor", "supplier"],
  category: ["קטגוריה", "category"],
  paymentMethod: ["אמצעי תשלום", "אמצעי", "payment", "payment method"],
  channel: ["ערוץ", "ערוץ הכנסה", "channel"],
  recurrence: ["סוג הוצאה", "recurrence"],
  note: ["הערה", "הערות", "note", "notes", "תיאור", "description"],
  recordType: ["סוג פתקית", "סוג", "type"],
};

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalizedHeaders.indexOf(normalizeHeader(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * חלק מהדוחות (למשל ייצוא מקופה) כוללים שורות כותרת/מטא-דאטה לפני שורת הכותרות
 * האמיתית. סורקים את 10 השורות הראשונות ומאתרים את הראשונה שמכילה גם עמודת
 * תאריך וגם עמודת סכום - זו כנראה שורת הכותרות האמיתית.
 */
function findHeaderRowIndex(table: string[][]): number {
  const limit = Math.min(table.length, 10);
  for (let i = 0; i < limit; i++) {
    const hasDate = findColumnIndex(table[i], FIELD_ALIASES.date) !== -1;
    const hasAmount = findColumnIndex(table[i], FIELD_ALIASES.amount) !== -1;
    if (hasDate && hasAmount) return i;
  }
  return 0;
}

function excelSerialToISO(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 60000) return null;
  const utcDays = Math.floor(serial - 25569); // 25569 = days between 1899-12-30 and 1970-01-01
  const date = new Date(utcDays * 86400 * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function parseDateCell(raw: string): string | null {
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);

  const dmy = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Excel serial date fallback (in case a date cell arrives unformatted).
  if (/^\d+(\.\d+)?$/.test(value)) return excelSerialToISO(Number(value));

  return null;
}

function parseAmountCell(raw: string): number | null {
  const cleaned = raw.replace(/[₪$,\s]/g, "").trim();
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.abs(value);
}

export interface ParsedIncomeRow {
  rowNumber: number;
  date: string;
  amount: number;
  source: string;
  category: string;
  paymentMethod: string;
  channel: string;
  note?: string;
}

export interface CsvParseResult {
  rows: ParsedIncomeRow[];
  errors: string[];
  /** נספרים כשיש עמודת "סוג פתקית" (כגון בייצוא מקופה) וחלק מהשורות מדולגות בכוונה */
  skippedByType?: Record<string, number>;
}

export interface IncomeImportOptions {
  defaultCategory: string;
  defaultPaymentMethod: string;
  defaultChannel: string;
  /** רשימת ערוצי ההכנסה של העסק, לזיהוי ערוץ "קופה/משלוחים" אוטומטית מתוך סוג פתקית */
  channels?: string[];
  /** רשימת קטגוריות ההכנסה של העסק, לזיהוי קטגוריית "מכירות" אוטומטית מתוך סוג פתקית */
  categories?: string[];
}

// ערכים שמופיעים בעמודת "סוג פתקית" בייצוא קופה שאינם מכירה בפועל (שורת סה"כ/סיכום)
const NON_SALE_RECORD_TYPES = ["סה\"כ", "סהכ", "total"];
const CREDIT_RECORD_TYPES = ["זיכוי", "credit", "refund"];
const DELIVERY_RECORD_TYPES = ["תעודת משלוח", "משלוח", "delivery"];

function pickChannelForRecordType(recordType: string, options: IncomeImportOptions): string {
  const isDelivery = DELIVERY_RECORD_TYPES.some((v) => recordType.includes(v));
  const keyword = isDelivery ? "משלוח" : "קופה";
  const match = options.channels?.find((c) => c.includes(keyword));
  return match ?? options.defaultChannel;
}

function pickCategoryForSaleRecord(options: IncomeImportOptions): string {
  const match = options.categories?.find((c) => c.includes("מכיר"));
  return match ?? options.defaultCategory;
}

function parseIncomeTable(table: string[][], options: IncomeImportOptions): CsvParseResult {
  if (table.length < 2) {
    return { rows: [], errors: ["הקובץ ריק או לא מכיל שורות נתונים"] };
  }

  const headerIndex = findHeaderRowIndex(table);
  const headerRow = table[headerIndex];
  const dataRows = table.slice(headerIndex + 1);

  const dateIdx = findColumnIndex(headerRow, FIELD_ALIASES.date);
  const amountIdx = findColumnIndex(headerRow, FIELD_ALIASES.amount);
  const sourceIdx = findColumnIndex(headerRow, FIELD_ALIASES.source);

  if (dateIdx === -1 || amountIdx === -1) {
    return {
      rows: [],
      errors: [
        `לא נמצאו כל העמודות הנדרשות בקובץ. צריך עמודות עבור תאריך וסכום (שמות התגלו: ${headerRow.join(", ")})`,
      ],
    };
  }

  const categoryIdx = findColumnIndex(headerRow, FIELD_ALIASES.category);
  const paymentIdx = findColumnIndex(headerRow, FIELD_ALIASES.paymentMethod);
  const channelIdx = findColumnIndex(headerRow, FIELD_ALIASES.channel);
  const noteIdx = findColumnIndex(headerRow, FIELD_ALIASES.note);
  const recordTypeIdx = findColumnIndex(headerRow, FIELD_ALIASES.recordType);

  const rows: ParsedIncomeRow[] = [];
  const errors: string[] = [];
  const skippedByType: Record<string, number> = {};

  dataRows.forEach((cells, i) => {
    const rowNumber = headerIndex + i + 2;
    const recordType = recordTypeIdx !== -1 ? (cells[recordTypeIdx] ?? "").trim() : "";

    if (recordTypeIdx !== -1) {
      const isNonSale = NON_SALE_RECORD_TYPES.some((v) => recordType.includes(v));
      const isCredit = CREDIT_RECORD_TYPES.some((v) => recordType.includes(v));
      if (isNonSale || isCredit || !recordType) {
        skippedByType[recordType || "(ריק)"] = (skippedByType[recordType || "(ריק)"] ?? 0) + 1;
        return;
      }
    }

    const date = parseDateCell(cells[dateIdx] ?? "");
    const amount = parseAmountCell(cells[amountIdx] ?? "");
    const source = sourceIdx !== -1 ? (cells[sourceIdx] ?? "").trim() : "";

    if (!date) {
      errors.push(`שורה ${rowNumber}: לא ניתן לפרש את התאריך "${cells[dateIdx] ?? ""}"`);
      return;
    }
    if (amount === null) {
      errors.push(`שורה ${rowNumber}: לא ניתן לפרש את הסכום "${cells[amountIdx] ?? ""}"`);
      return;
    }

    rows.push({
      rowNumber,
      date,
      amount,
      source: source || "לקוח קופה",
      category:
        categoryIdx !== -1
          ? cells[categoryIdx]?.trim() || options.defaultCategory
          : recordTypeIdx !== -1
            ? pickCategoryForSaleRecord(options)
            : options.defaultCategory,
      paymentMethod:
        paymentIdx !== -1 ? cells[paymentIdx]?.trim() || options.defaultPaymentMethod : options.defaultPaymentMethod,
      channel:
        channelIdx !== -1
          ? cells[channelIdx]?.trim() || options.defaultChannel
          : recordTypeIdx !== -1
            ? pickChannelForRecordType(recordType, options)
            : options.defaultChannel,
      note: noteIdx !== -1 ? cells[noteIdx]?.trim() || undefined : undefined,
    });
  });

  return { rows, errors, skippedByType: recordTypeIdx !== -1 ? skippedByType : undefined };
}

/** מאחד שורות הכנסה לפי (תאריך, ערוץ) - שימושי לייבוא קופה עם עשרות/מאות עסקאות ליום */
export function aggregateIncomeRowsByDay(rows: ParsedIncomeRow[]): ParsedIncomeRow[] {
  const groups = new Map<string, ParsedIncomeRow[]>();
  for (const row of rows) {
    const key = `${row.date}__${row.channel}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([key, group], index) => {
      const [date] = key.split("__");
      const total = group.reduce((sum, r) => sum + r.amount, 0);
      return {
        rowNumber: index,
        date,
        amount: total,
        source: `מכירות (${group.length} עסקאות)`,
        category: group[0].category,
        paymentMethod: group[0].paymentMethod,
        channel: group[0].channel,
        note: undefined,
      } satisfies ParsedIncomeRow;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function parseIncomeCsv(text: string, options: IncomeImportOptions): CsvParseResult {
  return parseIncomeTable(parseCsvRows(text), options);
}

export async function parseIncomeXlsx(
  buffer: ArrayBuffer,
  options: IncomeImportOptions
): Promise<CsvParseResult> {
  return parseIncomeTable(await readXlsxTable(buffer), options);
}

export interface ParsedExpenseRow {
  rowNumber: number;
  date: string;
  amount: number;
  vendor: string;
  category: string;
  paymentMethod: string;
  recurrence: string;
  note?: string;
}

export interface ExpenseParseResult {
  rows: ParsedExpenseRow[];
  errors: string[];
}

export interface ExpenseImportOptions {
  defaultCategory: string;
  defaultPaymentMethod: string;
  defaultRecurrence: string;
}

function parseExpenseTable(table: string[][], options: ExpenseImportOptions): ExpenseParseResult {
  if (table.length < 2) {
    return { rows: [], errors: ["הקובץ ריק או לא מכיל שורות נתונים"] };
  }

  const headerIndex = findHeaderRowIndex(table);
  const headerRow = table[headerIndex];
  const dataRows = table.slice(headerIndex + 1);

  const dateIdx = findColumnIndex(headerRow, FIELD_ALIASES.date);
  const amountIdx = findColumnIndex(headerRow, FIELD_ALIASES.amount);
  const vendorIdx = findColumnIndex(headerRow, FIELD_ALIASES.vendor);

  if (dateIdx === -1 || amountIdx === -1 || vendorIdx === -1) {
    return {
      rows: [],
      errors: [
        `לא נמצאו כל העמודות הנדרשות בקובץ. צריך עמודות עבור: תאריך, סכום, וספק/שם ההוצאה (שמות התגלו: ${headerRow.join(", ")})`,
      ],
    };
  }

  const categoryIdx = findColumnIndex(headerRow, FIELD_ALIASES.category);
  const paymentIdx = findColumnIndex(headerRow, FIELD_ALIASES.paymentMethod);
  const recurrenceIdx = findColumnIndex(headerRow, FIELD_ALIASES.recurrence);
  const noteIdx = findColumnIndex(headerRow, FIELD_ALIASES.note);

  const rows: ParsedExpenseRow[] = [];
  const errors: string[] = [];

  dataRows.forEach((cells, i) => {
    const rowNumber = headerIndex + i + 2;
    const date = parseDateCell(cells[dateIdx] ?? "");
    const amount = parseAmountCell(cells[amountIdx] ?? "");
    const vendor = (cells[vendorIdx] ?? "").trim();

    if (!date) {
      errors.push(`שורה ${rowNumber}: לא ניתן לפרש את התאריך "${cells[dateIdx] ?? ""}"`);
      return;
    }
    if (amount === null) {
      errors.push(`שורה ${rowNumber}: לא ניתן לפרש את הסכום "${cells[amountIdx] ?? ""}"`);
      return;
    }
    if (!vendor) {
      errors.push(`שורה ${rowNumber}: חסר שם ספק/הוצאה`);
      return;
    }

    rows.push({
      rowNumber,
      date,
      amount,
      vendor,
      category: categoryIdx !== -1 ? cells[categoryIdx]?.trim() || options.defaultCategory : options.defaultCategory,
      paymentMethod:
        paymentIdx !== -1 ? cells[paymentIdx]?.trim() || options.defaultPaymentMethod : options.defaultPaymentMethod,
      recurrence:
        recurrenceIdx !== -1 ? cells[recurrenceIdx]?.trim() || options.defaultRecurrence : options.defaultRecurrence,
      note: noteIdx !== -1 ? cells[noteIdx]?.trim() || undefined : undefined,
    });
  });

  return { rows, errors };
}

export function parseExpenseCsv(text: string, options: ExpenseImportOptions): ExpenseParseResult {
  return parseExpenseTable(parseCsvRows(text), options);
}

export async function parseExpenseXlsx(
  buffer: ArrayBuffer,
  options: ExpenseImportOptions
): Promise<ExpenseParseResult> {
  return parseExpenseTable(await readXlsxTable(buffer), options);
}

async function readXlsxTable(buffer: ArrayBuffer): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as string[][];
}
