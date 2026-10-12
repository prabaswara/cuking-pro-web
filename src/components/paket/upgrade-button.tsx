"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function UpgradeButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button className="w-full rounded-full" onClick={() => setShowDialog(true)}>
        Upgrade ke Pro
      </Button>

      {showDialog && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Segera Hadir</h3>
              <button
                onClick={() => setShowDialog(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              Pembayaran online via Midtrans Snap (QRIS, VA, e-wallet, kartu) akan tersedia di
              Fase 6. Saat ini paket Pro hanya bisa diaktifkan lewat seed database.
            </p>
            <Button className="mt-4 w-full rounded-full" onClick={() => setShowDialog(false)}>
              Mengerti
            </Button>
          </div>
        </div>
      )}
    </>
  );
}