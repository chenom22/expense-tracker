"use client";

import { useBusiness } from "@/context/business-context";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BusinessId } from "@/lib/types";

export function BusinessSwitcher() {
  const { businesses, businessId, setBusinessId } = useBusiness();

  return (
    <Tabs
      value={businessId}
      onValueChange={(value) => setBusinessId(value as BusinessId)}
    >
      <TabsList className="w-full">
        {businesses.map((b) => (
          <TabsTrigger key={b.id} value={b.id} className="flex-1">
            {b.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
