import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatSalesForUser } from "@/lib/mock";
import { SaleEditForm } from "./SaleEditForm";

interface EditSalePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  await connection();
  const { id } = await params;
  const sale = getCatSalesForUser("user-1").find((s) => s.id === id);

  if (!sale) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href="/breeding"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Penjualan
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Edit Penjualan</h1>
        <p className="mt-1 text-text-muted">{sale.catName}</p>
      </div>

      <SaleEditForm sale={sale} />
    </div>
  );
}