import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudBookingDetail } from "@/components/pacak/stud-booking-detail";
import { getOrCreateProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";
import { getStudBooking } from "@/lib/stud-bookings";
import { listStudServices } from "@/lib/stud-services";

type PageProps = { params: Promise<{ id: string }> };

export default async function BookingDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await getOrCreateProfile(session.user.id);
  if (!profile.isStudProvider) redirect("/jasa-pacak");

  const { id } = await params;

  let booking;
  try {
    booking = await getStudBooking(session.user.id, id);
  } catch {
    notFound();
  }

  const services = await listStudServices(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/jasa-pacak"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Jasa Pacak
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Booking: {booking.queenName}
        </h1>
        <p className="mt-1 text-text-muted">
          {booking.clientName} • {booking.clientWhatsapp}
        </p>
      </div>

      <StudBookingDetail
        initial={booking}
        services={services.map((service) => ({
          id: service.id,
          catName: service.catName,
          feeAmount: service.feeAmount,
          feeDescription: service.feeDescription,
          isBookable: service.isBookable,
        }))}
      />
    </div>
  );
}
