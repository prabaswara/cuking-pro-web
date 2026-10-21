import { createAuthClient } from "better-auth/react";

/**
 * Klien Better Auth untuk komponen client.
 * baseURL default mengikuti origin browser (cukup untuk app satu-domain).
 */
export const authClient = createAuthClient();
