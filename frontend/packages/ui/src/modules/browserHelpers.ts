import { getCookie } from "typescript-cookie";
import { z } from "zod";
import { isBrowser } from "./helpers";
import { getSignOutUrl, getSignInUrl } from "./urlBuilder";
import type { LocalizationLanguages, UserTypeChoice } from "./urlBuilder";

// TODO add wrapper a that blocks importing on nodejs

/**
 * Validates and cleans a URL parameter
 * Note: HDS components might pass event objects here, so we need to validate the type
 * @param url - URL string to validate (or any other value to handle HDS components)
 * @returns Validated URL string or undefined if invalid
 */
function cleanupUrlParam(url: unknown): string | undefined {
  if (typeof url === "string" && url.length > 0) {
    return z.string().url().parse(url);
  }
  return undefined;
}

/**
 * Redirects the user to the sign-in dialog
 * After sign-in, user is redirected to returnUrl or current page if not provided
 * @param apiBaseUrl - Base URL for the API
 * @param language - UI language for the sign-in page
 * @param client - User type (customer or admin)
 * @param returnUrl - Optional URL to return to after sign-in
 * @throws Error if called on the server (must be browser-only)
 */
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

/**
 * Removes trailing slash from a URL string if present
 * @param url - URL string to process
 * @returns URL string without trailing slash
 */
function removeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Detects if the current device is a touch device
 * Uses media query to check if device supports touch-only input
 * @returns True if touch device, false otherwise (or false on server)
 */
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

/**
 * Adds a hidden input field to a form element
 * @param form - HTML form element to add the input to
 * @param name - Name attribute for the input field
 * @param value - Value for the input field
 */
function addFormParam(form: HTMLFormElement, name: string, value: string): void {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}

/**
 * Disables polling by returning 0 if window is hidden, otherwise returns the original interval
 * Used to prevent unnecessary API calls when user is not viewing the page
 * Should not be called on SSR - falls back to disabling poll
 * @param pollInterval - Original polling interval in milliseconds
 * @returns 0 if window is hidden, otherwise the original pollInterval
 */
export function disablePollIfHidden(pollInterval: number): number {
  if (isWindowVisible()) {
    return 0;
  }
  return pollInterval;
}

/**
 * Checks if the browser window/tab is currently visible to the user
 * @returns True if window is visible, false otherwise (or false on server)
 */
export function isWindowVisible(): boolean {
  return isBrowser && document.visibilityState === "visible";
}
