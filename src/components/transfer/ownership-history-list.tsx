"use client";

import { getOwnershipHistory, formatDateID } from "@/lib/mock";
import { Card, CardContent } from "@/components/ui/card";

export function OwnershipHistoryList() {
  const history = getOwnershipHistory("cat-mochi");

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">history</span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Riwayat</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Riwayat kepemilikan kucing akan tercatat di sini saat ada transfer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <Card key={h.id} className="rounded-3xl border-sand-border shadow-warm-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lavender-subtle text-tertiary">
                      <span className="material-symbols-outlined text-xl">{h.acquiredVia === "transfer" ? "swap_horiz" : "person"}</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{h.ownerDisplayName}</p>
                      <p className="text-sm text-text-muted">
                        {formatDateID(h.startedAt.toISOString())} — {h.endedAt ? formatDateID(h.endedAt.toISOString()) : "Sekarang"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    h.acquiredVia === "transfer"
                      ? "bg-amber-subtle text-honey-amber"
                      : "bg-mint-subtle text-secondary"
                  }`}>
                    {h.acquiredVia === "transfer" ? "Transfer" : "Didaftarkan"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}