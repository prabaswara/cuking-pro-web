# cukingPro Web

Aplikasi web manajemen kucing (SaaS) — Next.js 16 App Router, TypeScript,
Tailwind v4, shadcn/ui, Drizzle ORM + PostgreSQL, Better Auth.

Referensi produk: `../PRD-cuking-pro-web.md` (sumber kebenaran requirement).
Konteks untuk agent: `AGENTS.md` dan `docs/`.

## Prasyarat

- Node.js 20+ (proyek ini diuji di Node 22)
- PostgreSQL 16+
- npm

## Menjalankan Lokal

```bash
# 1. Install dependensi (dari folder cuking-pro-web/, bukan folder induk)
npm install

# 2. Siapkan environment
cp .env.example .env
#    Isi DATABASE_URL, lalu buat secret: openssl rand -base64 32

# 3. Buat database (contoh)
createdb cukingpro

# 4. Jalankan migrasi
npm run db:migrate

# 5. Isi data demo (opsional, untuk mencoba berbagai role/paket)
npm run db:seed

# 6. Jalankan dev server
npm run dev
```

Buka http://localhost:3000.

### Akun demo

`npm run db:seed` membuat 4 akun (password sama: lihat `DEMO_PASSWORD`
di `.env`, default `demo12345`):

| Email | Peran | Paket |
|---|---|---|
| `free@demo.cukingpro` | pemilik | Free (2 kucing) |
| `breeder@demo.cukingpro` | breeder | Free |
| `stud@demo.cukingpro` | jasa pacak | Free |
| `pro@demo.cukingpro` | breeder + jasa pacak | Pro |

Pemilih akun di `/login` **hanya tampil bila `DEMO_MODE="true"`**.
Jangan aktifkan di produksi; akun demo tidak dibuat otomatis.

### Tes

```bash
# sekali saja: buat database tes + migrasi (butuh .env.test)
cp .env.example .env.test   # lalu isi DATABASE_URL ke database terpisah
npm run db:test:setup

npm test                    # Vitest: unit + integrasi (PostgreSQL)
```

Tes integrasi memakai database sungguhan dan membersihkan datanya sendiri.
Jangan arahkan `.env.test` ke database pengembangan/produksi.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan (Turbopack) |
| `npm run build` | Build produksi (wajib hijau) |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Cek TypeScript |
| `npm test` | Jalankan seluruh tes (Vitest) |
| `npm run test:watch` | Tes mode watch |
| `npm run db:generate` | Generate migrasi dari `src/db/schema.ts` |
| `npm run db:migrate` | Terapkan migrasi ke database |
| `npm run db:seed` | Isi akun & data demo (idempoten) |
| `npm run db:test:setup` | Buat database tes + migrasi |
| `npm run db:studio` | Drizzle Studio |

## Struktur Singkat

```
src/
├── app/
│   ├── (marketing)/   # landing, kebijakan privasi, syarat layanan
│   ├── (auth)/        # login, register, verify-email, lupa/reset password
│   ├── (app)/         # area aplikasi (auth guard, Header, Sidebar, BottomNav)
│   └── api/
│       ├── auth/[...all]/   # handler Better Auth
│       ├── health-check/    # GET /api/health-check → { ok: true }
│       ├── profile/         # GET/PATCH profil + peran
│       ├── plan/            # GET paket, pemakaian, jendela riwayat
│       ├── cats/            # CRUD kucing + tracking + pedigree
│       └── uploads/         # POST foto, GET foto (wajib sesi)
├── components/        # UI per domain
├── db/                # koneksi Drizzle, skema, seed
├── lib/               # auth, session, cats, plan, storage, api-error, mock
└── proxy.ts           # cek cookie sesi → redirect 307 ke /login
tests/                 # Vitest (unit + integrasi DB)
```

## Auth (Better Auth)

- Tabel: `user`, `session`, `account`, `verification` (dibuat oleh migrasi).
- Email + password, **wajib verifikasi email** sebelum login.
- Selama `SMTP_HOST` kosong, tautan verifikasi/reset hanya dicetak di log
  server saat mode development (tidak dikirim ke produksi).
- Helper sesi: `src/lib/session.ts` (`getSession`, `requireSession`).

## Catatan

- Data domain yang belum punya API (kesehatan, berat, breeding, penjualan,
  jasa pacak, transfer, keuangan) masih dari `src/lib/mock.ts`.
- Foto kucing disimpan di `.data/uploads/` (gitignored) dan hanya bisa
  diakses lewat `/api/uploads/:key` dengan sesi valid. Ganti ke S3/R2
  cukup dengan implementasi driver baru di `src/lib/storage.ts`.
- Harga & durasi Pro masih placeholder di seed (`plans`), menunggu
  keputusan pemilik produk.
- `.env` tidak boleh di-commit; gunakan `.env.example` sebagai acuan.
