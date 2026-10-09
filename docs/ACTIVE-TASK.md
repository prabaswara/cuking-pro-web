# Active Task

## Status Terakhir
**Fase 3 frontend (Breeding & Penjualan) SELESAI & build hijau.**
Menunggu perintah berikutnya (kandidat: selesaikan sisa FR-10
"Tambah Anak Kucing", atau mulai Fase 4 Jasa Pacak FR-13/FR-14,
atau mulai backend: DB + Better Auth).

## Progres Terakhir
- Mock + UI + validasi klien untuk: heat cycles, matings (own/eksternal),
  kehamilan (estimasi +65 hari), catat kelahiran (hidup ≤ lahir),
  penjualan (alur status, DP ≤ harga akhir, filter status)
- Gating breeder via localStorage; menu Breeding di sidebar
- Fix UX: modal berat badan jadi dialog tengah (nav bawah tetap
  terlihat), tooltip grafik kontras, tombol "Catat Berat" di detail
  kucing terhubung ke `/kucing/[id]/berat`

## Hasil Test Terakhir
- `npx tsc --noEmit` → bersih
- `npm run build` → sukses (static + partial prerender)
- Route cek dev server: `/breeding`, `/breeding/kehamilan/mating-1`,
  `/breeding/kehamilan/mating-1/lahir`, `/breeding/litter/litter-1` → 200

## Masalah yang Belum Selesai (diketahui)
1. `/breeding/litter/[id]/tambah-anak` belum ada
2. Semua form belum nyambung ke API (mock/demo)
3. Upload foto belum berfungsi
4. `require("@/lib/mock")` di komponen client — bersihkan saat API masuk
5. Auth guard belum ada di `(app)/layout.tsx`

## Langkah Berikutnya (pilih salah satu)
A. Selesaikan sisa Fase 3: halaman tambah-anak + hubungkan tombol
   "Jual" dari detail kucing ke form penjualan
B. Mulai Fase 4 (Jasa Pacak): mock + UI booking + kawin pacak
C. Mulai backend Fase 0: Drizzle schema + Better Auth + `.env.example`

## File yang Diubah Sesi Terakhir (Fase 3)
- src/lib/mock.ts (mock Fase 3 + helpers)
- src/components/breeding/{heat-cycle-list,mating-list}.tsx (baru)
- src/components/penjualan/sales-list.tsx (baru)
- src/app/(app)/breeding/** (page.tsx baru + sub-routes)
- src/components/layout/sidebar.tsx, src/components/profil/profile-form.tsx