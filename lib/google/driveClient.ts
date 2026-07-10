import { google } from "googleapis";

export class DriveNotConfiguredError extends Error {
  constructor() {
    super(
      "El Drive de Acelera todavía no está conectado. Configura GOOGLE_SERVICE_ACCOUNT_EMAIL, " +
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY y GOOGLE_DRIVE_ROOT_FOLDER_ID en las variables de entorno."
    );
  }
}

/** Cliente autenticado por cuenta de servicio. Server-only — nunca importar desde código de cliente. */
export function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) throw new DriveNotConfiguredError();

  return new google.auth.JWT({
    email,
    // Los env vars suelen guardar la llave con "\n" literales en vez de saltos de línea reales.
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function getRootFolderId(): string {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) throw new DriveNotConfiguredError();
  return rootFolderId;
}

export function getDriveClients() {
  const auth = getGoogleAuth();
  return {
    drive: google.drive({ version: "v3", auth }),
    sheets: google.sheets({ version: "v4", auth }),
  };
}
