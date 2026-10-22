import { listDocuments } from "@/lib/documents";
import { listFeedingSchedules } from "@/lib/feeding";
import { listHealthRecords } from "@/lib/health";
import { DOCUMENT_CATEGORY_LABEL, HEALTH_TYPE_LABEL } from "@/lib/labels";
import type { TimelineEvent } from "@/types";
import type { HistorySlice } from "@/lib/health";

/** Linimasa gabungan dari modul yang sudah punya backend (Fase 2). */
export async function getCatTimeline(
  userId: string,
  catId: string,
): Promise<HistorySlice<TimelineEvent>> {
  const [health, documents, feeding] = await Promise.all([
    listHealthRecords(userId, catId),
    listDocuments(userId, catId),
    listFeedingSchedules(userId, catId),
  ]);

  const weights = health.items
    .filter((row) => row.type === "weight" && row.weightKg != null)
    .sort((a, b) => a.recordDate.localeCompare(b.recordDate));

  const weightEvents: TimelineEvent[] = weights.map((row, index) => {
    const previous = index > 0 ? weights[index - 1].weightKg : null;
    const delta =
      previous != null && row.weightKg != null
        ? Math.round((row.weightKg - previous) * 1000)
        : null;

    return {
      id: `weight-${row.id}`,
      catId,
      category: "weight",
      title: `Berat ${row.weightKg?.toFixed(2)} kg`,
      description: row.notes,
      eventDate: row.recordDate,
      eventTime: null,
      meta: delta != null ? { delta: `${delta >= 0 ? "+" : ""}${delta}g` } : null,
    };
  });

  const healthEvents: TimelineEvent[] = health.items
    .filter((row) => row.type !== "weight")
    .map((row) => ({
      id: `health-${row.id}`,
      catId,
      category: "medical",
      title: row.title?.trim() || HEALTH_TYPE_LABEL[row.type],
      description: [row.vetName, row.notes].filter(Boolean).join(" • ") || null,
      eventDate: row.recordDate,
      eventTime: null,
      meta: row.nextDueDate
        ? { status: `Jatuh tempo berikutnya ${row.nextDueDate}` }
        : null,
    }));

  const documentEvents: TimelineEvent[] = documents.items.map((row) => ({
    id: `document-${row.id}`,
    catId,
    category: "note",
    title: `Dokumen: ${row.title}`,
    description: [DOCUMENT_CATEGORY_LABEL[row.category], row.source]
      .filter(Boolean)
      .join(" • "),
    eventDate: row.uploadedAt,
    eventTime: null,
    meta: null,
  }));

  const feedingEvents: TimelineEvent[] = feeding.map((row) => ({
    id: `feeding-${row.id}`,
    catId,
    category: "feeding",
    title: `Jadwal pakan: ${row.foodType}`,
    description: `${row.portionGrams} gram${row.notes ? ` • ${row.notes}` : ""}`,
    eventDate: row.createdAt.toISOString().slice(0, 10),
    eventTime: row.scheduleTime,
    meta: null,
  }));

  const items = [...healthEvents, ...weightEvents, ...documentEvents, ...feedingEvents].sort(
    (a, b) => {
      const byDate = b.eventDate.localeCompare(a.eventDate);
      if (byDate !== 0) return byDate;
      return (b.eventTime ?? "").localeCompare(a.eventTime ?? "");
    },
  );

  return {
    items,
    lockedCount: health.lockedCount + documents.lockedCount,
    windowStart: health.windowStart ?? documents.windowStart,
  };
}
