# AI Context — cukingPro Web (update terakhir: 9 Okt 2026)

## Kondisi Saat Ini
- **Fase frontend Fase 1–3 SELESAI** (UI + mock data). Backend/E2E belum ada.
- Build produksi hijau (`npm run build`), semua route 200 OK via dev server.
- Data masih dari `src/lib/mock.ts` (cats, health, berat, pengingat,
  heat cycles, matings, litters, sales). Semua aksi simpan = demo, ada
  TODO `POST /api/...` di kode.
- **Bypass demo**: tombol "Masuk sebagai Demo →" di `/login`;
  `(app)/layout.tsx` belum ada auth guard.
- **Gating breeder sementara**: toggle "Saya Breeder"/"Jasa Pacak" di
  `/profil` disimpan ke `localStorage` (`cukingpro:isBreeder`,
  `cukingpro:isStudProvider`); menu Breeding tampil kondisional.

## Fitur per Halaman (sudah jadi)
- `/` landing; auth: `/login`, `/register`, `/forgot-password`,
  `/verify-email`
- `/dashboard` (pengingat 7 hari dari `mockReminders`), `/kucing`
  (+detail, tambah, edit, silsilah), `/kucing/[id]/kesehatan` (+tambah),
  `/kucing/[id]/berat` (grafik SVG + modal catat), `/pengingat`,
  `/notifikasi` (izin push sungguhan + panduan iOS), `/profil`,
  `/paket`, `/pengaturan`
- `/breeding` (tab Siklus Birahi / Kawin & Kehamilan / Penjualan),
  `/breeding/kehamilan/[id]` + `/lahir`, `/breeding/litter/[id]`
- PWA: manifest + icon/apple-icon dari logoset (`public/brand/`), favicon

## Keputusan Penting (lihat DECISIONS.md untuk detail)
- Frontend-first: UI & mock dulu; API/DB menyusul per fase PRD.
- Tema "Warm Whiskers" via `@theme inline` di globals.css; fon Plus
  Jakarta Sans; Material Symbols Outlined.
- Server components dinamis pakai `await connection()` (bukan
  `export const dynamic`), lihat AGENTS.md §4.

## Batasan / Yang Perlu Diketahui Agent Berikutnya
- Belum ada: Better Auth, Drizzle/DB, API routes, service worker,
  upload foto, cron job, Midtrans — semua Fase 0/5/6.
- Foto kucing/anggota belum bisa diupload (placeholder UI saja).
- Halaman `/breeding/litter/[id]/tambah-anak` belum dibuat (FR-10 langkah
  terakhir: daftarkan anak sebagai kucing).
- await-import `require()` pada beberapa file client (`require("@/lib/mock")`)
  — akan dibereskan saat data pindah ke fetch/API.
- Data mock memakai tanggal relatif hari ini (fungsi `d(n)` di mock.ts)
  agar demo tetap hidup.

## Referensi
- PRD: `../PRD-cuking-pro-web.md` (§11 API, §6 skema DB, §12 rencana fase)
- Desain: `../stitch_cozy_cat_frontend_ui/` + `warm_whiskers/DESIGN.md`
- Aset logo: `cuking-pro-web/public/brand/` (transparent/main/inverted/
  mono; `reserved/` untuk dark mode & cetak)