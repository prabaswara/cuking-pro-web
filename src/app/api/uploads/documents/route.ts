import { handleRouteError, ApiError } from "@/lib/api-error";
import { requireSession } from "@/lib/session";
import { saveStoredDocument } from "@/lib/storage";

/** Unggah berkas dokumen (PDF/JPG/PNG/WebP) — wajib sesi. */
export async function POST(request: Request) {
  try {
    await requireSession();

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "File dokumen wajib dikirim.", {
        field: "file",
      });
    }

    const stored = await saveStoredDocument(file);

    return Response.json(
      {
        path: `/api/uploads/documents/${stored.key}`,
        key: stored.key,
        contentType: stored.contentType,
        size: stored.size,
        fileType: stored.fileType,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
