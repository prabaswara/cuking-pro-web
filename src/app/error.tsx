"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-peach-canvas px-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error-container">
        <span className="material-symbols-outlined text-4xl text-error">
          error
        </span>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-on-surface">
        Gagal memuat halaman
      </h1>
      <p className="mt-2 max-w-sm text-text-muted">
        {error.message || "Terjadi kesalahan. Periksa koneksi lalu coba lagi."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-white"
      >
        Coba Lagi
      </button>
    </div>
  );
}
