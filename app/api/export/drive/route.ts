import { NextResponse } from "next/server";
import { exportScheduleToDrive } from "@/lib/google/exportToDrive";
import { DriveNotConfiguredError } from "@/lib/google/driveClient";
import type { Employee, ScheduleOption, Site } from "@/types";

interface ExportDriveRequestBody {
  option: ScheduleOption;
  employees: Employee[];
  sites: Site[];
}

export async function POST(request: Request) {
  let body: ExportDriveRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido en la solicitud." }, { status: 400 });
  }

  try {
    const result = await exportScheduleToDrive(body.option, body.employees, body.sites);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DriveNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Error desconocido exportando a Drive.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
