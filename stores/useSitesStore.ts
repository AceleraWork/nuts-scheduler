import { create } from "zustand";
import { getSites } from "@/lib/data/sites";
import type { Site, SiteId } from "@/types";

interface SitesState {
  sites: Site[];
  initialize: () => Promise<void>;
}

export const useSitesStore = create<SitesState>()((set) => ({
  sites: [],
  initialize: async () => {
    const sites = await getSites();
    set({ sites });
  },
}));

/** Lookup síncrono para vistas/exportaciones que no pueden esperar una promesa (asume que el store ya se inicializó). */
export function getSiteName(id: SiteId): string {
  return useSitesStore.getState().sites.find((s) => s.id === id)?.name ?? id;
}
