# AI Context — cukingPro Web (update terakhir: 21 Okt 2026)

## Kondisi Saat Ini
- **Backend Fase 1 SELESAI**: profil, paket (Free/Pro), kucing, silsilah,
  upload foto, auth guard, akun demo, dan tes otomatis.
- **Backend Fase 0 SELESAI**: PostgreSQL + Drizzle, Better Auth
  (email/password + verifikasi email), `/api/health-check`, format error
  standar, helper sesi.
- **UI/UX Fase 1–6 SELESAI**; modul yang sudah punya API memakai data DB,
  sisanya masih `src/lib/mock.ts`.
- Build produksi hijau (`npm run build`), `npx tsc --noEmit` bersih,
  `npx eslint src` **0 error / 0 warning**, `npm test` **12 lulus**.
- **Auth guard aktif**: `src/proxy.ts` (cookie → 307) + pengecekan sesi
  Better Auth di `(app)/layout.tsx`. Tidak ada lagi bypass demo.
- **Akun demo** (`free@`, `breeder@`, `stud@`, `pro@demo.cukingpro`)
  dibuat oleh `npm run db:seed`; pemilih akun di `/login` hanya muncul
  bila `DEMO_MODE="true"`.
- **Peran dari DB**: `profiles.is_breeder` / `is_stud_provider` diteruskan
  layout ke Sidebar/BottomNav. `localStorage` hanya menyimpan penanda
  `cukingpro:onboarded` untuk banner Beranda.
- Foto kucing disimpan di `.data/uploads/` dan diakses lewat
  `/api/uploads/:key` dengan sesi valid.

## Backend yang Sudah Ada
- `src/db/schema.ts` — tabel auth Better Auth (`user`, `session`,
  `account`, `verification`) + `profiles`, `cats`, `cat_ownership_history`,
  `plans`, `subscriptions`; migrasi di `drizzle/`.
- `src/db/index.ts` — Drizzle + `postgres-js` (singleton saat dev).
- `src/db/seed.ts` — 4 akun demo + kucing + plan Pro (idempoten).
- `src/lib/auth.ts` — Better Auth + Drizzle adapter; verifikasi email
  wajib; plugin `nextCookies()` terakhir; hook membuat baris `profiles`.
- `src/lib/{cats,plan,profile}.ts` — lapisan data owner-scoped + aturan
  paket (batas 2 kucing Free, jendela riwayat 3 bulan, rekonsiliasi beku).
- `src/lib/storage.ts` — simpan/kompres foto (sharp → WebP) di
  `.data/uploads/`; antarmuka siap diganti S3/R2.
- `src/app/api/auth/[...all]/route.ts` — handler `toNextJsHandler(auth)`.
- `src/app/api/health-check/route.ts` — `{ ok: true }` + ping DB.
- `src/app/api/profile/route.ts` — GET/PATCH profil.
- `src/app/api/plan/route.ts` — paket + pemakaian + jendela riwayat.
- `src/app/api/cats/**` — CRUD, tracking, pedigree.
- `src/app/api/uploads/**` — POST/GET foto (sesi wajib).
- `src/lib/session.ts` — `getSession()`, `requireSession()` (memanggil
  `connection()` agar route handler tidak ikut prerender).
- `src/lib/api-error.ts` — `ApiError` / `handleRouteError` (PRD §11);
  error bail-out prerender diteruskan, bukan diubah jadi 500.
- `src/proxy.ts` — cek cookie sesi → redirect 307 ke `/login`.
- Env: `.env.example` (lengkap), `.env` lokal gitignored; `.env.test`
  untuk database tes.
- Tes: `tests/plan.test.ts` (unit), `tests/cats.test.ts` (integrasi DB).

## Fitur per Halaman (sudah jadi)
- `/` landing (+tautan legal); auth: `/login` (pemilih akun demo),
  `/register`, `/forgot-password`, `/verify-email`, `/reset-password`
- `/onboarding` (peran disimpan ke DB via API)
- `/dashboard` (pengingat 7 hari dari mock + banner onboarding)
- `/kucing` & `/kucing/tambah` — **data DB**; detail/edit/silsilah/jual
  masih mock kecuali endpoint silsilah sudah tersedia
- `/kucing/[id]/kesehatan` (+tambah), `/berat`, `/dokumen`, `/timeline`,
  `/aktivitas`, `/pakan` — masih mock (Fase 2)
- `/profil` — **profil & peran dari DB**
- `/paket` — **paket, pemakaian, harga dari DB** (pembayaran masih mock)
- `/pengaturan`, `/pengingat`, `/notifikasi`
- `/breeding` (tab Siklus Birahi / Kawin & Kehamilan / Penjualan),
  `/breeding/kehamilan/[id]` + `/lahir`, `/breeding/litter/[id]`
  + `/tambah-anak`, `/penjualan/[id]/edit` — mock
- `/jasa-pacak` (tab Pejantan / Booking), `/jasa-pacak/booking/[id]` — mock
- `/transfer`, `/riwayat-kepemilikan`, `/keuangan` — mock
- PWA: manifest + icon/apple-icon dari logoset (`public/brand/`)

## Keputusan Penting (lihat DECISIONS.md untuk detail)
- Frontend-first: UI & mock dulu; API/DB menyusul per fase PRD.
- **Backend Fase 0**: Drizzle + `postgres-js`, Better Auth + Drizzle adapter,
  skema auth mengikuti snapshot resmi Better Auth.
- **Backend Fase 1**: semua query domain lewat lapisan owner-scoped
  (`src/lib/cats.ts`); aturan paket terpusat di `src/lib/plan.ts`;
  data pemilik lain selalu 404.
- **Penyimpanan lokal di balik antarmuka** (`storage.ts`): berkas di
  `.data/uploads/`, akses lewat route ber sesi; S3/R2 menyusul.
- **Akun demo = user Better Auth hasil seed**, bukan endpoint palsu;
  pemilih akun digerbangi `DEMO_MODE` di server.
- **Peran dari DB** diteruskan sebagai props; `localStorage` hanya untuk
  penanda onboarding.
- Tema "Warm Whiskers" via `@theme inline` di globals.css; fon Plus
  Jakarta Sans; Material Symbols Outlined.
- Server components dinamis pakai `await connection()` (bukan
  `export const dynamic`), lihat AGENTS.md §4. Route handler yang membaca
  sesi juga memanggil `connection()` agar tidak ikut prerender.
- `(app)/layout.tsx` memakai `export const instant = false` agar guard
  boleh blocking; `src/proxy.ts` memberi redirect 307 untuk anonim.
- Akses `searchParams` di halaman wajib dibungkus `<Suspense>`
  (cacheComponents Next 16).

## Batasan / Yang Perlu Diketahui Agent Berikutnya
- Sudah ada: Better Auth, Drizzle/DB, migrasi, seed demo, API profil/plan/
  kucing/uploads, auth guard, tes Vitest.
- Belum ada: API kesehatan/berat/pakan/pengingat/dokumen/breeding/
  penjualan/jasa pacak/transfer/keuangan, cron job, Midtrans, SMTP nyata.
- `cats.litter_id` & `cat_ownership_history.transfer_id` ditunda sampai
  tabel Fase 3/5 dibuat.
- Upload avatar profil belum disambungkan (tombol disabled).
- Harga/durasi Pro masih placeholder (`plans` di seed).
- Data mock memakai tanggal relatif hari ini (fungsi `d(n)` di mock.ts)
  agar demo tetap hidup.
- `.env.test` wajib ada sebelum `npm test`; database tes terpisah dari
  database pengembangan.

## Referensi
- PRD: `../PRD-cuking-pro-web.md` (§11 API, §6 skema DB, §12 rencana fase)
- Desain: `../stitch_cozy_cat_frontend_ui/` + `warm_whiskers/DESIGN.md`
- Aset logo: `cuking-pro-web/public/brand/` (transparent/main/inverted/
  mono; `reserved/` untuk dark mode & cetak)
