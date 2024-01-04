import { z } from "zod";
import { subDays } from "date-fns";

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;
const TIME_PATTERN = /^[0-2][0-9]:[0-5][0-9]$/;

// Common select prop type
// normally a backend provided list that is transformed into
// { value, label } pair for input the value maps to a backend id (pk).
export const OptionSchema = z.object({
  value: z.number(),
  label: z.string(),
});

export const checkDateNotInPast = (
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
): void => {
  if (date && date < subDays(new Date(), 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: "Date can't be in the past",
    });
  }
};

export const checkDateWithinThreeYears = (
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
): void => {
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
};

// TODO doesn't check for valid days or months i.e. 2024-02-31 and 2024-13-41 are valid
export const checkValidDate = (
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
): void => {
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
  checkDateWithinThreeYears(date, ctx, path);
};

export const checkValidFutureDate = (
  date: Date | null,
  ctx: z.RefinementCtx,
  path: string
): void => {
  checkValidDate(date, ctx, path);
  checkDateNotInPast(date, ctx, path);
};

export const checkTimeStringFormat = (
  data: string | undefined,
  ctx: z.RefinementCtx,
  path: string,
  errorKey?: string
) => {
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
};

export const checkLengthWithoutHtml = (
  str: string,
  ctx: z.RefinementCtx,
  path: string,
  min?: number,
  max?: number
) => {
  const stripped = str.replaceAll(/<[^>]*>/g, "");

  if (min != null && stripped.length < min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `Message cannot be shorter than ${min} characters`,
    });
  }
  if (max != null && stripped.length > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `Message cannot be longer than ${max} characters`,
    });
  }
};
