import { describe, expect, it } from "vitest";
import type { HistoryEntry } from "./history";
import { computeStats, listeningStreak, periodStart } from "./stats";

// Local noon of a given day, so time zones do not move plays across days.
const at = (year: number, month: number, day: number, hour = 12) => new Date(year, month, day, hour).getTime() / 1000;
const play = (artist: string, title: string, startedAt: number, duration = 180): HistoryEntry => ({
  album: "",
  artist,
  duration,
  key: title,
  listened: 120,
  startedAt,
  title,
});

const now = new Date(2026, 10, 15, 18); // 15 Nov 2026, 18:00

describe("periodStart", () => {
  it("covers the last 7 / 30 days, this year or everything", () => {
    expect(periodStart("week", now)).toBe(new Date(2026, 10, 9).getTime() / 1000);
    expect(periodStart("month", now)).toBe(new Date(2026, 9, 17).getTime() / 1000);
    expect(periodStart("year", now)).toBe(new Date(2026, 0, 1).getTime() / 1000);
    expect(periodStart("all", now)).toBe(0);
  });
});

describe("computeStats", () => {
  const entries = [
    play("Vaundy", "踊り子", at(2026, 10, 15, 9)),
    play("vaundy", "踊り子", at(2026, 10, 14, 21)),
    play("YOASOBI", "Idol", at(2026, 10, 14, 21), 240),
    play("Old", "Song", at(2025, 5, 1)),
  ];

  it("counts plays, minutes, artists and songs in the period", () => {
    const stats = computeStats(entries, "week", now);
    expect(stats.plays).toBe(3);
    expect(stats.minutes).toBe(10); // 180 + 180 + 240 seconds
    expect(stats.distinctArtists).toBe(2);
    expect(stats.distinctSongs).toBe(2);
    expect(stats.topArtists[0]).toMatchObject({ name: "Vaundy", plays: 2 });
    expect(stats.topSongs[0]).toMatchObject({ plays: 2, title: "踊り子" });
    expect(stats.byHour[21]).toBe(2);
    expect(stats.byHour[9]).toBe(1);
  });

  it("has one bucket per day for a week and per month for a year", () => {
    const week = computeStats(entries, "week", now);
    expect(week.buckets).toHaveLength(7);
    expect(week.buckets.map((bucket) => bucket.plays).slice(-2)).toEqual([2, 1]);
    const year = computeStats(entries, "year", now);
    expect(year.buckets).toHaveLength(12);
    expect(year.buckets[10].plays).toBe(3);
  });

  it("all time includes everything", () => {
    expect(computeStats(entries, "all", now).plays).toBe(4);
  });
});

describe("listeningStreak", () => {
  it("counts consecutive days back from today or yesterday", () => {
    const days = [at(2026, 10, 15), at(2026, 10, 14), at(2026, 10, 13), at(2026, 10, 11)];
    expect(listeningStreak(days.map((time) => play("A", "B", time)), now)).toBe(3);
    expect(listeningStreak([play("A", "B", at(2026, 10, 14))], now)).toBe(1);
    expect(listeningStreak([play("A", "B", at(2026, 10, 10))], now)).toBe(0);
  });
});
