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
import { parseIncomeCsv, type ParsedIncomeRow } from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionInput } from "@/lib/types";

interface ImportIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: TransactionInput[]) => Promise<void>;
}

const SAMPLE_CSV =
  "תאריך,סכום,לקוח,קטגוריה,אמצעי תשלום,ערוץ,הערה\n2026-07-15,350,לקוח מזדמן,מכירות,אשראי,אתר,\n";

export function ImportIncomeDialog({ open, onOpenChange, onImport }: ImportIncomeDialogProps) {
  const { business } = useBusiness();
  const [rows, setRows] = useState<ParsedIncomeRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  function reset() {
    setRows([]);
    setErrors([]);
    setFileName("");
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    const text = await file.text();
    const result = parseIncomeCsv(text, {
      defaultCategory: business.incomeCategories[business.incomeCategories.length - 1],
      defaultPaymentMethod: "אחר",
      defaultChannel: business.incomeChannels[business.incomeChannels.length - 1],
    });
    setRows(result.rows);
    setErrors(result.errors);
  }

  async function handleConfirm() {
    setImporting(true);
    try {
      await onImport(
        rows.map((r) => ({
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
      );
      toast.success(`יובאו ${rows.length} הכנסות בהצלחה`);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("משהו השתבש בייבוא, נסו שוב");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob(["﻿" + SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "תבנית-ייבוא-הכנסות.csv";
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
          <DialogTitle>ייבוא הכנסות מקובץ</DialogTitle>
          <DialogDescription>
            העלו קובץ CSV (למשל ייצוא מ-Sumit) עם עמודות תאריך, סכום ולקוח/מקור. שדות נוספים
            (קטגוריה, אמצעי תשלום, ערוץ, הערה) הם לא חובה.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              הורדת קובץ לדוגמה
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm hover:bg-muted">
              בחירת קובץ CSV
              <input
                type="file"
                accept=".csv,text/csv"
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

          {rows.length > 0 && (
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
                  {rows.map((r) => (
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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={rows.length === 0 || importing}>
            {importing ? "מייבא..." : `ייבוא ${rows.length || ""} תנועות`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
