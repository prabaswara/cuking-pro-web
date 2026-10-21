# Decision Log — cukingPro Web

Format: **Tanggal — Keputusan** (alasan → dampak)

## 2026-10-09
- **Next.js 16 + cacheComponents, bukan `export const dynamic`**
  (build gagal dengan `dynamic` di cacheComponents) → semua halaman
  per-pengguna memakai `await connection()`; page dinamis memakai
  route segment dinamis.
- **Frontend-only lebih dulu** (mock di `src/lib/mock.ts`, bypass demo di
  login) → percepat review UI; semua endpoint API masih TODO.
- **Tema "Warm Whiskers" sebagai design system** (token di globals.css,
  warna primary #a33900, surface krem) → semua komponen baru wajib pakai
  token, bukan warna ad-hoc.
- **Logoset dipakai sesuai varian**: wordmark transparan (header/hero),
  mark "C" (favicon/PWA/loading), inverted/mono disimpan di `reserved/`
  → menghindari wordmark tak terbaca di ukuran ikon kecil.
- **Breeding gated via localStorage** (sampai auth ada) → toggle profil
  langsung terlihat efeknya; nanti diganti cek sesi + profil DB.
- **Modal bottom-sheet berat badan diganti dialog tengah** (menutupi nav
  bawah) → nav bawah tetap terlihat; backdrop `z-45`, konten `z-55`.

## 2026-10-08
- **Route groups `(auth)` & `(app)`** → layout publik & aplikasi terpisah;
  nav (Header/Sidebar/BottomNav) hanya di `(app)`.
- **Tailwind v4 + `@theme inline`** alih-alih config JS lama → token
  terpusat di globals.css.
- **Estimasi lahir = kawin + 65 hari** (dari PRD `[ASUMSI]`) → default
  di UI kehamilan, bisa diubah manual.

## 2026-10-21
- **Dokumen & Timeline jadi sub-route profil kucing** (`/kucing/[id]/dokumen`,
  `/kucing/[id]/timeline`) mengikuti tab yang sudah ada → konsisten dengan
  pola navigasi & desain stitch, tidak membuat satu halaman tab raksasa.
- **Onboarding peran di `/onboarding` + banner Beranda** → alur "Kamu siapa?"
  dari PRD terwujud tanpa menunggu auth; status disimpan di localStorage
  (`cukingpro:onboarded`) dan nanti dipindah ke profil DB.
- **Baca state eksternal (localStorage/navigator) pakai `useSyncExternalStore`**
  (bukan `setState` di `useEffect`) → lolos `react-hooks/set-state-in-effect`
  di Next 16 dan menghindari cascading render.
- **Halaman legal di route group `(marketing)`** (`/kebijakan-privasi`,
  `/syarat-layanan`) → punya layout publik sendiri, tidak memakai nav aplikasi.
- **Font ikon Material Symbols tetap `<link>` dengan `&display=swap`** dan
  rule `no-page-custom-font` di-disable untuk baris itu → `next/font` tidak
  cocok untuk icon-font dengan ligatur.

## 2026-10-21
- **Backend Fase 0 dikerjakan lebih dulu dari sisa penyambungan UI**
  (PRD menaruh setup DB/auth di Fase 0) → fondasi sesi & DB siap sebelum
  modul domain dipindah dari mock.
- **Drizzle + `postgres-js`, bukan `node-postgres`** (driver ringan, pool
  bawaan, contoh resmi Context7) → satu koneksi singleton di
  `src/db/index.ts`, di-cache di `globalThis` saat dev agar HMR tidak
  membanjiri pool.
- **Skema auth ditulis manual mengikuti snapshot resmi Better Auth**
  (CLI `@better-auth/cli generate` gagal dipasang karena bug npm
  `edgesOut`) → nama tabel default `user`/`session`/`account`/`verification`
  dipertahankan; migrasi Drizzle yang jadi sumber kebenaran.
- **Verifikasi email wajib sejak awal** (sesuai FR-01) +
  `sendVerificationEmail`/`sendResetPassword` memakai stub `sendEmail`
  → tautan hanya dicetak di log saat dev, tidak pernah di log produksi.
- **Form auth memakai `authClient` Better Auth**, bukan `fetch` ke
  endpoint buatan sendiri (`/api/auth/login`, `/register`) yang tidak
  pernah ada → pesan error dipetakan ke Bahasa Indonesia lewat
  `src/lib/auth-messages.ts`; tidak membocorkan email vs password salah.
- **Lupa password selalu menampilkan status "terkirim"** → mencegah
  enumerasi akun.
- **Akses `searchParams` di `/verify-email` dan `/reset-password`
  dibungkus `<Suspense>`** (Next 16 + cacheComponents gagal build bila
  tidak) → halaman tetap bisa di-prerender sebagian.
- **`turbopack.root` dikunci ke folder proyek** (ada `package-lock.json`
  liar di home directory) → warning workspace root hilang tanpa menghapus
  file milik pengguna.
- **`.gitignore` dikecualikan untuk `.env.example`** (`!.env.example`)
  → contoh env tetap bisa di-commit, `.env` tetap aman.

## 2026-10-21 (Fase 1)
- **Foto disimpan di disk lokal di balik antarmuka `storage.ts`**, bukan
  `public/` → PRD mewajibkan akses berotorisasi; berkas dilayani lewat
  `/api/uploads/:key` yang memeriksa sesi. S3/R2 cukup menambah driver.
- **Aturan paket hanya di `src/lib/plan.ts`** (batas 2 kucing aktif,
  riwayat 3 bulan kalender, rekonsiliasi beku) → route & komponen tidak
  boleh hardcode angka; perubahan aturan satu titik.
- **Kucing kelebihan dibekukan, bukan dihapus**; Free tidak bisa menambah
  kucing aktif ke-3 (`PLAN_CAT_LIMIT`), Pro mengaktifkan kembali semua
  kucing beku. Data tetap utuh saat paket berakhir.
- **Data milik pengguna lain selalu 404**, bukan 403 → tidak membocorkan
  keberadaan data; semua akses lewat lapisan owner-scoped `src/lib/cats.ts`.
- **Akun demo dibuat lewat Better Auth (`auth.api.signUpEmail`) dalam
  seed**, bukan insert tabel auth manual → hash password benar; pemilih
  akun hanya dirender bila `DEMO_MODE="true"` di server.
- **Peran pengguna dibaca dari DB dan dioper sebagai props** ke
  Sidebar/BottomNav → tidak ada lagi gating `localStorage`; penanda
  `cukingpro:onboarded` hanya untuk banner.
- **Tes memakai Vitest + PostgreSQL sungguhan** (database `cukingpro_test`)
  dan menguji lapisan data, bukan route handler → isolasi antar pemilik
  dan batas paket teruji tanpa perlu mensimulasikan request Next.
- **`src/proxy.ts` melakukan cek cookie sesi** → pengguna anonim dapat
  redirect HTTP 307; validasi sesi sebenarnya tetap di layout via Better
  Auth (cookie bisa dipalsukan).
- **`export const instant = false` pada layout `(app)` + `connection()`
  di `getSession()`** → route yang butuh sesi boleh blocking dan tidak
  ikut diprerender; error bail-out prerender diteruskan ulang oleh
  `handleRouteError` agar tidak tercatat sebagai 500.
- **Harga & durasi Pro placeholder (`49000` / 30 hari)** di seed →
  menunggu keputusan pemilik produk; UI membaca nilai dari tabel `plans`.

## Template entri baru
```
## YYYY-MM-DD
- **Keputusan** (alasan singkat) → dampak/akibat
```