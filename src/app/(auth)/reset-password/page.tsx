import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Password Baru 🔑</h1>
        <p className="mt-2 text-text-muted">
          Buat kata sandi baru untuk akun cukingPro kamu
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-80 animate-pulse rounded-3xl bg-surface-container-low" />
        }
      >
        <ResetPasswordContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
