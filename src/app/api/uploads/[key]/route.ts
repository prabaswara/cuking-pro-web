import { handleRouteError } from "@/lib/api-error";
import { readImage } from "@/lib/storage";
import { requireSession } from "@/lib/session";

type RouteContext = { params: Promise<{ key: string }> };

/**
 * Foto hanya bisa diakses dengan sesi valid (PRD: URL berotorisasi,
 * bukan URL publik permanen).
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireSession();
    const { key } = await params;
    const file = await readImage(key);

    if (!file) {
      return new Response(null, { status: 404 });
    }

    return new Response(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
