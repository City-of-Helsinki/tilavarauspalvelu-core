import type {
  ImageFragment,
  Maybe,
  ReservationStartInterval,
} from "../gql/gql-types";
import { pixel } from "./common/style";

export function filterNonNullable<T>(
  arr: Maybe<Maybe<T>[]> | undefined
): NonNullable<T>[] {
  return arr?.filter((n): n is NonNullable<T> => n != null) ?? [];
}

/// Safe string -> number conversion
/// handles the special cases of empty string and NaN with type safety
export function toNumber(filter: string | null): number | null {
  if (filter == null) {
    return null;
  }
  // empty string converts to 0 which is not what we want
  if (filter.trim() === "") {
    return null;
  }
  const n = Number(filter);
  if (Number.isNaN(n)) {
    return null;
  }
  return n;
}

export const toMondayFirstUnsafe = (day: number) => {
  if (day < 0 || day > 6) {
    throw new Error(`Invalid day ${day}`);
  }
  return day === 0 ? 6 : day - 1;
};

export const toMondayFirst = (day: 0 | 1 | 2 | 3 | 4 | 5 | 6) =>
  day === 0 ? 6 : day - 1;

export const fromMondayFirstUnsafe = (day: number) => {
  if (day < 0 || day > 6) {
    throw new Error(`Invalid day ${day}`);
  }
  return day === 6 ? 0 : day + 1;
};

export const fromMondayFirst = (day: 0 | 1 | 2 | 3 | 4 | 5 | 6) =>
  day === 6 ? 0 : day + 1;

export type LocalizationLanguages = "fi" | "sv" | "en";

export const getLocalizationLang = (code: string): LocalizationLanguages => {
  if (code.startsWith("fi")) {
    return "fi";
  }
  if (code.startsWith("sv")) {
    return "sv";
  }
  if (code.startsWith("en")) {
    return "en";
  }
  return "fi";
};

export const isBrowser = typeof window !== "undefined";

export function base64encode(str: string) {
  if (isBrowser) {
    return window.btoa(str);
    // TODO do we want unescape(encodeURIComponent(str)));?
  }
  return Buffer.from(str, "binary").toString("base64");
}

export function truncate(val: string, maxLen: number): string {
  return val.length > maxLen ? `${val.substring(0, maxLen - 1)}…` : val;
}

/// Always return an image because the Design and process should not allow imageless reservation units
/// On production returns the cached medium image url
/// On development we don't have image cache so we return the full image url
/// If image is null or undefined returns a static pixel
export function getImageSource(
  image: ImageFragment | null,
  size: "small" | "large" | "medium" | "full" = "medium"
): string {
  if (!image) {
    return pixel;
  }
  return getImageSourceWithoutDefault(image, size) || image?.imageUrl || pixel;
}

function getImageSourceWithoutDefault(
  image: ImageFragment,
  size: "small" | "large" | "medium" | "full"
): string | null {
  switch (size) {
    case "small":
      return image.smallUrl ?? null;
    case "large":
      return image.largeUrl ?? null;
    case "medium":
      return image.mediumUrl ?? null;
    case "full":
      return image.imageUrl ?? null;
    default:
      return null;
  }
}
export function getIntervalMinutes(
  reservationStartInterval: ReservationStartInterval
): number {
  switch (reservationStartInterval) {
    case "INTERVAL_15_MINS":
      return 15;
    case "INTERVAL_30_MINS":
      return 30;
    case "INTERVAL_60_MINS":
      return 60;
    case "INTERVAL_90_MINS":
      return 90;
    case "INTERVAL_120_MINS":
      return 120;
    case "INTERVAL_180_MINS":
      return 180;
    case "INTERVAL_240_MINS":
      return 240;
    case "INTERVAL_300_MINS":
      return 300;
    case "INTERVAL_360_MINS":
      return 360;
    case "INTERVAL_420_MINS":
      return 420;
    default:
      throw new Error("Invalid reservation start interval");
  }
}
