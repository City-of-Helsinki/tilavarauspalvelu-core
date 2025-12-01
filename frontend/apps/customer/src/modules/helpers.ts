import { ReadonlyURLSearchParams } from "next/navigation";
import { ApplicationStatusChoice } from "@gql/gql-types";
import type { Maybe } from "@gql/gql-types";
import { isBrowser } from "./const";

/**
 * Generates a URL for redirecting after login, preserving current path and adding parameters
 * @param params - Optional URL search parameters to append to the current URL
 * @returns URL string with isPostLogin parameter set, or undefined if called on server
 */
export function getPostLoginUrl(params: Readonly<URLSearchParams> = new ReadonlyURLSearchParams()): string | undefined {
  if (!isBrowser) {
    return undefined;
  }
  const { origin, pathname, searchParams } = new URL(window.location.href);
  const p = new URLSearchParams(searchParams);
  for (const [key, value] of params) {
    p.append(key, value);
  }
  p.set("isPostLogin", "true");
  return `${origin}${pathname}?${p.toString()}`;
}

/**
 * Checks if an application has been sent (submitted) based on its status
 * @param status - Application status choice
 * @returns True if application status indicates it has been sent (Received, ResultsSent, Handled, or InAllocation), false otherwise
 */
export function isSent(status: Maybe<ApplicationStatusChoice> | undefined): boolean {
  if (status == null) {
    return false;
  }
  switch (status) {
    case ApplicationStatusChoice.Draft:
    case ApplicationStatusChoice.Expired:
    case ApplicationStatusChoice.Cancelled:
      return false;
    case ApplicationStatusChoice.Received:
    case ApplicationStatusChoice.ResultsSent:
    case ApplicationStatusChoice.Handled:
    case ApplicationStatusChoice.InAllocation:
      return true;
  }
}
