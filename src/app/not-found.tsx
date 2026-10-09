import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-peach-canvas px-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low">
        <span className="material-symbols-outlined text-4xl text-text-muted">
          search_off
        </span>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-on-surface">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 max-w-sm text-text-muted">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-white"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
