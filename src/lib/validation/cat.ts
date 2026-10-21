import { z } from "zod";

export const catSexSchema = z.enum(["male", "female"], {
  message: "Jenis kelamin wajib dipilih",
});

export const catStatusSchema = z.enum(["active", "sold", "deceased"]);
export const trackingStatusSchema = z.enum(["tracked", "frozen"]);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

const optionalText = (max: number, message?: string) =>
  z
    .string()
    .trim()
    .max(max, message ?? `Maksimal ${max} karakter`)
    .nullable()
    .optional();

/** Field yang boleh diisi saat membuat kucing (FR-03). */
const catBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama kucing wajib diisi")
    .max(80, "Nama maksimal 80 karakter"),
  sex: catSexSchema,
  breed: optionalText(80),
  color: optionalText(80),
  birthDate: isoDate.nullable().optional(),
  photoPath: optionalText(255),
  isNeutered: z.boolean().optional(),
  microchipNo: optionalText(64),
  pedigreeNo: optionalText(64),
  sireId: z.uuid("ID ayah tidak valid").nullable().optional(),
  sireNameManual: optionalText(80),
  damId: z.uuid("ID ibu tidak valid").nullable().optional(),
  damNameManual: optionalText(80),
  status: catStatusSchema.optional(),
  notes: optionalText(2000),
});

export const catCreateSchema = catBaseSchema
  .refine(
    (data) => !(data.sireId && data.sireNameManual),
    {
      message: "Pilih ayah dari daftar atau isi nama manual, jangan keduanya",
      path: ["sireNameManual"],
    },
  )
  .refine(
    (data) => !(data.damId && data.damNameManual),
    {
      message: "Pilih ibu dari daftar atau isi nama manual, jangan keduanya",
      path: ["damNameManual"],
    },
  );

export const catUpdateSchema = catBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  });

export const catTrackingSchema = z.object({
  trackingStatus: trackingStatusSchema,
});

export const catListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  sex: catSexSchema.optional(),
  status: z.enum(["active", "sold", "deceased", "all"]).optional(),
});

export type CatCreateInput = z.infer<typeof catCreateSchema>;
export type CatUpdateInput = z.infer<typeof catUpdateSchema>;
export type CatListQuery = z.infer<typeof catListQuerySchema>;
