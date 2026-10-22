# AI Context — cukingPro Web (update terakhir: 22 Okt 2026)

## Kondisi Saat Ini
- **Backend Fase 4 SELESAI**: profil pejantan pacak, booking, catatan
  kawin, pengingat booking, statistik, dan UI Jasa Pacak sudah DB.
- **Backend Fase 3 SELESAI**: breeding (siklus birahi, kawin/kehamilan,
  kelahiran, anak kucing) dan penjualan kucing sudah memakai data DB.
- **Backend Fase 2 SELESAI**: kesehatan, berat, jadwal pakan, pengingat,
  dokumen, linimasa, jendela riwayat Free, dan halaman terkait.
- **Backend Fase 1 SELESAI**: profil, paket (Free/Pro), kucing, silsilah,
  upload foto, auth guard, akun demo, dan tes otomatis.
- **Backend Fase 0 SELESAI**: PostgreSQL + Drizzle, Better Auth
  (email/password + verifikasi email), `/api/health-check`, format error
  standar, helper sesi.
- **UI/UX Fase 1–6 SELESAI**; modul yang sudah punya API memakai data DB,
  sisanya masih `src/lib/mock.ts`.
- Build produksi hijau (`npm run build`), `npx tsc --noEmit` bersih,
  `npm run lint` **0 error**, `npm test` **72 lulus** (8 berkas).
- **Auth guard aktif**: `src/proxy.ts` (cookie → 307) + pengecekan sesi
  Better Auth di `(app)/layout.tsx`. Tidak ada lagi bypass demo.
- **Akun demo** (`free@`, `breeder@`, `stud@`, `pro@demo.cukingpro`)
  dibuat oleh `npm run db:seed`; pemilih akun di `/login` hanya muncul
  bila `DEMO_MODE="true"`.
- **Peran dari DB**: `profiles.is_breeder` / `is_stud_provider` diteruskan
  layout ke Sidebar/BottomNav. `localStorage` hanya menyimpan penanda
  `cukingpro:onboarded` untuk banner Beranda.
- Foto kucing disimpan di `.data/uploads/` dan diakses lewat
  `/api/uploads/:key` dengan sesi valid.
- Dokumen privat disimpan di `.data/documents/` dan diakses lewat
  `/api/uploads/documents/:key` dengan sesi valid.

## Backend yang Sudah Ada
- `src/db/schema.ts` — tabel auth Better Auth (`user`, `session`,
  `account`, `verification`) + `profiles`, `cats`, `cat_ownership_history`,
  `plans`, `subscriptions`, `health_records`, `reminders`,
  `feeding_schedules`, `cat_documents`, `heat_cycles`, `matings`,
  `litters`, `cat_sales`, `stud_services`, `stud_bookings`,
  `stud_booking_matings`; migrasi di `drizzle/`
  (`0001` Fase 1, `0002` Fase 2, `0003` Fase 3, `0004` Fase 4).
- `src/db/index.ts` — Drizzle + `postgres-js` (singleton saat dev).
- `src/db/seed.ts` — 4 akun demo + kucing + plan Pro (idempoten).
- `src/lib/auth.ts` — Better Auth + Drizzle adapter; verifikasi email
  wajib; plugin `nextCookies()` terakhir; hook membuat baris `profiles`.
- `src/lib/{cats,plan,profile}.ts` — lapisan data owner-scoped + aturan
  paket (batas 2 kucing Free, jendela riwayat 3 bulan, rekonsiliasi beku).
- `src/lib/{health,reminders,feeding,documents,timeline}.ts` — CRUD domain
  Fase 2, sinkronisasi pengingat otomatis, jendela riwayat, linimasa.
- `src/lib/{heat-cycles,matings,litters,sales}.ts` — CRUD breeding &
  penjualan Fase 3, sinkronisasi pengingat kehamilan, jendela riwayat,
  aturan kelahiran dan alur status penjualan.
- `src/lib/{stud-services,stud-bookings}.ts` — profil pejantan pacak,
  booking, catatan kawin, transisi status, bentrok jadwal, statistik,
  pengingat jadwal/estimasi lahir, dan jendela riwayat Free.
- `src/lib/{date,labels}.ts` — helper tanggal kalender lokal & label UI.
- `src/lib/validation/{cat,profile,health,reminder,feeding,document,breeding,sale,stud}.ts` —
  skema Zod; route memvalidasi ulang.
- `src/lib/storage.ts` — simpan/kompres foto (sharp → WebP) dan dokumen
  (PDF/gambar) di `.data/`; antarmuka siap diganti S3/R2.
- `src/app/api/auth/[...all]/route.ts` — handler `toNextJsHandler(auth)`.
- `src/app/api/health-check/route.ts` — `{ ok: true }` + ping DB.
- `src/app/api/profile/route.ts` — GET/PATCH profil.
- `src/app/api/plan/route.ts` — paket + pemakaian + jendela riwayat.
- `src/app/api/cats/**` — CRUD, tracking, pedigree, health, weights,
  feeding, documents, heat-cycles.
- `src/app/api/{health,weights,reminders,feeding,documents,heat-cycles}/[id]` —
  PATCH/DELETE per entri.
- `src/app/api/{matings,litters,cat-sales}/**` — kawin/kehamilan,
  kelahiran + anak kucing, penjualan.
- `src/app/api/{stud-services,stud-bookings,booking-matings}/**` —
  pejantan pacak, booking klien, catatan kawin, statistik.
- `src/app/api/reminders/route.ts` — GET/POST pengingat manual.
- `src/app/api/uploads/**` — POST/GET foto & dokumen (sesi wajib).
- `src/lib/session.ts` — `getSession()`, `requireSession()` (memanggil
  `connection()` agar route handler tidak ikut prerender).
- `src/lib/api-error.ts` — `ApiError` / `handleRouteError` (PRD §11);
  error bail-out prerender diteruskan, bukan diubah jadi 500.
- `src/proxy.ts` — cek cookie sesi → redirect 307 ke `/login`.
- Env: `.env.example` (lengkap), `.env` lokal gitignored; `.env.test`
  untuk database tes.
- Tes: `tests/{plan,cats,health,reminders,records,breeding,sales,stud}.test.ts`
  (unit + integrasi PostgreSQL).

## Fitur per Halaman (sudah jadi)
- `/` landing (+tautan legal); auth: `/login` (pemilih akun demo),
  `/register`, `/forgot-password`, `/verify-email`, `/reset-password`
- `/onboarding` (peran disimpan ke DB via API)
- `/dashboard` — statistik kucing + pengingat 7 hari dari DB, aksi cepat
  memakai kucing aktif pertama
- `/kucing` & `/kucing/tambah` — **data DB**; detail/edit/silsilah/jual
  memakai DB
- `/kucing/[id]` — **ringkasan DB**: berat terakhir, catatan kesehatan,
  jadwal pakan; aksi Jual hanya untuk breeder
- `/kucing/[id]/jual` — **form penjualan DB** (mengarah ke edit bila
  sudah ada penjualan aktif)
- `/kucing/[id]/kesehatan` (+tambah), `/berat`, `/dokumen`, `/timeline`,
  `/pakan/tambah` — **data DB**
- `/profil` — **profil & peran dari DB**
- `/paket` — **paket, pemakaian, harga dari DB** (pembayaran masih mock)
- `/pengaturan`, `/notifikasi`
- `/pengingat` — **daftar/tambah/selesai/tunda/hapus dari DB**
- `/breeding` (tab Siklus Birahi / Kawin & Kehamilan / Penjualan),
  `/breeding/kehamilan/[id]` + `/lahir`, `/breeding/litter/[id]`
  + `/tambah-anak`, `/penjualan/[id]/edit` — **data DB**
- `/jasa-pacak` (tab Pejantan / Booking),
  `/jasa-pacak/booking/[id]` — **data DB**
- `/transfer`, `/riwayat-kepemilikan`, `/keuangan` — mock
- PWA: manifest + icon/apple-icon dari logoset (`public/brand/`)

## Keputusan Penting (lihat DECISIONS.md untuk detail)
- Frontend-first: UI & mock dulu; API/DB menyusul per fase PRD.
- **Backend Fase 0**: Drizzle + `postgres-js`, Better Auth + Drizzle adapter,
  skema auth mengikuti snapshot resmi Better Auth.
- **Backend Fase 1**: semua query domain lewat lapisan owner-scoped
  (`src/lib/cats.ts`); aturan paket terpusat di `src/lib/plan.ts`;
  data pemilik lain selalu 404.
- **Penyimpanan lokal di balik antarmuka** (`storage.ts`): berkas di
  `.data/uploads/` (foto) dan `.data/documents/` (dokumen), akses lewat
  route ber sesi; S3/R2 menyusul.
- **Backend Fase 2**: berat disimpan di `health_records` (`type='weight'`)
  sesuai PRD; `/weights` hanya permukaan khusus. Pengingat otomatis
  memakai `source_type='health'` + `source_id` unik agar tidak duplikat.
- **Backend Fase 3**: breeding memakai tabel `heat_cycles`, `matings`,
  `litters`; anak kucing adalah baris `cats` dengan `litter_id`. Satu
  litter per kawin (unique) dan status `delivered` hanya lewat pencatatan
  kelahiran. Pengingat kehamilan memakai `source_type='pregnancy'` +
  `source_id=mating.id`.
- **Penjualan Fase 3**: tabel `cat_sales` dengan partial unique index
  untuk satu penjualan aktif per kucing; status Terjual final, mengubah
  kucing menjadi `sold`, dan menandai pengingat aktif selesai (bukan
  dihapus). Hapus penjualan Terjual memulihkan kucing ke `active`.
- **Jendela riwayat Free** dihitung dari hari ini (3 bulan kalender) dan
  diterapkan di daftar kesehatan/berat/dokumen/birahi/kawin/penjualan/
  booking pacak; respons menyertakan `lockedCount` + `windowStart` untuk
  banner UI. Kehamilan `pending`/`pregnant` dan booking aktif tetap
  tampil walau lebih tua.
- **Fase 4 memakai tabel PRD `stud_services`, `stud_bookings`, dan
  `stud_booking_matings`.** Tambahan `approved_at` menyimpan apakah
  booking pernah disetujui, sehingga hapus kawin terakhir bisa kembali
  ke Disetujui atau Diminta dengan tepat.
- **Pengingat booking memakai `source_type='booking_planned'` /
  `'booking_due'` + `source_id=booking.id`.** Booking disetujui dengan
  tanggal rencana membuat pengingat jadwal; kawin pertama membuat
  pengingat estimasi lahir (65 hari). Tidak hamil menghapus, sudah
  melahirkan menutup (`done_at`).
- **Bentrok jadwal hanya peringatan, bukan larangan.** UI memeriksa
  booking aktif dengan pejantan + tanggal yang sama lalu meminta
  konfirmasi “Tetap Simpan”; server tetap mengizinkan penyimpanan.
- **Profil pejantan tidak boleh dihapus bila sudah punya booking** →
  nonaktifkan ketersediaan agar riwayat tetap utuh; FK memakai restrict.
- **Estimasi lahir manual dipertahankan** saat kawin pertama berubah;
  pengguna bisa memilih “Hitung Otomatis (Kawin + 65 Hari)” untuk
  mengembalikan mode otomatis.
- **Dokumen tidak diklaim terverifikasi**: `verified` selalu `false` dari
  API; UI menampilkan "Akses privat" / "Belum diverifikasi".
- **Akun demo = user Better Auth hasil seed**, bukan endpoint palsu;
  pemilih akun digerbangi `DEMO_MODE` di server.
- **Peran dari DB** diteruskan sebagai props; `localStorage` hanya untuk
  penanda onboarding.
- Tema "Warm Whiskers" via `@theme inline` di globals.css; fon Plus
  Jakarta Sans; Material Symbols Outlined.
- Server components dinamis pakai `await connection()` (bukan
  `export const dynamic`), lihat AGENTS.md §4. Route handler yang membaca
  sesi juga memanggil `connection()` agar tidak ikut prerender.
- `(app)/layout.tsx` memakai `export const instant = false` agar guard
  boleh blocking; `src/proxy.ts` memberi redirect 307 untuk anonim.
- Akses `searchParams` di halaman wajib dibungkus `<Suspense>`
  (cacheComponents Next 16).

## Batasan / Yang Perlu Diketahui Agent Berikutnya
- Sudah ada: Better Auth, Drizzle/DB, migrasi, seed demo, API profil/plan/
  kucing/uploads/kesehatan/berat/pakan/pengingat/dokumen/breeding/
  penjualan/jasa-pacak, auth guard, tes Vitest.
- Belum ada: API transfer/keuangan, halaman publik pejantan (FR-19),
  cron job, Midtrans, SMTP nyata.
- Tabel `feeding_schedules` & `cat_documents` adalah pendukung UI dan
  belum tercantum eksplisit di PRD.
- `cat_ownership_history.transfer_id` ditunda sampai Fase 5.
- Foto anak kucing belum diunggah dari form tambah anak; masih bisa
  diubah dari halaman detail kucing setelah terdaftar.
- Upload avatar profil belum disambungkan (tombol disabled).
- Harga/durasi Pro masih placeholder (`plans` di seed).
- Data mock memakai tanggal relatif hari ini (fungsi `d(n)` di mock.ts)
  agar demo tetap hidup.
- `.env.test` wajib ada sebelum `npm test`; database tes terpisah dari
  database pengembangan.

## Referensi
- PRD: `../PRD-cuking-pro-web.md` (§11 API, §6 skema DB, §12 rencana fase)
- Desain: `../stitch_cozy_cat_frontend_ui/` + `warm_whiskers/DESIGN.md`
- Aset logo: `cuking-pro-web/public/brand/` (transparent/main/inverted/
  mono; `reserved/` untuk dark mode & cetak)
