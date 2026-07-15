import type { PublicHoliday } from "@/types";

interface NagerHoliday {
  date: string;
  localName: string;
}

/** Festivos de Colombia para un año dado, vía la API gratuita Nager.Date (sin API key). */
export async function fetchColombiaHolidays(year: number): Promise<PublicHoliday[]> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CO`);
  if (!res.ok) throw new Error(`No se pudieron obtener los festivos de ${year}`);
  const data: NagerHoliday[] = await res.json();
  return data.map((h) => ({ date: h.date, name: h.localName }));
}
