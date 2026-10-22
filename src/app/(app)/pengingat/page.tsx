import { connection } from "next/server";
import { redirect } from "next/navigation";
import { PengingatList } from "@/components/pengingat/pengingat-list";
import { listCats } from "@/lib/cats";
import { listReminders } from "@/lib/reminders";
import { getSession } from "@/lib/session";

export default async function PengingatPage() {
  await connection();

  const session = await getSession();
  if (!session) redirect("/login");

  const [reminders, cats] = await Promise.all([
    listReminders(session.user.id, { done: "all" }),
    listCats(session.user.id, { status: "active" }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">
          Mendatang & Pengingat
        </h1>
        <p className="mt-1 text-text-muted">
          Jadwal penting 7 hari ke depan (dikirim H-3 & hari-H via email +
          notifikasi web)
        </p>
      </div>

      <PengingatList
        initialReminders={reminders}
        cats={cats.map((cat) => ({
          id: cat.id,
          name: cat.name,
          frozen: cat.trackingStatus === "frozen",
        }))}
      />
    </div>
  );
}
