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

## Template entri baru
```
## YYYY-MM-DD
- **Keputusan** (alasan singkat) → dampak/akibat
```