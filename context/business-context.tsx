"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BUSINESSES, getBusiness } from "@/lib/data/businesses";
import type { Business, BusinessId } from "@/lib/types";

const CURRENT_BUSINESS_KEY = "expense-tracker:current-business";
const DEFAULT_BUSINESS_ID: BusinessId = "chen-digital";

interface BusinessContextValue {
  businesses: Business[];
  businessId: BusinessId;
  business: Business;
  setBusinessId: (id: BusinessId) => void;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businessId, setBusinessIdState] = useState<BusinessId>(DEFAULT_BUSINESS_ID);

  useEffect(() => {
    const stored = window.localStorage.getItem(CURRENT_BUSINESS_KEY);
    if (stored && getBusiness(stored)) {
      // Read once after mount (not during render) to keep SSR/client markup identical and avoid a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBusinessIdState(stored as BusinessId);
    }
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-business-theme", businessId);
  }, [businessId]);

  function setBusinessId(id: BusinessId) {
    setBusinessIdState(id);
    window.localStorage.setItem(CURRENT_BUSINESS_KEY, id);
  }

  const business = useMemo(() => getBusiness(businessId) ?? BUSINESSES[0], [businessId]);

  return (
    <BusinessContext.Provider value={{ businesses: BUSINESSES, businessId, business, setBusinessId }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within a BusinessProvider");
  return ctx;
}
