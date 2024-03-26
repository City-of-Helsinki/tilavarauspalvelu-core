import type { Maybe, ReservationMetadataFieldNode } from "../types/gql-types";

export function filterNonNullable<T>(
  arr: Maybe<Maybe<T>[]> | undefined
): NonNullable<T>[] {
  return arr?.filter((n): n is NonNullable<T> => n != null) ?? [];
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

/// Transitional helper when moving from string fields
/// TODO should be enums or string literals instead of arbitary strings
/// TODO are the backend fields in camelCase or snake_case?
export function containsField(
  formFields: ReservationMetadataFieldNode[],
  fieldName: string
): boolean {
  if (!formFields || formFields?.length === 0 || !fieldName) {
    return false;
  }
  if (formFields.find((x) => x.fieldName === fieldName)) {
    return true;
  }
  return false;
}

/// TODO are the backend fields in camelCase or snake_case?
export function containsNameField(
  formFields: ReservationMetadataFieldNode[]
): boolean {
  return (
    containsField(formFields, "reserveeFirstName") ||
    containsField(formFields, "reserveeLastName")
  );
}
