/**
 * Helper tanggal untuk backend & UI.
 * Tanggal "date-only" selalu diperlakukan sebagai tanggal kalender lokal
 * (YYYY-MM-DD), bukan UTC, agar tidak bergeser satu hari di zona waktu negatif.
 */

export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Ubah Date menjadi YYYY-MM-DD memakai komponen lokal. */
export function toIsoDate(date: Date): string {
  return todayIso(date);
}

/** Tambah/kurangi hari pada string YYYY-MM-DD. */
export function addDaysIso(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

/** Selisih hari antara dua tanggal (YYYY-MM-DD); positif bila `to` lebih akhir. */
export function daysBetweenIso(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00`).getTime() -
      new Date(`${from}T00:00:00`).getTime()) /
      86_400_000,
  );
}

/** Selisih hari dari hari ini ke tanggal (negatif = sudah lewat). */
export function daysUntil(dateStr: string, now = new Date()): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** True bila tanggal (YYYY-MM-DD) setelah hari ini. */
export function isFutureDate(dateStr: string, now = new Date()): boolean {
  return dateStr > todayIso(now);
}

export function formatAge(birthDate?: string | null): string {
  if (!birthDate) return "-";

  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (years === 0) return `${rest} bln`;
  if (rest === 0) return `${years} thn`;
  return `${years} thn ${rest} bln`;
}

export function formatDateID(date?: string | Date | null): string {
  if (!date) return "-";

  const value =
    typeof date === "string"
      ? new Date(date.length === 10 ? `${date}T00:00:00` : date)
      : date;

  return value.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRupiah(amount?: number | null): string {
  if (amount == null) return "-";
  return `Rp${amount.toLocaleString("id-ID")}`;
}
