import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import { ApiError } from "@/lib/api-error";

/**
 * Penyimpanan berkas — implementasi lokal dulu (Fase 1).
 * Ganti ke S3/R2 cukup dengan menambah implementasi `StorageDriver`
 * dan memilihnya lewat env; pemanggil tidak perlu berubah.
 *
 * Berkas TIDAK disimpan di `public/` karena PRD mewajibkan akses
 * berotorisasi, bukan URL publik permanen.
 */

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type StoredImage = {
  /** Nama berkas, dipakai sebagai path di `/api/uploads/<key>`. */
  key: string;
  contentType: string;
  size: number;
};

function assertKey(key: string) {
  if (!/^[a-f0-9-]+\.webp$/.test(key)) {
    throw new ApiError("NOT_FOUND", "Berkas tidak ditemukan.");
  }
}

/** Validasi + kompresi + simpan. Melempar ApiError untuk input tidak sah. */
export async function saveImage(file: File): Promise<StoredImage> {
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError("VALIDATION_ERROR", "Pilih berkas gambar terlebih dahulu.", {
      field: "file",
    });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError("VALIDATION_ERROR", "Ukuran foto maksimal 5 MB.", {
      field: "file",
    });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    throw new ApiError("VALIDATION_ERROR", "Format foto harus JPEG, PNG, atau WebP.", {
      field: "file",
    });
  }

  const input = Buffer.from(await file.arrayBuffer());

  // Cek isi berkas, bukan hanya MIME dari klien.
  let metadata: Metadata;
  try {
    metadata = await sharp(input).metadata();
  } catch {
    throw new ApiError("VALIDATION_ERROR", "Berkas bukan gambar yang valid.", {
      field: "file",
    });
  }

  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
    throw new ApiError("VALIDATION_ERROR", "Format foto harus JPEG, PNG, atau WebP.", {
      field: "file",
    });
  }

  const output = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const key = `${randomUUID()}.webp`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), output);

  return { key, contentType: "image/webp", size: output.byteLength };
}

export async function readImage(key: string) {
  assertKey(key);

  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, key));
    return { buffer, contentType: "image/webp" };
  } catch {
    return null;
  }
}

export async function deleteImage(key: string) {
  try {
    assertKey(key);
    await unlink(path.join(UPLOAD_DIR, key));
  } catch {
    // Berkas sudah tidak ada — tidak perlu error.
  }
}

export const UPLOAD_LIMITS = {
  maxBytes: MAX_UPLOAD_BYTES,
  allowedMime: [...ALLOWED_MIME],
} as const;

// ============================================================
// Dokumen (PDF / gambar) — brankas dokumen per kucing
// ============================================================

const DOCUMENT_DIR = path.join(process.cwd(), ".data", "documents");
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

const DOCUMENT_MIME: Record<string, { ext: string; fileType: "pdf" | "image" }> = {
  "application/pdf": { ext: "pdf", fileType: "pdf" },
  "image/jpeg": { ext: "jpg", fileType: "image" },
  "image/png": { ext: "png", fileType: "image" },
  "image/webp": { ext: "webp", fileType: "image" },
};

export type StoredDocument = {
  key: string;
  contentType: string;
  size: number;
  fileType: "pdf" | "image";
};

function assertDocumentKey(key: string) {
  if (!/^[a-f0-9-]+\.(pdf|jpg|png|webp)$/.test(key)) {
    throw new ApiError("NOT_FOUND", "Berkas tidak ditemukan.");
  }
}

/** Validasi dan simpan dokumen apa adanya (tanpa kompresi). */
export async function saveStoredDocument(file: File): Promise<StoredDocument> {
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError("VALIDATION_ERROR", "Pilih berkas terlebih dahulu.", {
      field: "file",
    });
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new ApiError("VALIDATION_ERROR", "Ukuran dokumen maksimal 15 MB.", {
      field: "file",
    });
  }

  const mime = DOCUMENT_MIME[file.type];

  if (!mime) {
    throw new ApiError("VALIDATION_ERROR", "Format dokumen harus PDF, JPG, PNG, atau WebP.", {
      field: "file",
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Verifikasi isi berkas, bukan hanya MIME dari klien.
  if (mime.fileType === "pdf") {
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      throw new ApiError("VALIDATION_ERROR", "Berkas bukan PDF yang valid.", {
        field: "file",
      });
    }
  } else {
    try {
      const metadata = await sharp(buffer).metadata();
      if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
        throw new Error("invalid image");
      }
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Berkas bukan gambar yang valid.", {
        field: "file",
      });
    }
  }

  const key = `${randomUUID()}.${mime.ext}`;
  await mkdir(DOCUMENT_DIR, { recursive: true });
  await writeFile(path.join(DOCUMENT_DIR, key), buffer);

  return { key, contentType: file.type, size: buffer.byteLength, fileType: mime.fileType };
}

export async function readStoredDocument(key: string) {
  assertDocumentKey(key);

  try {
    const buffer = await readFile(path.join(DOCUMENT_DIR, key));
    const ext = key.split(".").pop();
    const contentType =
      ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "jpg" ? "image/jpeg" : "image/webp";

    return { buffer, contentType };
  } catch {
    return null;
  }
}

/**
 * Terima key mentah atau path `/api/uploads/documents/<key>`.
 * Path di luar penyimpanan dokumen diabaikan (tidak pernah menghapus
 * berkas sembarangan).
 */
export async function deleteStoredDocument(keyOrPath: string) {
  const prefix = "/api/uploads/documents/";
  const key = keyOrPath.startsWith(prefix)
    ? keyOrPath.slice(prefix.length)
    : keyOrPath;

  try {
    assertDocumentKey(key);
    await unlink(path.join(DOCUMENT_DIR, key));
  } catch {
    // Berkas sudah tidak ada — tidak perlu error.
  }
}

export const DOCUMENT_LIMITS = {
  maxBytes: MAX_DOCUMENT_BYTES,
  allowedMime: Object.keys(DOCUMENT_MIME),
} as const;
