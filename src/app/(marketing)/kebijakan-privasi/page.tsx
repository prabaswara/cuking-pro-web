import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — cukingPro",
  description: "Kebijakan privasi aplikasi manajemen kucing cukingPro.",
};

const SECTIONS = [
  {
    title: "1. Data yang Kami Kumpulkan",
    body: [
      "Kami mengumpulkan data yang kamu berikan saat membuat akun dan menggunakan cukingPro, antara lain:",
      "• Data akun: nama, alamat email, kata sandi terenkripsi, dan preferensi notifikasi.",
      "• Data profil: nama kennel, nomor WhatsApp, dan peran (pemilik kucing, breeder, penyedia jasa pacak).",
      "• Data kucing: nama, jenis kelamin, ras, warna, tanggal lahir, nomor microchip, nomor registrasi/pedigree, dan silsilah.",
      "• Data kesehatan: catatan vaksin, obat, kunjungan dokter, berat badan, dan dokumen penunjang.",
      "• Data breeding dan penjualan: siklus birahi, kawin, kehamilan, kelahiran, booking jasa pacak, dan status penjualan.",
      "• Data keuangan: catatan pemasukan dan pengeluaran yang kamu buat sendiri.",
      "• Data teknis: perangkat, browser, dan langganan notifikasi web (push subscription).",
    ],
  },
  {
    title: "2. Penggunaan Data",
    body: [
      "Data digunakan untuk menyediakan fitur cukingPro, antara lain mengelola profil kucing, membuat pengingat, mengirim email dan notifikasi web, memproses langganan Pro, serta menampilkan ringkasan keuangan.",
      "Kami tidak menjual data pribadi kamu kepada pihak ketiga.",
    ],
  },
  {
    title: "3. Berbagi Data",
    body: [
      "Kami hanya membagikan data kepada penyedia layanan yang membantu operasi aplikasi (seperti layanan email, penyimpanan, dan pembayaran), dan hanya sejauh yang diperlukan.",
      "Data kucing dapat dipindahkan kepada pengguna lain hanya ketika kamu mengirim dan penerima menerima permintaan transfer kepemilikan.",
    ],
  },
  {
    title: "4. Keamanan",
    body: [
      "Kata sandi disimpan dalam bentuk terenkripsi. Kami menerapkan kontrol akses agar setiap pengguna hanya dapat melihat dan mengubah datanya sendiri.",
      "Meskipun demikian, tidak ada metode transmisi melalui internet yang sepenuhnya aman. Gunakan kata sandi yang kuat dan unik.",
    ],
  },
  {
    title: "5. Retensi & Penghapusan",
    body: [
      "Data akun dan kucing disimpan selama akun aktif. Saat kamu menghapus akun, data pribadi dihapuskan atau di-anonimkan sesuai ketentuan yang berlaku.",
      "Data yang secara hukum atau operasional perlu disimpan (misalnya catatan transaksi) dapat dipertahankan tanpa mengidentifikasi kamu secara pribadi.",
    ],
  },
  {
    title: "6. Hak Kamu",
    body: [
      "Kamu berhak mengakses, mengoreksi, mengekspor, dan meminta penghapusan data pribadi. Kamu juga dapat menonaktifkan notifikasi kapan saja.",
      "Untuk menggunakan hak ini, hubungi kami melalui kanal yang tersedia di aplikasi.",
    ],
  },
  {
    title: "7. Perubahan Kebijakan",
    body: [
      "Kebijakan ini dapat diperbarui dari waktu ke waktu. Perubahan penting akan diumumkan di dalam aplikasi. Tanggal pembaruan terakhir tercantum di bagian bawah halaman ini.",
    ],
  },
  {
    title: "8. Kontak",
    body: [
      "Pertanyaan mengenai kebijakan privasi dapat disampaikan ke dukungan cukingPro melalui halaman Profil → Pengaturan.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-on-surface">Kebijakan Privasi</h1>
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
