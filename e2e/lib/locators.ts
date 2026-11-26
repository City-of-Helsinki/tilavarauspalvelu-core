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
 * A price as a pattern for `toHaveText`, without the typography that the frontend's unit tests check: any spaces
 * (non-breaking ones too), any dash in a range, and whole euros with or without ",00". The amounts, the tax and the
 * words must match, so "Hinta: 0–30 € (sis. alv 25,5 %)" matches "Hinta: 0 - 30,00 € (sis. alv 25,5%)" but not
 * "Hinta: 30,00 € (sis. alv 25,5 %)".
 */
export function pricePattern(price: string): RegExp {
  const pattern = price
    .trim()
    .replaceAll(/\s*([%€])/g, " $1") // a space may or may not come before % and €
    .replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll(/\s*[-–—]\s*/g, "-") // a range's dash, with or without spaces around it
    .replaceAll(/(?<![\d,])(\d+)(?:,00)?(?![\d,])/g, "$1(?:,00)?") // 30 and 30,00 are the same price
    .replaceAll(/\s+/g, "\\s*")
    .replaceAll("-", "\\s*[-–—]\\s*");
  // toHaveText matches a pattern against the text as it is, without normalizing its whitespace
  return new RegExp(`^\\s*${pattern}\\s*$`);
}
