import { camelCase } from "lodash";
import type {
  Maybe,
  ReservationMetadataFieldNode,
  ReservationUnitImageNode,
} from "../types/gql-types";
import { pixel } from "./common/style";

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
/// backend field names are in snake_case so we convert them to camelCase
/// TODO should be enums or string literals instead of arbitary strings
export function containsField(
  formFields: ReservationMetadataFieldNode[],
  fieldName: string
): boolean {
  if (!formFields || formFields?.length === 0 || !fieldName) {
    return false;
  }
  const found = formFields
    .map((x) => x.fieldName)
    .map(camelCase)
    .find((x) => x === fieldName);
  if (found != null) {
    return true;
  }
  return false;
}

/// backend fields are in snake_case, containsField handles the conversion
export function containsNameField(
  formFields: ReservationMetadataFieldNode[]
): boolean {
  return (
    containsField(formFields, "reserveeFirstName") ||
    containsField(formFields, "reserveeLastName")
  );
}

export function containsBillingField(
  formFields: ReservationMetadataFieldNode[]
): boolean {
  const formFieldsNames = formFields.map((x) => x.fieldName).map(camelCase);
  return formFieldsNames.some((x) => x.startsWith("billing"));
}

/// Always return an image because the Design and process should not allow imageless reservation units
/// On production returns the cached medium image url
/// On development we don't have image cache so we return the full image url
/// If image is null or undefined returns a static pixel
export function getImageSource(
  image: ReservationUnitImageNode | null,
  size: "small" | "large" | "medium" | "full" = "medium"
): string {
  if (!image) {
    return pixel;
  }
  return getImageSourceWithoutDefault(image, size) || image?.imageUrl || pixel;
}

function getImageSourceWithoutDefault(
  image: ReservationUnitImageNode,
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
