import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-on-surface">
          Daftar cukingPro 🐱
        </h1>
        <p className="mt-2 text-text-muted">
          Buat akun dan mulai kelola kucing kamu
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}
