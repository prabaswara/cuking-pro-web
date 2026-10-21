import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-peach-canvas">
      <header className="flex items-center justify-between border-b border-sand-border px-6 py-4">
        <Link href="/" aria-label="Kembali ke beranda">
          <Logo height={34} />
        </Link>
        <Link
          href="/login"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Masuk
        </Link>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>

      <footer className="border-t border-sand-border px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-text-muted">
            © 2026 cukingPro. Semua hak dilindungi.
          </p>
          <div className="flex gap-4 text-sm">
            <Link
              href="/kebijakan-privasi"
              className="font-medium text-primary hover:underline"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/syarat-layanan"
              className="font-medium text-primary hover:underline"
            >
              Syarat Layanan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
