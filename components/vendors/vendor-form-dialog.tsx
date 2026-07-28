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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBusiness } from "@/context/business-context";
import { PAYMENT_METHODS } from "@/lib/types";
import type { PaymentMethod, RecurringVendor, RecurringVendorInput } from "@/lib/types";

const vendorSchema = z.object({
  name: z.string().min(1, "שדה חובה"),
  category: z.string().min(1, "יש לבחור קטגוריה"),
  paymentMethod: z.string().min(1, "יש לבחור אמצעי תשלום"),
  defaultAmount: z.coerce.number().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: RecurringVendor;
  onSubmit: (input: RecurringVendorInput) => Promise<void>;
}

function emptyValues(defaultCategory: string): VendorFormValues {
  return { name: "", category: defaultCategory, paymentMethod: "העברה בנקאית", defaultAmount: undefined };
}

export function VendorFormDialog({ open, onOpenChange, vendor, onSubmit }: VendorFormDialogProps) {
  const { business } = useBusiness();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: emptyValues(business.expenseCategories[0]),
  });

  useEffect(() => {
    if (!open) return;
    if (vendor) {
      reset({
        name: vendor.name,
        category: vendor.category,
        paymentMethod: vendor.paymentMethod,
        defaultAmount: vendor.defaultAmount,
      });
    } else {
      reset(emptyValues(business.expenseCategories[0]));
    }
  }, [open, vendor, business, reset]);

  async function submit(values: VendorFormValues) {
    try {
      await onSubmit({
        businessId: business.id,
        name: values.name.trim(),
        category: values.category,
        paymentMethod: values.paymentMethod as PaymentMethod,
        defaultAmount: values.defaultAmount || undefined,
      });
      toast.success(vendor ? "הספק עודכן" : "הספק נוסף בהצלחה");
      onOpenChange(false);
    } catch {
      toast.error("משהו השתבש, נסו שוב");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{vendor ? "עריכת ספק קבוע" : "הוספת ספק קבוע"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="contents">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="vendor-name">שם הספק</Label>
              <Input id="vendor-name" placeholder="לדוגמה: סיטונאי גבינות" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
              <Label htmlFor="vendor-amount">סכום קבוע (לא חובה)</Label>
              <Input
                id="vendor-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="ימולא אוטומטית אם יש סכום קבוע"
                {...register("defaultAmount")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {vendor ? "שמירה" : "הוספת ספק"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
