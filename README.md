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

# 5. Jalankan dev server
npm run dev
```

Buka http://localhost:3000.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan (Turbopack) |
| `npm run build` | Build produksi (wajib hijau) |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Cek TypeScript |
| `npm run db:generate` | Generate migrasi dari `src/db/schema.ts` |
| `npm run db:migrate` | Terapkan migrasi ke database |
| `npm run db:studio` | Drizzle Studio |

## Struktur Singkat

```
src/
├── app/
│   ├── (marketing)/   # landing, kebijakan privasi, syarat layanan
│   ├── (auth)/        # login, register, verify-email, lupa/reset password
│   ├── (app)/         # area aplikasi (Header, Sidebar, BottomNav)
│   └── api/
│       ├── auth/[...all]/   # handler Better Auth
│       └── health-check/    # GET /api/health-check → { ok: true }
├── components/        # UI per domain
├── db/                # koneksi Drizzle + skema
└── lib/               # auth, session, api-error, email, mock
```

## Auth (Better Auth)

- Tabel: `user`, `session`, `account`, `verification` (dibuat oleh migrasi).
- Email + password, **wajib verifikasi email** sebelum login.
- Selama `SMTP_HOST` kosong, tautan verifikasi/reset hanya dicetak di log
  server saat mode development (tidak dikirim ke produksi).
- Helper sesi: `src/lib/session.ts` (`getSession`, `requireSession`).

## Catatan

- `src/lib/mock.ts` masih menjadi sumber data UI untuk modul non-auth.
- `.env` tidak boleh di-commit; gunakan `.env.example` sebagai acuan.
