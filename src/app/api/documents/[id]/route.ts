import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/** Serves an uploaded document from SQLite. Add `?download=1` to force a download. */
export async function GET(request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  const filename = encodeURIComponent(doc.name);
  return new Response(doc.data, {
    headers: {
      "Content-Type": doc.mime,
      "Content-Length": String(doc.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
