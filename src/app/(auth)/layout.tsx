import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Check if user is already authenticated
  // If authenticated, redirect to dashboard
  // const session = await getSession();
  // if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-peach-canvas">
      <div className="flex min-h-screen flex-col">
        {/* Auth Header */}
        <header className="fixed top-0 z-50 w-full bg-peach-canvas/80 pt-safe backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo height={36} />
          </div>
        </header>

        {/* Auth Content */}
        <main className="flex flex-1 flex-col pt-16">
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
