import { connection } from "next/server";
import { redirect } from "next/navigation";
import { KucingList } from "@/components/kucing/kucing-list";
import { listCats } from "@/lib/cats";
import { getSession } from "@/lib/session";

export default async function KucingPage() {
  // Data kucing bersifat per-pengguna & per-request.
  await connection();

  const session = await getSession();
  if (!session) redirect("/login");

  // `status: all` agar kucing terjual/meninggal tetap muncul di filter "Semua".
  const cats = await listCats(session.user.id, { status: "all" });

  return <KucingList cats={cats} />;
}
