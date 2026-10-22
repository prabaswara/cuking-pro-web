import { z } from "zod";
import { todayIso } from "@/lib/date";

export const documentCategorySchema = z.enum([
  "pedigree",
  "vaccine_book",
  "lab",
  "registration",
  "other",
]);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .nullable()
    .optional();

const documentBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul dokumen wajib diisi")
    .max(120, "Judul maksimal 120 karakter"),
  category: documentCategorySchema.default("other"),
  filePath: optionalText(255),
  fileType: z.enum(["pdf", "image"]).default("pdf"),
  sizeBytes: z
    .number()
    .int()
    .min(0)
    .max(15 * 1024 * 1024, "Ukuran berkas maksimal 15 MB")
    .nullable()
    .optional(),
  uploadedAt: isoDate.default(todayIso()),
  source: optionalText(80),
  notes: optionalText(1000),
});

export const documentCreateSchema = documentBaseSchema;

export const documentUpdateSchema = documentBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  });

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
