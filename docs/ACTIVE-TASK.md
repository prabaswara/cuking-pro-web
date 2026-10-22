# Active Task

## Status Terakhir
**Fase 4 — Jasa Pacak SELESAI** — profil pejantan pacak, booking klien,
catatan kawin, pengingat jadwal/estimasi lahir, statistik, dan jendela
riwayat Free sudah memakai data DB.

- `npm run build` → hijau.
- `npx tsc --noEmit` → bersih.
- `npm run lint` → 0 error / 0 warning.
- `npm test` → **72 tes lulus** (8 berkas).
- Migrasi `drizzle/0004_bored_psylocke.sql` sudah diterapkan ke DB dev & tes.

## Yang Selesai di Fase 4 (22 Okt 2026)

### Skema
- Tabel baru: `stud_services`, `stud_bookings`, `stud_booking_matings`.
- `stud_services.cat_id` nullable + unique (boleh dikosongkan saat transfer),
  `cat_name` disimpan sebagai salinan.
- `stud_bookings.approved_at` ditambahkan sebagai penanda apakah booking
  pernah disetujui, untuk mengembalikan status yang tepat saat kawin
  terakhir dihapus.
- `stud_booking_matings.booking_id` cascade; `stud_bookings.stud_service_id`
  restrict agar profil pejantan tidak menghapus riwayat booking.

### API (semua owner-scoped)
- `GET/POST /api/stud-services`.
- `GET/PATCH/DELETE /api/stud-services/:id`.
- `GET /api/stud-services/:id/stats`.
- `GET/POST /api/stud-bookings` (query `status`, `stud_service_id`,
  `planned_date`; camelCase juga diterima).
- `GET/PATCH/DELETE /api/stud-bookings/:id`.
- `GET/POST /api/stud-bookings/:id/matings`.
- `DELETE /api/booking-matings/:id`.
- Data pemilik lain → `404`; kucing beku → `403 CAT_FROZEN`.

### Aturan bisnis
- Pejantan hanya kucing jantan milik sendiri, aktif, dan dilacak.
- Tarif wajib nominal Rp ≥ 0 atau deskripsi; satu kucing satu profil pacak.
- Pejantan tidak tersedia/beku/terjual tidak bisa dipilih untuk booking baru.
- Booking baru selalu `requested`; transisi:
  `requested → approved/rejected/cancelled`,
  `approved → rejected/cancelled`,
  `ongoing → completed/cancelled`. `ongoing` hanya lewat kawin pertama.
- `completed` hanya dari `ongoing` dan minimal satu catatan kawin.
- Booking `approved` + tanggal rencana membuat pengingat
  `source_type='booking_planned'`, `source_id=booking.id`.
- Kawin pertama mengubah status ke `ongoing`, mengisi estimasi lahir
  kawin pertama + 65 hari, dan membuat pengingat `booking_due`.
- Estimasi manual dipertahankan saat tanggal kawin berubah; dapat
  dikembalikan ke hitungan otomatis.
- Hapus kawin terakhir mengembalikan status ke `approved` (jika pernah
  disetujui) atau `requested`, mengosongkan estimasi, dan menghapus
  pengingat estimasi.
- Status kehamilan manual: `unknown`, `pregnant`, `not_pregnant`,
  `delivered`. Tidak hamil menghapus pengingat; sudah melahirkan
  menutup pengingat (`done_at`).
- Booking lewat estimasi tanpa `delivered`/`not_pregnant` menampilkan
  “Melewati estimasi lahir” + aksi perbarui status.
- Bentrok jadwal pejantan + tanggal yang sama hanya peringatan; UI
  meminta konfirmasi “Tetap Simpan” sebelum menyimpan.
- Statistik pejantan: jumlah booking, total kawin, hamil, melahirkan;
  dihitung dari booking yang terlihat sesuai paket.
- Free: booking selesai/batal yang lebih tua dari jendela 3 bulan
  disembunyikan dengan `lockedCount` + `windowStart`; booking aktif
  selalu terlihat.

### UI tersambung
- `/jasa-pacak` — server component, gate `profiles.is_stud_provider`,
  tab Booking & Pejantan Pacak.
- `/jasa-pacak/booking/[id]` — detail DB: status, kawin, estimasi lahir,
  status kehamilan, WhatsApp, edit booking.
- Komponen baru: `stud-tabs`, `stud-service-manager`,
  `stud-booking-manager`, `stud-booking-form`, `stud-booking-detail`,
  `stud-status`.
- Komponen mock `StudServiceList` dan `StudBookingList` dihapus.

### Tes
- `tests/stud.test.ts` — isolasi pemilik, kucing beku, validasi tarif,
  satu profil per kucing, alur status, bentrok jadwal, kawin pertama,
  estimasi manual/otomatis, overdue, pengingat booking, hapus kawin,
  statistik, dan jendela riwayat Free/Pro.
- Total 72 tes lulus bersama Fase 1–3.

## Masalah yang Belum Selesai (diketahui)
1. Modul transfer kepemilikan, keuangan, dan pembayaran Pro masih mock.
2. `cat_ownership_history.transfer_id` menunggu Fase 5.
3. Halaman publik pejantan (FR-19) belum dibuat.
4. Belum ada SMTP nyata; tautan verifikasi/reset hanya ke log (dev).
5. Upload avatar profil belum disambungkan.
6. Midtrans, cron notifikasi, dan Web Push belum ada.
7. Harga & durasi Pro masih placeholder (`49000` / 30 hari).
8. Dokumen hanya disimpan lokal di `.data/documents/`; belum ada
   pemindaian malware/verifikasi eksternal.
9. Foto anak kucing belum diunggah dari form tambah anak.

## Langkah Berikutnya (Fase 5 — Transfer & Keuangan)
A. Skema transfer kepemilikan + `transfer_id` pada riwayat kepemilikan;
   saat kucing ditransfer, kosongkan `stud_services.cat_id` dan nonaktifkan
   layanan.
B. API transfer masuk/keluar dan penerimaan/penolakan.
C. Modul keuangan: transaksi, ringkasan, kaitan booking/penjualan.
D. Pembayaran Pro / Midtrans bila sudah diputuskan.
E. Update dokumen konteks di akhir sesi.

## File Penting Fase 4
- Baru: `src/lib/{stud-services,stud-bookings}.ts`,
  `src/lib/validation/stud.ts`,
  `src/app/api/{stud-services,stud-bookings,booking-matings}/**`,
  `src/components/pacak/{stud-tabs,stud-service-manager,stud-booking-manager,stud-booking-form,stud-booking-detail,stud-status}.tsx`,
  `tests/stud.test.ts`, `drizzle/0004_bored_psylocke.sql`.
- Diubah: `src/db/schema.ts`, `src/lib/reminders.ts`,
  `src/app/(app)/jasa-pacak/**`.
- Dihapus: komponen mock `stud-service-list.tsx`, `stud-booking-list.tsx`.

## File Penting Fase 3
- `src/lib/{heat-cycles,matings,litters,sales}.ts`,
  `src/lib/validation/{breeding,sale}.ts`, API breeding/penjualan,
  `src/components/breeding/**`, `tests/{breeding,sales}.test.ts`,
  `drizzle/0003_shiny_oracle.sql`.

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
