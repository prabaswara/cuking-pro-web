import Link from "next/link";
import { redirect } from "next/navigation";
import { StudTabs } from "@/components/pacak/stud-tabs";
import { listCats } from "@/lib/cats";
import { getOrCreateProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";
import { getStudOverview } from "@/lib/stud-bookings";

export default async function JasaPacakPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const profile = await getOrCreateProfile(userId);

  if (!profile.isStudProvider) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Jasa Pacak</h1>
          <p className="mt-1 text-text-muted">
            Kelola pejantan pacak dan booking klien
          </p>
        </div>

        <div className="rounded-3xl border-sand-border bg-surface-card p-8 text-center shadow-warm-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-lavender-subtle">
            <span className="material-symbols-outlined text-3xl text-tertiary">
              cruelty_free
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            Fitur Jasa Pacak Tersembunyi
          </h2>
          <p className="mx-auto mt-2 max-w-md text-text-muted">
            Aktifkan peran &ldquo;Saya Menyediakan Jasa Pacak&rdquo; di{" "}
            <Link href="/profil" className="text-primary underline">
              Profil
            </Link>{" "}
            untuk mengakses fitur manajemen pejantan pacak dan booking klien.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <Link href="/profil">
              <span className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">
                Buka Profil
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [overview, cats] = await Promise.all([
    getStudOverview(userId),
    listCats(userId, { status: "all" }),
  ]);

  const eligibleCats = cats
    .filter(
      (cat) =>
        cat.sex === "male" &&
        cat.status === "active" &&
        cat.trackingStatus === "tracked",
    )
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      breed: cat.breed,
      color: cat.color,
      photoPath: cat.photoPath,
    }));

  return (
    <StudTabs
      services={overview.services}
      cats={eligibleCats}
      bookings={overview.bookings}
    />
  );
}
