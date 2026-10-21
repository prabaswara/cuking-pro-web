# Active Task

## Status Terakhir
**Backend Fase 1 SELESAI** — profil, paket, kucing, silsilah, upload foto,
auth guard, akun demo, dan tes otomatis.

- Build produksi hijau, `npx tsc --noEmit` bersih, ESLint 0 error.
- `npm test` → **12 tes lulus** (unit + integrasi PostgreSQL).
- Data kucing/profil/paket sudah dari DB. Modul lain (kesehatan, berat,
  breeding, penjualan, jasa pacak, transfer, keuangan) masih mock.

## Yang Selesai di Fase 1 (21 Okt 2026)

### Skema & aturan paket
- Tabel baru: `profiles`, `cats`, `cat_ownership_history`, `plans`,
  `subscriptions` (migrasi `drizzle/0001_windy_cargill.sql`).
- Indeks unik parsial menjamin satu kepemilikan aktif per kucing.
- Induk (`sire_id`/`dam_id`) hanya boleh kucing milik pemilik yang sama —
  dijaga di lapisan API (tidak ada FK lintas pemilik).
- `src/lib/plan.ts`: satu sumber aturan Free/Pro, jendela riwayat 3 bulan
  kalender (dengan clamp akhir bulan), hitung kucing, rekonsiliasi status beku.

### API
- `GET/PATCH /api/profile` — profil + peran + nama.
- `GET /api/plan` — paket aktif, pemakaian, awal jendela riwayat.
- `GET/POST /api/cats`, `GET/PATCH/DELETE /api/cats/:id`.
- `PATCH /api/cats/:id/tracking`, `GET /api/cats/:id/pedigree`.
- `POST /api/uploads`, `GET /api/uploads/:key` (wajib sesi).
- Semua query memfilter `owner_id` dari sesi; data pemilik lain → 404.
- Kucing beku menolak edit (`403 CAT_FROZEN`), kecuali ubah status.
- Paket Free menolak kucing aktif ke-3 (`403 PLAN_CAT_LIMIT`).

### Auth & demo
- Auth guard di `(app)/layout.tsx` + `src/proxy.ts` (cookie check → 307).
- Pemilih 4 akun demo di `/login`, hanya bila `DEMO_MODE="true"`.
- Peran diambil dari DB dan diteruskan ke Sidebar/BottomNav (bukan
  `localStorage` lagi).
- Onboarding & form profil menyimpan peran lewat `PATCH /api/profile`.

### UI tersambung
- `/kucing` menampilkan kucing dari DB; `/kucing/tambah` menyimpan via API.
- `/profil` memuat & menyimpan profil DB.
- `/paket` menampilkan paket, pemakaian, dan harga dari DB.

### Tes
- `vitest.config.mts`, `vitest.setup.ts`, `tests/plan.test.ts`,
  `tests/cats.test.ts`.
- Integrasi memakai database `cukingpro_test` dan membersihkan datanya.

## Hasil Verifikasi (production build)
- `npm run build` → sukses, tanpa error prerender.
- Tanpa sesi: `/dashboard`, `/kucing/abc` → **307** ke `/login`.
- Login `free@demo.cukingpro` → `/dashboard`, `/kucing`, `/profil`,
  `/paket`, `/onboarding` → 200; kucing Mochi & Luna tampil.
- Free: POST kucing ke-3 → `403 PLAN_CAT_LIMIT`.
- Pro: POST kucing ke-4 → 201; `/paket` menampilkan "tanpa batas".
- Isolasi: GET/PATCH/DELETE kucing milik Pro oleh Free → 404.
- Kucing beku: PATCH nama → `403 CAT_FROZEN`.
- Upload PNG 1×1 → WebP 96 byte; GET dengan sesi 200, tanpa sesi 401.
- PATCH peran breeder → menu Jasa Pacak langsung muncul setelah refresh.

## Masalah yang Belum Selesai (diketahui)
1. Harga & durasi Pro masih placeholder (`49000` / 30 hari).
2. Belum ada SMTP nyata; tautan verifikasi/reset hanya ke log (dev).
3. Modul kesehatan/berat/breeding/penjualan/jasa pacak/transfer/keuangan
   masih mock; tabelnya menyusul di fase terkait.
4. `litter_id` pada `cats` dan `transfer_id` pada riwayat kepemilikan
   ditunda sampai tabel Fase 3/5 ada.
5. Upload avatar profil belum disambungkan (tombol masih disabled).
6. Midtrans & cron job belum ada (Fase 6).
7. Logout belum menghapus langganan Web Push (TODO FR-21).

## Langkah Berikutnya (Fase 2)
A. Tabel kesehatan, berat, pakan, pengingat, dokumen + API owner-scoped.
B. Terapkan jendela riwayat Free (banner "N data terkunci").
C. Sambungkan halaman `/kucing/[id]/kesehatan`, `/berat`, `/pakan`,
   `/dokumen`, `/timeline` ke API.
D. Update `docs/AI-CONTEXT.md` tiap akhir sesi.

## File Penting Fase 1
- Baru: `src/lib/{cats,plan,profile,storage}.ts`,
  `src/lib/validation/{cat,profile}.ts`,
  `src/db/seed.ts`, `src/proxy.ts`, `vitest.config.mts`,
  `vitest.setup.ts`, `tests/{plan,cats}.test.ts`,
  `src/app/api/{profile,plan,cats,uploads}/**`.
- Diubah: `src/db/schema.ts`, `src/lib/{auth,session,api-error}.ts`,
  `src/app/(app)/layout.tsx`, `src/app/(app)/{kucing,profil,paket,onboarding}/**`,
  `src/components/{layout/sidebar,layout/bottom-nav,auth/login-form,profil/profile-form,onboarding/role-picker}.tsx`,
  `README.md`, `package.json`, `.gitignore`, `.env.example`.
