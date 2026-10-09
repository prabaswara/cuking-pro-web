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

## Template entri baru
```
## YYYY-MM-DD
- **Keputusan** (alasan singkat) → dampak/akibat
```