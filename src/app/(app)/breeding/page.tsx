import { redirect } from "next/navigation";
import Link from "next/link";
import { BreedingTabs } from "@/components/breeding/breeding-tabs";
import { listCats } from "@/lib/cats";
import { listHeatCycles } from "@/lib/heat-cycles";
import { listMatings } from "@/lib/matings";
import { listSales } from "@/lib/sales";
import { getOrCreateProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export default async function BreedingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const profile = await getOrCreateProfile(userId);

  if (!profile.isBreeder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Breeding</h1>
          <p className="mt-1 text-text-muted">
            Kelola siklus birahi, kawin, kehamilan, dan kelahiran kucing
          </p>
        </div>

        <div className="rounded-3xl border-sand-border bg-surface-card p-8 text-center shadow-warm-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-lavender-subtle">
            <span className="material-symbols-outlined text-3xl text-tertiary">
              pets
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            Fitur Breeding Tersembunyi
          </h2>
          <p className="mx-auto mt-2 max-w-md text-text-muted">
            Aktifkan peran &ldquo;Saya Breeder&rdquo; di{" "}
            <Link href="/profil" className="text-primary underline">
              Profil
            </Link>{" "}
            untuk mengakses fitur pencatatan birahi, kawin, kehamilan, dan
            kelahiran.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/profil">
              <button className="h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
                Buka Profil
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [cats, heatCycles, matings, sales] = await Promise.all([
    listCats(userId, { status: "all" }),
    listHeatCycles(userId),
    listMatings(userId),
    listSales(userId),
  ]);

  const tracked = cats.filter(
    (cat) => cat.status === "active" && cat.trackingStatus === "tracked",
  );

  const toOption = (cat: (typeof tracked)[number]) => ({
    id: cat.id,
    name: cat.name,
    sex: cat.sex,
    breed: cat.breed,
    sireId: cat.sireId,
    damId: cat.damId,
  });

  const females = tracked
    .filter((cat) => cat.sex === "female")
    .map(toOption);
  const males = tracked.filter((cat) => cat.sex === "male").map(toOption);
  const saleCats = tracked.map((cat) => ({
    id: cat.id,
    name: cat.name,
    photoPath: cat.photoPath,
  }));

  return (
    <BreedingTabs
      heatCycles={heatCycles}
      matings={matings}
      sales={sales}
      summary={sales.summary}
      females={females}
      males={males}
      saleCats={saleCats}
    />
  );
}
