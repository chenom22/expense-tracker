"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { monthLabel } from "@/lib/utils";

export type TransactionTypeFilter = "all" | "income" | "expense";

interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  month: string;
  onMonthChange: (value: string) => void;
  months: string[];
  type: TransactionTypeFilter;
  onTypeChange: (value: TransactionTypeFilter) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
}

export function TransactionFilters({
  search,
  onSearchChange,
  month,
  onMonthChange,
  months,
  type,
  onTypeChange,
  category,
  onCategoryChange,
  categories,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-56">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="חיפוש לפי לקוח, ספק או הערה..."
          className="ps-8"
        />
      </div>

      <Select
        value={month}
        onValueChange={(v) => onMonthChange(v ?? "all")}
        items={{ all: "כל החודשים", ...Object.fromEntries(months.map((m) => [m, monthLabel(m)])) }}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="חודש" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל החודשים</SelectItem>
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {monthLabel(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={type}
        onValueChange={(v) => onTypeChange((v ?? "all") as TransactionTypeFilter)}
        items={{ all: "כל הסוגים", income: "הכנסה", expense: "הוצאה" }}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="סוג תנועה" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הסוגים</SelectItem>
          <SelectItem value="income">הכנסה</SelectItem>
          <SelectItem value="expense">הוצאה</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={category}
        onValueChange={(v) => onCategoryChange(v ?? "all")}
        items={{ all: "כל הקטגוריות", ...Object.fromEntries(categories.map((c) => [c, c])) }}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="קטגוריה" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הקטגוריות</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
