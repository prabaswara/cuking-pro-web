import { z } from "zod";

/** Format WhatsApp Indonesia: 08xxx atau +62xxx (FR-02). */
const WHATSAPP_REGEX = /^(08\d{8,12}|\+62\d{8,12})$/;

export const profileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama wajib diisi")
      .max(100, "Nama maksimal 100 karakter")
      .optional(),
    whatsapp: z
      .string()
      .trim()
      .regex(WHATSAPP_REGEX, "Nomor WhatsApp harus diawali 08 atau +62")
      .nullable()
      .optional(),
    kennelName: z
      .string()
      .trim()
      .max(100, "Nama kennel maksimal 100 karakter")
      .nullable()
      .optional(),
    avatarPath: z.string().trim().max(255).nullable().optional(),
    isBreeder: z.boolean().optional(),
    isStudProvider: z.boolean().optional(),
    emailRemindersEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
