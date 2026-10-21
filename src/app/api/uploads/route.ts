import { handleRouteError, ApiError } from "@/lib/api-error";
import { saveImage } from "@/lib/storage";
import { requireSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    await requireSession();

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "File foto wajib dikirim.", {
        field: "file",
      });
    }

    const stored = await saveImage(file);

    return Response.json(
      {
        path: `/api/uploads/${stored.key}`,
        key: stored.key,
        contentType: stored.contentType,
        size: stored.size,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
