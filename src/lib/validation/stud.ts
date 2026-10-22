import { z } from "zod";
import { isFutureDate } from "@/lib/date";

/**
 * Validasi Fase 4: profil pejantan pacak, booking klien, dan catatan kawin.
 * Aturan yang bergantung pada data lama (tarif hasil merge, transisi status,
 * kawin pertama) diperiksa ulang di lapisan data.
 */

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

const optionalRupiah = z
  .number()
  .int("Nominal harus bilangan bulat")
  .min(0, "Nominal tidak boleh negatif")
  .max(1_000_000_000_000, "Nominal terlalu besar")
  .nullable()
  .optional();

function issueNotFuture(
  value: string | null | undefined,
  path: string,
  ctx: z.RefinementCtx,
) {
  if (value && isFutureDate(value)) {
    ctx.addIssue({
      code: "custom",
      message: "Tanggal tidak boleh di masa depan",
      path: [path],
    });
  }
}

export const studServiceCreateSchema = z
  .object({
    catId: z.uuid("Pilih kucing jantan"),
    feeAmount: optionalRupiah,
    feeDescription: optionalText(200),
    notes: optionalText(1000),
    isAvailable: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.feeAmount == null && !data.feeDescription?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Isi tarif nominal atau deskripsi tarif",
        path: ["feeAmount"],
      });
    }
  });

export const studServiceUpdateSchema = z
  .object({
    feeAmount: optionalRupiah,
    feeDescription: optionalText(200),
    notes: optionalText(1000),
    isAvailable: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  });

export const studBookingStatusSchema = z.enum([
  "requested",
  "approved",
  "ongoing",
  "completed",
  "rejected",
  "cancelled",
]);

export const queenPregnancyStatusSchema = z.enum([
  "unknown",
  "pregnant",
  "not_pregnant",
  "delivered",
]);

const bookingFields = {
  studServiceId: z.uuid("Pilih pejantan"),
  clientName: z
    .string()
    .trim()
    .min(1, "Nama klien wajib diisi")
    .max(120, "Nama klien maksimal 120 karakter"),
  clientWhatsapp: z
    .string()
    .trim()
    .min(5, "Nomor WhatsApp wajib diisi")
    .max(30, "Nomor WhatsApp maksimal 30 karakter"),
  queenName: z
    .string()
    .trim()
    .min(1, "Nama betina wajib diisi")
    .max(120, "Nama betina maksimal 120 karakter"),
  queenBreed: optionalText(120),
  queenAgeText: optionalText(50),
  plannedDate: isoDate.nullable().optional(),
  feeAgreed: optionalRupiah,
  depositAmount: optionalRupiah,
  depositPaid: z.boolean(),
  notes: optionalText(2000),
};

export const studBookingCreateSchema = z.object({
  ...bookingFields,
  depositPaid: z.boolean().default(false),
});

export const studBookingUpdateSchema = z
  .object({
    ...bookingFields,
    status: studBookingStatusSchema.optional(),
    expectedDueDate: isoDate.nullable().optional(),
    expectedDueDateManual: z.boolean().optional(),
    queenPregnancyStatus: queenPregnancyStatusSchema.optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  });

export const studBookingListQuerySchema = z.object({
  status: studBookingStatusSchema.optional(),
  studServiceId: z.uuid("ID pejantan tidak valid").optional(),
  plannedDate: isoDate.optional(),
});

export const studMatingCreateSchema = z
  .object({
    matingDate: isoDate,
    notes: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    issueNotFuture(data.matingDate, "matingDate", ctx);
  });

export type StudServiceCreateInput = z.infer<typeof studServiceCreateSchema>;
export type StudServiceUpdateInput = z.infer<typeof studServiceUpdateSchema>;
export type StudBookingCreateInput = z.infer<typeof studBookingCreateSchema>;
export type StudBookingUpdateInput = z.infer<typeof studBookingUpdateSchema>;
export type StudBookingListQuery = z.infer<typeof studBookingListQuerySchema>;
export type StudMatingCreateInput = z.infer<typeof studMatingCreateSchema>;
export type StudBookingStatus = z.infer<typeof studBookingStatusSchema>;
export type QueenPregnancyStatus = z.infer<typeof queenPregnancyStatusSchema>;
