// deterministic pseudo-random so server and client renders agree
export function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

export function isoDaysAgo(days: number, hour = 9): string {
  const base = Date.UTC(2026, 7, 23, hour, 0, 0);
  return new Date(base - days * 86400000).toISOString();
}

export function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
