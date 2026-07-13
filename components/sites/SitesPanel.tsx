"use client";

import { Building2 } from "lucide-react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { SiteCard } from "@/components/sites/SiteCard";
import { SitesMenu } from "@/components/sites/SitesMenu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSitesStore } from "@/stores/useSitesStore";

export function SitesPanel() {
  const sites = useSitesStore((s) => s.sites);

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        icon={Building2}
        title="Sedes"
        subtitle="Puntos y planta"
        action={<SitesMenu />}
      />
      <ScrollArea className="min-h-0 flex-1 @container">
        <div className="grid grid-cols-1 gap-3 p-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
