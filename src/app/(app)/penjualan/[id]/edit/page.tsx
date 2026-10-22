import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api-error";
import { getSale } from "@/lib/sales";
import { getSession } from "@/lib/session";
import { SaleEditForm } from "./SaleEditForm";

interface EditSalePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  let sale;
  try {
    sale = await getSale(session.user.id, id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  if (sale.status === "sold") {
    redirect("/breeding");
  }

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
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Edit Penjualan
        </h1>
        <p className="mt-1 text-text-muted">{sale.catName}</p>
      </div>

      <SaleEditForm sale={sale} />
    </div>
  );
}
