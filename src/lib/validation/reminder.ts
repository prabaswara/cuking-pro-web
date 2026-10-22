import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

export const reminderSourceSchema = z.enum([
  "health",
  "pregnancy",
  "booking_planned",
  "booking_due",
  "manual",
]);

export const reminderCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul pengingat wajib diisi")
    .max(120, "Judul maksimal 120 karakter"),
  dueDate: isoDate,
  catId: z.uuid("ID kucing tidak valid").nullable().optional(),
});

export const reminderUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul pengingat wajib diisi")
      .max(120, "Judul maksimal 120 karakter")
      .optional(),
    dueDate: isoDate.optional(),
    catId: z.uuid("ID kucing tidak valid").nullable().optional(),
    done: z.boolean().optional(),
    /** Geser jatuh tempo; nilai lama/terlewat digeser dari hari ini. */
    postponeDays: z
      .number()
      .int()
      .min(1, "Minimal 1 hari")
      .max(30, "Maksimal 30 hari")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  })
  .refine((data) => !(data.done !== undefined && data.postponeDays !== undefined), {
    message: "Pilih tandai selesai atau tunda, jangan keduanya",
  });

export const reminderListQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  done: z.enum(["all", "true", "false"]).optional(),
});

export type ReminderCreateInput = z.infer<typeof reminderCreateSchema>;
export type ReminderUpdateInput = z.infer<typeof reminderUpdateSchema>;
export type ReminderListQuery = z.infer<typeof reminderListQuerySchema>;
