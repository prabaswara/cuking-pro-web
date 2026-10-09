import { Symbol } from "@/components/brand/logo";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div className="animate-pulse">
        <Symbol size={56} />
      </div>
      <p className="text-sm font-medium text-text-muted">Memuat...</p>
    </div>
  );
}
