"use client";

import { createContext, useContext } from "react";
import { useBusiness } from "@/context/business-context";
import { useTransactions } from "@/hooks/use-transactions";

type TransactionsContextValue = ReturnType<typeof useTransactions>;

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { businessId } = useBusiness();
  const value = useTransactions(businessId);

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactionsContext(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactionsContext must be used within a TransactionsProvider");
  return ctx;
}
