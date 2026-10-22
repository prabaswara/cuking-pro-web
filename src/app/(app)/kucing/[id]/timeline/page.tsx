import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { TimelineList } from "@/components/kucing/timeline-list";
import { getCat } from "@/lib/cats";
import { getSession } from "@/lib/session";
import { getCatTimeline } from "@/lib/timeline";

interface TimelinePageProps {
  params: Promise<{ id: string }>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
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

  const { items, lockedCount, windowStart } = await getCatTimeline(
    session.user.id,
    id,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/kucing/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Profil {cat.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Timeline {cat.name}
        </h1>
        <p className="mt-1 text-text-muted">
          Riwayat kegiatan, medis, dan breeding dalam satu linimasa
        </p>
      </div>

      <TimelineList
        catId={id}
        catName={cat.name}
        initialEvents={items}
        lockedCount={lockedCount}
        windowStart={windowStart}
      />
    </div>
  );
}
