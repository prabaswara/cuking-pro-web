import { z } from "zod";
import { isFutureDate, todayIso } from "@/lib/date";

export const healthTypeSchema = z.enum([
  "vaccine",
  "deworming",
  "flea",
  "vet_visit",
  "medication",
  "weight",
  "other",
]);

export type HealthType = z.infer<typeof healthTypeSchema>;

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

const healthBaseSchema = z.object({
  type: healthTypeSchema,
  title: optionalText(120),
  recordDate: isoDate,
  nextDueDate: isoDate.nullable().optional(),
  weightKg: z
    .number()
    .positive("Berat badan harus lebih dari 0 kg")
    .max(20, "Berat badan maksimal 20 kg")
    .nullable()
    .optional(),
  vetName: optionalText(120),
  cost: z
    .number()
    .int("Biaya harus bilangan bulat")
    .min(0, "Biaya tidak boleh negatif")
    .max(1_000_000_000, "Biaya terlalu besar")
    .nullable()
    .optional(),
  photoPath: optionalText(255),
  notes: optionalText(2000),
});

function issueFutureDate(
  data: { recordDate?: string },
  ctx: z.RefinementCtx,
) {
  if (data.recordDate && isFutureDate(data.recordDate)) {
    ctx.addIssue({
      code: "custom",
      message: "Tanggal tidak boleh di masa depan",
      path: ["recordDate"],
    });
  }
}

function issueNextDueDate(
  data: { recordDate?: string; nextDueDate?: string | null },
  ctx: z.RefinementCtx,
) {
  if (data.nextDueDate && data.recordDate && data.nextDueDate < data.recordDate) {
    ctx.addIssue({
      code: "custom",
      message: "Tanggal berikutnya tidak boleh sebelum tanggal catatan",
      path: ["nextDueDate"],
    });
  }
}

export const healthCreateSchema = healthBaseSchema.superRefine((data, ctx) => {
  issueFutureDate(data, ctx);
  issueNextDueDate(data, ctx);

  if (data.type === "weight" && data.weightKg == null) {
    ctx.addIssue({
      code: "custom",
      message: "Berat badan wajib diisi",
      path: ["weightKg"],
    });
  }
});

export const healthUpdateSchema = healthBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: "custom", message: "Tidak ada data yang diubah" });
    }

    issueFutureDate(data, ctx);
    issueNextDueDate(data, ctx);

    if (data.type === "weight" && data.weightKg === null) {
      ctx.addIssue({
        code: "custom",
        message: "Berat badan wajib diisi",
        path: ["weightKg"],
      });
    }
  });

export const healthListQuerySchema = z.object({
  type: healthTypeSchema.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

/** Payload khusus halaman Berat (dipetakan ke health_records type='weight'). */
const weightFields = {
  recordDate: isoDate,
  weightKg: z
    .number()
    .positive("Berat badan harus lebih dari 0 kg")
    .max(20, "Berat badan maksimal 20 kg"),
  notes: optionalText(2000),
};

export const weightCreateSchema = z.object({
  ...weightFields,
  recordDate: isoDate.default(todayIso()),
});

export const weightUpdateSchema = z
  .object(weightFields)
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: "custom", message: "Tidak ada data yang diubah" });
    }
    issueFutureDate(data, ctx);
  });

export type HealthCreateInput = z.infer<typeof healthCreateSchema>;
export type HealthUpdateInput = z.infer<typeof healthUpdateSchema>;
export type HealthListQuery = z.infer<typeof healthListQuerySchema>;
export type WeightCreateInput = z.infer<typeof weightCreateSchema>;
export type WeightUpdateInput = z.infer<typeof weightUpdateSchema>;
