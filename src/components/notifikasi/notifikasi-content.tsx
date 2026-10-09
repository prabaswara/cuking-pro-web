"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NotifikasiContent() {
  const [pushOn, setPushOn] = useState(false);
  const [emailOn, setEmailOn] = useState(true);
  const [supported, setSupported] = useState(true);
  const [isIOSBrowser, setIsIOSBrowser] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSupported("Notification" in window && "serviceWorker" in navigator);
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsIOSBrowser(isIOS && !isStandalone);
  }, []);

  async function handlePushToggle(next: boolean) {
    setMessage(null);
    if (!next) {
      // TODO: DELETE /api/push/subscribe (hapus langganan perangkat ini)
      setPushOn(false);
      return;
    }
    if (!supported) {
      setMessage("Browser ini tidak mendukung notifikasi web.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(
          "Izin ditolak. Aktifkan lewat pengaturan situs browser; email pengingat tetap berjalan."
        );
        return;
      }
      // TODO: POST /api/push/subscribe (daftarkan langganan VAPID)
      setPushOn(true);
      setMessage("Notifikasi perangkat ini aktif.");
    } catch {
      setMessage("Gagal meminta izin notifikasi. Coba lagi.");
    }
  }

  async function handleTest() {
    setMessage(null);
    if (!pushOn) {
      setMessage("Aktifkan dulu “Notifikasi di perangkat ini”.");
      return;
    }
    // TODO: POST /api/push/test
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("cukingPro (uji)", {
        body: "Notifikasi uji berhasil diterima di perangkat ini. 🐾",
      });
      setMessage("Notifikasi uji dikirim.");
    } catch {
      // Fallback bila service worker belum terpasang (fase frontend)
      setMessage("Mode demo: service worker Web Push dipasang saat backend siap.");
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface">
          {message}
        </div>
      )}

      {/* Panduan iOS */}
      {isIOSBrowser && (
        <Card className="rounded-3xl border-honey-amber/40 bg-amber-subtle shadow-warm-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <span className="material-symbols-outlined text-2xl text-honey-amber">
              add_to_home_screen
            </span>
            <div>
              <p className="font-bold text-on-surface">
                Tambahkan ke Layar Utama dulu
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Di iPhone/iPad, notifikasi web hanya berfungsi bila cukingPro
                dibuka dari ikon Layar Utama (iOS 16.4+): ketuk Bagikan →
                “Tambah ke Layar Utama”, lalu buka dari ikon itu.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perangkat ini */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Perangkat Ini</CardTitle>
          <CardDescription>
            Izin hanya bisa diminta lewat ketukan tombol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="push-toggle">Notifikasi di perangkat ini</Label>
              <p className="text-sm text-text-muted">
                {pushOn ? "Aktif" : "Nonaktif"} •{" "}
                {supported ? "didukung browser ini" : "tidak didukung browser ini"}
              </p>
            </div>
            <Switch
              id="push-toggle"
              checked={pushOn}
              onCheckedChange={handlePushToggle}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            className="h-11 w-full rounded-full"
          >
            <span className="material-symbols-outlined mr-2 text-xl">
              notifications_active
            </span>
            Kirim notifikasi uji
          </Button>
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Email Pengingat</CardTitle>
          <CardDescription>
            Ringkasan harian pukul 08:00 WIB (H-3 & hari-H)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="email-toggle">Email pengingat</Label>
              <p className="text-sm text-text-muted">
                {emailOn ? "Aktif" : "Nonaktif"} — pengingat tetap tampil di
                Beranda
              </p>
            </div>
            <Switch
              id="email-toggle"
              checked={emailOn}
              onCheckedChange={(v) => {
                setEmailOn(v);
                // TODO: PATCH /api/profile (email_reminders_enabled)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Perangkat terdaftar */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Perangkat Terdaftar</CardTitle>
          <CardDescription>
            Setiap perangkat punya langganan sendiri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-on-surface">
                <span className="material-symbols-outlined text-xl">
                  smartphone
                </span>
              </div>
              <div>
                <p className="font-semibold text-on-surface">
                  Perangkat ini {pushOn ? "(aktif)" : "(belum aktif)"}
                </p>
                <p className="text-sm text-text-muted">Didaftarkan baru saja</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Logout otomatis menghapus langganan perangkat ini agar notifikasi
            tidak bocor ke akun lain.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
