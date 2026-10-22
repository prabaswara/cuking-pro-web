import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api-error";
import { formatAge, formatDateID } from "@/lib/date";
import { getLitter } from "@/lib/litters";
import { getSession } from "@/lib/session";

interface LitterPageProps {
  params: Promise<{ id: string }>;
}

export default async function LitterPage({ params }: LitterPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  let litter;
  try {
    litter = await getLitter(session.user.id, id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const registered = litter.kittens.length;
  const remaining = Math.max(litter.totalAlive - registered, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/breeding/kehamilan/${litter.matingId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Kehamilan
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Litter • Lahir {formatDateID(litter.birthDate)}
        </h1>
        <p className="mt-1 text-text-muted">
          {litter.queenName} × {litter.sireName} • {litter.totalAlive}/
          {litter.totalBorn} anak hidup
        </p>
      </div>

      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                Ringkasan Litter
              </h2>
              <p className="text-sm text-text-muted">
                Total lahir: {litter.totalBorn} • Hidup: {litter.totalAlive} •
                Terdaftar: {registered}
              </p>
            </div>
            <Link
              href={`/breeding/litter/${litter.id}/tambah-anak`}
              aria-disabled={remaining === 0}
              className={remaining === 0 ? "pointer-events-none" : ""}
            >
              <Button
                disabled={remaining === 0}
                className="h-10 rounded-full px-4"
              >
                <span className="material-symbols-outlined mr-1 text-xl">
                  add
                </span>
                Tambah Anak Kucing
              </Button>
            </Link>
          </div>

          {remaining > 0 && (
            <p className="mt-3 rounded-2xl bg-amber-subtle/40 px-4 py-3 text-sm text-honey-amber">
              Masih ada {remaining} anak hidup yang belum didaftarkan. Kamu
              boleh mendaftarkan sebagian atau seluruhnya.
            </p>
          )}

          {remaining === 0 && (
            <p className="mt-3 rounded-2xl bg-mint-subtle px-4 py-3 text-sm text-secondary">
              Semua anak hidup dari litter ini sudah didaftarkan.
            </p>
          )}

          {litter.notes && (
            <p className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              {litter.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold text-on-surface">Anak Kucing</h3>

        {litter.kittens.length === 0 ? (
          <Card className="rounded-3xl border-sand-border shadow-warm-sm">
            <CardContent className="p-8 text-center text-text-muted">
              Belum ada anak kucing yang terdaftar.
              <Link
                href={`/breeding/litter/${litter.id}/tambah-anak`}
                className="ml-1 text-primary underline"
              >
                Tambah sekarang
              </Link>
            </CardContent>
          </Card>
        ) : (
          litter.kittens.map((kitten) => (
            <Link key={kitten.id} href={`/kucing/${kitten.id}`}>
              <Card className="rounded-3xl border-sand-border shadow-warm-sm transition-shadow hover:shadow-warm-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container">
                    {kitten.photoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={kitten.photoPath}
                        alt={kitten.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-xl text-text-muted">
                        pets
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-on-surface">
                      {kitten.name}
                    </p>
                    <p className="text-sm text-text-muted">
                      {kitten.sex === "male" ? "Jantan" : "Betina"}
                      {kitten.color ? ` • ${kitten.color}` : ""}
                      {kitten.birthDate
                        ? ` • ${formatAge(kitten.birthDate)}`
                        : ""}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-text-muted">
                    chevron_right
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/breeding" className="flex-1">
          <Button variant="outline" className="h-12 w-full rounded-full">
            Kembali ke Breeding
          </Button>
        </Link>
        {litter.queenName && (
          <Link
            href={`/breeding/kehamilan/${litter.matingId}`}
            className="flex-1"
          >
            <Button className="h-12 w-full rounded-full">
              Lihat Kehamilan
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
