import { setTimeout } from "node:timers/promises";

/**
 * Runs `action` until it passes, at most `attempts` times, waiting `intervalMs` between the attempts. Fails with the
 * last attempt's error. For steps that are safe to repeat; to retry for a time instead, use `expect(...).toPass()`.
 */
export async function retry<T>(attempts: number, intervalMs: number, action: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- one attempt after another
      return await action();
    } catch (err) {
      if (attempt >= attempts) {
        throw err;
      }
      // oxlint-disable-next-line no-await-in-loop -- the pause between attempts
      await setTimeout(intervalMs);
    }
  }
}
