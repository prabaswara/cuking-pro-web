import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-peach-canvas">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Logo height={38} />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Masuk
          </Link>
          <Link href="/register">
            <Button className="rounded-full">Daftar</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex justify-center">
            <Logo height={72} />
          </div>

          <h1 className="text-4xl font-bold leading-tight text-on-surface md:text-5xl">
            Kelola Kucingmu dengan{" "}
            <span className="text-primary">Lebih Cerdas</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-text-muted">
            Aplikasi web untuk mengelola kucing, breeding, dan jasa pacak.
            Catat vaksin, jadwal kawin, dan riwayat kesehatan anabulmu dalam
            satu tempat.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="h-14 rounded-full px-8 text-base">
                Mulai Sekarang
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-full px-8 text-base"
              >
                Masuk
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl bg-surface-card p-6 shadow-warm-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tangerine-subtle">
                <span className="material-symbols-outlined text-2xl text-primary">
                  pets
                </span>
              </div>
              <h3 className="font-semibold text-on-surface">Manajemen Kucing</h3>
              <p className="mt-2 text-sm text-text-muted">
                Catat data lengkap kucing, vaksin, dan riwayat kesehatan.
              </p>
            </div>

            <div className="rounded-3xl bg-surface-card p-6 shadow-warm-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lavender-subtle">
                <span className="material-symbols-outlined text-2xl text-tertiary">
                  favorite
                </span>
              </div>
              <h3 className="font-semibold text-on-surface">Breeding</h3>
              <p className="mt-2 text-sm text-text-muted">
                Lacak siklus birahi, kawin, kehamilan, dan kelahiran.
              </p>
            </div>

            <div className="rounded-3xl bg-surface-card p-6 shadow-warm-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-mint-subtle">
                <span className="material-symbols-outlined text-2xl text-secondary">
                  event
                </span>
              </div>
              <h3 className="font-semibold text-on-surface">Pengingat</h3>
              <p className="mt-2 text-sm text-text-muted">
                Jangan lewatkan jadwal penting dengan pengingat otomatis.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sand-border px-6 py-6 text-center">
        <p className="text-sm text-text-muted">
          © 2026 cukingPro. Aplikasi manajemen kucing untuk breeder dan pemilik
          kucing.
        </p>
      </footer>
    </div>
  );
}
