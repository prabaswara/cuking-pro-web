# AI Context — cukingPro Web (update terakhir: 21 Okt 2026)

## Kondisi Saat Ini
- **Seluruh UI/UX Fase 1–6 SELESAI** (frontend-only + mock data).
  Backend/E2E belum ada.
- Build produksi hijau (`npm run build`), `npx tsc --noEmit` bersih,
  `npx eslint src` **0 error / 0 warning**.
- Data masih dari `src/lib/mock.ts` (cats, health, berat, pengingat,
  heat cycles, matings, litters, sales, stud services/bookings,
  transfers, ownership history, dokumen, timeline). Semua aksi simpan =
  demo, ada TODO `POST /api/...` di kode.
- **Bypass demo**: tombol "Masuk sebagai Demo →" di `/login`;
  `(app)/layout.tsx` belum ada auth guard.
- **Gating peran sementara**: `localStorage` (`cukingpro:isBreeder`,
  `cukingpro:isStudProvider`, `cukingpro:onboarded`) diisi lewat
  `/onboarding` dan toggle di `/profil`; menu Breeding/Jasa Pacak
  tampil kondisional. Dibaca dengan `useSyncExternalStore`.
- Halaman legal publik: `/kebijakan-privasi`, `/syarat-layanan`.

## Fitur per Halaman (sudah jadi)
- `/` landing (+tautan legal); auth: `/login`, `/register`,
  `/forgot-password`, `/verify-email`
- `/onboarding` (pilih peran breeder / penyedia jasa pacak)
- `/dashboard` (pengingat 7 hari + banner onboarding), `/kucing`
  (+detail, tambah, edit, silsilah, jual), `/kucing/[id]/kesehatan`
  (+tambah), `/kucing/[id]/berat`, `/kucing/[id]/dokumen` (baru),
  `/kucing/[id]/timeline` (baru), `/kucing/[id]/aktivitas`,
  `/kucing/[id]/pakan`, `/pengingat`, `/notifikasi`,
  `/profil`, `/paket`, `/pengaturan`
- `/breeding` (tab Siklus Birahi / Kawin & Kehamilan / Penjualan),
  `/breeding/kehamilan/[id]` + `/lahir`, `/breeding/litter/[id]`
  + `/tambah-anak`, `/penjualan/[id]/edit`
- `/jasa-pacak` (tab Pejantan / Booking), `/jasa-pacak/booking/[id]`
- `/transfer`, `/riwayat-kepemilikan`, `/keuangan`
- PWA: manifest + icon/apple-icon dari logoset (`public/brand/`)

## Keputusan Penting (lihat DECISIONS.md untuk detail)
- Frontend-first: UI & mock dulu; API/DB menyusul per fase PRD.
- Tema "Warm Whiskers" via `@theme inline` di globals.css; fon Plus
  Jakarta Sans; Material Symbols Outlined.
- Server components dinamis pakai `await connection()` (bukan
  `export const dynamic`), lihat AGENTS.md §4.
- Nilai dari `localStorage`/`navigator`/`window` dibaca dengan
  `useSyncExternalStore` (bukan `setState` di dalam `useEffect`) agar
  lolos aturan `react-hooks/set-state-in-effect`.

## Batasan / Yang Perlu Diketahui Agent Berikutnya
- Belum ada: Better Auth, Drizzle/DB, API routes, service worker,
  upload foto/dokumen, cron job, Midtrans — Fase 0/5/6.
- Foto kucing/anggota & dokumen belum bisa diunggah (placeholder UI).
- Semua form belum terhubung ke API; validasi klien sudah ada, validasi
  server belum.
- Data mock memakai tanggal relatif hari ini (fungsi `d(n)` di mock.ts)
  agar demo tetap hidup.

## Referensi
- PRD: `../PRD-cuking-pro-web.md` (§11 API, §6 skema DB, §12 rencana fase)
- Desain: `../stitch_cozy_cat_frontend_ui/` + `warm_whiskers/DESIGN.md`
- Aset logo: `cuking-pro-web/public/brand/` (transparent/main/inverted/
  mono; `reserved/` untuk dark mode & cetak)
