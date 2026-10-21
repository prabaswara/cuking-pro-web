"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      // TODO(FR-21): hapus langganan Web Push perangkat ini sebelum keluar.
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full rounded-2xl bg-error-container/50 p-4 text-left transition-colors hover:bg-error-container disabled:opacity-60"
    >
      <p className="font-semibold text-error">
        {isLoading ? "Mengakhiri sesi..." : "Keluar"}
      </p>
      <p className="text-sm text-text-muted">
        Akhiri sesi dan kembali ke halaman login
      </p>
    </button>
  );
}
