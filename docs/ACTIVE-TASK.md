# Active Task

## Status Terakhir
**Backend Fase 0 SELESAI** — Drizzle + PostgreSQL, migrasi, Better Auth
(email/password + verifikasi email), format error standar, `/api/health-check`,
dan form auth di frontend sudah memakai Better Auth (bukan endpoint dummy).
UI Fase 1–6 tetap berjalan dengan mock.

Build hijau, TypeScript bersih, ESLint 0 error / 0 warning.

## Progres Sesi Ini (21 Okt 2026)
- Menambahkan dependensi: `drizzle-orm`, `drizzle-kit`, `postgres`,
  `better-auth`, `zod`, `tsx`, `dotenv`.
- `src/db/schema.ts` — tabel auth resmi Better Auth (`user`, `session`,
  `account`, `verification`) + relasi. Migrasi: `drizzle/0000_*.sql`.
- `src/db/index.ts` — Drizzle + postgres-js, singleton saat dev.
- `drizzle.config.ts` + skrip `db:generate`, `db:migrate`, `db:studio`.
- `src/lib/auth.ts` — Better Auth + Drizzle adapter, `requireEmailVerification`,
  `minPasswordLength: 8`, plugin `nextCookies()`, stub email.
- `src/lib/email.ts` — stub email: tautan hanya ditulis ke log (dev).
- `src/lib/session.ts` — `getSession()` / `requireSession()`.
- `src/lib/api-error.ts` — `ApiError` + `handleRouteError` sesuai format PRD §11.
- `src/app/api/auth/[...all]/route.ts` + `src/app/api/health-check/route.ts`.
- Form auth disesuaikan ke Better Auth: login (termasuk "Kirim ulang"
  verifikasi), register, lupa password, halaman `/reset-password` baru,
  kirim ulang di `/verify-email`, dan tombol Keluar di `/pengaturan`.
- `.env.example`, `.env` lokal (gitignored), README setup, `.gitignore`
  dikecualikan untuk `.env.example`.
- `next.config.ts`: `turbopack.root` dikunci ke folder proyek (menghapus
  warning package-lock liar di home directory).
- Halaman `/verify-email` & `/reset-password` membungkus akses `searchParams`
  dengan `<Suspense>` (wajib di Next 16 + cacheComponents).

## Hasil Verifikasi
- `npx tsc --noEmit` → bersih
- `npx eslint src` → 0 error, 0 warning
- `npm run db:migrate` → 4 tabel dibuat (`user`, `session`, `account`,
  `verification`)
- `npm run build` → sukses
- Uji API (dev & production build):
  - `GET /api/health-check` → `200 {"ok":true}`
  - sign-up → 200, email verifikasi tercatat di log
  - login sebelum verifikasi → `403 EMAIL_NOT_VERIFIED`
  - buka tautan verifikasi → 302 ke `/`
  - login setelah verifikasi → 200 + sesi valid (`get-session`)
  - request reset password → 200; reset dengan token → 200; login password
    baru → 200
- Halaman `/login`, `/register`, `/verify-email`, `/reset-password`,
  `/pengaturan` → 200 (dev & production)

## Masalah yang Belum Selesai (diketahui)
1. Modul selain auth masih memakai `src/lib/mock.ts`.
2. Belum ada auth guard di `(app)/layout.tsx` (bypass demo masih ada).
3. Pengiriman email nyata belum ada (SMTP stub).
4. Upload foto/dokumen, Web Push, Midtrans belum ada.
5. Logout belum menghapus langganan Web Push (TODO FR-21).

## Langkah Berikutnya
A. **Fase 1**: skema `profiles`, `cats`, `cat_ownership_history` + modul
   `plan.ts` + auth guard `(app)` (paling logis setelah Fase 0).
B. Sambungkan modul kucing & kesehatan ke API.
C. Tambah `profiles` + ganti gating peran dari `localStorage` ke DB.

## File Penting yang Diubah Sesi Ini
- Baru: `drizzle.config.ts`, `drizzle/`, `.env.example`,
  `src/db/{index,schema}.ts`, `src/lib/{auth,auth-client,auth-messages,email,session,api-error}.ts`,
  `src/app/api/auth/[...all]/route.ts`, `src/app/api/health-check/route.ts`,
  `src/app/(auth)/reset-password/page.tsx`,
  `src/components/auth/reset-password-form.tsx`,
  `src/components/profil/logout-button.tsx`
- Diubah: `package.json`, `next.config.ts`, `.gitignore`, `README.md`,
  `src/components/auth/{login-form,register-form,forgot-password-form,verify-email-card}.tsx`,
  `src/app/(auth)/verify-email/page.tsx`, `src/app/(app)/pengaturan/page.tsx`
