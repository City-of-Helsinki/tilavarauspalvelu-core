import { getCookie } from "typescript-cookie";
import { z } from "zod";
import { isBrowser } from "./helpers";
import { getSignOutUrl, getSignInUrl, type LocalizationLanguages, type UserTypeChoice } from "./urlBuilder";

// TODO add wrapper a that blocks importing on nodejs

/// NOTE have to cleanup because HDS components might be passing event here
function cleanupUrlParam(url: unknown): string | undefined {
  if (typeof url === "string" && url.length > 0) {
    return z.string().url().parse(url);
  }
  return undefined;
}

// Redirect the user to the sign in dialog and return to returnUrl (or
// current url if none is provided) after sign in
/// Throws if called on the server
export function signIn({
  apiBaseUrl,
  language,
  client,
  returnUrl,
}: {
  apiBaseUrl: string;
  language: LocalizationLanguages;
  client: UserTypeChoice;
  returnUrl?: unknown;
}) {
  if (!isBrowser) {
    throw new Error("signIn can only be called in the browser");
  }
  const returnUrlParam = cleanupUrlParam(returnUrl);
  // encode otherwise backend will drop the query params
  const returnTo = returnUrlParam ?? window.location.href;
  window.location.href = getSignInUrl({
    apiBaseUrl,
    language,
    callBackUrl: returnTo,
    client,
  });
}

function removeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const isTouchDevice = (): boolean => isBrowser && window?.matchMedia("(any-hover: none)").matches;

/// Sign the user out and redirect to route /auth/logout/ after the session is destroyed
/// Throws if called on the server
/// @param apiBaseUrl - base url for api
/// @param appUrlBasePath - base path for the app (only required if next app is not in host root)
export function signOut(apiBaseUrl: string, appUrlBasePath = "") {
  if (!isBrowser) {
    throw new Error("signIn can only be called in the browser");
  }
  const url = new URL(window.location.href);
  const logoutUrl = getSignOutUrl(apiBaseUrl);
  const csrfToken = getCookie("csrftoken");
  const logoutPath = "/auth/logout/";
  const origin = url.origin;
  const returnUrlBase = `${removeTrailingSlash(origin)}${removeTrailingSlash(appUrlBasePath)}`;
  const returnUrl = `${returnUrlBase}${logoutPath}`;
  if (!csrfToken) {
    throw new Error("csrf token not found");
  }

  // NOTE dynamically create a form and submit it so this function can be used anywhere
  // can't use fetch because the logout goes through redirects after Django logout
  const form = document.createElement("form");
  form.method = "POST";
  form.action = logoutUrl;
  form.style.display = "none";
  addFormParam(form, "csrfmiddlewaretoken", csrfToken);
  addFormParam(form, "redirect_to", returnUrl);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

function addFormParam(form: HTMLFormElement, name: string, value: string): void {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}

// should not be called on SSR => fallback to disable poll
export function disablePollIfHidden(pollInterval: number): number {
  if (isWindowVisible()) {
    return 0;
  }
  return pollInterval;
}

export function isWindowVisible(): boolean {
  return isBrowser && document.visibilityState === "visible";
}
