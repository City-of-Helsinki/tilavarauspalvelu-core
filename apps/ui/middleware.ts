// NOTE middleware can't import lodash or any other library that has
// Dynamic Code Evaluation
// This is because Vercel doesn't support NodeJs as a runtime environment
// and edge doesn't allow Dynamic Code Evaluation
// This app is not edge compatible, but it's impossible to disable the checks.
// Workaround as long as the function isn't needed is to split imports in such a way
// that libraries are not imported in the middleware.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { getSignInUrl, buildGraphQLUrl } from "common/src/urlBuilder";
import { base64encode, type LocalizationLanguages } from "common/src/helpers";

const apiBaseUrl = env.TILAVARAUS_API_URL ?? "";

type QqlQuery = {
  query: string;
  // TODO don't type to unknown (undefined and Date break JSON.stringify)
  variables: Record<string, unknown>;
};

/// Fetch a query from the backend
/// @param req - NextRequest used to copy headers etc.
/// @param query - Query object with query and variables
/// @returns Promise<Response>
/// custom function so we don't have to import apollo client in middleware
async function gqlQueryFetch(req: NextRequest, query: QqlQuery) {
  const { cookies, headers } = req;
  // TODO this is copy to the createApolloClient function but different header types
  // NextRequest vs. RequestInit
  const newHeaders = new Headers({
    ...headers,
    "Content-Type": "application/json",
  });

  const sessionid = cookies.get("sessionid");
  const csrfToken = cookies.get("csrftoken");

  if (csrfToken == null) {
    return new Response("missing csrf token", {
      status: 400,
      statusText: "Bad Request",
    });
  }

  newHeaders.append("X-Csrftoken", csrfToken.value);
  newHeaders.append("Cookie", `csrftoken=${csrfToken.value}`);
  // queries can be made both with and without sessionid
  if (sessionid != null) {
    newHeaders.append("Cookie", `sessionid=${sessionid.value}`);
  }

  const proto = headers.get("x-forwarded-proto") ?? "http";
  const hostname = headers.get("x-forwarded-host") ?? headers.get("host") ?? "";
  const requestUrl = new URL(req.url).pathname;
  const referer = `${proto}://${hostname}${requestUrl}`;
  newHeaders.append("Referer", referer);
  // Use of fetch requires a string body (vs. gql query object)
  // the request returns either a valid user (e.g. pk) or null if user was not found
  const body: string = JSON.stringify(query);

  return fetch({
    method: "POST",
    url: buildGraphQLUrl(apiBaseUrl, env.ENABLE_FETCH_HACK),
    headers: newHeaders,
    // @ts-expect-error -- something broken in node types, body can be a string
    body,
  });
}

type User = {
  pk: number;
  hasAccess: boolean;
};

const RESERVATION_QUERY = `
  reservation(id: $reservationId) {
    id
    user {
      id
      pk
    }
  }`;

const APPLICATION_QUERY = `
  application(id: $applicationId) {
    id
    user {
      id
      pk
    }
  }`;

/// Get the current user from the backend
/// @param req - NextRequest
/// @param opts - optional parameters for fetching additional data
/// @returns Promise<number | null> - user id or null if not logged in
async function getCurrentUser(
  req: NextRequest,
  opts?: {
    applicationPk?: number | null;
    reservationPk?: number | null;
  }
): Promise<User | null> {
  const { cookies } = req;
  const hasSession = cookies.has("sessionid");
  if (!hasSession) {
    return null;
  }

  const sessionid = cookies.get("sessionid");
  const csrfToken = cookies.get("csrftoken");

  if (csrfToken == null || sessionid == null) {
    return null;
  }

  const applicationId =
    opts?.applicationPk != null
      ? base64encode(`ApplicationNode:${opts.applicationPk}`)
      : null;
  const reservationId =
    opts?.reservationPk != null
      ? base64encode(`ReservationNode:${opts.reservationPk}`)
      : null;

  // NOTE: need to build queries dynamically because of the optional parameters
  const params =
    reservationId != null || applicationId != null
      ? `(
${reservationId ? "$reservationId: ID!" : ""}
${applicationId ? "$applicationId: ID!" : ""}
)`
      : "";

  const query: QqlQuery = {
    query: `
      query GetCurrentUser ${params} {
        currentUser {
          pk
        }
        ${reservationId ? RESERVATION_QUERY : ""}
        ${applicationId ? APPLICATION_QUERY : ""}
      }`,
    variables: {
      ...(reservationId != null ? { reservationId } : {}),
      ...(applicationId != null ? { applicationId } : {}),
    },
  };
  const res = await gqlQueryFetch(req, query);

  if (!res.ok) {
    const text = await res.text();
    // eslint-disable-next-line no-console
    console.warn(`request failed: ${res.status} with message: ${text}`);
    return null;
  }

  const data: unknown = await res.json();
  if (typeof data !== "object" || data == null || !("data" in data)) {
    // eslint-disable-next-line no-console
    console.warn("no data in response");
    return null;
  }

  return parseUserGQLquery(data.data, reservationId, applicationId);
}

function parseUserGQLquery(
  data: unknown,
  reservationId: string | null,
  applicationId: string | null
): User | null {
  let userPk = null;
  let hasAccess = reservationId == null && applicationId == null;
  if (typeof data !== "object" || data == null) {
    return null;
  }

  if ("currentUser" in data) {
    const { currentUser } = data;
    if (
      typeof currentUser === "object" &&
      currentUser != null &&
      "pk" in currentUser
    ) {
      userPk = typeof currentUser.pk === "number" ? currentUser.pk : null;
    }
  }

  if ("reservation" in data) {
    const { reservation } = data;
    if (
      reservation != null &&
      typeof reservation === "object" &&
      "user" in reservation &&
      reservation.user != null &&
      typeof reservation.user === "object" &&
      "pk" in reservation.user
    ) {
      const { pk } = reservation.user;
      if (pk != null && typeof pk === "number") {
        hasAccess = pk === userPk;
      }
    }
  }

  if ("application" in data) {
    const { application } = data;
    if (
      application != null &&
      typeof application === "object" &&
      "user" in application &&
      application.user != null &&
      typeof application.user === "object" &&
      "pk" in application.user
    ) {
      const { pk } = application.user;
      if (pk != null && typeof pk === "number") {
        hasAccess = pk === userPk;
      }
    }
  }

  if (userPk != null) {
    return { pk: userPk, hasAccess };
  }
  return null;
}

/// Get language code from the url
function getLocalizationFromUrl(url: URL): LocalizationLanguages {
  // frontpage has no trailing slash
  if (url.pathname.startsWith("/en/") || url.pathname === "/en") {
    return "en";
  }
  if (url.pathname.startsWith("/sv/") || url.pathname === "/sv") {
    return "sv";
  }
  return "fi";
}

/// Save user language to the backend if it has changed
/// @param req - NextRequest
/// @param user - user id or null if not logged in
/// @returns Promise<string | undefined> - the new language or undefined if it hasn't changed
/// uses the following cookies: sessionid, csrftoken, (language)
/// only saves the language if the user is logged in
/// NOTE The responsibility to update the cookie is on the caller (who creates the next request).
async function maybeSaveUserLanguage(
  req: NextRequest,
  user: User | null
): Promise<string | undefined> {
  const { cookies } = req;
  const url = new URL(req.url);
  if (user == null) {
    return;
  }
  if (isPageRequest(url)) {
    const sessionid = cookies.get("sessionid");
    if (sessionid == null) {
      return;
    }
    const cookieLang = cookies.get("language");
    const language = getLocalizationFromUrl(url);
    if (cookieLang?.value === language) {
      return;
    }

    const query: QqlQuery = {
      query: `
        mutation SaveUserLanguage($preferredLanguage: PreferredLanguage!) {
          updateCurrentUser(
            input:{
              preferredLanguage: $preferredLanguage
            }
          ) {
             pk
          }
        }`,
      variables: {
        preferredLanguage: language.toUpperCase(),
      },
    };

    const res = await gqlQueryFetch(req, query);
    if (res.ok) {
      return language;
    }
    // eslint-disable-next-line no-console
    console.warn("failed to save user language", res.status, await res.text());
  }
}

/// Check if the user is logged in and redirect to the sign in page if not
/// @param req - NextRequest
/// @param user - user id or null if not logged in
/// @returns Promise<string | undefined> - the redirect url or null if no redirect is needed
function getRedirectProtectedRoute(
  req: NextRequest,
  user: User | null
): string | null {
  const { headers } = req;

  if (user == null) {
    // on the server we are behind a gateway so get the forwarded headers
    // localhost has no headers
    const currentUrl = req.url;
    const url = new URL(currentUrl);
    const protocol = headers.get("x-forwarded-proto") ?? "http";
    const host = headers.get("x-forwarded-host") ?? url.host;
    const origin = `${protocol}://${host}`;
    return getSignInUrl(apiBaseUrl, url.pathname, origin);
  }
  return null;
}

/// Check if the request is a page request
/// @param url - URL
/// @returns boolean
function isPageRequest(url: URL): boolean {
  if (
    // ignore healthcheck because it's for automated test suite that can't do redirects
    url.pathname.startsWith("/healthcheck") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.match(
      /\.(webmanifest|js|css|png|jpg|jpeg|svg|gif|ico|json|woff|woff2|ttf|eot|otf|pdf)$/
    )
  ) {
    return false;
  }
  return true;
}

/// are we missing a csrf token in cookies
/// if so get the backend url to redirect to and add the current url as a redirect_to parameter
function redirectCsrfToken(req: NextRequest): URL | undefined {
  const { cookies } = req;
  const hasCsrfToken = cookies.has("csrftoken");
  if (hasCsrfToken) {
    return undefined;
  }

  // need to ignore all assets outside of html requests (which don't have an extension)
  // so could we just check any request that doesn't have an extension?
  const requestUrl = new URL(req.url);
  if (!isPageRequest(requestUrl)) {
    return undefined;
  }

  const csrfUrl = `${apiBaseUrl}/csrf/`;
  const redirectUrl = new URL(csrfUrl);

  // On server envs everything is in the same domain and 80/443 ports, so ignore the host part of the url.
  // More robust solution (supporting separate domains) would need to take into account us being behind
  // a gateway so the public url doesn't match the internal url.
  const origin = requestUrl.origin;
  const hostPart = origin.includes("localhost") ? origin : "";
  const next = `${hostPart}${requestUrl.pathname}`;
  redirectUrl.searchParams.set("redirect_to", next);

  return redirectUrl;
}

// Run the middleware only on paths that require authentication
// NOTE don't define nested routes, only single word top level routes are supported
// refactor the matcher or fix the underlining matcher issue in nextjs
// matcher syntax: /hard-path/:path* -> /hard-path/anything
// our syntax: hard-path
const reservationRoutes = [
  "reservation", //:path*',
  "reservations", //:path*',
];
const applicationRoutes = [
  "applications", //:path*',
  "application", //:path*',
];
const authenticatedRoutes = [
  // just in case if the route falls through
  ...reservationRoutes,
  ...applicationRoutes,
  "success",
];
// url matcher that is very specific to our case
function doesUrlMatch(url: string, route: string) {
  const ref: string[] = url.split("/");
  return ref.includes(route);
}

export async function middleware(req: NextRequest) {
  const redirectUrl = redirectCsrfToken(req);
  if (redirectUrl) {
    // block infinite redirect loop (there is no graceful way to handle this)
    if (req.url.includes("redirect_to")) {
      // eslint-disable-next-line no-console
      console.error("Infinite redirect loop detected");
      return NextResponse.next();
    }
    return NextResponse.redirect(redirectUrl);
  }

  // don't make unnecessary requests to the backend for every asset
  if (!isPageRequest(new URL(req.url))) {
    return NextResponse.next();
  }

  const url = new URL(req.url);
  let reservationPk: number | null = null;
  let applicationPk: number | null = null;

  if (reservationRoutes.some((route) => doesUrlMatch(req.url, route))) {
    const id = url.pathname.match(/\/reservations?\/(\d+)/)?.[1];
    const pk = Number(id);
    // can be either an url issues (user error) or a bug in our matcher
    if (pk > 0) {
      reservationPk = pk;
    } else {
      // eslint-disable-next-line no-console
      console.error("Invalid reservation id");
    }
  }
  if (applicationRoutes.some((route) => doesUrlMatch(req.url, route))) {
    const id = url.pathname.match(/\/applications?\/(\d+)/)?.[1];
    const pk = Number(id);
    // can be either an url issues (user error) or a bug in our matcher
    if (pk > 0) {
      applicationPk = pk;
    } else {
      // eslint-disable-next-line no-console
      console.error("Invalid application id");
    }
  }

  const options = {
    applicationPk,
    reservationPk,
  };

  const user = await getCurrentUser(req, options);
  if (user != null && !user.hasAccess) {
    return NextResponse.error();
  }

  if (authenticatedRoutes.some((route) => doesUrlMatch(req.url, route))) {
    const redirect = getRedirectProtectedRoute(req, user);
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, req.url));
    }
  }

  const lang = await maybeSaveUserLanguage(req, user);

  if (lang != null) {
    const n = NextResponse.next();
    n.cookies.set("language", lang);
    return n;
  }
  return NextResponse.next();
}

export const config = {
  /* i18n locale router and middleware have a bug in nextjs, matcher breaks the router
  matcher: undefined
  */
};
