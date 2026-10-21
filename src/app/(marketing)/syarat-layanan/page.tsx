import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat Layanan — cukingPro",
  description: "Syarat dan ketentuan penggunaan aplikasi cukingPro.",
};

const SECTIONS = [
  {
    title: "1. Penerimaan Syarat",
    body: [
      "Dengan membuat akun atau menggunakan cukingPro, kamu menyetujui syarat dan ketentuan ini. Jika tidak setuju, mohon untuk tidak menggunakan layanan.",
    ],
  },
  {
    title: "2. Akun",
    body: [
      "Kamu bertanggung jawab menjaga kerahasiaan kata sandi dan semua aktivitas di bawah akunmu.",
      "Berikan informasi yang akurat dan perbarui bila ada perubahan.",
      "Satu akun hanya boleh digunakan oleh satu orang, kecuali diizinkan secara tegas.",
    ],
  },
  {
    title: "3. Layanan & Batasan",
    body: [
      "cukingPro adalah alat bantu manajemen kucing. Seluruh catatan medis, vaksin, dan keputusan breeding berasal dari input pengguna dan bukan merupakan saran medis dari kami.",
      "Kami tidak menjamin layanan bebas dari gangguan. Jadwal dan pengingat bergantung pada ketersediaan koneksi dan perangkat.",
      "Pada paket Free berlaku batas yang tercantum di halaman Paket, antara lain jumlah kucing yang dapat dilacak dan jendela riwayat. Data yang terkunci tidak dihapus.",
    ],
  },
  {
    title: "4. Langganan Pro & Pembayaran",
    body: [
      "Langganan Pro diproses melalui penyedia pembayaran pihak ketiga (Midtrans). Harga dan durasi mengikuti yang tertera di halaman Paket.",
      "Pembayaran dianggap berhasil berdasarkan notifikasi resmi dari penyedia pembayaran, bukan berdasarkan pengalihan halaman di browser.",
      "Perpanjangan saat masih aktif akan menambahkan durasi pada tanggal berakhir yang lama.",
    ],
  },
  {
    title: "5. Penggunaan yang Dilarang",
    body: [
      "Dilarang menggunakan layanan untuk menyebarkan konten melanggar hukum, menipu pengguna lain, atau mengakali batas paket.",
      "Dilarang mencoba mengakses data pengguna lain tanpa izin.",
    ],
  },
  {
    title: "6. Kepemilikan & Transfer Data",
    body: [
      "Kamu tetap memiliki data yang kamu masukkan. Kamu dapat mentransfer kucing ke pengguna lain sesuai mekanisme transfer yang tersedia.",
      "Data yang tidak ikut pindah saat transfer (seperti catatan kawin, penjualan, dan keuangan) tetap milik pemilik lama.",
    ],
  },
  {
    title: "7. Pembatasan Tanggung Jawab",
    body: [
      "cukingPro disediakan sebagaimana adanya. Kami tidak bertanggung jawab atas kerugian tidak langsung, termasuk kehilangan data akibat kesalahan pengguna atau gangguan layanan pihak ketiga.",
    ],
  },
  {
    title: "8. Perubahan Syarat",
    body: [
      "Kami dapat memperbarui syarat ini sewaktu-waktu. Perubahan penting akan diumumkan di dalam aplikasi.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-on-surface">Syarat Layanan</h1>
        <p className="mt-2 text-sm text-text-muted">
          Terakhir diperbarui: 21 Oktober 2026
        </p>
      </header>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-3xl border border-sand-border bg-surface-card p-6 shadow-warm-sm"
          >
            <h2 className="text-lg font-bold text-on-surface">{section.title}</h2>
            <div className="mt-3 space-y-2">
              {section.body.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-on-surface-variant">
                  {line}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
