"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSitesStore } from "@/stores/useSitesStore";
import type { SiteId } from "@/types";

export type SiteFilter = SiteId | "todas";

interface SiteFilterTabsProps {
  value: SiteFilter;
  onChange: (value: SiteFilter) => void;
}

export function SiteFilterTabs({ value, onChange }: SiteFilterTabsProps) {
  const sites = useSitesStore((s) => s.sites);
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as SiteFilter)}>
      <TabsList variant="line">
        <TabsTrigger value="todas">Todas</TabsTrigger>
        {sites.map((site) => (
          <TabsTrigger key={site.id} value={site.id}>
            {site.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
