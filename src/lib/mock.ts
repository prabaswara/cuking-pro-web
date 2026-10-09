import type { Cat } from "@/types";

// Mock data untuk fase frontend (belum ada backend/API).
// Nanti diganti dengan fetch ke /api/cats.
export const mockCats: Cat[] = [
  {
    id: "cat-mochi",
    ownerId: "user-1",
    name: "Mochi",
    sex: "female",
    breed: "British Shorthair",
    color: "Lilac Solid",
    birthDate: "2024-06-14",
    photoPath: null,
    isNeutered: false,
    microchipNo: "9810982341",
    pedigreeNo: "ICA-2024-BSH-8821",
    sireId: null,
    sireNameManual: "King Arthur von Fluff",
    damId: null,
    damNameManual: "Queen Cleo of PurrGems",
    litterId: null,
    status: "active",
    trackingStatus: "tracked",
    notes: "Induk aktif, nafsu makan stabil.",
    createdAt: new Date("2024-06-14"),
  },
  {
    id: "cat-luna",
    ownerId: "user-1",
    name: "Luna",
    sex: "female",
    breed: "Persia",
    color: "Putih Solid",
    birthDate: "2025-07-01",
    photoPath: null,
    isNeutered: false,
    microchipNo: null,
    pedigreeNo: null,
    sireId: null,
    sireNameManual: null,
    damId: null,
    damNameManual: null,
    litterId: null,
    status: "active",
    trackingStatus: "tracked",
    notes: null,
    createdAt: new Date("2025-07-01"),
  },
  {
    id: "cat-simba",
    ownerId: "user-1",
    name: "Simba",
    sex: "male",
    breed: "Maine Coon",
    color: "Brown Tabby",
    birthDate: "2023-03-10",
    photoPath: null,
    isNeutered: false,
    microchipNo: "9810982100",
    pedigreeNo: "ICA-2023-MCO-1102",
    sireId: null,
    sireNameManual: null,
    damId: null,
    damNameManual: null,
    litterId: null,
    status: "active",
    trackingStatus: "frozen",
    notes: "Pejantan pacak.",
    createdAt: new Date("2023-03-10"),
  },
];

export function getMockCat(id: string): Cat | undefined {
  return mockCats.find((c) => c.id === id);
}

// Format umur sederhana: "2 thn 3 bln"
export function formatAge(birthDate?: string | null): string {
  if (!birthDate) return "-";
  const birth = new Date(birthDate);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} bln`;
  if (rest === 0) return `${years} thn`;
  return `${years} thn ${rest} bln`;
}

// Format tanggal DD MMM YYYY (id-ID), mis. "14 Jun 2024"
export function formatDateID(date?: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ========================================
// MOCK FASE 2 — Kesehatan, Berat, Pengingat
// (ganti dengan fetch /api saat backend siap)
// ========================================

import type { HealthRecord, Reminder } from "@/types";

export const mockHealthRecords: HealthRecord[] = [
  {
    id: "hr-usg",
    catId: "cat-mochi",
    type: "vet_visit",
    title: "USG Gestasi Trimester 2",
    recordDate: "2026-09-15",
    nextDueDate: "2026-09-24",
    weightKg: null,
    vetName: "Drh. Sarah Sp.K",
    cost: 250000,
    photoPath: null,
    notes: "4 fetus terdeteksi sehat, detak jantung stabil.",
  },
  {
    id: "hr-deworm",
    catId: "cat-mochi",
    type: "deworming",
    title: "Drontal Cat Deworming",
    recordDate: "2026-08-01",
    nextDueDate: null,
    weightKg: null,
    vetName: null,
    cost: null,
    photoPath: null,
    notes: "1 tablet sesuai BB 4,2 kg.",
  },
  {
    id: "hr-vaccine",
    catId: "cat-mochi",
    type: "vaccine",
    title: "Vaksin Tricat Trio Booster",
    recordDate: "2026-05-12",
    nextDueDate: "2027-05-12",
    weightKg: null,
    vetName: "Klinik Satwa Sehat",
    cost: 180000,
    photoPath: null,
    notes: "Batch TC-88902-ID. Berlaku s/d 12 Mei 2027.",
  },
  {
    id: "hr-vaccine-luna",
    catId: "cat-luna",
    type: "vaccine",
    title: "Vaksin Rabies Booster",
    recordDate: "2025-09-24",
    nextDueDate: "2026-09-24",
    weightKg: null,
    vetName: "Klinik Satwa Sehat",
    cost: 150000,
    photoPath: null,
    notes: null,
  },
];

export const mockWeights: { id: string; catId: string; date: string; kg: number; note?: string }[] = [
  { id: "w1", catId: "cat-mochi", date: "2026-08-01", kg: 3.6, note: "Baseline sebelum program kawin." },
  { id: "w2", catId: "cat-mochi", date: "2026-08-15", kg: 3.7, note: "Stabil, pola tidur lebih panjang." },
  { id: "w3", catId: "cat-mochi", date: "2026-09-01", kg: 3.9, note: "Selera makan meningkat tajam." },
  { id: "w4", catId: "cat-mochi", date: "2026-09-15", kg: 4.2, note: "Perut makin membesar, aktif bergerak." },
];

export const mockReminders: Reminder[] = [
  {
    id: "rem-luna-vaccine",
    userId: "user-1",
    catId: "cat-luna",
    title: "Booster Rabies Luna",
    dueDate: "2026-09-24",
    sourceType: "health",
    sourceId: "hr-vaccine-luna",
    doneAt: null,
    notifiedH3At: null,
    notifiedD0At: null,
  },
  {
    id: "rem-simba-weight",
    userId: "user-1",
    catId: "cat-simba",
    title: "Timbang Berat Rutin Simba",
    dueDate: "2026-09-19",
    sourceType: "manual",
    sourceId: null,
    doneAt: null,
    notifiedH3At: null,
    notifiedD0At: null,
  },
  {
    id: "rem-mochi-birth",
    userId: "user-1",
    catId: "cat-mochi",
    title: "Estimasi Kelahiran Mochi",
    dueDate: "2026-09-29",
    sourceType: "pregnancy",
    sourceId: null,
    doneAt: null,
    notifiedH3At: null,
    notifiedD0At: null,
  },
  {
    id: "rem-mochi-usg",
    userId: "user-1",
    catId: "cat-mochi",
    title: "USG Kehamilan Lanjutan",
    dueDate: "2026-09-24",
    sourceType: "health",
    sourceId: "hr-usg",
    doneAt: new Date("2026-09-16"),
    notifiedH3At: null,
    notifiedD0At: null,
  },
];

export function getCatName(catId?: string | null): string {
  if (!catId) return "-";
  return mockCats.find((c) => c.id === catId)?.name ?? "-";
}

const HEALTH_TYPE_LABEL: Record<HealthRecord["type"], string> = {
  vaccine: "Vaksinasi",
  deworming: "Obat Cacing",
  flea: "Obat Kutu",
  vet_visit: "Kunjungan Dokter",
  medication: "Pengobatan",
  weight: "Berat Badan",
  other: "Lainnya",
};

export function healthTypeLabel(type: HealthRecord["type"]): string {
  return HEALTH_TYPE_LABEL[type];
}

// Sisa hari dari hari ini ke tanggal tujuan (negatif = terlewat)
export function daysUntil(dateStr: string, now = new Date()): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatRupiah(amount?: number | null): string {
  if (amount == null) return "-";
  return "Rp" + amount.toLocaleString("id-ID");
}

// ========================================
// MOCK FASE 3 — Breeding & Penjualan
// (ganti dengan fetch /api saat backend siap)
// ========================================

import type { HeatCycle, Mating, Litter, CatSale } from "@/types";

function d(n: number): string {
  const t = new Date();
  t.setDate(t.getDate() + n);
  return t.toISOString().slice(0, 10);
}

// Heat Cycles (hanya betina)
export const mockHeatCycles: HeatCycle[] = [
  {
    id: "hc-mochi-1",
    catId: "cat-mochi",
    startDate: d(-95),
    endDate: d(-88),
    notes: "Gejala ringan, suara lebih aktif, menggosok badan.",
  },
  {
    id: "hc-mochi-2",
    catId: "cat-mochi",
    startDate: d(-60),
    endDate: d(-53),
    notes: "Jelas, roll roll, nafsu makan turun.",
  },
  {
    id: "hc-mochi-3",
    catId: "cat-mochi",
    startDate: d(-25),
    endDate: d(-18),
    notes: "Berlangsung, kandidat kawin berikutnya.",
  },
  {
    id: "hc-luna-1",
    catId: "cat-luna",
    startDate: d(-40),
    endDate: d(-33),
    notes: "Siklus pertama tercatat.",
  },
];

// Matings
export const mockMatings: Mating[] = [
  {
    id: "mating-1",
    ownerId: "user-1",
    queenId: "cat-mochi",
    queenNameManual: null,
    sireId: "cat-simba",
    sireNameManual: null,
    matingDate: d(-50),
    outcome: "pregnant",
    expectedDueDate: d(15), // +65 hari dari matingDate
    notes: "Kawin 2x dalam sehari, kontak baik.",
  },
  {
    id: "mating-2",
    ownerId: "user-1",
    queenId: "cat-luna",
    queenNameManual: null,
    sireId: null,
    sireNameManual: "Rocky (pejantan luar)",
    matingDate: d(-10),
    outcome: "pending",
    expectedDueDate: null,
    notes: "Pejantan milik klien, booking pacak.",
  },
  {
    id: "mating-3",
    ownerId: "user-1",
    queenId: "cat-mochi",
    queenNameManual: null,
    sireId: "cat-simba",
    sireNameManual: null,
    matingDate: d(-200),
    outcome: "not_pregnant",
    expectedDueDate: null,
    notes: "Ultrasound negatif hari ke-28.",
  },
];

// Litters
export const mockLitters: Litter[] = [
  {
    id: "litter-1",
    matingId: "mating-3", // bukan mating-3 yang not_pregnant... perlu mating delivered
    birthDate: d(-100),
    totalBorn: 4,
    totalAlive: 3,
    notes: "1 stillborn, 3 sehat. Lahir normal.",
  },
];

// Kittens dari litter-1 (sudah jadi data kucing di mockCats? belum, tambahkan helper)
// CatSale
export const mockCatSales: CatSale[] = [
  {
    id: "sale-1",
    ownerId: "user-1",
    catId: null, // anak kucing belum di mockCats
    catName: "Anak Mochi #1 (Lilac)",
    status: "listed",
    askingPrice: 5000000,
    buyerName: null,
    buyerWhatsapp: null,
    finalPrice: null,
    depositAmount: null,
    depositPaid: false,
    saleDate: null,
    notes: "Betina, Lilac Solid, ayah Simba, ibu Mochi.",
    createdAt: new Date(d(-30)),
  },
  {
    id: "sale-2",
    ownerId: "user-1",
    catId: null,
    catName: "Anak Mochi #2 (Blue)",
    status: "reserved",
    askingPrice: 5500000,
    buyerName: "Budi Santoso",
    buyerWhatsapp: "081234567890",
    finalPrice: 5500000,
    depositAmount: 1000000,
    depositPaid: true,
    saleDate: d(-5),
    notes: "Jantan, Blue Solid. DP sudah dibayar.",
    createdAt: new Date(d(-40)),
  },
];

// Helper: hitung jarak hari antara 2 tanggal (YYYY-MM-DD)
export function daysBetween(start: string, end: string): number {
  const a = new Date(start + "T00:00:00");
  const b = new Date(end + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// Helper: filter heat cycles untuk 1 betina, urut descending
export function getHeatCyclesForCat(catId: string): HeatCycle[] {
  return mockHeatCycles
    .filter((h) => h.catId === catId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

// Helper: filter matings untuk 1 user
export function getMatingsForUser(userId: string): Mating[] {
  return mockMatings.filter((m) => m.ownerId === userId);
}

// Helper: get mating by id
export function getMating(id: string): Mating | undefined {
  return mockMatings.find((m) => m.id === id);
}

// Helper: get litter by matingId
export function getLitterByMating(matingId: string): Litter | undefined {
  return mockLitters.find((l) => l.matingId === matingId);
}

// Helper: get sales for user
export function getCatSalesForUser(userId: string): CatSale[] {
  return mockCatSales.filter((s) => s.ownerId === userId);
}

// Nama pejantan/betina untuk display
export function getQueenDisplayName(m: Mating): string {
  return m.queenId ? getCatName(m.queenId) : m.queenNameManual ?? "Betina luar";
}
export function getSireDisplayName(m: Mating): string {
  return m.sireId ? getCatName(m.sireId) : m.sireNameManual ?? "Pejantan luar";
}
