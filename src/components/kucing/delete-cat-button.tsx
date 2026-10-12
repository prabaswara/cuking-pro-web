"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DeleteCatButtonProps {
  catId: string;
  catName: string;
}

export function DeleteCatButton({ catId, catName }: DeleteCatButtonProps) {
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    // TODO: DELETE /api/cats/:id
    alert(`Demo: kucing "${catName}" akan dihapus (TODO: DELETE /api/cats/${catId})`);
    setConfirming(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirming(true)}
        className="h-12 w-full rounded-full border-error text-error hover:bg-error-container"
      >
        <span className="material-symbols-outlined mr-2 text-xl">delete</span>
        Hapus Kucing
      </Button>

      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">Hapus Kucing?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              <strong>{catName}</strong> akan dihapus permanen beserta semua data terkaitnya.
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} className="h-12 flex-1 rounded-full">
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                className="h-12 flex-1 rounded-full bg-error text-white hover:bg-error/90"
              >
                Hapus Permanen
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}