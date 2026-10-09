<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — cukingPro Web

## 1. Identitas Proyek
SaaS manajemen kucing: akun, data kucing, kesehatan, pengingat, breeding,
penjualan, jasa pacak, transfer kepemilikan, keuangan, langganan Pro.
Referensi produk: `PRD-cuking-pro-web.md` di root repo. PRD adalah sumber
kebenaran untuk requirement — jika kode dan PRD berbeda, ikuti PRD.

## 2. Perintah Penting
CD ke folder PROYEK DULU (`cuking-pro-web/`), bukan repo/root:
- `npm run dev` — server pengembangan (Turbopack)
- `npm run build` — build produksi (WAJIB hijau sebelum selesai)
- `npm run start` — jalankan hasil build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — cek TypeScript saja

⚠️ Menjalankan npm dari folder induk (`testingAI/`) akan gagal ENOENT.

## 3. Arsitektur Singkat
Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui, satu proyek.
Backend (rencana): route handlers + Zod + Drizzle ORM + PostgreSQL +
Better Auth. Saat ini: **FRONTEND-ONLY**, data dari `src/lib/mock.ts`.

Struktur:
- `src/app/(auth)/` — halaman publik auth; `src/app/(app)/` — aplikasi
  (Header, Sidebar, BottomNav di layout); `src/app/api/` — (belum ada)
- `src/components/` — `ui/` (shadcn), plus folder per-domain
  (`auth/`, `kucing/`, `kesehatan/`, `berat/`, `breeding/`, `penjualan/`,
  `pengingat/`, `notifikasi/`, `profil/`, `layout/`, `brand/`)
- `src/lib/mock.ts` — data mock (PENGGANTI SEMENTARA API)
- `src/types/index.ts` — tipe bersama (mirror tabel DB di PRD §6)

## 4. Standar Coding
- TypeScript ketat; hindari `any` (kecuali bridging mock→UI).
- Bahasa Indonesia untuk semua teks UI; nama file/variabel Inggris.
- Server Component default; `"use client"` hanya saat perlu state/effect.
- **Route params adalah Promise** (Next 15+): `params: Promise<{ id: string }>`
  di server component; unwrap dengan `await params`.
- `cacheComponents: true` aktif:
  - `export const dynamic` TIDAK VALID.
  - Untuk render dinamis per-request, panggil `await connection()`
    dari `next/server` di awal server component.
  - `new Date()` langsung di prerender bisa gagal build → pakai
    `await connection()` atau route dinamis.
  - Komponen dengan `usePathname()` di layout/dialog WAJIB dibungkus
    `<Suspense>`.
- Modal/dialog: jangan bertabrakan z-index dengan BottomNav (z-50).
  Pola disepakati: backdrop di bawah nav, konten di atas.
- Form: label eksplisit, error di bawah field terkait, validasi klien
  yg mencerminkan aturan PRD (server tetap validasi ulang nanti).
- Mobile-first: target 44×44px, hormati safe area, tanpa scroll horizontal
  di 360px. Desain mengikuti tema "Warm Whiskers" (token di
  `src/app/globals.css`) dan referensi HTML di `stitch_cozy_cat_frontend_ui/`.

## 5. Aturan Bisnis yang WAJIB Dihormati di UI
- Tidak boleh menampilkan saran medis/interval vaksin otomatis; semua
  tanggal diisi pengguna. Halaman kesehatan memuat disclaimer.
- Estimasi lahir = tanggal kawin + 65 hari (default, bisa diubah manual).
- Batas paket (Free): maks 2 kucing dilacak; riwayat 3 bulan (banner
  "N data terkunci"); kucing kelebihan dibekukan (read-only).
- Penjualan: alur status Dijual → Dipesan → Terjual; Terjual final
  (koreksi dengan hapus + konfirmasi). DP ≤ harga akhir.
- Kelahiran: jumlah hidup ≤ jumlah lahir; tidak bisa dicatat 2x.
- Siklus birahi: hanya kucing betina; tanggal selesai ≥ mulai; tolak
  rentang tumpang tindih pada betina yang sama.
- Web Push iOS: hanya berfungsi bila sudah ditambahkan ke Layar Utama
  (iOS 16.4+); tampilkan panduan, bukan error.
- Semua query data (saat backend ada) WAJIB difilter `user_id` dari sesi.
- Keuangan hanya pemasukan/pengeluaran — TANPA margin/laba/rugi/saldo.

## 6. Konvensi Git & Konteks
- Jangan hapus blok auto-generated `nextjs-agent-rules` di AGENTS.md
  (di-regenerate `next dev`). Commit bersama perubahan Anda.
- Baca `node_modules/next/dist/docs/` sebelum menulis kode Next.js
  (versi ini berbeda dari yang diperkirakan model).
- Selesaikan pekerjaan fase dalam commit logis; jaga build tetap hijau.
- Setiap akhir sesi, perbarui `docs/AI-CONTEXT.md` dan
  `docs/ACTIVE-TASK.md`.

## 7. Context Persistence Rules

Before starting a task:
1. Read `docs/AI-CONTEXT.md`.
2. Read `docs/ACTIVE-TASK.md` if it exists.
3. Inspect the current code and Git status. Do not assume previous notes are still accurate.

During the task:
1. Keep `docs/ACTIVE-TASK.md` updated when a meaningful milestone is reached.
2. Record important architectural or business decisions in `docs/DECISIONS.md`.
3. Never record secrets, credentials, or environment variable values.
4. Do not overwrite unrelated changes made by the user.

Before ending a task or when asked to hand off:
1. Update `docs/ACTIVE-TASK.md` with completed work, pending work, blockers, changed files, and verification results.
2. Update `docs/AI-CONTEXT.md` if project architecture, implementation status, or important conventions changed.
3. Update `docs/DECISIONS.md` only when a meaningful decision was made.
4. Run relevant tests when possible and record the actual results.
5. Ensure another agent can continue without needing the previous conversation.

Keep context concise, factual, and based on verified repository state.

## 8. Larangan (dari PRD §8)
Tidak membangun tanpa diminta: aplikasi native, paket berbayar kedua,
kupon/refund otomatis, penghitungan margin/laba/rugi, pusat notifikasi
dalam-app, SMS/WhatsApp otomatis, offline caching, panel admin, login
sosial, multi-bahasa, dark mode kustom, marketplace, chat, ekspor PDF
(sebelum P0/P1 selesai), verifikasi pedigree, saran medis/AI.