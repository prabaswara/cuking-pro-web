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

## 2026-10-21
- **Dokumen & Timeline jadi sub-route profil kucing** (`/kucing/[id]/dokumen`,
  `/kucing/[id]/timeline`) mengikuti tab yang sudah ada → konsisten dengan
  pola navigasi & desain stitch, tidak membuat satu halaman tab raksasa.
- **Onboarding peran di `/onboarding` + banner Beranda** → alur "Kamu siapa?"
  dari PRD terwujud tanpa menunggu auth; status disimpan di localStorage
  (`cukingpro:onboarded`) dan nanti dipindah ke profil DB.
- **Baca state eksternal (localStorage/navigator) pakai `useSyncExternalStore`**
  (bukan `setState` di `useEffect`) → lolos `react-hooks/set-state-in-effect`
  di Next 16 dan menghindari cascading render.
- **Halaman legal di route group `(marketing)`** (`/kebijakan-privasi`,
  `/syarat-layanan`) → punya layout publik sendiri, tidak memakai nav aplikasi.
- **Font ikon Material Symbols tetap `<link>` dengan `&display=swap`** dan
  rule `no-page-custom-font` di-disable untuk baris itu → `next/font` tidak
  cocok untuk icon-font dengan ligatur.

## 2026-10-21
- **Backend Fase 0 dikerjakan lebih dulu dari sisa penyambungan UI**
  (PRD menaruh setup DB/auth di Fase 0) → fondasi sesi & DB siap sebelum
  modul domain dipindah dari mock.
- **Drizzle + `postgres-js`, bukan `node-postgres`** (driver ringan, pool
  bawaan, contoh resmi Context7) → satu koneksi singleton di
  `src/db/index.ts`, di-cache di `globalThis` saat dev agar HMR tidak
  membanjiri pool.
- **Skema auth ditulis manual mengikuti snapshot resmi Better Auth**
  (CLI `@better-auth/cli generate` gagal dipasang karena bug npm
  `edgesOut`) → nama tabel default `user`/`session`/`account`/`verification`
  dipertahankan; migrasi Drizzle yang jadi sumber kebenaran.
- **Verifikasi email wajib sejak awal** (sesuai FR-01) +
  `sendVerificationEmail`/`sendResetPassword` memakai stub `sendEmail`
  → tautan hanya dicetak di log saat dev, tidak pernah di log produksi.
- **Form auth memakai `authClient` Better Auth**, bukan `fetch` ke
  endpoint buatan sendiri (`/api/auth/login`, `/register`) yang tidak
  pernah ada → pesan error dipetakan ke Bahasa Indonesia lewat
  `src/lib/auth-messages.ts`; tidak membocorkan email vs password salah.
- **Lupa password selalu menampilkan status "terkirim"** → mencegah
  enumerasi akun.
- **Akses `searchParams` di `/verify-email` dan `/reset-password`
  dibungkus `<Suspense>`** (Next 16 + cacheComponents gagal build bila
  tidak) → halaman tetap bisa di-prerender sebagian.
- **`turbopack.root` dikunci ke folder proyek** (ada `package-lock.json`
  liar di home directory) → warning workspace root hilang tanpa menghapus
  file milik pengguna.
- **`.gitignore` dikecualikan untuk `.env.example`** (`!.env.example`)
  → contoh env tetap bisa di-commit, `.env` tetap aman.

## 2026-10-21 (Fase 1)
- **Foto disimpan di disk lokal di balik antarmuka `storage.ts`**, bukan
  `public/` → PRD mewajibkan akses berotorisasi; berkas dilayani lewat
  `/api/uploads/:key` yang memeriksa sesi. S3/R2 cukup menambah driver.
- **Aturan paket hanya di `src/lib/plan.ts`** (batas 2 kucing aktif,
  riwayat 3 bulan kalender, rekonsiliasi beku) → route & komponen tidak
  boleh hardcode angka; perubahan aturan satu titik.
- **Kucing kelebihan dibekukan, bukan dihapus**; Free tidak bisa menambah
  kucing aktif ke-3 (`PLAN_CAT_LIMIT`), Pro mengaktifkan kembali semua
  kucing beku. Data tetap utuh saat paket berakhir.
- **Data milik pengguna lain selalu 404**, bukan 403 → tidak membocorkan
  keberadaan data; semua akses lewat lapisan owner-scoped `src/lib/cats.ts`.
- **Akun demo dibuat lewat Better Auth (`auth.api.signUpEmail`) dalam
  seed**, bukan insert tabel auth manual → hash password benar; pemilih
  akun hanya dirender bila `DEMO_MODE="true"` di server.
- **Peran pengguna dibaca dari DB dan dioper sebagai props** ke
  Sidebar/BottomNav → tidak ada lagi gating `localStorage`; penanda
  `cukingpro:onboarded` hanya untuk banner.
- **Tes memakai Vitest + PostgreSQL sungguhan** (database `cukingpro_test`)
  dan menguji lapisan data, bukan route handler → isolasi antar pemilik
  dan batas paket teruji tanpa perlu mensimulasikan request Next.
- **`src/proxy.ts` melakukan cek cookie sesi** → pengguna anonim dapat
  redirect HTTP 307; validasi sesi sebenarnya tetap di layout via Better
  Auth (cookie bisa dipalsukan).
- **`export const instant = false` pada layout `(app)` + `connection()`
  di `getSession()`** → route yang butuh sesi boleh blocking dan tidak
  ikut diprerender; error bail-out prerender diteruskan ulang oleh
  `handleRouteError` agar tidak tercatat sebagai 500.
- **Harga & durasi Pro placeholder (`49000` / 30 hari)** di seed →
  menunggu keputusan pemilik produk; UI membaca nilai dari tabel `plans`.

## 2026-10-22 (Fase 2)
- **Berat disimpan di `health_records` (`type='weight'`, `weight_kg`)**
  sesuai PRD §6, bukan tabel terpisah → endpoint `/api/cats/:id/weights`
  hanya permukaan khusus di atas tabel yang sama; linimasa & jendela
  riwayat otomatis konsisten.
- **Menambah tabel `feeding_schedules` dan `cat_documents`** karena
  halaman Pakan & Dokumen sudah ada di UI tetapi belum punya padanan di
  PRD → migrasi `0002`; jika PRD berubah, tabel ini yang menyesuaikan.
- **Pengingat otomatis memakai `source_type='health'` + `source_id`**
  (bukan mencocokkan judul) → satu catatan kesehatan hanya punya satu
  pengingat; update/hapus catatan selalu menyinkronkan pengingat dalam
  transaksi yang sama.
- **Menunda pengingat yang sudah lewat dihitung dari hari ini** →
  pengingat tidak langsung telat lagi setelah ditunda; pengingat
  mendatang tetap digeser dari tanggal jatuh temponya.
- **Mengubah tipe catatan menjadi `weight` menghapus `nextDueDate`** →
  catatan berat tidak menyimpan jadwal berikutnya dan tidak membuat
  pengingat; mencegah pengingat "hantu" saat tipe diubah kembali.
- **Jendela riwayat Free 3 bulan kalender dihitung dari hari ini** dan
  diterapkan di lapisan data (bukan hanya UI) → `lockedCount` &
  `windowStart` dikirim ke klien; Pro mengembalikan `null`/0.
- **Dokumen disimpan lokal di `.data/documents/` dan hanya dilayani
  lewat route ber sesi** → konsisten dengan foto; tidak ada URL publik.
- **`verified` selalu `false` dari API dan UI tidak mengklaim
  verifikasi CFA/ICA** → menghindari klaim yang tidak didukung proses
  verifikasi nyata.
- **Edit pengingat memeriksa kucing lama maupun kucing tujuan** →
  pengingat milik kucing beku tidak bisa diubah hanya karena `catId`
  tidak dikirim (bug ditemukan oleh tes integrasi).
- **Tes Fase 2 menguji lapisan data terhadap PostgreSQL** (bukan route
  handler), mencakup isolasi pemilik, kucing beku, sinkronisasi
  pengingat, jendela Free, dan validasi berat.

## 2026-10-22 (Fase 3)
- **Siklus birahi disimpan di tabel `heat_cycles`** (bukan catatan
  kesehatan) → query per betina, validasi overlap, dan jarak antar siklus
  menjadi sederhana; hanya betina aktif & dilacak yang boleh dicatat.
- **Kawin menyimpan `owner_id`, betina/pejantan opsional (ID atau nama
  manual)** → kucing luar tidak perlu didaftarkan sebagai `cats`; data
  tetap owner-scoped lewat `matings.owner_id`.
- **Estimasi lahir default +65 hari dan pengingat memakai
  `source_type='pregnancy'` + `source_id=mating.id`** → perubahan manual
  memperbarui pengingat yang sama, Tidak Hamil/kelahiran menghapusnya.
- **Status `delivered` hanya dicapai lewat pencatatan kelahiran** →
  mencegah catatan "sudah melahirkan" tanpa litter; validasi ini
  ditolak di create/update biasa.
- **Satu litter per catatan kawin lewat unique index `litters.mating_id`**
  → duplikasi ditolak di level DB, bukan hanya pengecekan aplikasi.
- **Anak kucing adalah baris `cats` dengan `litter_id`, `sire_id`,
  `dam_id`, dan tanggal lahir litter** → otomatis muncul di daftar
  kucing, silsilah, dan modul lain; foto bisa ditambahkan kemudian.
- **Pendaftaran anak boleh sebagian tetapi tidak melebihi `total_alive`**,
  dan tetap memanggil `assertCanAddCat` → batas kucing Free berlaku juga
  untuk anak kucing.
- **Penjualan memakai tabel `cat_sales` + partial unique index untuk
  status aktif** → satu kucing tidak bisa punya dua penjualan
  Dijual/Dipesan; status Terjual final dan koreksi lewat hapus.
- **Terjual menandai pengingat aktif `done_at`, bukan menghapusnya** →
  riwayat pengingat tetap utuh; kucing berubah `sold` dan hilang dari
  daftar default. Hapus penjualan Terjual memulihkan kucing ke `active`.
- **Jendela riwayat Free untuk kawin mengecualikan `pending`/`pregnant`**
  → kehamilan yang belum melahirkan tetap terlihat walau tanggal kawin
  lebih tua dari 3 bulan, sesuai PRD.
- **Komponen mock breeding/penjualan lama dihapus** setelah halaman
  memakai data DB → tidak ada dua sumber data yang membingungkan.
- **Skema update dibuat dari field tanpa default** — pada Zod 4,
  `.partial()` tetap menerapkan `.default()`, sehingga PATCH parsial bisa
  mereset status/nilai (mis. hasil kawin menjadi `pending` atau
  `depositPaid` menjadi `false`). Schema update memakai base field tanpa
  default; ini juga memperbaiki PATCH dokumen dan berat Fase 2.
- **Estimasi lahir boleh berada di masa depan** — validasi hanya
  memastikan tidak sebelum tanggal kawin; larangan tanggal masa depan
  berlaku untuk peristiwa yang sudah terjadi (kawin, lahir, jual, siklus).

## 2026-10-22 (Fase 4)
- **Memakai tabel PRD `stud_services`, `stud_bookings`, dan
  `stud_booking_matings`** → mengikuti skema resmi, dengan tambahan
  `approved_at` untuk mengetahui apakah booking pernah disetujui.
- **`stud_services.cat_id` nullable + unique dan tetap menyimpan
  `cat_name`** → saat kucing ditransfer (Fase 5), layanan bisa
  dikosongkan tanpa kehilangan nama; layanan otomatis tidak bisa
  dibooking karena `cat_id` kosong.
- **Menghapus profil pejantan yang sudah punya booking ditolak** →
  riwayat klien tidak ikut terhapus; pengguna cukup menonaktifkan
  ketersediaan. FK `stud_service_id` memakai `RESTRICT`.
- **Booking baru selalu `requested`; status `ongoing` hanya lewat kawin
  pertama** → mencegah “Berlangsung” tanpa catatan kawin. `completed`
  hanya dari `ongoing` dan minimal satu kawin.
- **Hapus kawin terakhir memakai `approved_at` untuk memilih status
  kembalian** → kembali ke Disetujui bila pernah disetujui, atau
  Diminta bila belum; estimasi lahir dikosongkan dan pengingat dihapus.
- **Pengingat booking memakai `source_type='booking_planned'` dan
  `'booking_due'` + `source_id=booking.id`** → satu booking punya
  maksimal satu pengingat jadwal dan satu pengingat lahir; disetujui
  dengan tanggal membuat jadwal, kawin pertama membuat estimasi.
- **Tidak hamil menghapus pengingat, sudah melahirkan menutup
  (`done_at`)** → riwayat pengingat tetap ada saat melahirkan, sesuai
  semantik “menutup” di PRD.
- **Bentrok jadwal hanya peringatan** → UI memeriksa booking aktif
  dengan pejantan + tanggal yang sama, lalu meminta konfirmasi “Tetap
  Simpan”; server tidak memblokir.
- **Estimasi lahir manual dipertahankan saat tanggal kawin berubah** →
  pengguna bisa mengembalikan ke hitungan otomatis lewat aksi khusus.
- **Statistik pejantan dihitung dari booking yang terlihat sesuai
  paket** → akun Free tidak menghitung booking lama yang terkunci.

## Template entri baru
```
## YYYY-MM-DD
- **Keputusan** (alasan singkat) → dampak/akibat
```