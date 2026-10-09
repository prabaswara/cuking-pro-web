import type { HealthRecord } from "@/types";
import { formatDateID, formatRupiah, healthTypeLabel } from "@/lib/mock";

const TYPE_STYLE: Record<HealthRecord["type"], { bg: string; text: string; icon: string }> = {
  vaccine: { bg: "bg-tangerine-subtle", text: "text-primary", icon: "vaccines" },
  deworming: { bg: "bg-mint-subtle", text: "text-secondary", icon: "medication" },
  flea: { bg: "bg-mint-subtle", text: "text-secondary", icon: "pest_control" },
  vet_visit: { bg: "bg-amber-subtle", text: "text-honey-amber", icon: "stethoscope" },
  medication: { bg: "bg-lavender-subtle", text: "text-tertiary", icon: "pill" },
  weight: { bg: "bg-amber-subtle", text: "text-honey-amber", icon: "scale" },
  other: { bg: "bg-surface-container", text: "text-on-surface-variant", icon: "description" },
};

interface HealthRecordCardProps {
  record: HealthRecord;
}

export function HealthRecordCard({ record }: HealthRecordCardProps) {
  const style = TYPE_STYLE[record.type];

  return (
    <article className="flex flex-col gap-2.5 rounded-3xl border border-sand-border bg-surface-card p-4 shadow-warm-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {style.icon}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface">
              {record.title ?? healthTypeLabel(record.type)}
            </h4>
            <p className="text-sm text-text-muted">
              {formatDateID(record.recordDate)}
              {record.vetName ? ` • ${record.vetName}` : ""}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}
        >
          {healthTypeLabel(record.type)}
        </span>
      </div>

      {(record.nextDueDate || record.cost != null || record.notes) && (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-surface-container-low p-3">
          {record.nextDueDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Jatuh tempo berikutnya:</span>
              <span className="font-semibold text-on-surface">
                {formatDateID(record.nextDueDate)}
              </span>
            </div>
          )}
          {record.cost != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Biaya:</span>
              <span className="font-semibold text-on-surface">
                {formatRupiah(record.cost)}
              </span>
            </div>
          )}
          {record.notes && (
            <p className="text-sm text-on-surface">{record.notes}</p>
          )}
        </div>
      )}
    </article>
  );
}
