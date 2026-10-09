import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
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

      <LoginForm />
    </div>
  );
}
