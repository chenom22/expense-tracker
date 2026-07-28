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

const FIELD_ALIASES: Record<"date" | "amount" | "source" | "category" | "paymentMethod" | "channel" | "note", string[]> = {
  date: ["תאריך", "date"],
  amount: ["סכום", "סכום כולל", "סה\"כ", "סהכ", "total", "amount", "sum"],
  source: ["לקוח", "שם לקוח", "שם", "customer", "source", "מקור", "מקור הכנסה"],
  category: ["קטגוריה", "category"],
  paymentMethod: ["אמצעי תשלום", "אמצעי", "payment", "payment method"],
  channel: ["ערוץ", "ערוץ הכנסה", "channel"],
  note: ["הערה", "הערות", "note", "notes", "תיאור", "description"],
};

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalizedHeaders = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalizedHeaders.indexOf(normalizeHeader(alias));
    if (idx !== -1) return idx;
  }
  return -1;
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
}

export function parseIncomeCsv(
  text: string,
  options: { defaultCategory: string; defaultPaymentMethod: string; defaultChannel: string }
): CsvParseResult {
  const table = parseCsvRows(text);
  if (table.length < 2) {
    return { rows: [], errors: ["הקובץ ריק או לא מכיל שורות נתונים"] };
  }

  const [headerRow, ...dataRows] = table;
  const dateIdx = findColumnIndex(headerRow, FIELD_ALIASES.date);
  const amountIdx = findColumnIndex(headerRow, FIELD_ALIASES.amount);
  const sourceIdx = findColumnIndex(headerRow, FIELD_ALIASES.source);

  if (dateIdx === -1 || amountIdx === -1 || sourceIdx === -1) {
    return {
      rows: [],
      errors: [
        `לא נמצאו כל העמודות הנדרשות בקובץ. צריך עמודות עבור: תאריך, סכום, ולקוח/מקור (שמות התגלו: ${headerRow.join(", ")})`,
      ],
    };
  }

  const categoryIdx = findColumnIndex(headerRow, FIELD_ALIASES.category);
  const paymentIdx = findColumnIndex(headerRow, FIELD_ALIASES.paymentMethod);
  const channelIdx = findColumnIndex(headerRow, FIELD_ALIASES.channel);
  const noteIdx = findColumnIndex(headerRow, FIELD_ALIASES.note);

  const rows: ParsedIncomeRow[] = [];
  const errors: string[] = [];

  dataRows.forEach((cells, i) => {
    const rowNumber = i + 2; // +1 for header, +1 for 1-indexing
    const date = parseDateCell(cells[dateIdx] ?? "");
    const amount = parseAmountCell(cells[amountIdx] ?? "");
    const source = (cells[sourceIdx] ?? "").trim();

    if (!date) {
      errors.push(`שורה ${rowNumber}: לא ניתן לפרש את התאריך "${cells[dateIdx] ?? ""}"`);
      return;
    }
    if (amount === null) {
      errors.push(`שורה ${rowNumber}: לא ניתן לפרש את הסכום "${cells[amountIdx] ?? ""}"`);
      return;
    }
    if (!source) {
      errors.push(`שורה ${rowNumber}: חסר שם לקוח/מקור`);
      return;
    }

    rows.push({
      rowNumber,
      date,
      amount,
      source,
      category: categoryIdx !== -1 ? cells[categoryIdx]?.trim() || options.defaultCategory : options.defaultCategory,
      paymentMethod:
        paymentIdx !== -1 ? cells[paymentIdx]?.trim() || options.defaultPaymentMethod : options.defaultPaymentMethod,
      channel: channelIdx !== -1 ? cells[channelIdx]?.trim() || options.defaultChannel : options.defaultChannel,
      note: noteIdx !== -1 ? cells[noteIdx]?.trim() || undefined : undefined,
    });
  });

  return { rows, errors };
}
