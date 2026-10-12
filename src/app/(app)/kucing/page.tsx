import { connection } from "next/server";
import { mockCats } from "@/lib/mock";
import { KucingList } from "@/components/kucing/kucing-list";

export default async function KucingPage() {
  // Data kucing bersifat per-pengguna & per-request (nanti dari /api/cats).
  // connection() menandai halaman ini dynamic di bawah Cache Components.
  await connection();

  const cats = mockCats;

  return <KucingList cats={cats} />;
}