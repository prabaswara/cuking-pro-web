# AI Context — cukingPro Web (update terakhir: 21 Okt 2026)

## Kondisi Saat Ini
- **UI/UX Fase 1–6 SELESAI** (masih memakai mock untuk data domain).
- **Backend Fase 0 SELESAI**: PostgreSQL + Drizzle (migrasi jalan),
  Better Auth (email/password + verifikasi email), `/api/health-check`,
  format error standar, helper sesi. Form auth sudah memakai Better Auth.
- Build produksi hijau (`npm run build`), `npx tsc --noEmit` bersih,
  `npx eslint src` **0 error / 0 warning**.
- Data domain (cats, health, berat, pengingat, heat cycles, matings,
  litters, sales, stud services/bookings, transfers, ownership history,
  dokumen, timeline) masih dari `src/lib/mock.ts`. Aksi simpan = demo,
  ada TODO `POST /api/...`.
- **Bypass demo**: tombol "Masuk sebagai Demo →" di `/login` masih ada;
  `(app)/layout.tsx` belum ada auth guard.
- **Gating peran sementara**: `localStorage` (`cukingpro:isBreeder`,
  `cukingpro:isStudProvider`, `cukingpro:onboarded`) diisi lewat
  `/onboarding` dan toggle di `/profil`; menu Breeding/Jasa Pacak
  tampil kondisional. Dibaca dengan `useSyncExternalStore`.
- Halaman legal publik: `/kebijakan-privasi`, `/syarat-layanan`.

## Backend yang Sudah Ada
- `src/db/schema.ts` — tabel auth Better Auth (`user`, `session`,
  `account`, `verification`); migrasi di `drizzle/`.
- `src/db/index.ts` — Drizzle + `postgres-js` (singleton saat dev).
- `src/lib/auth.ts` — Better Auth + Drizzle adapter; verifikasi email
  wajib; plugin `nextCookies()` terakhir.
- `src/app/api/auth/[...all]/route.ts` — handler `toNextJsHandler(auth)`.
- `src/app/api/health-check/route.ts` — `{ ok: true }` + ping DB.
- `src/lib/session.ts` — `getSession()`, `requireSession()`.
- `src/lib/api-error.ts` — `ApiError` / `handleRouteError` (PRD §11).
- `src/lib/email.ts` — stub; tautan verifikasi/reset hanya ke log (dev).
- Env: `.env.example` (lengkap), `.env` lokal gitignored.

## Fitur per Halaman (sudah jadi)
- `/` landing (+tautan legal); auth: `/login`, `/register`,
  `/forgot-password`, `/verify-email`, `/reset-password`
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
- **Backend Fase 0**: Drizzle + `postgres-js`, Better Auth + Drizzle adapter,
  skema auth mengikuti snapshot resmi Better Auth.
- Tema "Warm Whiskers" via `@theme inline` di globals.css; fon Plus
  Jakarta Sans; Material Symbols Outlined.
- Server components dinamis pakai `await connection()` (bukan
  `export const dynamic`), lihat AGENTS.md §4.
- Nilai dari `localStorage`/`navigator`/`window` dibaca dengan
  `useSyncExternalStore` (bukan `setState` di dalam `useEffect`) agar
  lolos aturan `react-hooks/set-state-in-effect`.
- Akses `searchParams` di halaman wajib dibungkus `<Suspense>`
  (cacheComponents Next 16).

## Batasan / Yang Perlu Diketahui Agent Berikutnya
- Sudah ada: Better Auth, Drizzle/DB, migrasi, `/api/health-check`.
- Belum ada: API domain (cats/health/breeding/…), auth guard `(app)`,
  service worker, upload foto/dokumen, cron job, Midtrans (Fase 1–6).
- Foto kucing/anggota & dokumen belum bisa diunggah (placeholder UI).
- Form domain belum terhubung ke API; validasi klien sudah ada, validasi
  server (Zod) baru kerangka di `api-error.ts`.
- Email verifikasi/reset hanya ke log server (belum ada SMTP).
- Data mock memakai tanggal relatif hari ini (fungsi `d(n)` di mock.ts)
  agar demo tetap hidup.

## Referensi
- PRD: `../PRD-cuking-pro-web.md` (§11 API, §6 skema DB, §12 rencana fase)
- Desain: `../stitch_cozy_cat_frontend_ui/` + `warm_whiskers/DESIGN.md`
- Aset logo: `cuking-pro-web/public/brand/` (transparent/main/inverted/
  mono; `reserved/` untuk dark mode & cetak)
