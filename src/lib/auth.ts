import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { sendEmail } from "@/lib/email";

/**
 * Konfigurasi Better Auth (FR-01).
 * Skema tabel auth dihasilkan dari sini lewat `@better-auth/cli generate`
 * dan disimpan di `src/db/schema.ts` — jangan membuat tabel auth manual.
 */
export const auth = betterAuth({
  appName: "cukingPro",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      // Jangan await pengiriman email (mencegah timing attack).
      void sendEmail({
        to: user.email,
        subject: "Atur ulang kata sandi cukingPro",
        text: `Kami menerima permintaan atur ulang kata sandi.\n\nBuka tautan berikut (berlaku 1 jam):\n${url}\n\nAbaikan email ini jika kamu tidak memintanya.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verifikasi email cukingPro",
        text: `Halo ${user.name},\n\nVerifikasi email kamu dengan membuka tautan berikut:\n${url}\n\nTautan berlaku 1 jam.`,
      });
    },
  },
  // nextCookies() harus menjadi plugin terakhir.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
