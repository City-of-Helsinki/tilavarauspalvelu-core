import { isAfter, isBefore } from "date-fns";
import type { OptionInProps } from "hds-react";
import type { TFunction } from "i18next";
import sanitizeHtml from "sanitize-html";
import { minutesToHoursString, timeToMinutes } from "@ui/modules/date-utils";
import { ReservationUnitImageType } from "../../gql/gql-types";
import type { ImageFragment, Maybe, PricingFieldsFragment, SuitableTimeFragment } from "../../gql/gql-types";
import { pixel } from "./const";
import { convertWeekday } from "./conversion";
import type { LocalizationLanguages } from "./urlBuilder";

/// Enforce readonly on all nested properties
/// only single level deep i.e. {a: {b: {c: string}}} -> {readonly a: {b: {c: string}}}
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: ReadonlyDeep<T[P]>;
};

/**
 * Filters out null and undefined values from an array
 * @param arr - Array that may contain null or undefined values
 * @returns Array with all null and undefined values removed
 * @example
 * filterNonNullable([1, null, 2, undefined, 3]) // Returns: [1, 2, 3]
 */
export function filterNonNullable<T>(
  arr: Maybe<Readonly<Array<Maybe<T | undefined>>>> | undefined
): Array<NonNullable<T>> {
  return arr?.filter((n): n is NonNullable<T> => n != null) ?? [];
}

type SortFunc<T> = (a: T, b: T) => number;
/**
 * Creates a sorted copy of an array using a custom comparison function
 * Does not mutate the original array
 * @param arr - Array to sort
 * @param func - Comparison function for sorting
 * @returns New sorted array
 */
export function sort<T>(arr: Readonly<T[]>, func: SortFunc<T>): T[] {
  return [...arr].sort((a, b) => func(a, b));
}

/**
 * Capitalizes the first letter of a string
 * @param s - String to capitalize
 * @returns String with first letter capitalized
 * @example
 * capitalize("hello") // Returns: "Hello"
 */
export function capitalize<T extends string>(s: T): Capitalize<T> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
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

/// Safe string -> integer conversion
/// Always truncates the number to an integer
export function toInteger(filter: Maybe<string> | undefined): number | null {
  const val = toNumber(filter);
  if (val == null) {
    return null;
  }
  return Math.floor(val);
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

/**
 * Base64 encodes a string in both browser and Node.js environments
 * @param str - String to encode
 * @returns Base64 encoded string
 */
function base64encode(str: string) {
  if (isBrowser) {
    return window.btoa(str);
    // TODO do we want unescape(encodeURIComponent(str)));?
  }
  return Buffer.from(str, "binary").toString("base64");
}

export function createNodeId(type: string, pk: number): string {
  return base64encode(`${type}:${pk}`);
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
  return val.length > maxLen ? `${val.slice(0, maxLen - 1)}…` : val;
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

/**
 * Gets the image URL for a specific size without fallback to default pixel
 * @param image - Image fragment from GraphQL query
 * @param size - Desired image size
 * @returns Image URL or null if not available for the requested size
 */
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
  }
}

/**
 * Finds the main image from a reservation unit's image array
 * @param ru - Object containing images array
 * @returns The main image or null if not found
 */
export function getMainImage(ru?: { images: Readonly<ImageFragment[]> }): ImageFragment | null {
  return ru?.images.find((img) => img.imageType === ReservationUnitImageType.Main) ?? null;
}

/// Returns if price is free
/// NOTE Only check highestPrice because lowestPrice < highestPrice
export function isPriceFree(pricing: Pick<PricingFieldsFragment, "highestPrice">): boolean {
  const price = toNumber(pricing.highestPrice);
  return price == null || price === 0;
}

/**
 * Picks one of two potentially undefined dates based on a comparison function
 * @param a - First date or undefined
 * @param b - Second date or undefined
 * @param compF - Comparison function that returns true if first date should be picked
 * @returns The picked date or undefined if both are undefined
 */
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

/**
 * Finds the earliest date from an array of dates
 * @param days - Array of dates (may contain undefined values)
 * @returns The earliest date or undefined if array is empty or all values are undefined
 */
export function dayMin(days: Readonly<Array<Readonly<Date | undefined>>>): Date | undefined {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return pickMaybeDay(acc, day, isBefore);
  }, undefined);
}

/**
 * Finds the latest date from an array of dates
 * @param days - Array of dates (may contain undefined values)
 * @returns The latest date or undefined if array is empty or all values are undefined
 */
export function dayMax(days: Array<Date | undefined>): Date | undefined {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return pickMaybeDay(acc, day, isAfter);
  }, undefined);
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
  const btime = minutesToHoursString(timeToMinutes(beginTime), trailingMinutes);
  const endTimeMins = timeToMinutes(endTime);
  const etime = minutesToHoursString(endTimeMins === 0 ? 24 * 60 : endTimeMins, trailingMinutes);
  return `${btime}–${etime}`;
}

/**
 * Formats all time ranges for a specific day from a schedule
 * @param schedule - Array of suitable time fragments
 * @param day - Day number (0-6, where 0 is Sunday)
 * @returns Comma-separated list of time ranges for the day
 * @example
 * formatDayTimes(schedule, 1) // Returns: "10:00–12:00, 14:00–16:00"
 */
export function formatDayTimes(
  schedule: Array<Omit<SuitableTimeFragment, "pk" | "id" | "priority">>,
  day: number
): string {
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

/**
 * Calculates the median value from an array of numbers
 * @param numbers - Array of numbers
 * @returns The median value, or 0 if array is empty
 * @example
 * calculateMedian([1, 2, 3, 4, 5]) // Returns: 3
 * calculateMedian([1, 2, 3, 4]) // Returns: 2.5
 */
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

/**
 * Extracts the first element if value is an array, otherwise returns the value itself
 * @param value - Single value or array of values
 * @returns First element if array, the value itself otherwise, or null if array is empty
 */
export function ignoreMaybeArray<T>(value: T | T[]): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Converts an option object to Helsinki Design System (HDS) option format
 * @param option - Option with label and value
 * @returns HDS-compatible option object with stringified value
 */
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
  return list.slice(0, -1).join(", ") + ` ${t("common:and")} ${lastItem}`;
}

/// @description Converts time struct to string
/// @param hour - hour in 24h format
/// @param minute - minute in 24h format
/// @return string in format HH:MM
export function formatTimeStruct({ hour, minute }: { hour: number; minute: number }): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function mapParamToInteger(param: string[], min?: number): number[] {
  const numbers = param.map(Number).filter(Number.isInteger);
  return min != null ? numbers.filter((n) => n >= min) : numbers;
}

export function filterEmpty<S, T extends Array<S> | string>(val: T | null | undefined): T | null {
  if (val == null || val.length === 0) {
    return null;
  }
  return val;
}

export function filterEmptyArray<T>(param: T[]): T[] | undefined {
  return filterEmpty(param) ?? undefined;
}

type PossibleKeys = string;
type Lang = Capitalize<LocalizationLanguages>;
// extend an arbitrary record to always have all language variants for the "key" (user defined)
type RecordWithTranslation<K extends PossibleKeys, T extends string | null> = {
  // enforce {K}Fi | {K}En | {K}Sv to exist in the record
  [Property in `${K}${Lang}`]: T;
} &
  // allow any other keys we don't care about
  Record<string, unknown>;

function getTranslationFallback<K extends PossibleKeys, T extends string | null>(
  dict: RecordWithTranslation<K, T>,
  key: K
): string {
  const val = dict[`${key}Fi`];
  return cleanTranslatedValue(val, key);
}

/// helper for type narrowing translated fields from arbitrary records
function cleanTranslatedValue<K extends PossibleKeys, T extends string | null>(
  value:
    | RecordWithTranslation<K, T>[`${K}Fi`]
    | RecordWithTranslation<K, T>[`${K}Sv`]
    | RecordWithTranslation<K, T>[`${K}En`],
  key: PossibleKeys
): string {
  // type guard for return type (type enforcement checks that the Keys map to strings)
  if (typeof value === "string") {
    return value;
  }
  // oxlint-disable-next-line eqeqeq -- undefined never because of the type checker -> throw for it
  if (value === null) {
    return "";
  }
  // never
  throw new Error(`Object is missing translation for ${key}`);
}

/// Pick the correct translation from a GraphQL result type safely.
/// @param dict - GraphQL node (can be arbitrary record) will be type checked for key
/// @key - record key we want the localised version (without the localisation postfix e.g. Fi)
/// @param lang - language to use, use useTranslation hook in get the current language inside a component
/// GrpaphQL schema allows for nulls for translated fields -> treat them as empty strings.
/// Fallback to Finnish translations if localisation is empty (undefined / missing is an error).
export function getTranslation<K extends PossibleKeys, T extends string | null>(
  dict: RecordWithTranslation<K, T>,
  key: K,
  lang: LocalizationLanguages
): string {
  const localKey: `${K}${Lang}` = `${key}${capitalize(lang)}`;
  const value = cleanTranslatedValue(dict[localKey], key);
  return value || getTranslationFallback(dict, key);
}

/**
 * Strips all HTML tags from a string and decodes HTML entities
 * @param html - String containing HTML tags and entities
 * @returns Plain text with tags removed and entities decoded
 * @example
 * stripHtml("<p>Hello &amp; <strong>world</strong>!</p>")
 * // Returns: "Hello & world!"
 */
export function stripHtml(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: use regex-based approach
    return html
      .replaceAll(/<[^>]*>/g, "") // Remove HTML tags
      .replaceAll("&nbsp;", "\u00A0") // Decode non-breaking space
      .replaceAll("&amp;", "&") // Decode ampersand
      .replaceAll("&lt;", "<") // Decode less than
      .replaceAll("&gt;", ">") // Decode greater than
      .replaceAll("&quot;", '"') // Decode double quote
      .replaceAll("&#39;", "'") // Decode single quote
      .replaceAll("&apos;", "'") // Decode apostrophe
      .replaceAll(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec))) // Decode numeric entities
      .replaceAll(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16))) // Decode hex entities
      .trim();
  }

  // Client-side: use browser's built-in HTML parser
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() || "";
}

/**
 * Configuration for HTML sanitization
 * Specifies which HTML tags and attributes are allowed in sanitized content
 */
export const sanitizeConfig = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "div",
    "span",
    "ol",
    "ul",
    "li",
    "strong",
    "em",
    "u",
    "a",
    "pre",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    "*": ["style"],
  },
};

/**
 * Removes unwanted HTML tags from content while preserving allowed tags
 * Returns empty string for content that is empty or contains only empty tags
 * @param html - HTML string to clean
 * @returns Sanitized HTML string with only allowed tags, or empty string
 * @example
 * cleanHtmlContent("<script>alert('xss')</script><p>Safe content</p>")
 * // Returns: "<p>Safe content</p>"
 */
export function cleanHtmlContent(html: string): string {
  if (html === "") {
    return "";
  }
  if (sanitizeHtml(html, { allowedTags: [] }) === "") {
    return "";
  }
  return sanitizeHtml(html, sanitizeConfig);
}
