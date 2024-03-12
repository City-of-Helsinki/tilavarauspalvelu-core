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

// Log the user out and redirect to route /logout
/// Thows if called on the server
export function signOut(apiBaseUrl: string) {
  if (!isBrowser) {
    throw new Error("signIn can only be called in the browser");
  }
  const logoutUrl = getSignOutUrl(apiBaseUrl);
  const csrfToken = getCookie("csrftoken");
  if (!csrfToken) {
    throw new Error("csrf token not found");
  }

  // NOTE dynamically create a form and submit it so this function can be used anywhere
  // can't use fetch because the logout goes through redirects after Django logout
  const form = document.createElement("form");
  form.method = "POST";
  form.action = logoutUrl;
  form.style.display = "none";
  const csrfTokenInput = document.createElement("input");
  csrfTokenInput.type = "hidden";
  csrfTokenInput.name = "csrfmiddlewaretoken";
  csrfTokenInput.value = csrfToken;
  form.appendChild(csrfTokenInput);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
