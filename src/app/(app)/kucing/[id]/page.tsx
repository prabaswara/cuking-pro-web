import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getCat, getPedigree } from "@/lib/cats";
import { formatAge, formatDateID } from "@/lib/date";
import { listFeedingSchedules } from "@/lib/feeding";
import { getLatestHealthRecord, getLatestWeight } from "@/lib/health";
import { getSession } from "@/lib/session";

interface KucingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function KucingDetailPage({ params }: KucingDetailPageProps) {
  // Halaman per-request (data milik pengguna) — tandai dynamic.
  await connection();

  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  let cat;
  try {
    cat = await getCat(session.user.id, id);
  } catch {
    notFound();
  }

  const [pedigree, latestWeight, latestVaccine, feedingSchedules] =
    await Promise.all([
      getPedigree(session.user.id, id),
      getLatestWeight(session.user.id, id),
      getLatestHealthRecord(session.user.id, id, "vaccine"),
      listFeedingSchedules(session.user.id, id),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/kucing"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Kembali ke Kucing Saya
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/kucing/${cat.id}/edit`}>
            <Button variant="outline" size="sm" className="rounded-full">
              Edit Profil
            </Button>
          </Link>
          <Link href={`/kucing/${cat.id}/silsilah`}>
            <Button size="sm" className="rounded-full">
              <span className="material-symbols-outlined mr-1 text-lg">
                family_restroom
              </span>
              Silsilah
            </Button>
          </Link>
          {cat.status === "active" && cat.trackingStatus === "tracked" && (
            <Link href={`/transfer`}>
              <Button variant="outline" size="sm" className="rounded-full">
                <span className="material-symbols-outlined mr-1 text-lg">swap_horiz</span>
                Transfer
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cat Profile Card */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-2xl bg-surface-container">
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-4xl">pets</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-on-surface">{cat.name}</h2>
                <span className="rounded-full bg-lavender-subtle px-2.5 py-0.5 text-xs font-semibold text-tertiary">
                  {cat.sex === "female" ? "♀ Betina" : "♂ Jantan"}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {cat.breed ?? "-"} • {formatAge(cat.birthDate)} •{" "}
                {cat.color ?? "-"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-mint-subtle px-2.5 py-0.5 text-xs font-semibold text-secondary">
                  {cat.status === "active"
                    ? "Aktif"
                    : cat.status === "sold"
                      ? "Terjual"
                      : "Meninggal"}
                </span>
                {cat.trackingStatus === "frozen" && (
                  <span className="rounded-full bg-amber-subtle px-2.5 py-0.5 text-xs font-semibold text-honey-amber">
                    Dibekukan — hanya-baca
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            <Link
              href={`/kucing/${cat.id}/kesehatan/tambah`}
              className="flex flex-col items-center gap-1 rounded-2xl bg-surface-container-low p-3 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-xl text-secondary">medical_services</span>
              <span className="text-xs font-semibold">Medis</span>
            </Link>
            <Link
              href={`/kucing/${cat.id}/pakan/tambah`}
              className="flex flex-col items-center gap-1 rounded-2xl bg-surface-container-low p-3 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-xl text-honey-amber">set_meal</span>
              <span className="text-xs font-semibold">Catat Pakan</span>
            </Link>
            <Link
              href={`/kucing/${cat.id}/aktivitas/tambah`}
              className="flex flex-col items-center gap-1 rounded-2xl bg-surface-container-low p-3 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-xl text-tertiary">pets</span>
              <span className="text-xs font-semibold">Aktivitas</span>
            </Link>
            <Link
              href={`/kucing/${cat.id}/jual`}
              className="flex flex-col items-center gap-1 rounded-2xl bg-surface-container-low p-3 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-xl text-primary">sell</span>
              <span className="text-xs font-semibold">Jual</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <span className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Ringkasan
        </span>
        <Link
          href={`/kucing/${cat.id}/timeline`}
          className="whitespace-nowrap rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-muted shadow-sm transition-all hover:text-on-surface active:scale-95"
        >
          Timeline
        </Link>
        <Link
          href={`/kucing/${cat.id}/kesehatan`}
          className="whitespace-nowrap rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-muted shadow-sm transition-all hover:text-on-surface active:scale-95"
        >
          Kesehatan
        </Link>
        <Link
          href={`/kucing/${cat.id}/berat`}
          className="whitespace-nowrap rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-muted shadow-sm transition-all hover:text-on-surface active:scale-95"
        >
          Berat
        </Link>
        <Link
          href={`/kucing/${cat.id}/dokumen`}
          className="whitespace-nowrap rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-muted shadow-sm transition-all hover:text-on-surface active:scale-95"
        >
          Dokumen
        </Link>
        <Link
          href={`/kucing/${cat.id}/silsilah`}
          className="whitespace-nowrap rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-muted shadow-sm transition-all hover:text-on-surface active:scale-95"
        >
          Silsilah
        </Link>
        <Link
          href="/breeding"
          className="whitespace-nowrap rounded-full bg-surface-card px-4 py-2 text-sm font-medium text-text-muted shadow-sm transition-all hover:text-on-surface active:scale-95"
        >
          Breeding
        </Link>
      </div>

      {/* Overview Content */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan</CardTitle>
          <CardDescription>Informasi lengkap kucing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-xs text-text-muted">Berat Terakhir</p>
              <p className="mt-1 text-2xl font-bold text-on-surface">
                {latestWeight ? `${latestWeight.kg.toFixed(1)} kg` : "-"}
              </p>
              <p className="text-xs text-text-muted">
                {latestWeight ? formatDateID(latestWeight.date) : "Belum ada data"}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-xs text-text-muted">Vaksin Terakhir</p>
              <p className="mt-1 text-lg font-semibold text-on-surface">
                {latestVaccine?.title ?? (latestVaccine ? "Vaksinasi" : "-")}
              </p>
              <p className="text-xs text-text-muted">
                {latestVaccine
                  ? formatDateID(latestVaccine.recordDate)
                  : "Belum ada catatan"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-4">
            <h4 className="font-semibold text-on-surface">Data Silsilah & Registrasi</h4>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-text-muted">Tanggal lahir</span>
                <span className="text-sm font-medium text-on-surface">
                  {formatDateID(cat.birthDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-text-muted">Warna Mantel</span>
                <span className="text-sm font-medium text-on-surface">
                  {cat.color ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-text-muted">No. Registrasi</span>
                <span className="text-sm font-medium text-on-surface">
                  {cat.pedigreeNo ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-text-muted">Microchip</span>
                <span className="font-mono text-sm font-medium text-on-surface">
                  {cat.microchipNo ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-text-muted">Induk</span>
                <span className="text-right text-sm font-medium text-on-surface">
                  {pedigree.dam?.name ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-text-muted">Ayah</span>
                <span className="text-right text-sm font-medium text-on-surface">
                  {pedigree.sire?.name ?? "-"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jadwal Pakan */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Jadwal Pakan</CardTitle>
              <CardDescription>Porsi dan waktu makan harian</CardDescription>
            </div>
            {cat.trackingStatus === "tracked" && (
              <Link href={`/kucing/${cat.id}/pakan/tambah`}>
                <Button size="sm" variant="outline" className="rounded-full">
                  <span className="material-symbols-outlined mr-1 text-lg">add</span>
                  Tambah
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {feedingSchedules.length > 0 ? (
            <div className="flex flex-col gap-2">
              {feedingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-subtle text-honey-amber">
                      <span className="material-symbols-outlined text-lg">set_meal</span>
                    </span>
                    <div>
                      <p className="font-semibold text-on-surface">
                        {schedule.foodType}
                      </p>
                      <p className="text-sm text-text-muted">
                        {schedule.portionGrams} gram
                        {schedule.notes ? ` • ${schedule.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-card px-3 py-1 text-sm font-bold text-primary">
                    {schedule.scheduleTime}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-surface-container-low p-6 text-center text-sm text-text-muted">
              Belum ada jadwal pakan. Tambahkan agar porsi harian {cat.name}{" "}
              tercatat.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
