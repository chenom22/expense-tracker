export interface WoltNettingResult {
  netAmount: number | null;
  grossAmount: number | null;
  commissionAmount: number | null;
  withholdingAmount: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  concentrationNumber: string | null;
  looksLikeNettingReport: boolean;
}

const NUMBER = "([\\d,]+\\.\\d{2})";

/** מחפש את המספר (עם 2 ספרות אחרי הנקודה) הקרוב ביותר לתווית נתונה, בכל כיוון - לשדות לא-קריטיים */
function numberNearLabel(text: string, label: RegExp, maxDistance = 100): number | null {
  const labelMatch = label.exec(text);
  if (!labelMatch) return null;
  const idx = labelMatch.index;
  const start = Math.max(0, idx - maxDistance);
  const window = text.slice(start, idx + maxDistance);
  const labelPosInWindow = idx - start;

  const numbers = [...window.matchAll(/-?[\d,]{1,12}\.\d{2}/g)];
  if (numbers.length === 0) return null;

  let best = numbers[0];
  let bestDist = Infinity;
  for (const m of numbers) {
    const dist = Math.abs((m.index ?? 0) - labelPosInWindow);
    if (dist < bestDist) {
      bestDist = dist;
      best = m;
    }
  }
  return Number(best[0].replace(/,/g, ""));
}

function extractConcentrationNumber(text: string): string | null {
  const match = numberNearLabel(text, /מספר\s*ריכוז/, 40);
  return match !== null ? String(Math.round(match)) : null;
}

/** תאריכי התקופה מגיעים בדרך כלל בשם הקובץ עצמו, לדוגמה: ..._2026-07-16_2026-08-01.pdf */
export function extractPeriodFromFileName(fileName: string): { start: string | null; end: string | null } {
  const match = /(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/.exec(fileName);
  if (!match) return { start: null, end: null };
  return { start: match[1], end: match[2] };
}

export function parseWoltNettingReport(text: string, fileName: string): WoltNettingResult {
  // "סה״כ תשלום לשותף  2,776.88" - הסכום נטו שבאמת מועבר לעסק
  const netMatch = new RegExp(`סה["״]?כ\\s*תשלום\\s*לשותף\\D{0,20}${NUMBER}`).exec(text);
  const netAmount = netMatch ? Number(netMatch[1].replace(/,/g, "")) : null;

  // שתי שורות "סה״כ <מספר>" מופיעות בסדר קבוע: קודם סה"כ מכירות בית העסק, אח"כ סה"כ עמלת Wolt
  const subtotalMatches = [...text.matchAll(new RegExp(`סה["״]?כ(?!\\s*תשלום)\\D{0,10}${NUMBER}`, "g"))].map((m) =>
    Number(m[1].replace(/,/g, ""))
  );
  const grossAmount = subtotalMatches[0] ?? null;
  const commissionAmount = subtotalMatches[1] ?? null;

  // "ניכוי במקור  <סכום כולל מעמ>  <אחוז>%  <סכום הניכוי>" - הערך השלישי הוא הניכוי בפועל
  const withholdMatch = new RegExp(`ניכוי\\s*במקור\\D{0,20}${NUMBER}\\D{0,10}\\d+%\\D{0,10}${NUMBER}`).exec(text);
  const withholdingAmount = withholdMatch ? Number(withholdMatch[2].replace(/,/g, "")) : null;

  const concentrationNumber = extractConcentrationNumber(text);
  const { start, end } = extractPeriodFromFileName(fileName);

  return {
    netAmount,
    grossAmount,
    commissionAmount,
    withholdingAmount,
    periodStart: start,
    periodEnd: end,
    concentrationNumber,
    looksLikeNettingReport: /תשלום\s*לשותף/.test(text) && netAmount !== null,
  };
}
