"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VendorFormDialog } from "@/components/vendors/vendor-form-dialog";
import { useVendors } from "@/hooks/use-vendors";
import { useBusiness } from "@/context/business-context";
import { formatCurrency } from "@/lib/utils";
import type { RecurringVendor } from "@/lib/types";

export default function VendorsPage() {
  const { business } = useBusiness();
  const { vendors, loading, addVendor, editVendor, removeVendor } = useVendors(business.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringVendor | null>(null);

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(vendor: RecurringVendor) {
    setEditing(vendor);
    setOpen(true);
  }

  async function handleDelete(vendor: RecurringVendor) {
    if (!window.confirm(`למחוק את הספק "${vendor.name}"?`)) return;
    await removeVendor(vendor.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ספקים קבועים</CardTitle>
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            הוספת ספק
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">טוען נתונים...</p>
          ) : vendors.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              אין עדיין ספקים קבועים. לחצו על &quot;הוספת ספק&quot; כדי להוסיף ספק שחוזר כל חודש —
              כך תוכלו לבחור אותו מהר בעת הוספת הוצאה.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם הספק</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>אמצעי תשלום</TableHead>
                  <TableHead className="text-end">סכום קבוע</TableHead>
                  <TableHead className="text-end">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {v.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.paymentMethod}</TableCell>
                    <TableCell className="text-end">
                      {v.defaultAmount ? formatCurrency(v.defaultAmount) : "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(v)} aria-label="עריכה">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(v)} aria-label="מחיקה">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VendorFormDialog
        open={open}
        onOpenChange={setOpen}
        vendor={editing ?? undefined}
        onSubmit={(input) => (editing ? editVendor(editing.id, input) : addVendor(input))}
      />
    </div>
  );
}
