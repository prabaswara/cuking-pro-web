import Image from "next/image";

interface LogoProps {
  /** Tinggi logo dalam px (lebar mengikuti aspek rasio asli 808:214) */
  height?: number;
  className?: string;
}

// Wordmark transparan untuk background terang (header, hero, auth).
export function Logo({ height = 32, className = "" }: LogoProps) {
  const width = Math.round((height * 808) / 214);
  return (
    <Image
      src="/brand/logo-transparent.png"
      alt="cukingPro"
      width={width}
      height={height}
      priority
      className={`w-auto ${className}`}
      style={{ height }}
    />
  );
}

interface SymbolProps {
  /** Ukuran sisi dalam px (simbol berbentuk persegi 1:1) */
  size?: number;
  className?: string;
}

// Mark "C" bertelinga untuk konteks kecil (loading, avatar fallback).
// Varian transparan: cocok di atas background terang apa pun.
export function Symbol({ size = 32, className = "" }: SymbolProps) {
  return (
    <Image
      src="/brand/symbol-transparent.png"
      alt="cukingPro"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
