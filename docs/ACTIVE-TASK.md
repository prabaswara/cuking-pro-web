# Active Task

## Status Terakhir
**Backend Fase 2 SELESAI** — kesehatan, berat, jadwal pakan, pengingat,
dokumen, linimasa, jendela riwayat Free, dan halaman terkait sudah
memakai data DB.

- `npm run build` → hijau.
- `npx tsc --noEmit` → bersih.
- `npm run lint` → 0 error.
- `npm test` → **45 tes lulus** (5 berkas, termasuk tes integrasi Fase 2).
- Migrasi `drizzle/0002_dry_sumo.sql` sudah diterapkan ke DB dev & tes.

## Yang Selesai di Fase 2 (22 Okt 2026)

### Skema
- Tabel baru: `health_records`, `reminders`, `feeding_schedules`,
  `cat_documents` + indeks/relasi.
- Berat disimpan di `health_records` (`type='weight'`, `weight_kg`),
  sesuai PRD; endpoint `/api/cats/:id/weights` hanya permukaan khusus.
- Dua tabel pendukung UI yang belum ada di PRD: `feeding_schedules` dan
  `cat_documents` (dibutuhkan halaman Pakan & Dokumen).

### API (semua owner-scoped)
- `GET/POST /api/cats/:id/health`, `PATCH/DELETE /api/health/:id`.
- `GET/POST /api/cats/:id/weights`, `PATCH/DELETE /api/weights/:id`.
- `GET/POST /api/reminders`, `PATCH/DELETE /api/reminders/:id`.
- `GET/POST /api/cats/:id/feeding`, `PATCH/DELETE /api/feeding/:id`.
- `GET/POST /api/cats/:id/documents`, `PATCH/DELETE /api/documents/:id`.
- `POST /api/uploads/documents`, `GET /api/uploads/documents/:key`
  (wajib sesi).
- Data pemilik lain → `404`; kucing beku → `403 CAT_FROZEN`.

### Aturan bisnis
- Tanggal catatan tidak boleh masa depan; `nextDueDate` ≥ `recordDate`.
- Berat > 0 kg dan ≤ 20 kg (validasi Zod di route).
- Pengingat otomatis (`source_type='health'`, `source_id=healthRecord.id`)
  dibuat/diperbarui/dihapus mengikuti `nextDueDate`; tidak ada duplikat.
- Menunda pengingat yang telat dihitung dari hari ini, bukan tanggal lama.
- Edit pengingat milik kucing beku sekarang ditolak (bug ditemukan tes).
- Mengubah tipe catatan menjadi `weight` menghapus `nextDueDate` dan
  pengingat otomatisnya.
- Free: daftar kesehatan/berat/dokumen memotong riwayat 3 bulan kalender
  dan mengembalikan `lockedCount` + `windowStart`; Pro tanpa batas.
- Tidak ada saran medis/interval otomatis; disclaimer tetap di halaman
  kesehatan.

### UI tersambung
- `/dashboard` — statistik kucing & pengingat dari DB, aksi cepat memakai
  kucing aktif pertama.
- `/kucing/[id]` — ringkasan berat/kesehatan + jadwal pakan.
- `/kucing/[id]/kesehatan` + tambah — daftar & form DB.
- `/kucing/[id]/berat` — grafik & riwayat DB.
- `/kucing/[id]/pakan/tambah` — simpan jadwal pakan.
- `/kucing/[id]/dokumen` — unggah/daftar/hapus dokumen privat.
- `/kucing/[id]/timeline` — linimasa gabungan kesehatan, berat, dokumen,
  pakan.
- `/pengingat` — daftar, tambah manual, selesai, tunda, hapus.

### Tes
- `tests/health.test.ts` — isolasi, kucing beku, validasi tanggal/berat,
  sinkronisasi pengingat, jendela Free/Pro.
- `tests/reminders.test.ts` — isolasi, filter, kucing beku, tunda,
  selesai, daftar 7 hari.
- `tests/records.test.ts` — pakan, dokumen, jendela Free dokumen,
  linimasa gabungan.
- Total 45 tes lulus bersama `tests/plan.test.ts` dan `tests/cats.test.ts`.

## Masalah yang Belum Selesai (diketahui)
1. Modul breeding, penjualan, jasa pacak, transfer, keuangan masih mock.
2. Harga & durasi Pro masih placeholder (`49000` / 30 hari).
3. Belum ada SMTP nyata; tautan verifikasi/reset hanya ke log (dev).
4. Upload avatar profil belum disambungkan.
5. Midtrans, cron notifikasi, dan Web Push belum ada.
6. `litter_id` pada `cats` dan `transfer_id` pada riwayat kepemilikan
   ditunda sampai tabel Fase 3/5 ada.
7. Dokumen hanya disimpan lokal di `.data/documents/`; belum ada
   pemindaian malware/verifikasi eksternal.

## Langkah Berikutnya (Fase 3)
A. Skema & API breeding: siklus birahi, perkawinan, kehamilan, litter.
B. Sambungkan halaman `/breeding` dan sub-route-nya ke DB.
C. Terapkan aturan kelahiran (jumlah hidup ≤ lahir, sekali catat) dan
   siklus birahi (betina, tanpa tumpang tindih).
D. Update `docs/AI-CONTEXT.md` tiap akhir sesi.

## File Penting Fase 2
- Baru: `src/lib/{health,reminders,feeding,documents,timeline,date,labels}.ts`,
  `src/lib/validation/{health,reminder,feeding,document}.ts`,
  `src/app/api/{cats/[id]/health,cats/[id]/weights,cats/[id]/feeding,cats/[id]/documents,health,weights,reminders,feeding,documents,uploads/documents}/**`,
  `tests/{health,reminders,records}.test.ts`.
- Diubah: `src/db/schema.ts`, `drizzle/0002_dry_sumo.sql`,
  `src/lib/storage.ts`, halaman `(app)/dashboard`,
  `kucing/[id]/{page,kesehatan,berat,dokumen,timeline,pakan}`,
  `(app)/pengingat`, komponen `berat/`, `dokumen/`, `kesehatan/`,
  `kucing/timeline-list`, `pengingat/`.

## File Penting Fase 1
- `src/lib/{cats,plan,profile,storage}.ts`,
  `src/lib/validation/{cat,profile}.ts`, `src/db/seed.ts`, `src/proxy.ts`,
  `tests/{plan,cats}.test.ts`, API profil/plan/kucing/uploads.
