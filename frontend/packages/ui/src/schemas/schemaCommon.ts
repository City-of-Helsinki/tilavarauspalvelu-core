import { subDays } from "date-fns";
import { z } from "zod";
import { parseUIDate } from "../modules/date-utils";

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;
const TIME_PATTERN = /^[0-2][0-9]:[0-5][0-9]$/;

export const emailField = z.email({ error: "invalidEmail" }).max(254);
// backend doesn't accept bad emails (empty is fine)
export const optionalEmailField = z.union([emailField, z.string().length(0)]).optional();

export function checkDateNotInPast(date: Date | null, ctx: z.RefinementCtx, path: string): void {
  if (date && date < subDays(new Date(), 1)) {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: "Date can't be in the past",
    });
  }
}

export function checkDateWithinThreeYears(date: Date | null, ctx: z.RefinementCtx, path: string): void {
  if (date && Math.abs(Date.now() - date.getTime()) > THREE_YEARS_MS) {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: "Date needs to be within three years.",
    });
  }
}

export function checkValidDateOnly(date: Date | null, ctx: z.RefinementCtx, path: string) {
  // NOTE typical use case goes through our date parser that converts invalid dates -> null
  if (date == null || Number.isNaN(date.getTime())) {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: "Invalid date",
    });
  }
}

// TODO doesn't check for valid days or months i.e. 2024-02-31 and 2024-13-41 are valid (?) it seems to work
// TODO this should not do two things, it should only check if the date is valid, but requires refactoring the users
export function checkValidDate(date: Date | null, ctx: z.RefinementCtx, path: string): void {
  checkValidDateOnly(date, ctx, path);
  checkDateWithinThreeYears(date, ctx, path);
}

export function checkValidFutureDate(date: Date | null, ctx: z.RefinementCtx, path: string): void {
  // different order so we get "not past" errors before of "not inside 3-year range"
  checkValidDateOnly(date, ctx, path);
  checkDateNotInPast(date, ctx, path);
  checkDateWithinThreeYears(date, ctx, path);
}

export function checkTimeStringFormat(data: string | undefined, ctx: z.RefinementCtx, path: string, errorKey?: string) {
  if (!data) {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: `Required`,
    });
  } else if (!TIME_PATTERN.test(data)) {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: `${errorKey ?? path} is not in time format.`,
    });
  } else if (Number(data.replace(":", ".")) >= 24) {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: `${errorKey ?? path} can't be more than 24 hours.`,
    });
  }
}

export function lessThanMaybeDate(a?: string | null, b?: string | null): boolean {
  if (a == null || b == null) {
    return false;
  }
  const aDate = parseUIDate(a);
  const bDate = parseUIDate(b);
  if (aDate == null || bDate == null) {
    return false;
  }
  return aDate < bDate;
}
