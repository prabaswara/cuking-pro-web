import type {
  QueenPregnancyStatus,
  StudBookingStatus,
} from "@/lib/validation/stud";

export const STUD_BOOKING_STATUS_STYLE: Record<
  StudBookingStatus,
  { bg: string; text: string; label: string }
> = {
  requested: { bg: "bg-amber-subtle", text: "text-honey-amber", label: "Diminta" },
  approved: { bg: "bg-lavender-subtle", text: "text-tertiary", label: "Disetujui" },
  ongoing: { bg: "bg-primary-container", text: "text-primary", label: "Berlangsung" },
  completed: { bg: "bg-mint-subtle", text: "text-secondary", label: "Selesai" },
  rejected: {
    bg: "bg-surface-container",
    text: "text-on-surface-variant",
    label: "Ditolak",
  },
  cancelled: {
    bg: "bg-surface-container",
    text: "text-on-surface-variant",
    label: "Dibatalkan",
  },
};

export const PREGNANCY_STATUS_OPTIONS: {
  value: QueenPregnancyStatus;
  label: string;
}[] = [
  { value: "unknown", label: "Belum diketahui" },
  { value: "pregnant", label: "Hamil" },
  { value: "not_pregnant", label: "Tidak hamil" },
  { value: "delivered", label: "Sudah melahirkan" },
];

export function whatsappUrl(number: string, message: string): string {
  const normalized = number.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}
