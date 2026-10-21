import { Suspense } from "react";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";

async function VerifyEmailContent({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return <VerifyEmailCard email={email} />;
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <div className="w-full max-w-md">
      <Suspense
        fallback={
          <div className="h-80 animate-pulse rounded-3xl bg-surface-container-low" />
        }
      >
        <VerifyEmailContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
