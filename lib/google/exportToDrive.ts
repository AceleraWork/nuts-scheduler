import type { drive_v3, sheets_v4 } from "googleapis";
import type { Employee, ScheduleOption, Site } from "@/types";
import { formatMonthEs, formatWeekRangeEs } from "@/lib/time/week";
import { buildScheduleRows } from "@/lib/export/scheduleRows";
import { getDriveClients, getRootFolderId } from "@/lib/google/driveClient";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const SHEET_MIME = "application/vnd.google-apps.spreadsheet";

async function findOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string> {
  const escapedName = name.replace(/'/g, "\\'");
  const query = `name = '${escapedName}' and '${parentId}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`;
  const existing = await drive.files.list({ q: query, fields: "files(id, name)" });
  const found = existing.data.files?.[0];
  if (found?.id) return found.id;

  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: "id",
  });
  if (!created.data.id) throw new Error(`No se pudo crear la carpeta "${name}" en Drive.`);
  return created.data.id;
}

async function createSheetWithRows(
  drive: drive_v3.Drive,
  sheets: sheets_v4.Sheets,
  title: string,
  parentId: string,
  sheetsData: { tabTitle: string; rows: string[][] }[]
): Promise<{ id: string; url: string }> {
  const created = await drive.files.create({
    requestBody: { name: title, mimeType: SHEET_MIME, parents: [parentId] },
    fields: "id, webViewLink",
  });
  const spreadsheetId = created.data.id;
  if (!spreadsheetId) throw new Error(`No se pudo crear el Sheet "${title}".`);

  // El spreadsheet nuevo trae una sola pestaña por defecto ("Hoja 1"); la renombramos para
  // la primera tabla y agregamos una pestaña extra por cada tabla adicional (consolidado).
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const defaultSheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId;

  const requests: sheets_v4.Schema$Request[] = sheetsData.map((tab, i) => {
    if (i === 0 && defaultSheetId !== undefined) {
      return { updateSheetProperties: { properties: { sheetId: defaultSheetId, title: tab.tabTitle }, fields: "title" } };
    }
    return { addSheet: { properties: { title: tab.tabTitle } } };
  });
  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  }

  for (const tab of sheetsData) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tab.tabTitle}'!A1`,
      valueInputOption: "RAW",
      requestBody: { values: tab.rows },
    });
  }

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

export interface ExportScheduleResult {
  folderUrl: string;
  sheetUrls: Record<string, string>;
}

/**
 * Crea (o reutiliza) Mes > Semana en el Drive de Acelera, y dentro un Sheet por sede más
 * uno consolidado con ambas. Idempotente: reexportar la misma semana reutiliza las carpetas.
 */
export async function exportScheduleToDrive(
  option: ScheduleOption,
  employees: Employee[],
  sites: Site[]
): Promise<ExportScheduleResult> {
  const { drive, sheets } = getDriveClients();
  const rootFolderId = getRootFolderId();

  const monthFolderId = await findOrCreateFolder(drive, formatMonthEs(option.weekStartDate), rootFolderId);
  const weekRange = formatWeekRangeEs(option.weekStartDate);
  const weekFolderName = `Horario Nuts Semana del ${weekRange}`;
  const weekFolderId = await findOrCreateFolder(drive, weekFolderName, monthFolderId);

  const sheetUrls: Record<string, string> = {};

  for (const site of sites) {
    const title = `${weekFolderName} - ${site.name}`;
    const rows = buildScheduleRows(option, employees, site.id);
    const sheet = await createSheetWithRows(drive, sheets, title, weekFolderId, [
      { tabTitle: site.name, rows },
    ]);
    sheetUrls[site.id] = sheet.url;
  }

  const consolidatedTitle = `${weekFolderName} - Consolidado`;
  const consolidated = await createSheetWithRows(
    drive,
    sheets,
    consolidatedTitle,
    weekFolderId,
    sites.map((site) => ({ tabTitle: site.name, rows: buildScheduleRows(option, employees, site.id) }))
  );
  sheetUrls.consolidado = consolidated.url;

  return {
    folderUrl: `https://drive.google.com/drive/folders/${weekFolderId}`,
    sheetUrls,
  };
}
