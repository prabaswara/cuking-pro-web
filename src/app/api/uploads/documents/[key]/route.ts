import { handleRouteError } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import { readStoredDocument } from "@/lib/storage";

type RouteContext = { params: Promise<{ key: string }> };

/** Dokumen hanya bisa diakses dengan sesi valid. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireSession();
    const { key } = await params;
    const file = await readStoredDocument(key);

    if (!file) {
      return new Response(null, { status: 404 });
    }

    return new Response(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
