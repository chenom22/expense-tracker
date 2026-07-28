"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        לא נמצאו תנועות התואמות את הסינון
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>תאריך</TableHead>
          <TableHead>סוג</TableHead>
          <TableHead>לקוח / ספק</TableHead>
          <TableHead>קטגוריה</TableHead>
          <TableHead>אמצעי תשלום</TableHead>
          <TableHead>הערה</TableHead>
          <TableHead className="text-end">סכום</TableHead>
          <TableHead className="text-end">פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell>{formatDate(t.date)}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  "border-transparent",
                  t.type === "income" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                )}
              >
                {t.type === "income" ? "הכנסה" : "הוצאה"}
              </Badge>
            </TableCell>
            <TableCell className="max-w-40 truncate">{t.type === "income" ? t.source : t.vendor}</TableCell>
            <TableCell>
              <Badge variant="outline" className="font-normal">
                {t.category}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{t.paymentMethod}</TableCell>
            <TableCell className="max-w-40 truncate text-muted-foreground">{t.note || "—"}</TableCell>
            <TableCell
              className={cn("text-end font-semibold", t.type === "income" ? "text-income" : "text-expense")}
            >
              {t.type === "income" ? "+" : "-"}
              {formatCurrency(t.amount)}
            </TableCell>
            <TableCell className="text-end">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(t)} aria-label="עריכה">
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => onDelete(t)} aria-label="מחיקה">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
