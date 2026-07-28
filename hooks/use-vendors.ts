"use client";

import { useCallback, useEffect, useState } from "react";
import { repository } from "@/lib/data";
import type { BusinessId, RecurringVendor, RecurringVendorInput } from "@/lib/types";

export function useVendors(businessId: BusinessId) {
  const [vendors, setVendors] = useState<RecurringVendor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await repository.listVendors(businessId);
    setVendors(data);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    // Fetch on mount and whenever the selected business changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const addVendor = useCallback(
    async (input: RecurringVendorInput) => {
      await repository.createVendor(input);
      await load();
    },
    [load]
  );

  const editVendor = useCallback(
    async (id: string, input: RecurringVendorInput) => {
      await repository.updateVendor(id, input);
      await load();
    },
    [load]
  );

  const removeVendor = useCallback(
    async (id: string) => {
      await repository.deleteVendor(id);
      await load();
    },
    [load]
  );

  return { vendors, loading, addVendor, editVendor, removeVendor };
}
