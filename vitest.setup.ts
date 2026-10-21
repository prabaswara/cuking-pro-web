import { config } from "dotenv";

// Muat konfigurasi tes SEBELUM modul aplikasi (termasuk src/db) diimpor.
// Variabel dari shell tetap menang agar CI bisa menimpa nilainya.
config({ path: ".env.test", override: false });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL untuk tes belum diatur. Buat .env.test (lihat README) lalu jalankan `npm run db:test:setup`.",
  );
}
