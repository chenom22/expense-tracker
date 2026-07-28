"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusiness } from "@/context/business-context";
import {
  parseIncomeCsv,
  parseIncomeXlsx,
  parseExpenseCsv,
  parseExpenseXlsx,
  type ParsedIncomeRow,
  type ParsedExpenseRow,
} from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseRecurrence, PaymentMethod, TransactionInput } from "@/lib/types";

interface ImportTransactionsDialogProps {
  type: "income" | "expense";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: TransactionInput[]) => Promise<void>;
}

const INCOME_SAMPLE_CSV =
  "תאריך,סכום,לקוח,קטגוריה,אמצעי תשלום,ערוץ,הערה\n2026-07-15,350,לקוח מזדמן,מכירות,אשראי,אתר,\n";

const EXPENSE_SAMPLE_CSV =
  "תאריך,סכום,ספק,קטגוריה,אמצעי תשלום,סוג הוצאה,הערה\n2026-07-15,350,סיטונאי גבינות,חומרי גלם,אשראי,חד פעמית,\n";

function isXlsxFile(file: File): boolean {
  return /\.xlsx?$/i.test(file.name);
}

export function ImportTransactionsDialog({ type, open, onOpenChange, onImport }: ImportTransactionsDialogProps) {
  const { business } = useBusiness();
  const [incomeRows, setIncomeRows] = useState<ParsedIncomeRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<ParsedExpenseRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const rowCount = type === "income" ? incomeRows.length : expenseRows.length;

  function reset() {
    setIncomeRows([]);
    setExpenseRows([]);
    setErrors([]);
    setFileName("");
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    const xlsx = isXlsxFile(file);

    if (type === "income") {
      const options = {
        defaultCategory: business.incomeCategories[business.incomeCategories.length - 1],
        defaultPaymentMethod: "אחר",
        defaultChannel: business.incomeChannels[business.incomeChannels.length - 1],
      };
      const result = xlsx ? await parseIncomeXlsx(await file.arrayBuffer(), options) : parseIncomeCsv(await file.text(), options);
      setIncomeRows(result.rows);
      setErrors(result.errors);
    } else {
      const options = {
        defaultCategory: business.expenseCategories[business.expenseCategories.length - 1],
        defaultPaymentMethod: "אחר",
        defaultRecurrence: "חד פעמית",
      };
      const result = xlsx
        ? await parseExpenseXlsx(await file.arrayBuffer(), options)
        : parseExpenseCsv(await file.text(), options);
      setExpenseRows(result.rows);
      setErrors(result.errors);
    }
  }

  async function handleConfirm() {
    setImporting(true);
    try {
      const inputs: TransactionInput[] =
        type === "income"
          ? incomeRows.map((r) => ({
              businessId: business.id,
              type: "income",
              date: r.date,
              amount: r.amount,
              source: r.source,
              category: r.category,
              channel: r.channel,
              paymentMethod: r.paymentMethod as TransactionInput["paymentMethod"],
              note: r.note,
            }))
          : expenseRows.map((r) => ({
              businessId: business.id,
              type: "expense",
              date: r.date,
              amount: r.amount,
              vendor: r.vendor,
              category: r.category,
              recurrence: r.recurrence as ExpenseRecurrence,
              paymentMethod: r.paymentMethod as PaymentMethod,
              note: r.note,
            }));
      await onImport(inputs);
      toast.success(`יובאו ${rowCount} ${type === "income" ? "הכנסות" : "הוצאות"} בהצלחה`);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("משהו השתבש בייבוא, נסו שוב");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const csv = type === "income" ? INCOME_SAMPLE_CSV : EXPENSE_SAMPLE_CSV;
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === "income" ? "תבנית-ייבוא-הכנסות.csv" : "תבנית-ייבוא-הוצאות.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{type === "income" ? "ייבוא הכנסות מקובץ" : "ייבוא הוצאות מקובץ"}</DialogTitle>
          <DialogDescription>
            העלו קובץ CSV או Excel (למשל ייצוא מ-Sumit) עם עמודות תאריך, סכום, ו
            {type === "income" ? "לקוח/מקור" : "ספק"}. שדות נוספים אינם חובה.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              הורדת קובץ לדוגמה
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm hover:bg-muted">
              בחירת קובץ CSV / Excel
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}

          {type === "income" && incomeRows.length > 0 && (
            <div className="max-h-72 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תאריך</TableHead>
                    <TableHead>לקוח / מקור</TableHead>
                    <TableHead>קטגוריה</TableHead>
                    <TableHead>ערוץ</TableHead>
                    <TableHead className="text-end">סכום</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeRows.map((r) => (
                    <TableRow key={r.rowNumber}>
                      <TableCell>{formatDate(r.date)}</TableCell>
                      <TableCell className="max-w-40 truncate">{r.source}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.channel}</TableCell>
                      <TableCell className="text-end">{formatCurrency(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {type === "expense" && expenseRows.length > 0 && (
            <div className="max-h-72 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תאריך</TableHead>
                    <TableHead>ספק</TableHead>
                    <TableHead>קטגוריה</TableHead>
                    <TableHead>סוג הוצאה</TableHead>
                    <TableHead className="text-end">סכום</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseRows.map((r) => (
                    <TableRow key={r.rowNumber}>
                      <TableCell>{formatDate(r.date)}</TableCell>
                      <TableCell className="max-w-40 truncate">{r.vendor}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.recurrence}</TableCell>
                      <TableCell className="text-end">{formatCurrency(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={rowCount === 0 || importing}>
            {importing ? "מייבא..." : `ייבוא ${rowCount || ""} תנועות`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
