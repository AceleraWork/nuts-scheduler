import { create } from "zustand";
import { getSites, insertSiteRow, updateSiteRow } from "@/lib/data/sites";
import type { Site, SiteId } from "@/types";

/** Orden fijo de visualización (tabs, dropdowns, tarjetas). Sedes que no estén acá
 * (ej. una creada a mano desde "Crear sede nueva") caen al final, en el orden que
 * devuelva Supabase. */
const SITE_DISPLAY_ORDER: SiteId[] = ["calle-93", "calle-81", "planta"];

function sortSites(sites: Site[]): Site[] {
  return [...sites].sort((a, b) => {
    const ai = SITE_DISPLAY_ORDER.indexOf(a.id);
    const bi = SITE_DISPLAY_ORDER.indexOf(b.id);
    return (ai === -1 ? SITE_DISPLAY_ORDER.length : ai) - (bi === -1 ? SITE_DISPLAY_ORDER.length : bi);
  });
}

interface SitesState {
  sites: Site[];
  initialize: () => Promise<void>;
  addSite: (site: Site) => Promise<void>;
  updateSite: (site: Site) => Promise<void>;
}

export const useSitesStore = create<SitesState>()((set) => ({
  sites: [],
  initialize: async () => {
    const sites = await getSites();
    set({ sites: sortSites(sites) });
  },
  addSite: async (site) => {
    await insertSiteRow(site);
    set((state) => ({ sites: [...state.sites, site] }));
  },
  updateSite: async (site) => {
    await updateSiteRow(site);
    set((state) => ({
      sites: state.sites.map((s) => (s.id === site.id ? site : s)),
    }));
  },
}));

/** Lookup síncrono para vistas/exportaciones que no pueden esperar una promesa (asume que el store ya se inicializó). */
export function getSiteName(id: SiteId): string {
  return useSitesStore.getState().sites.find((s) => s.id === id)?.name ?? id;
}
