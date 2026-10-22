import type { documentCategorySchema } from "@/lib/validation/document";
import type { healthTypeSchema } from "@/lib/validation/health";
import type { z } from "zod";

export type HealthType = z.infer<typeof healthTypeSchema>;

export const HEALTH_TYPE_LABEL: Record<HealthType, string> = {
  vaccine: "Vaksinasi",
  deworming: "Obat Cacing",
  flea: "Obat Kutu",
  vet_visit: "Kunjungan Dokter",
  medication: "Pengobatan",
  weight: "Berat Badan",
  other: "Lainnya",
};

export type DocumentCategory = z.infer<typeof documentCategorySchema>;

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  pedigree: "Pedigree",
  vaccine_book: "Buku Vaksin",
  lab: "Hasil Lab / USG",
  registration: "Registrasi",
  other: "Lainnya",
};

export function healthTypeLabel(type: HealthType): string {
  return HEALTH_TYPE_LABEL[type];
}

export function documentCategoryLabel(category: DocumentCategory): string {
  return DOCUMENT_CATEGORY_LABEL[category];
}
