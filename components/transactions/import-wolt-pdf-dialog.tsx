"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBusiness } from "@/context/business-context";
import { extractPdfText } from "@/lib/pdf";
import { parseWoltNettingReport } from "@/lib/wolt-netting";
import { formatCurrency, todayISO } from "@/lib/utils";
import type { TransactionInput } from "@/lib/types";

interface ImportWoltPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (input: TransactionInput) => Promise<void>;
}

export function ImportWoltPdfDialog({ open, onOpenChange, onImport }: ImportWoltPdfDialogProps) {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [source, setSource] = useState("Wolt");
  const [category, setCategory] = useState(business.incomeCategories[0]);
  const [channel, setChannel] = useState(business.incomeChannels[0]);
  const [details, setDetails] = useState<{ gross: number | null; commission: number | null; withholding: number | null }>({
    gross: null,
    commission: null,
    withholding: null,
  });
  const [parsed, setParsed] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Reset the form whenever the dialog reopens or the active business changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
    setImporting(false);
    setError(null);
    setFileName("");
    setAmount("");
    setParsed(false);
    setDetails({ gross: null, commission: null, withholding: null });
    setDate(todayISO());
    setSource("Wolt");
    setCategory(business.incomeCategories.find((c) => c.includes("משלוח")) ?? business.incomeCategories[0]);
    setChannel(business.incomeChannels.find((c) => c === "וולט" || c.includes("וולט")) ?? business.incomeChannels[0]);
  }, [open, business]);

  function reset() {
    setLoading(false);
    setImporting(false);
    setError(null);
    setFileName("");
    setAmount("");
    setParsed(false);
    setDetails({ gross: null, commission: null, withholding: null });
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setParsed(false);
    try {
      const buffer = await file.arrayBuffer();
      const text = await extractPdfText(buffer);
      const result = parseWoltNettingReport(text, file.name);

      if (!result.looksLikeNettingReport) {
        setError(
          "לא זוהה כדוח \"ריכוז תשלומים וחיובים\" של Wolt. ודאו שהעליתם את קובץ ה-netting report (לא את דוח פירוט העסקאות או החשבוניות)."
        );
        return;
      }

      setAmount(String(result.netAmount));
      setDate(result.periodEnd ?? todayISO());
      setDetails({ gross: result.grossAmount, commission: result.commissionAmount, withholding: result.withholdingAmount });
      setParsed(true);
    } catch {
      setError("לא הצלחנו לקרוא את קובץ ה-PDF. ודאו שזה קובץ תקין ונסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      toast.error("סכום לא תקין");
      return;
    }
    setImporting(true);
    try {
      await onImport({
        businessId: business.id,
        type: "income",
        date,
        amount: amountNumber,
        source: source.trim() || "Wolt",
        category,
        channel,
        paymentMethod: "העברה בנקאית",
        note: fileName,
      });
      toast.success("ההכנסה מוולט נוספה בהצלחה");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("משהו השתבש, נסו שוב");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ייבוא תשלום Wolt מ-PDF</DialogTitle>
          <DialogDescription>
            העלו את קובץ &quot;ריכוז תשלומים וחיובים&quot; (netting report) שמורידים מ-Wolt. המערכת תשלוף
            את סכום התשלום נטו אוטומטית.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="inline-flex w-fit cursor-pointer items-center rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm hover:bg-muted">
            בחירת קובץ PDF
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </label>
          {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          {loading && <p className="text-sm text-muted-foreground">קורא את הקובץ...</p>}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {parsed && (
            <>
              {(details.gross !== null || details.commission !== null || details.withholding !== null) && (
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {details.gross !== null && (
                    <div>
                      <p>ברוטו</p>
                      <p className="font-medium text-foreground">{formatCurrency(details.gross)}</p>
                    </div>
                  )}
                  {details.commission !== null && (
                    <div>
                      <p>עמלת Wolt</p>
                      <p className="font-medium text-foreground">-{formatCurrency(details.commission)}</p>
                    </div>
                  )}
                  {details.withholding !== null && (
                    <div>
                      <p>ניכוי במקור</p>
                      <p className="font-medium text-foreground">-{formatCurrency(details.withholding)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wolt-date">תאריך</Label>
                  <Input id="wolt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wolt-amount">סכום נטו (יובא כהכנסה)</Label>
                  <Input
                    id="wolt-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="wolt-source">מקור הכנסה</Label>
                  <Input id="wolt-source" value={source} onChange={(e) => setSource(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>קטגוריה</Label>
                  <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחרו קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {business.incomeCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>ערוץ</Label>
                  <Select value={channel} onValueChange={(v) => v && setChannel(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחרו ערוץ" />
                    </SelectTrigger>
                    <SelectContent>
                      {business.incomeChannels.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!parsed || importing}>
            {importing ? "מוסיף..." : "הוספת הכנסה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
