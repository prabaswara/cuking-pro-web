# Active Task

## Status Terakhir
**Seluruh layar UI/UX Fase 1–6 SELESAI (frontend-only, mock) + polish.**
Build hijau, TypeScript bersih, ESLint **0 error / 0 warning**.
Menunggu perintah berikutnya (kandidat utama: mulai backend Fase 0).

## Progres Sesi Terakhir (21 Okt 2026)
- Menambahkan tab **Dokumen** di profil kucing
  (`/kucing/[id]/dokumen`) — brankas sertifikat/vaksin/lab dengan filter
  kategori, status verifikasi, dialog unggah (placeholder), empty state.
- Menambahkan tab **Timeline** di profil kucing
  (`/kucing/[id]/timeline`) — linimasa medis/berat/pakan/breeding dengan
  filter, meta, dan "muat lebih banyak".
- Menambahkan **onboarding "Kamu siapa?"** (`/onboarding`) + banner di
  Beranda; peran disimpan ke `localStorage`
  (`cukingpro:isBreeder`, `cukingpro:isStudProvider`,
  `cukingpro:onboarded`).
- Menambahkan halaman **Kebijakan Privasi** dan **Syarat Layanan**
  (`(marketing)` route group) + tautan di footer landing.
- Tipe & mock baru: `CatDocument`, `TimelineEvent` di `src/types` dan
  `src/lib/mock.ts` (helper `getCatDocuments`, `getTimelineForCat`,
  label kategori).
- **Bersih-bersih kualitas**: memperbaiki 16 error + 31 warning ESLint
  lama (unused imports, `any`, `require()`, `set-state-in-effect`,
  unescaped entities). Pola `set-state-in-effect` diganti
  `useSyncExternalStore`.
- Menambahkan `&display=swap` pada font Material Symbols + disable rule
  `no-page-custom-font` (ikon font, bukan teks).

## Hasil Verifikasi
- `npx tsc --noEmit` → bersih
- `npx eslint src` → 0 error, 0 warning
- `npm run build` → sukses (static + partial prerender)
- Runtime (production server) → 200 untuk: `/dashboard`, `/breeding`,
  `/jasa-pacak`, `/notifikasi`, `/pengaturan`, `/kucing`,
  `/kucing/cat-mochi`, `/kucing/cat-mochi/kesehatan`,
  `/kucing/cat-mochi/timeline`, `/kucing/cat-mochi/dokumen`,
  `/breeding/kehamilan/mating-1`, `/breeding/litter/litter-1`,
  `/onboarding`, `/kebijakan-privasi`, `/syarat-layanan`

## Masalah yang Belum Selesai (diketahui)
1. Semua form masih demo/mock; belum ada API (`TODO: POST /api/...`).
2. Auth guard belum ada di `(app)/layout.tsx` (bypass demo).
3. Upload foto & dokumen belum berfungsi (UI placeholder).
4. Service worker Web Push & Midtrans belum ada.
5. Data peran masih di `localStorage`, nanti pindah ke profil DB.

## Langkah Berikutnya (pilih salah satu)
A. **Backend Fase 0 (disarankan)**: Drizzle schema + Better Auth +
   `.env.example` + route handler auth.
B. Sambungkan modul satu-per-satu ke API (mulai dari kucing & kesehatan).
C. Ganti gating `localStorage` dengan sesi + profil DB.

## File Penting yang Diubah Sesi Ini
- `src/types/index.ts`, `src/lib/mock.ts` (tipe & mock dokumen/timeline)
- `src/app/(app)/kucing/[id]/dokumen/page.tsx` (baru)
- `src/app/(app)/kucing/[id]/timeline/page.tsx` (baru)
- `src/components/dokumen/document-list.tsx` (baru)
- `src/components/kucing/timeline-list.tsx` (baru)
- `src/app/(app)/onboarding/page.tsx` (baru)
- `src/components/onboarding/onboarding-banner.tsx` (baru)
- `src/app/(marketing)/**` (layout + privasi + syarat, baru)
- `src/app/(app)/kucing/[id]/page.tsx` (tab Timeline/Dokumen)
- `src/app/(app)/dashboard/page.tsx` (banner onboarding)
- `src/app/page.tsx` (tautan footer)
- Perbaikan lint: `breeding/**`, `jasa-pacak/**`,
  `components/layout/{sidebar,bottom-nav}.tsx`,
  `components/notifikasi/notifikasi-content.tsx`,
  `components/breeding/mating-list.tsx`,
  `components/penjualan/sales-list.tsx`,
  `components/pacak/stud-booking-list.tsx`,
  `components/transfer/{transfer-list,ownership-history-list}.tsx`,
  `src/app/layout.tsx`
