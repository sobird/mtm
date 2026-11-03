export interface LoginRateLimiterOptions {
  maxFailures?: number;
  windowMs?: number;
  now?: () => number;
}

export interface LoginRateLimiter {
  isBlocked(key: string): boolean;
  recordFailure(key: string): void;
  reset(key: string): void;
  clear(): void;
}

const DEFAULT_MAX_FAILURES = 5;
const DEFAULT_WINDOW_MS = 15 * 60_000;

export function createLoginRateLimiter(options: LoginRateLimiterOptions = {}): LoginRateLimiter {
  const maxFailures = options.maxFailures ?? DEFAULT_MAX_FAILURES;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now ?? Date.now;
  const failures = new Map<string, number[]>();

  function prune(key: string, currentTime: number): number[] {
    const timestamps = failures.get(key);
    if (!timestamps) return [];

    const kept = timestamps.filter(timestamp => currentTime - timestamp < windowMs);
    if (kept.length === 0) {
      failures.delete(key);
    } else {
      failures.set(key, kept);
    }
    return kept;
  }

  return {
    isBlocked(key) {
      return prune(key, now()).length >= maxFailures;
    },
    recordFailure(key) {
      const currentTime = now();
      const timestamps = prune(key, currentTime);
      timestamps.push(currentTime);
      failures.set(key, timestamps);
    },
    reset(key) {
      failures.delete(key);
    },
    clear() {
      failures.clear();
    },
  };
}
