import { revalidatePath } from "next/cache";
import { createBackupZip, restoreBackupZip } from "@/lib/backup";
import { getCurrentUser, READ_ONLY_MESSAGE } from "@/lib/auth/session";
import { today } from "@/lib/format";

/** Downloads a complete backup ZIP (all tables + uploaded documents). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!user.canWrite) return new Response(READ_ONLY_MESSAGE, { status: 403 });
  const zip = await createBackupZip();
  return new Response(zip as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Gauri-Home-Management-Backup-${today()}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Restores a backup ZIP uploaded as multipart field `file`. Replaces all current data. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });
  if (!user.canWrite) return Response.json({ error: READ_ONLY_MESSAGE }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "No ZIP file uploaded." }, { status: 400 });
    const counts = await restoreBackupZip(await file.arrayBuffer());
    revalidatePath("/", "layout");
    return Response.json({ ok: true, counts });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Invalid backup ZIP." }, { status: 400 });
  }
}
