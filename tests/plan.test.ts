import { describe, expect, it } from "vitest";
import { historyWindowStart } from "@/lib/plan";

describe("historyWindowStart", () => {
  it("memundurkan 3 bulan kalender dan mempertahankan tanggal", () => {
    const now = new Date(2026, 9, 21, 10, 30); // 21 Okt 2026
    const start = historyWindowStart(3, now);

    expect(start?.getFullYear()).toBe(2026);
    expect(start?.getMonth()).toBe(6); // Juli
    expect(start?.getDate()).toBe(21);
    expect(start?.getHours()).toBe(10);
  });

  it("mengembalikan null untuk paket tanpa batas (Pro)", () => {
    expect(historyWindowStart(null)).toBeNull();
  });

  it("clamp ke akhir bulan saat tanggal tidak ada (31 Mei - 3 bulan)", () => {
    const start = historyWindowStart(3, new Date(2026, 4, 31));

    expect(start?.getFullYear()).toBe(2026);
    expect(start?.getMonth()).toBe(1); // Februari 2026 (bukan kabisat)
    expect(start?.getDate()).toBe(28);
  });

  it("clamp dengan benar pada tahun kabisat", () => {
    const start = historyWindowStart(1, new Date(2024, 2, 31)); // 31 Mar 2024

    expect(start?.getMonth()).toBe(1); // Februari 2024
    expect(start?.getDate()).toBe(29);
  });
});
