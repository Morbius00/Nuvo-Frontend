/** Deterministic PRNG (mulberry32) so mock data is stable across reloads within a session. */
export function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function range(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

export function dateAt(daysAgo: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function monthStart(monthsAgo = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysSinceMonthStart(monthsAgo: number, dayOfMonth: number, hour: number, minute: number) {
  const start = monthStart(monthsAgo);
  start.setDate(dayOfMonth);
  start.setHours(hour, minute, 0, 0);
  const now = new Date();
  return Math.round((now.getTime() - start.getTime()) / 86_400_000);
}
