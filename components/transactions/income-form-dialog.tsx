"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBusiness } from "@/context/business-context";
import { todayISO } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/types";
import type { IncomeTransaction, TransactionInput } from "@/lib/types";

const incomeSchema = z.object({
  date: z.string().min(1, "שדה חובה"),
  amount: z.coerce.number({ message: "יש להזין מספר" }).positive("הסכום חייב להיות גדול מ-0"),
  source: z.string().min(1, "שדה חובה"),
  category: z.string().min(1, "יש לבחור קטגוריה"),
  channel: z.string().min(1, "יש לבחור ערוץ הכנסה"),
  paymentMethod: z.string().min(1, "יש לבחור אמצעי תשלום"),
  note: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

interface IncomeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: IncomeTransaction;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

function emptyValues(defaultCategory: string, defaultChannel: string): IncomeFormValues {
  return {
    date: todayISO(),
    amount: 0,
    source: "",
    category: defaultCategory,
    channel: defaultChannel,
    paymentMethod: "העברה בנקאית",
    note: "",
  };
}

export function IncomeFormDialog({ open, onOpenChange, transaction, onSubmit }: IncomeFormDialogProps) {
  const { business } = useBusiness();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: emptyValues(business.incomeCategories[0], business.incomeChannels[0]),
  });

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      reset({
        date: transaction.date,
        amount: transaction.amount,
        source: transaction.source,
        category: transaction.category,
        channel: transaction.channel,
        paymentMethod: transaction.paymentMethod,
        note: transaction.note ?? "",
      });
    } else {
      reset(emptyValues(business.incomeCategories[0], business.incomeChannels[0]));
    }
  }, [open, transaction, business, reset]);

  async function submit(values: IncomeFormValues) {
    try {
      await onSubmit({
        businessId: business.id,
        type: "income",
        date: values.date,
        amount: values.amount,
        source: values.source.trim(),
        category: values.category,
        channel: values.channel,
        paymentMethod: values.paymentMethod as TransactionInput["paymentMethod"],
        note: values.note?.trim() || undefined,
      });
      toast.success(transaction ? "ההכנסה עודכנה" : "ההכנסה נוספה בהצלחה");
      onOpenChange(false);
    } catch {
      toast.error("משהו השתבש, נסו שוב");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "עריכת הכנסה" : "הוספת הכנסה"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="contents">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="income-date">תאריך</Label>
              <Input id="income-date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="income-amount">סכום</Label>
              <Input
                id="income-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0"
                {...register("amount")}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="income-source">שם לקוח / מקור הכנסה</Label>
              <Input id="income-source" placeholder="שם הלקוח או מקור ההכנסה" {...register("source")} />
              {errors.source && <p className="text-xs text-destructive">{errors.source.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>קטגוריה</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>ערוץ הכנסה</Label>
              <Controller
                control={control}
                name="channel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
              {errors.channel && <p className="text-xs text-destructive">{errors.channel.message}</p>}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>אמצעי תשלום</Label>
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחרו אמצעי תשלום" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="income-note">הערה</Label>
              <Textarea id="income-note" placeholder="הערה חופשית (לא חובה)" {...register("note")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {transaction ? "שמירה" : "הוספת הכנסה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
