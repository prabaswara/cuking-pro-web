import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-on-surface">
          Lupa Password? 🔐
        </h1>
        <p className="mt-2 text-text-muted">
          Kami akan kirimkan tautan reset ke email kamu
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
