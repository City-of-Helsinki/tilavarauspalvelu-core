import { isBrowser } from "./const";
import { ReadonlyURLSearchParams } from "next/navigation";
import { type Maybe, ApplicationStatusChoice } from "@gql/gql-types";

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
