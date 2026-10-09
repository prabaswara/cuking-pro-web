"use client";

import { useState } from "react";

interface GenderSelectProps {
  name?: string;
  defaultValue?: "male" | "female" | "";
}

export function GenderSelect({ name = "sex", defaultValue = "" }: GenderSelectProps) {
  const [value, setValue] = useState<"male" | "female" | "">(defaultValue);

  const base =
    "flex h-12 items-center justify-center gap-2 rounded-2xl border-2 font-medium transition-all active:scale-[0.98]";
  const selected = "border-primary bg-tangerine-subtle text-primary shadow-sm";
  const unselected =
    "border-sand-border bg-surface-card text-on-surface hover:border-primary/50";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Jenis kelamin">
        <button
          type="button"
          role="radio"
          aria-checked={value === "male"}
          onClick={() => setValue("male")}
          className={`${base} ${value === "male" ? selected : unselected}`}
        >
          <span className="text-lg text-secondary">♂</span>
          <span>Jantan</span>
          {value === "male" && (
            <span className="material-symbols-outlined text-lg">check_circle</span>
          )}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === "female"}
          onClick={() => setValue("female")}
          className={`${base} ${value === "female" ? selected : unselected}`}
        >
          <span className="text-lg text-primary">♀</span>
          <span>Betina</span>
          {value === "female" && (
            <span className="material-symbols-outlined text-lg">check_circle</span>
          )}
        </button>
      </div>
      {/* Nilai ikut terkirim saat form submit */}
      <input type="hidden" name={name} value={value} required />
    </div>
  );
}
