import { NextResponse, type NextRequest } from "next/server";

/**
 * Guard lapisan pertama: redirect cepat ke /login bila cookie sesi tidak ada.
 *
 * Ini BUKAN validasi sesi — cookie bisa dipalsukan/daluwarsa. Layout `(app)`
 * tetap memanggil Better Auth untuk memverifikasi sesi ke database.
 * Tujuannya hanya agar pengguna anonim mendapat redirect HTTP 307, bukan
 * shell halaman yang baru dialihkan setelah hydration.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("better-auth.session_token") ||
        cookie.name.startsWith("__Secure-better-auth.session_token"),
    );

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/kucing/:path*",
    "/paket/:path*",
    "/keuangan/:path*",
    "/pengaturan/:path*",
    "/profil/:path*",
    "/onboarding/:path*",
    "/breeding/:path*",
    "/jasa-pacak/:path*",
    "/transfer/:path*",
    "/riwayat-kepemilikan/:path*",
    "/penjualan/:path*",
    "/pengingat/:path*",
    "/notifikasi/:path*",
  ],
};
