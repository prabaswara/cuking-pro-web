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

// ========================================
// MOCK FASE 4 — Jasa Pacak
// ========================================

import type { StudService, StudBooking, Transaction, CatTransfer, OwnershipHistory } from "@/types";

export const mockStudServices: StudService[] = [
  {
    id: "ss-simba",
    catId: "cat-simba",
    catName: "Simba",
    ownerId: "user-1",
    feeAmount: 3000000,
    feeDescription: null,
    notes: "Maine Coon, pedigree ICA-2023-MCO-1102. Pengalaman 5x kawin.",
    isAvailable: true,
  },
  {
    id: "ss-luna-stud",
    catId: null,
    catName: "Custom Stud",
    ownerId: "user-1",
    feeAmount: null,
    feeDescription: "Anak pilihan pertama",
    notes: null,
    isAvailable: false,
  },
];

// Stud bookings (kawin pacak)
export interface StudMating {
  id: string;
  bookingId: string;
  matingDate: string;
  notes?: string | null;
}

export const mockStudMatings: StudMating[] = [
  { id: "sm-1", bookingId: "sb-1", matingDate: d(-30), notes: "Kawin pertama" },
  { id: "sm-2", bookingId: "sb-1", matingDate: d(-28), notes: "Kawin kedua" },
];

export const mockStudBookings: StudBooking[] = [
  {
    id: "sb-1",
    ownerId: "user-1",
    studServiceId: "ss-simba",
    clientName: "Dian Pratama",
    clientWhatsapp: "081298765432",
    queenName: "Bella",
    queenBreed: "Persia",
    queenAgeText: "1,5 tahun",
    plannedDate: d(-30),
    status: "ongoing",
    feeAgreed: 3000000,
    depositAmount: 500000,
    depositPaid: true,
    expectedDueDate: d(35), // -30 + 65
    expectedDueDateManual: false,
    queenPregnancyStatus: "pregnant",
    notes: "Betina datang dengan buku vaksin lengkap.",
    createdAt: new Date(d(-35)),
  },
  {
    id: "sb-2",
    ownerId: "user-1",
    studServiceId: "ss-simba",
    clientName: "Sari Wulandari",
    clientWhatsapp: "08135554443",
    queenName: "Ciwi",
    queenBreed: "British Shorthair",
    queenAgeText: "2 tahun",
    plannedDate: d(7),
    status: "approved",
    feeAgreed: 3000000,
    depositAmount: 500000,
    depositPaid: false,
    expectedDueDate: null,
    expectedDueDateManual: false,
    queenPregnancyStatus: "unknown",
    notes: "Ingin anak rajah. DP dibayar saat jemput.",
    createdAt: new Date(d(-3)),
  },
  {
    id: "sb-3",
    ownerId: "user-1",
    studServiceId: "ss-simba",
    clientName: "Andi Kurniawan",
    clientWhatsapp: "08571112223",
    queenName: "Molly",
    queenBreed: "Domestik",
    queenAgeText: null,
    plannedDate: null,
    status: "requested",
    feeAgreed: null,
    depositAmount: null,
    depositPaid: false,
    expectedDueDate: null,
    expectedDueDateManual: false,
    queenPregnancyStatus: "unknown",
    notes: "Belum tentu tanggal, menunggu kesiapan betina.",
    createdAt: new Date(d(-1)),
  },
];

// Helper Fase 4
export function getStudServicesForUser(userId: string): StudService[] {
  return mockStudServices.filter((s) => s.ownerId === userId);
}
export function getStudBookingsForUser(userId: string): StudBooking[] {
  return mockStudBookings
    .filter((b) => b.ownerId === userId)
    .sort((a, b) => (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999"));
}
export function getStudBooking(id: string): StudBooking | undefined {
  return mockStudBookings.find((b) => b.id === id);
}
export function getStudService(id: string): StudService | undefined {
  return mockStudServices.find((s) => s.id === id);
}
export function getStudMatingsForBooking(bookingId: string): StudMating[] {
  return mockStudMatings
    .filter((m) => m.bookingId === bookingId)
    .sort((a, b) => a.matingDate.localeCompare(b.matingDate));
}

// ========================================
// MOCK FASE 5 — Transfer & Keuangan
// ========================================

export const mockTransactions: Transaction[] = [
  { id: "tx-1", userId: "user-1", type: "income", category: "penjualan kucing", amount: 5500000, txnDate: d(-40), catName: "Anak Mochi #1", saleId: "sale-1", notes: "Jual anak pertama" },
  { id: "tx-2", userId: "user-1", type: "income", category: "jasa pacak", amount: 3000000, txnDate: d(-30), catName: "Simba (pacak)", bookingId: "sb-1", notes: "DP + pelunasan booking Dian" },
  { id: "tx-3", userId: "user-1", type: "expense", category: "pakan", amount: 850000, txnDate: d(-25), catName: "Mochi", notes: "Royal Canin Kitten 15kg" },
  { id: "tx-4", userId: "user-1", type: "expense", category: "dokter", amount: 250000, txnDate: d(-20), catName: "Luna", notes: "USG gestasi" },
  { id: "tx-5", userId: "user-1", type: "expense", category: "perlengkapan", amount: 420000, txnDate: d(-10), notes: "Pasir & litter box baru" },
  { id: "tx-6", userId: "user-1", type: "income", category: "penjualan kucing", amount: 5000000, txnDate: d(-5), catName: "Anak Mochi #2", saleId: "sale-2", notes: "Harga akhir setelah negosiasi" },
];

export const mockCatTransfers: CatTransfer[] = [
  {
    id: "ct-1",
    catId: "cat-mochi",
    catName: "Mochi",
    catSummary: "British Shorthair • Lilac Solid • 2 thn 4 bln",
    fromUserId: "user-1",
    toEmail: "dian@example.com",
    toUserId: null,
    message: "Sudah vaksin lengkap, buku registrasi diserahkan.",
    status: "pending",
    createdAt: new Date(d(-2)),
    expiresAt: new Date(d(12)),
    respondedAt: null,
  },
  {
    id: "ct-2",
    catId: "cat-luna",
    catName: "Luna",
    catSummary: "Persia • Putih Solid • 1 thn 3 bln",
    fromUserId: "user-2",
    toEmail: "user@example.com",
    toUserId: "user-1",
    message: "Luna sudah hamil, perlu perhatian ekstra.",
    status: "accepted",
    createdAt: new Date(d(-100)),
    expiresAt: new Date(d(-86)),
    respondedAt: new Date(d(-98)),
  },
];

export const mockOwnershipHistory: OwnershipHistory[] = [
  { id: "oh-1", catId: "cat-mochi", catName: "Mochi", ownerId: "user-1", ownerDisplayName: "Pengguna", startedAt: new Date("2024-06-14"), endedAt: null, acquiredVia: "created" },
  { id: "oh-2", catId: "cat-luna", catName: "Luna", ownerId: "user-2", ownerDisplayName: "Budi Santoso", startedAt: new Date("2025-07-01"), endedAt: new Date(d(-98)), acquiredVia: "created" },
  { id: "oh-3", catId: "cat-luna", catName: "Luna", ownerId: "user-1", ownerDisplayName: "Pengguna", startedAt: new Date(d(-98)), endedAt: null, acquiredVia: "transfer", transferId: "ct-2" },
];

// Helper Fase 5
export function getTransactionsForUser(userId: string): Transaction[] {
  return mockTransactions.filter((t) => t.userId === userId);
}
export function getTransfersForUser(userId: string): CatTransfer[] {
  return mockCatTransfers.filter((t) => t.fromUserId === userId || t.toUserId === userId);
}
export function getOwnershipHistory(catId: string): OwnershipHistory[] {
  return mockOwnershipHistory.filter((o) => o.catId === catId);
}

// ========================================
// MOCK — DOKUMEN & TIMELINE (tab profil kucing)
// (ganti dengan fetch /api saat backend siap)
// ========================================

import type { CatDocument, TimelineEvent } from "@/types";

export const mockCatDocuments: CatDocument[] = [
  {
    id: "doc-pedigree",
    catId: "cat-mochi",
    title: "Pedigree CFA 5-Generation Official.pdf",
    category: "pedigree",
    fileType: "pdf",
    sizeLabel: "3.2 MB",
    uploadedAt: "2024-08-14",
    source: "CFA Secretariat",
    statusLabel: "Terverifikasi",
    verified: true,
    notes: "Asli — 5 generasi tercatat.",
  },
  {
    id: "doc-vaccine-book",
    catId: "cat-mochi",
    title: "Buku Vaksinasi Lengkap (Halaman 1-4).pdf",
    category: "vaccine_book",
    fileType: "pdf",
    sizeLabel: "1.8 MB",
    uploadedAt: "2026-05-12",
    source: "Klinik Satwa Sehat",
    statusLabel: "Aktif & Valid",
    verified: true,
    notes: "Tricat & Rabies.",
  },
  {
    id: "doc-usg",
    catId: "cat-mochi",
    title: "Hasil USG Gestasi Trimester 2.pdf",
    category: "lab",
    fileType: "pdf",
    sizeLabel: "4.5 MB",
    uploadedAt: "2026-09-15",
    source: "VetCare (Drh. Sarah)",
    statusLabel: "4 Fetus Terpantau",
    verified: false,
    notes: "Hari ke-35 gestasi.",
  },
  {
    id: "doc-microchip",
    catId: "cat-mochi",
    title: "Sertifikat Registrasi Mikrocip ISO 11784.pdf",
    category: "registration",
    fileType: "pdf",
    sizeLabel: "950 KB",
    uploadedAt: "2024-06-20",
    source: "Microchip ID Center",
    statusLabel: "ID Terpasang",
    verified: true,
    notes: "Subkutan leher, nomor 9810982341.",
  },
  {
    id: "doc-felv-fiv",
    catId: "cat-mochi",
    title: "Hasil Skrining Darah & Tes FeLV-FIV.pdf",
    category: "lab",
    fileType: "pdf",
    sizeLabel: "850 KB",
    uploadedAt: "2026-07-20",
    source: "Lab Patologi Vet Clinic",
    statusLabel: "Negatif / Bersih",
    verified: true,
    notes: "Layak breeding.",
  },
  {
    id: "doc-adoption",
    catId: "cat-mochi",
    title: "Kontrak Adopsi & Sertifikat Kepemilikan.pdf",
    category: "other",
    fileType: "pdf",
    sizeLabel: "1.1 MB",
    uploadedAt: "2024-02-02",
    source: "Royal Fluff Cattery",
    statusLabel: "Arsip",
    verified: false,
    notes: null,
  },
];

export function getCatDocuments(catId: string): CatDocument[] {
  return mockCatDocuments
    .filter((doc) => doc.catId === catId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export const DOCUMENT_CATEGORY_LABEL: Record<CatDocument["category"], string> = {
  pedigree: "Pedigree",
  vaccine_book: "Buku Vaksin",
  lab: "Hasil Lab / USG",
  registration: "Registrasi",
  other: "Lainnya",
};

export function documentCategoryLabel(category: CatDocument["category"]): string {
  return DOCUMENT_CATEGORY_LABEL[category];
}

export const TIMELINE_CATEGORY_LABEL: Record<TimelineEvent["category"], string> = {
  medical: "Medis & Vaksin",
  weight: "Berat Badan",
  feeding: "Pakan",
  breeding: "Breeding",
  note: "Catatan Harian",
};

export function timelineCategoryLabel(category: TimelineEvent["category"]): string {
  return TIMELINE_CATEGORY_LABEL[category];
}

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "tl-feeding-1",
    catId: "cat-mochi",
    category: "feeding",
    title: "Royal Canin Mother & Babycat 85g",
    description:
      "Nafsu makan sangat baik, porsi dihabiskan dalam 10 menit. Minum air bersih tercukupi.",
    eventDate: d(0),
    eventTime: "10:30 WIB",
    meta: { status: "Lahap", petugas: "Rian (Staff)" },
  },
  {
    id: "tl-weight-1",
    catId: "cat-mochi",
    category: "weight",
    title: "4.2 kg",
    description:
      "Kenaikan berat badan stabil dan sehat untuk masa gestasi hari ke-37. Perut mulai terasa membulat dan padat.",
    eventDate: d(-1),
    eventTime: "16:00 WIB",
    meta: { delta: "+100g" },
  },
  {
    id: "tl-medical-1",
    catId: "cat-mochi",
    category: "medical",
    title: "USG & Evaluasi Kehamilan (Mid-Term)",
    description:
      "Klinik VetCare Puri bersama Drh. Sarah Sp.K. Detak jantung janin normal, perkiraan 4 kitten aktif berkembang sehat.",
    eventDate: d(-36),
    eventTime: null,
    meta: null,
  },
  {
    id: "tl-medical-2",
    catId: "cat-mochi",
    category: "medical",
    title: "Vitamin Prenatal & Kalsium Organik",
    description:
      "Dosis harian 1 tablet kunyah rasa tuna. Dikonsumsi tanpa kendala bersama sarapan.",
    eventDate: d(-41),
    eventTime: null,
    meta: null,
  },
  {
    id: "tl-medical-3",
    catId: "cat-mochi",
    category: "medical",
    title: "Konfirmasi USG Kehamilan Positif (Hari ke-10)",
    description:
      "Kantung gestasi pertama terdeteksi jelas pada rahim kiri dan kanan. Program transisi diet induk hamil diaktifkan.",
    eventDate: d(-50),
    eventTime: null,
    meta: null,
  },
  {
    id: "tl-breeding-1",
    catId: "cat-mochi",
    category: "breeding",
    title: "Kawin Berhasil dengan Simba",
    description: "Pejantan registrasi CFA • Sesi 3 hari.",
    eventDate: d(-50),
    eventTime: null,
    meta: { partner: "Simba (Maine Coon Tabby)" },
  },
];

export function getTimelineForCat(catId: string): TimelineEvent[] {
  return mockTimelineEvents
    .filter((e) => e.catId === catId)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}
