import { LoginForm, type DemoAccount } from "@/components/auth/login-form";

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "free@demo.cukingpro", label: "Free" },
  { email: "breeder@demo.cukingpro", label: "Breeder" },
  { email: "stud@demo.cukingpro", label: "Jasa Pacak" },
  { email: "pro@demo.cukingpro", label: "Pro (semua)" },
];

export default function LoginPage() {
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-on-surface">
          Selamat Datang Kembali! 🐾
        </h1>
        <p className="mt-2 text-text-muted">
          Masuk ke akun cukingPro kamu
        </p>
      </div>

      <LoginForm
        demoAccounts={demoMode ? DEMO_ACCOUNTS : []}
        demoPassword={
          demoMode ? (process.env.DEMO_PASSWORD ?? "demo12345") : undefined
        }
      />
    </div>
  );
}
