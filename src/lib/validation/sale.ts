import { z } from "zod";
import { isFutureDate } from "@/lib/date";

/**
 * Validasi penjualan kucing (FR-19). Aturan status bergantung satu sama
 * lain, jadi `checkSaleRules` dipakai ulang setelah data lama digabung.
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

export const catSaleStatusSchema = z.enum([
  "listed",
  "reserved",
  "sold",
  "cancelled",
]);

const saleBaseFields = {
  catId: z.uuid("ID kucing tidak valid").nullable().optional(),
  status: catSaleStatusSchema,
  askingPrice: optionalRupiah,
  buyerName: optionalText(120),
  buyerWhatsapp: optionalText(30),
  finalPrice: optionalRupiah,
  depositAmount: optionalRupiah,
  depositPaid: z.boolean(),
  saleDate: isoDate.nullable().optional(),
  notes: optionalText(2000),
};

const saleCreateFields = {
  ...saleBaseFields,
  status: catSaleStatusSchema.default("listed"),
  depositPaid: z.boolean().default(false),
};

export type SaleRulesInput = {
  status: z.infer<typeof catSaleStatusSchema>;
  buyerName?: string | null;
  finalPrice?: number | null;
  depositAmount?: number | null;
  saleDate?: string | null;
};

export function checkSaleRules(
  data: SaleRulesInput,
  ctx: z.RefinementCtx,
): void {
  if (
    (data.status === "reserved" || data.status === "sold") &&
    !data.buyerName?.trim()
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Nama pembeli wajib diisi untuk status ini",
      path: ["buyerName"],
    });
  }

  if (data.status === "sold") {
    if (data.finalPrice == null) {
      ctx.addIssue({
        code: "custom",
        message: "Harga akhir wajib diisi saat terjual",
        path: ["finalPrice"],
      });
    }

    if (!data.saleDate) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal jual wajib diisi saat terjual",
        path: ["saleDate"],
      });
    }
  }

  if (data.saleDate && isFutureDate(data.saleDate)) {
    ctx.addIssue({
      code: "custom",
      message: "Tanggal jual tidak boleh di masa depan",
      path: ["saleDate"],
    });
  }

  if (
    data.depositAmount != null &&
    data.finalPrice != null &&
    data.depositAmount > data.finalPrice
  ) {
    ctx.addIssue({
      code: "custom",
      message: "DP tidak boleh lebih besar dari harga akhir",
      path: ["depositAmount"],
    });
  }
}

export const saleCreateSchema = z
  .object({
    ...saleCreateFields,
    catId: z.uuid("Pilih kucing yang dijual"),
  })
  .superRefine(checkSaleRules);

export const saleUpdateSchema = z
  .object(saleBaseFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Tidak ada data yang diubah",
  });

/** Dipakai lapisan data untuk memeriksa state penjualan setelah merge. */
export const saleStateSchema = z
  .object(saleCreateFields)
  .superRefine(checkSaleRules);

export const saleListQuerySchema = z.object({
  status: catSaleStatusSchema.optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format bulan harus YYYY-MM")
    .optional(),
});

export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
export type SaleUpdateInput = z.infer<typeof saleUpdateSchema>;
export type SaleListQuery = z.infer<typeof saleListQuerySchema>;
export type CatSaleStatus = z.infer<typeof catSaleStatusSchema>;
