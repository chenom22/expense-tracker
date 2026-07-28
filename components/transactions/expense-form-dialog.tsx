"use client";

import { useEffect, useState } from "react";
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
import { useVendors } from "@/hooks/use-vendors";
import { todayISO } from "@/lib/utils";
import { EXPENSE_RECURRENCES, PAYMENT_METHODS } from "@/lib/types";
import type { ExpenseRecurrence, ExpenseTransaction, PaymentMethod, TransactionInput } from "@/lib/types";

const expenseSchema = z.object({
  date: z.string().min(1, "שדה חובה"),
  amount: z.coerce.number({ message: "יש להזין מספר" }).positive("הסכום חייב להיות גדול מ-0"),
  vendor: z.string().min(1, "שדה חובה"),
  category: z.string().min(1, "יש לבחור קטגוריה"),
  paymentMethod: z.string().min(1, "יש לבחור אמצעי תשלום"),
  recurrence: z.string().min(1, "יש לבחור סוג הוצאה"),
  note: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: ExpenseTransaction;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

function emptyValues(defaultCategory: string): ExpenseFormValues {
  return {
    date: todayISO(),
    amount: 0,
    vendor: "",
    category: defaultCategory,
    paymentMethod: "העברה בנקאית",
    recurrence: "חד פעמית",
    note: "",
  };
}

export function ExpenseFormDialog({ open, onOpenChange, transaction, onSubmit }: ExpenseFormDialogProps) {
  const { business } = useBusiness();
  const { vendors } = useVendors(business.id);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: emptyValues(business.expenseCategories[0]),
  });

  useEffect(() => {
    if (!open) return;
    // Reset the quick-fill picker whenever the dialog reopens (not during render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedVendorId("");
    if (transaction) {
      reset({
        date: transaction.date,
        amount: transaction.amount,
        vendor: transaction.vendor,
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        recurrence: transaction.recurrence,
        note: transaction.note ?? "",
      });
    } else {
      reset(emptyValues(business.expenseCategories[0]));
    }
  }, [open, transaction, business, reset]);

  function handlePickVendor(vendorId: string) {
    setSelectedVendorId(vendorId);
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;
    setValue("vendor", vendor.name);
    setValue("category", vendor.category);
    setValue("paymentMethod", vendor.paymentMethod);
    setValue("recurrence", "קבועה");
    if (vendor.defaultAmount) setValue("amount", vendor.defaultAmount);
  }

  async function submit(values: ExpenseFormValues) {
    try {
      await onSubmit({
        businessId: business.id,
        type: "expense",
        date: values.date,
        amount: values.amount,
        vendor: values.vendor.trim(),
        category: values.category,
        paymentMethod: values.paymentMethod as PaymentMethod,
        recurrence: values.recurrence as ExpenseRecurrence,
        note: values.note?.trim() || undefined,
      });
      toast.success(transaction ? "ההוצאה עודכנה" : "ההוצאה נוספה בהצלחה");
      onOpenChange(false);
    } catch {
      toast.error("משהו השתבש, נסו שוב");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "עריכת הוצאה" : "הוספת הוצאה"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="contents">
          <div className="grid grid-cols-2 gap-4">
            {!transaction && vendors.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <Label>מילוי מהיר מספק קבוע</Label>
                <Select
                  value={selectedVendorId}
                  onValueChange={(v) => handlePickVendor(v ?? "")}
                  items={Object.fromEntries(vendors.map((v) => [v.id, v.name]))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="בחרו ספק קבוע (לא חובה)" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="expense-date">תאריך</Label>
              <Input id="expense-date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense-amount">סכום</Label>
              <Input
                id="expense-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0"
                {...register("amount")}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="expense-vendor">ספק / שם ההוצאה</Label>
              <Input id="expense-vendor" placeholder="שם הספק או ההוצאה" {...register("vendor")} />
              {errors.vendor && <p className="text-xs text-destructive">{errors.vendor.message}</p>}
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
                      {business.expenseCategories.map((c) => (
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
              <Label>סוג הוצאה</Label>
              <Controller
                control={control}
                name="recurrence"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחרו סוג הוצאה" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_RECURRENCES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="expense-note">הערה</Label>
              <Textarea id="expense-note" placeholder="הערה חופשית (לא חובה)" {...register("note")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {transaction ? "שמירה" : "הוספת הוצאה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
