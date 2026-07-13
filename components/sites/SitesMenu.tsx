"use client";

import { useState } from "react";
import { MapPinPlus, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SiteCreateDialog } from "@/components/sites/SiteCreateDialog";

export function SitesMenu() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          <Building2 className="size-3.5" />
          Sedes
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <MapPinPlus className="size-4" />
            Crear nueva sede
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SiteCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
