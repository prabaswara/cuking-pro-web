/**
 * Pengiriman email — sementara hanya menulis ke log server.
 *
 * Fase 2 (FR-06) akan mengganti isi fungsi ini dengan SMTP/penyedia email.
 * Tautan verifikasi/reset HANYA dicetak saat bukan produksi agar token tidak
 * bocor ke log produksi.
 */

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  if (process.env.SMTP_HOST) {
    // TODO(fase-2): kirim lewat SMTP/penyedia email.
    console.warn("[email] SMTP_HOST diatur tetapi pengiriman belum diimplementasikan.");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      `[email] Tidak ada transport email. Email ke ${to} ("${subject}") tidak terkirim.`,
    );
    return;
  }

  console.info(
    [
      "",
      "──────── EMAIL (DEV, tidak benar-benar terkirim) ────────",
      `To      : ${to}`,
      `Subject : ${subject}`,
      "",
      text,
      "────────────────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}
