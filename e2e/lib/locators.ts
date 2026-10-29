/** Helpers for checks that the keywords make with Playwright locators. */
import type { Locator } from "@playwright/test";

/** Whether the locator gets to `state` within `timeout` ms (the action timeout by default): true or false, no error. */
export async function reachesState(
  locator: Locator,
  state: "attached" | "detached" | "visible" | "hidden",
  timeout?: number
): Promise<boolean> {
  try {
    await locator.waitFor({ state, timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * The elements the locator matches, after waiting for the first one to appear (the action timeout by default). An
 * empty list if none appear in time.
 */
export async function elementsOf(locator: Locator, timeout?: number): Promise<Locator[]> {
  if (!(await reachesState(locator.first(), "attached", timeout))) {
    return [];
  }
  return locator.all();
}
