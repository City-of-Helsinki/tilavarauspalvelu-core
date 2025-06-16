import { isAfter, isBefore } from "date-fns";
import {
  ImageType,
  type PricingFieldsFragment,
  type ImageFragment,
  type Maybe,
  type SuitableTimeFragment,
} from "../gql/gql-types";
import { type OptionInProps } from "hds-react";
import { type DayT, pixel } from "./const";
import { type TFunction } from "i18next";
import { type LocalizationLanguages } from "./urlBuilder";
import { convertWeekday } from "./conversion";

/// Enforce readonly on all nested properties
/// only single level deep i.e. {a: {b: {c: string}}} -> {readonly a: {b: {c: string}}}
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: ReadonlyDeep<T[P]>;
};

export function filterNonNullable<T>(arr: Maybe<Readonly<Array<Maybe<T | undefined>>>> | undefined): NonNullable<T>[] {
  return arr?.filter((n): n is NonNullable<T> => n != null) ?? [];
}

type SortFunc<T> = (a: T, b: T) => number;
export function sort<T>(arr: Readonly<T[]>, func: SortFunc<T>): T[] {
  return [...arr].sort((a, b) => func(a, b));
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/// Safe string -> number conversion
/// handles the special cases of empty string and NaN with type safety
/// @return null if the string is empty or NaN otherwise the number
export function toNumber(filter: Maybe<string> | undefined): number | null {
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

export function pick<T, K extends keyof T>(reservation: T, keys: ReadonlyArray<K>): Pick<T, K> {
  return keys.reduce<Pick<T, K>>(
    (acc, key) => {
      if (reservation[key] != null) {
        acc[key] = reservation[key];
      }
      return acc;
    },
    {} as Pick<T, K>
  );
}

export function toMondayFirstUnsafe(day: number): DayT {
  if (day < 0 || day > 6) {
    throw new Error(`Invalid day ${day}`);
  }
  return day === 0 ? 6 : ((day - 1) as DayT);
}

export function toMondayFirst(day: DayT): DayT {
  return day === 0 ? 6 : ((day - 1) as DayT);
}

export function fromMondayFirstUnsafe(day: number): DayT {
  if (day < 0 || day > 6) {
    throw new Error(`Invalid day ${day}`);
  }
  return day === 6 ? 0 : ((day + 1) as DayT);
}

export function fromMondayFirst(day: DayT): DayT {
  return day === 6 ? 0 : ((day + 1) as DayT);
}

export function getLocalizationLang(code?: string): LocalizationLanguages {
  if (code?.startsWith("fi")) {
    return "fi";
  }
  if (code?.startsWith("sv")) {
    return "sv";
  }
  if (code?.startsWith("en")) {
    return "en";
  }
  return "fi";
}

export const isBrowser = typeof window !== "undefined";

export function base64encode(str: string) {
  if (isBrowser) {
    return window.btoa(str);
    // TODO do we want unescape(encodeURIComponent(str)));?
  }
  return Buffer.from(str, "binary").toString("base64");
}

export async function hash(val: string): Promise<string> {
  if (!isBrowser) {
    throw new Error("hash is only available in the browser");
  }
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(val));
  const hexes = [],
    view = new DataView(h);
  for (let i = 0; i < view.byteLength; i += 4) hexes.push(`00000000${view.getUint32(i).toString(16)}`.slice(-8));
  return hexes.join("");
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
      return image.smallUrl;
    case "large":
      return image.largeUrl;
    case "medium":
      return image.mediumUrl;
    case "full":
      return image.imageUrl;
    default:
      return null;
  }
}

export function getMainImage(ru?: { images: Readonly<ImageFragment[]> }): ImageFragment | null {
  return ru?.images.find((img) => img.imageType === ImageType.Main) ?? null;
}

/// Returns if price is free
/// NOTE Only check highestPrice because lowestPrice < highestPrice
export function isPriceFree(pricing: Pick<PricingFieldsFragment, "highestPrice">): boolean {
  const price = toNumber(pricing.highestPrice);
  if (price == null || price === 0) {
    return true;
  }
  return false;
}

function pickMaybeDay(
  a: Date | undefined,
  b: Date | undefined,
  compF: (a: Date, b: Date) => boolean
): Date | undefined {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return compF(a, b) ? a : b;
}

// Returns a Date object with the first day of the given array of Dates
export function dayMin(days: Readonly<Array<Readonly<Date | undefined>>>): Date | undefined {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return pickMaybeDay(acc, day, isBefore);
  }, undefined);
}

export function dayMax(days: Array<Date | undefined>): Date | undefined {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return pickMaybeDay(acc, day, isAfter);
  }, undefined);
}

/// @description Convert time string "HH:MM" to minutes
/// safe for invalid time strings but not for invalid time values
/// removes trailing seconds if present
/// @return 0 if time is invalid otherwise the time in minutes
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  if (hours != null && minutes != null && isFinite(hours) && isFinite(minutes)) {
    return hours * 60 + minutes;
  }
  return 0;
}

export function formatMinutes(minutes: number, trailingMinutes = false): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const showMins = trailingMinutes || mins > 0;
  if (showMins) {
    return `${hours}:${mins < 10 ? `0${mins}` : mins}`;
  }
  return `${hours}`;
}

export function formatTimeRange(beginMins: number, endMins: number, trailingMinutes = false): string {
  return `${formatMinutes(beginMins, trailingMinutes)}–${formatMinutes(endMins, trailingMinutes)}`;
}

export function formatApiTimeInterval({
  beginTime,
  endTime,
  trailingMinutes = false,
}: {
  beginTime?: Maybe<string> | undefined;
  endTime?: Maybe<string> | undefined;
  trailingMinutes?: boolean;
}): string {
  if (!beginTime || !endTime) {
    return "";
  }
  // NOTE this uses extra cycles because of double conversions but it's safer than stripping from raw data
  const btime = formatMinutes(timeToMinutes(beginTime), trailingMinutes);
  const endTimeMins = timeToMinutes(endTime);
  const etime = formatMinutes(endTimeMins === 0 ? 24 * 60 : endTimeMins, trailingMinutes);
  return `${btime}–${etime}`;
}

export function formatDayTimes(schedule: Omit<SuitableTimeFragment, "pk" | "id" | "priority">[], day: number): string {
  return schedule
    .filter((s) => convertWeekday(s.dayOfTheWeek) === day)
    .map((s) => formatApiTimeInterval(s))
    .join(", ");
}

/// Primary use case is to clip out seconds from backend time strings
/// Assumed only to be used for backend time strings which are in format HH:MM or HH:MM:SS
/// NOTE does not handle incorrect time strings (ex. bar:foo)
/// NOTE does not have any boundary checks (ex. 25:99 is allowed)
export function convertTime(t: Maybe<string> | undefined): string {
  if (t == null || t === "") {
    return "";
  }
  // NOTE split has incorrect typing
  const [h, m, _]: Array<string | undefined> = t.split(":");
  return `${h ?? "00"}:${m ?? "00"}`;
}

export function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length === 0) {
    return 0;
  } else if (sorted.length % 2 === 0) {
    const a = sorted[middle - 1] ?? 0;
    const b = sorted[middle] ?? 0;
    return (a + b) / 2;
  }
  return sorted[middle] ?? 0;
}

export function constructUrl(basePath: string, page: string): string {
  const startSlash = page.startsWith("/");
  const endSlash = basePath.endsWith("/");
  const hasSlash = startSlash || endSlash;
  const separator = hasSlash ? "" : "/";
  return `${basePath}${separator}${page}`;
}

export function ignoreMaybeArray<T>(value: T | T[]): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function convertOptionToHDS(option: { label: string; value: string | number }): OptionInProps {
  return {
    label: option.label,
    value: option.value.toString(),
  };
}

/// @description Convert a list of strings to a comma separated string
export function formatListToCSV(t: TFunction, list: Readonly<Array<Readonly<string>>>): string {
  if (list.length === 0) {
    return "";
  }
  if (list.length === 1 && list[0]) {
    return list[0];
  }
  const lastItem = list[list.length - 1];
  return list.slice(0, list.length - 1).join(", ") + ` ${t("common:and")} ${lastItem}`;
}

/// @description Converts time struct to string
/// @param hour - hour in 24h format
/// @param minute - minute in 24h format
/// @return string in format HH:MM
export function formatTimeStruct({ hour, minute }: { hour: number; minute: number }): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}
