import { z } from "zod";
import { isFutureDate } from "@/lib/date";

/**
 * Validasi Fase 3: siklus birahi, catatan kawin, kelahiran, anak kucing.
 * Aturan silang (endDate ≥ startDate, totalAlive ≤ totalBorn) juga
 * diperiksa ulang di lapisan data setelah nilai lama digabung.
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

export const heatCycleCreateSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate.nullable().optional(),
    notes: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    issueNotFuture(data.startDate, "startDate", ctx);
    issueNotFuture(data.endDate, "endDate", ctx);

    if (data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
        path: ["endDate"],
      });
    }
  });

export const heatCycleUpdateSchema = z
  .object({
    startDate: isoDate.optional(),
    endDate: isoDate.nullable().optional(),
    notes: optionalText(1000),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  })
  .superRefine((data, ctx) => {
    issueNotFuture(data.startDate, "startDate", ctx);
    issueNotFuture(data.endDate, "endDate", ctx);

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
        path: ["endDate"],
      });
    }
  });

export const matingOutcomeSchema = z.enum([
  "pending",
  "pregnant",
  "not_pregnant",
  "delivered",
]);

const matingFields = {
  queenId: z.uuid("ID betina tidak valid").nullable().optional(),
  queenNameManual: optionalText(120),
  sireId: z.uuid("ID pejantan tidak valid").nullable().optional(),
  sireNameManual: optionalText(120),
  matingDate: isoDate,
  outcome: matingOutcomeSchema,
  expectedDueDate: isoDate.nullable().optional(),
  notes: optionalText(2000),
};

function issueParents(
  data: {
    queenId?: string | null;
    queenNameManual?: string | null;
    sireId?: string | null;
    sireNameManual?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (!data.queenId && !data.queenNameManual?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Pilih betina atau isi nama betina luar",
      path: ["queenId"],
    });
  }

  if (!data.sireId && !data.sireNameManual?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Pilih pejantan atau isi nama pejantan luar",
      path: ["sireId"],
    });
  }

  if (data.queenId && data.sireId && data.queenId === data.sireId) {
    ctx.addIssue({
      code: "custom",
      message: "Betina dan pejantan tidak boleh kucing yang sama",
      path: ["sireId"],
    });
  }
}

function issueDates(
  data: { matingDate?: string; expectedDueDate?: string | null },
  ctx: z.RefinementCtx,
) {
  issueNotFuture(data.matingDate, "matingDate", ctx);

  if (
    data.matingDate &&
    data.expectedDueDate &&
    data.expectedDueDate < data.matingDate
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Estimasi lahir tidak boleh sebelum tanggal kawin",
      path: ["expectedDueDate"],
    });
  }
}

export const matingCreateSchema = z
  .object({
    ...matingFields,
    outcome: matingOutcomeSchema.default("pending"),
  })
  .superRefine((data, ctx) => {
    issueParents(data, ctx);
    issueDates(data, ctx);
  });

export const matingUpdateSchema = z
  .object(matingFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  })
  .superRefine((data, ctx) => issueDates(data, ctx));

export const matingListQuerySchema = z.object({
  outcome: matingOutcomeSchema.optional(),
});

export const litterCreateSchema = z
  .object({
    birthDate: isoDate,
    totalBorn: z
      .number()
      .int("Jumlah lahir harus bilangan bulat")
      .min(1, "Jumlah lahir minimal 1")
      .max(20, "Jumlah lahir maksimal 20"),
    totalAlive: z
      .number()
      .int("Jumlah hidup harus bilangan bulat")
      .min(0, "Jumlah hidup tidak boleh negatif")
      .max(20, "Jumlah hidup maksimal 20"),
    notes: optionalText(1000),
  })
  .superRefine((data, ctx) => {
    issueNotFuture(data.birthDate, "birthDate", ctx);

    if (data.totalAlive > data.totalBorn) {
      ctx.addIssue({
        code: "custom",
        message: "Jumlah hidup tidak boleh lebih dari jumlah lahir",
        path: ["totalAlive"],
      });
    }
  });

export const kittenCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .max(80, "Nama maksimal 80 karakter"),
  sex: z.enum(["male", "female"], "Pilih jenis kelamin"),
  breed: optionalText(120),
  color: optionalText(80),
  birthDate: isoDate
    .nullable()
    .optional()
    .refine((value) => !value || !isFutureDate(value), {
      message: "Tanggal tidak boleh di masa depan",
    }),
  photoPath: optionalText(255),
  notes: optionalText(1000),
});

export type HeatCycleCreateInput = z.infer<typeof heatCycleCreateSchema>;
export type HeatCycleUpdateInput = z.infer<typeof heatCycleUpdateSchema>;
export type MatingCreateInput = z.infer<typeof matingCreateSchema>;
export type MatingUpdateInput = z.infer<typeof matingUpdateSchema>;
export type MatingListQuery = z.infer<typeof matingListQuerySchema>;
export type MatingOutcome = z.infer<typeof matingOutcomeSchema>;
export type LitterCreateInput = z.infer<typeof litterCreateSchema>;
export type KittenCreateInput = z.infer<typeof kittenCreateSchema>;
