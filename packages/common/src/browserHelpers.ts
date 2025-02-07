import { z } from "zod";
import { isBrowser } from "./helpers";
import { getSignOutUrl, getSignInUrl } from "./urlBuilder";
import { getCookie } from "typescript-cookie";

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
/// Thows if called on the server
export function signIn(apiBaseUrl: string, returnUrl?: unknown) {
  if (!isBrowser) {
    throw new Error("signIn can only be called in the browser");
  }
  const returnUrlParam = cleanupUrlParam(returnUrl);
  const returnTo = returnUrlParam ?? window.location.href;
  const url = getSignInUrl(apiBaseUrl, returnTo);
  window.location.href = url;
}

function removeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/// Sign the user out and redirect to route /auth/logout/ after the session is destroyed
/// Thows if called on the server
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

function addFormParam(form: HTMLFormElement, name: string, value: string) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}
