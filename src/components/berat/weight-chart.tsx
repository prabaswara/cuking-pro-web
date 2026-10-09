"use client";

import { useMemo, useState } from "react";
import { mockWeights } from "@/lib/mock";

const TIMEFRAMES = [
  { value: 30, label: "1 Bulan" },
  { value: 90, label: "3 Bulan" },
  { value: 180, label: "6 Bulan" },
  { value: 0, label: "Semua" },
] as const;

// Grafik SVG sederhana: peta tanggal → x, berat → y.
export function WeightChart({ catId }: { catId: string }) {
  const [days, setDays] = useState<number>(90);
  const [activeId, setActiveId] = useState<string | null>(null);

  const points = useMemo(() => {
    const all = mockWeights
      .filter((w) => w.catId === catId)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (days === 0 || all.length === 0) return all;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const filtered = all.filter((w) => w.date >= cutoffStr);
    return filtered.length > 0 ? filtered : all;
  }, [catId, days]);

  const W = 320;
  const H = 160;
  const PAD_L = 30;
  const PAD_B = 22;

  const coords = useMemo(() => {
    if (points.length === 0) return [];
    const kgs = points.map((p) => p.kg);
    const min = Math.min(...kgs);
    const max = Math.max(...kgs);
    const span = max - min || 0.5;
    const lo = min - span * 0.2;
    const hi = max + span * 0.2;
    return points.map((p, i) => {
      const x =
        points.length === 1
          ? W / 2
          : PAD_L + (i / (points.length - 1)) * (W - PAD_L - 8);
      const y = 10 + (1 - (p.kg - lo) / (hi - lo)) * (H - 10 - PAD_B);
      return { ...p, x, y };
    });
  }, [points]);

  if (points.length === 0) {
    return (
      <p className="rounded-2xl bg-surface-container-low p-4 text-center text-sm text-text-muted">
        Belum ada data berat. Catat berat pertama untuk mulai memantau.
      </p>
    );
  }

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const active = coords.find((c) => c.id === activeId) ?? coords[coords.length - 1];
  const first = coords[0];
  const last = coords[coords.length - 1];
  const delta = last.kg - first.kg;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-text-muted">
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)} kg sejak {first.date}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-surface-container p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setDays(t.value)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                days === t.value
                  ? "bg-surface-card text-primary shadow-sm"
                  : "text-text-muted hover:text-on-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full overflow-visible">
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#cc4900" stopOpacity="0.28" />
              <stop offset="85%" stopColor="#cc4900" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            fill="url(#weightAreaGrad)"
            points={`${coords.map((c) => `${c.x},${c.y}`).join(" ")} ${last.x},${H - PAD_B} ${first.x},${H - PAD_B}`}
          />
          <polyline
            fill="none"
            points={line}
            stroke="#cc4900"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {coords.map((c) => (
            <g
              key={c.id}
              className="cursor-pointer"
              onMouseEnter={() => setActiveId(c.id)}
              onClick={() => setActiveId(c.id)}
            >
              <circle cx={c.x} cy={c.y} r="14" fill="transparent" />
              <circle
                cx={c.x}
                cy={c.y}
                r={c.id === active.id ? 8 : 6}
                fill={c.id === active.id ? "#a33900" : "#ffffff"}
                stroke={c.id === active.id ? "#ffffff" : "#cc4900"}
                strokeWidth="3"
              />
            </g>
          ))}
        </svg>
        {/* Tooltip */}
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-xl bg-inverse-on-surface px-2.5 py-1 text-center shadow-md"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${(active.y / H) * 100}%`,
            transform: "translate(-50%, -110%)",
          }}
        >
          <p className="text-xs font-bold text-inverse-surface">
            {active.kg.toFixed(1)} kg
          </p>
          <p className="text-[10px] text-inverse-surface/80">
            {active.date}
          </p>
        </div>
      </div>
    </div>
  );
}
