import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .nullable()
    .optional();

const feedingBaseSchema = z.object({
  scheduleTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format waktu harus HH:MM"),
  portionGrams: z
    .number()
    .int("Porsi harus bilangan bulat")
    .positive("Porsi harus lebih dari 0 gram")
    .max(5000, "Porsi maksimal 5000 gram"),
  foodType: z
    .string()
    .trim()
    .min(1, "Jenis pakan wajib diisi")
    .max(120, "Jenis pakan maksimal 120 karakter"),
  notes: optionalText(1000),
});

export const feedingCreateSchema = feedingBaseSchema;

export const feedingUpdateSchema = feedingBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  });

export type FeedingCreateInput = z.infer<typeof feedingCreateSchema>;
export type FeedingUpdateInput = z.infer<typeof feedingUpdateSchema>;
