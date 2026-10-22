# Active Task

## Status Terakhir
**Backend Fase 3 SELESAI** — breeding (siklus birahi, kawin/kehamilan,
kelahiran, anak kucing) dan penjualan kucing sudah memakai data DB.
Fase 2 tetap hijau.

- `npm run build` → hijau.
- `npx tsc --noEmit` → bersih.
- `npm run lint` → 0 error / 0 warning.
- `npm test` → **61 tes lulus** (7 berkas).
- Migrasi `drizzle/0003_shiny_oracle.sql` sudah diterapkan ke DB dev & tes.

## Yang Selesai di Fase 3 (22 Okt 2026)

### Skema
- Tabel baru: `heat_cycles`, `matings`, `litters`, `cat_sales`.
- `cats.litter_id` → FK ke `litters.id` (`ON DELETE SET NULL`).
- `litters.mating_id` unik (satu litter per catatan kawin).
- Partial unique index `cat_sales_active_cat_uidx` → satu penjualan aktif
  (`listed`/`reserved`) per kucing.

### API (semua owner-scoped)
- `GET/POST /api/cats/:id/heat-cycles`, `PATCH/DELETE /api/heat-cycles/:id`.
- `GET/POST /api/matings`, `GET/PATCH/DELETE /api/matings/:id`.
- `POST /api/matings/:id/litter`.
- `GET /api/litters/:id`, `POST /api/litters/:id/kittens`.
- `GET/POST /api/cat-sales`, `GET/PATCH/DELETE /api/cat-sales/:id`.
- Data pemilik lain → `404`; kucing beku → `403 CAT_FROZEN`.

### Aturan bisnis
- Siklus birahi hanya betina aktif & dilacak; `endDate >= startDate`;
  rentang tumpang tindih ditolak; jarak antar siklus dihitung per betina.
- Kawin boleh memakai kucing sendiri atau nama manual untuk betina dan/
  atau pejantan; validasi jenis kelamin; peringatan kawin sedarah hanya
  informatif.
- Estimasi lahir default = tanggal kawin + 65 hari; nilai manual dipertahankan.
- Status Hamil membuat pengingat `source_type='pregnancy'`,
  `source_id=mating.id`; Tidak Hamil menghapusnya; ubah estimasi
  memperbarui pengingat yang sama.
- Status Sudah Melahirkan hanya bisa dicapai lewat pencatatan kelahiran.
- Kelahiran: `totalAlive <= totalBorn`, tanggal tidak sebelum kawin,
  satu litter per kawin; status kawin menjadi `delivered` dan pengingat
  kehamilan ditutup.
- Anak kucing dibuat sebagai baris `cats` dengan induk, `litter_id`, dan
  tanggal lahir litter; pendaftaran boleh sebagian tetapi tidak melebihi
  jumlah hidup; batas kucing Free tetap berlaku.
- Penjualan: Dijual → Dipesan → Terjual; Dijual/Dipesan → Batal;
  Batal → Dijual. Terjual final (koreksi lewat hapus).
- Terjual wajib pembeli, harga akhir, dan tanggal jual tidak masa depan;
  DP ≤ harga akhir.
- Terjual mengubah kucing menjadi `sold`, menandai pengingat aktif
  selesai, dan menyembunyikannya dari daftar kucing default.
- Hapus penjualan Terjual mengembalikan kucing ke `active` bila masih
  milik pengguna.
- Free: riwayat birahi dan penjualan dipotong 3 bulan kalender dengan
  `lockedCount` + `windowStart`; daftar kawin menyembunyikan riwayat lama
  tetapi tetap menampilkan `pending`/`pregnant`.

### UI tersambung
- `/breeding` — server component + tab DB: Siklus Birahi, Kawin &
  Kehamilan, Penjualan; gate `profiles.is_breeder`.
- `/breeding/kehamilan/[id]` — detail DB, ubah hasil/estimasi lahir.
- `/breeding/kehamilan/[id]/lahir` — form kelahiran → API.
- `/breeding/litter/[id]` — ringkasan + daftar anak kucing DB.
- `/breeding/litter/[id]/tambah-anak` — form anak kucing → API.
- `/penjualan/[id]/edit` — edit status/data penjualan DB.
- `/kucing/[id]/jual` — catat penjualan dari detail kucing.
- Aksi Jual di detail kucing hanya muncul untuk breeder, kucing aktif,
  dan dilacak.

### Tes
- `tests/breeding.test.ts` — isolasi, kucing beku, validasi betina,
  overlap/jarak siklus, default +65, sinkronisasi pengingat, peringatan
  sedarah, satu litter per kawin, batas anak kucing, batas Free,
  jendela riwayat Free/Pro.
- `tests/sales.test.ts` — isolasi, satu penjualan aktif, alur status,
  validasi pembeli/harga/tanggal/DP, efek Terjual ke kucing & pengingat,
  hapus memulihkan kucing, ringkasan bulanan, jendela riwayat Free.
- Total 61 tes lulus bersama tes Fase 1–2.

## Masalah yang Belum Selesai (diketahui)
1. Modul jasa pacak, transfer kepemilikan, keuangan, dan pembayaran Pro
   masih mock.
2. `cat_ownership_history.transfer_id` menunggu Fase 5.
3. Belum ada SMTP nyata; tautan verifikasi/reset hanya ke log (dev).
4. Upload avatar profil belum disambungkan.
5. Midtrans, cron notifikasi, dan Web Push belum ada.
6. Harga & durasi Pro masih placeholder (`49000` / 30 hari).
7. Dokumen hanya disimpan lokal di `.data/documents/`; belum ada
   pemindaian malware/verifikasi eksternal.
8. Foto anak kucing belum diunggah dari form tambah anak; dapat diubah
   dari halaman detail kucing setelah terdaftar.

## Langkah Berikutnya (Fase 4 — Jasa Pacak)
A. Skema & API pejantan pacak + booking (termasuk catatan kawin booking).
B. Sambungkan `/jasa-pacak` dan `/jasa-pacak/booking/[id]` ke DB.
C. Terapkan tarif, jadwal, status booking, dan pengingat booking.
D. Update dokumen konteks di akhir sesi.

## File Penting Fase 3
- Baru: `src/lib/{heat-cycles,matings,litters,sales}.ts`,
  `src/lib/validation/{breeding,sale}.ts`,
  `src/app/api/{cats/[id]/heat-cycles,heat-cycles,matings,litters,cat-sales}/**`,
  `src/components/breeding/{breeding-tabs,heat-cycle-manager,mating-manager,sales-manager}.tsx`,
  `src/app/(app)/breeding/kehamilan/[id]/MatingActions.tsx`,
  `src/app/(app)/breeding/kehamilan/[id]/lahir/BirthForm.tsx`,
  `tests/{breeding,sales}.test.ts`, `drizzle/0003_shiny_oracle.sql`.
- Diubah: `src/db/schema.ts`, `src/lib/reminders.ts`, `src/lib/date.ts`,
  `src/lib/litters.ts`, halaman `(app)/breeding/**`,
  `penjualan/[id]/edit/**`, `kucing/[id]/{page,jual}`,
  `src/components/kucing/gender-select.tsx`.
- Dihapus: komponen mock `heat-cycle-list`, `mating-list`, `sales-list`.

## File Penting Fase 2
- `src/lib/{health,reminders,feeding,documents,timeline,date,labels}.ts`,
  `src/lib/validation/{health,reminder,feeding,document}.ts`,
  API kesehatan/berat/pakan/pengingat/dokumen/uploads,
  `tests/{health,reminders,records}.test.ts`,
  `drizzle/0002_dry_sumo.sql`.

## File Penting Fase 1
- `src/lib/{cats,plan,profile,storage}.ts`,
  `src/lib/validation/{cat,profile}.ts`, `src/db/seed.ts`, `src/proxy.ts`,
  `tests/{plan,cats}.test.ts`, API profil/plan/kucing/uploads.
