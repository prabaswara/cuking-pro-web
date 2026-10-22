"use client";

import { useState } from "react";
import { StudBookingManager } from "@/components/pacak/stud-booking-manager";
import { StudServiceManager, type StudCatOption } from "@/components/pacak/stud-service-manager";
import type {
  StudBookingWithDetails,
  StudServiceWithStats,
} from "@/lib/stud-bookings";

export function StudTabs({
  services,
  cats,
  bookings,
}: {
  services: StudServiceWithStats[];
  cats: StudCatOption[];
  bookings: {
    items: StudBookingWithDetails[];
    lockedCount: number;
    windowStart: string | null;
  };
}) {
  const [activeTab, setActiveTab] = useState<"pejantan" | "booking">("booking");

  const serviceOptions = services.map((service) => ({
    id: service.id,
    catName: service.catName,
    feeAmount: service.feeAmount,
    feeDescription: service.feeDescription,
    isBookable: service.isBookable,
  }));

  const serviceKey = services
    .map((service) =>
      [
        service.id,
        service.isAvailable,
        service.isBookable,
        service.stats.bookingCount,
        service.stats.matingCount,
        service.stats.pregnantCount,
        service.stats.deliveredCount,
      ].join(":"),
    )
    .join("|");

  const bookingKey = bookings.items
    .map((booking) =>
      [
        booking.id,
        booking.status,
        booking.plannedDate,
        booking.expectedDueDate,
        booking.queenPregnancyStatus,
        booking.matingCount,
      ].join(":"),
    )
    .join("|");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Jasa Pacak</h1>
        <p className="mt-1 text-text-muted">
          Kelola pejantan pacak dan booking klien
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["booking", "Booking"],
            ["pejantan", "Pejantan Pacak"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "pejantan" && (
        <StudServiceManager
          key={serviceKey}
          initial={services}
          cats={cats}
        />
      )}

      {activeTab === "booking" && (
        <StudBookingManager
          key={bookingKey}
          initial={bookings}
          services={serviceOptions}
        />
      )}
    </div>
  );
}
