import { z } from "zod";
import { subDays } from "date-fns";
import { fromUIDate } from "../common/util";

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;
const TIME_PATTERN = /^[0-2][0-9]:[0-5][0-9]$/;

// Common select prop type
// normally a backend provided list that is transformed into
// { value, label } pair for input the value maps to a backend id (pk).
export const OptionSchema = z.object({
  value: z.number(),
  label: z.string(),
});

export function checkDateNotInPast(
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
): void {
  if (date && date < subDays(new Date(), 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: "Date can't be in the past",
    });
  }
}

export function checkDateWithinThreeYears(
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
): void {
  if (
    date &&
    Math.abs(new Date().getTime() - date.getTime()) > THREE_YEARS_MS
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: "Date needs to be within three years.",
    });
  }
}

export function checkValidDateOnly(
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
) {
  if (!date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: "Required",
    });
  } else if (Number.isNaN(date.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: "Invalid date",
    });
  }
}

// TODO doesn't check for valid days or months i.e. 2024-02-31 and 2024-13-41 are valid (?) it seems to work
// TODO this should not do two things, it should only check if the date is valid, but requires refactoring the users
export function checkValidDate(
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
): void {
  checkValidDateOnly(date, ctx, path);
  checkDateWithinThreeYears(date, ctx, path);
}

export function checkValidFutureDate(
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
): void {
  checkValidDate(date, ctx, path);
  checkDateNotInPast(date, ctx, path);
}

export function checkTimeStringFormat(
  data: string | undefined,
  ctx: z.RefinementCtx,
  path: string,
  errorKey?: string
) {
  if (!data) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `Required`,
    });
  } else if (!data.match(TIME_PATTERN)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `${errorKey ?? path} is not in time format.`,
    });
  } else if (Number(data.replace(":", ".")) >= 24) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `${errorKey ?? path} can't be more than 24 hours.`,
    });
  }
}

export function checkLengthWithoutHtml(
  str: string,
  ctx: z.RefinementCtx,
  path: string,
  min?: number,
  max?: number,
  name?: string
) {
  const stripped = str.replaceAll(/<[^>]*>/g, "");

  if (min != null && stripped.length < min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `${name ?? "Message"} cannot be shorter than ${min} characters`,
    });
  }
  if (max != null && stripped.length > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `${name ?? "Message"} cannot be longer than ${max} characters`,
    });
  }
}

export function lessThanMaybeDate(
  a?: string | null,
  b?: string | null
): boolean {
  if (a == null || b == null) {
    return false;
  }
  const aDate = fromUIDate(a);
  const bDate = fromUIDate(b);
  if (aDate == null || bDate == null) {
    return false;
  }
  return aDate < bDate;
}
