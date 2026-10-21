/**
 * Terjemahan kode error Better Auth ke pesan Bahasa Indonesia.
 * Sengaja tidak mengungkap apakah email atau password yang salah (FR-01).
 */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email atau password salah",
  EMAIL_NOT_VERIFIED: "Verifikasi email dulu",
  USER_ALREADY_EXISTS: "Email sudah digunakan",
  EMAIL_ALREADY_EXISTS: "Email sudah digunakan",
  INVALID_EMAIL: "Format email tidak valid",
  PASSWORD_TOO_SHORT: "Password minimal 8 karakter",
  PASSWORD_TOO_LONG: "Password terlalu panjang",
  INVALID_TOKEN: "Tautan tidak valid atau sudah kedaluwarsa",
};

export function authErrorMessage(code?: string, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  if (!code) return fallback;
  return MESSAGES[code] ?? fallback;
}
