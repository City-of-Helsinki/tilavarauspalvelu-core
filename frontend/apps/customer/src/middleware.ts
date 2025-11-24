// Dynamic Code Evaluation
// This is because Vercel doesn't support NodeJs as a runtime environment
// and edge doesn't allow Dynamic Code Evaluation
// This app is not edge compatible, but it's impossible to disable the checks.
// Workaround as long as the function isn't needed is to split imports in such a way
// that libraries are not imported in the middleware.
import { NextResponse, type NextRequest } from "next/server";
import { isPageRequest, redirectCsrfToken } from "ui/src/middlewareHelpers";
import { createNodeId, getLocalizationLang } from "ui/src/modules/helpers";
import { buildGraphQLUrl, getSignInUrl, type LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { env } from "@/env.mjs";
import { ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";
import { getReservationInProgressPath } from "./modules/urls";

const API_BASE_URL = env.TILAVARAUS_API_URL ?? "";

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
function gqlQueryFetch(req: NextRequest, query: QqlQuery) {
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
    url: buildGraphQLUrl(API_BASE_URL),
    headers: newHeaders,
    // @ts-expect-error -- something broken in node types, body can be a string
    body,
  });
}

type User = {
  pk: number;
  hasAccess: boolean;
};
type Data = {
  reservation: {
    state: ReservationStateChoice | undefined | null;
    type: ReservationTypeChoice | undefined | null;
    resUnitPk: number | null;
  } | null;
  user: User;
};

const RESERVATION_QUERY = `
  reservation(id: $reservationId) {
    id
    type
    state
    reservationUnit {
      id
      pk
    }
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
async function fetchUserData(
  req: NextRequest,
  opts?: {
    applicationPk?: number | null;
    reservationPk?: number | null;
  }
): Promise<Data | null> {
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

  const applicationId = opts?.applicationPk != null ? createNodeId("ApplicationNode", opts.applicationPk) : null;
  const reservationId = opts?.reservationPk != null ? createNodeId("ReservationNode", opts.reservationPk) : null;

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
    console.warn(`Middleware: request failed: ${res.status} with message: ${text}`);
    // prefer throw here because we want all query failures -> end in same fail state
    throw new Error(res.statusText);
  }

  const data: unknown = await res.json();
  if (typeof data !== "object" || data == null || !("data" in data)) {
    // eslint-disable-next-line no-console
    console.warn("Middleware: no data in response");
    return null;
  }

  const user = parseUserGQLquery(data.data, reservationId, applicationId);
  if (user == null) {
    return null;
  }

  return {
    reservation: parseReservationGQLquery(data.data),
    user,
  };
}

/// return reservation data from the gql query or null if it's not found
function parseReservationGQLquery(data: unknown): Data["reservation"] | null {
  if (data != null && typeof data === "object" && "reservation" in data) {
    const { reservation } = data;

    if (reservation != null && typeof reservation === "object") {
      let type: ReservationTypeChoice | null = null;
      if ("type" in reservation && reservation.type != null && typeof reservation.type === "string") {
        type = reservation.type as ReservationTypeChoice;
      }

      let state: ReservationStateChoice | null = null;
      if ("state" in reservation && reservation.state != null && typeof reservation.state === "string") {
        state = reservation.state as ReservationStateChoice;
      }

      let resUnitPk: number | null = null;
      if (
        "reservationUnit" in reservation &&
        reservation.reservationUnit != null &&
        typeof reservation.reservationUnit === "object" &&
        "pk" in reservation.reservationUnit &&
        typeof reservation.reservationUnit.pk === "number"
      ) {
        resUnitPk = reservation.reservationUnit.pk;
      }
      return { state, type, resUnitPk };
    }
  }

  return null;
}

function parseUserGQLquery(data: unknown, reservationId: string | null, applicationId: string | null): User | null {
  let userPk = null;
  let hasAccess = reservationId == null && applicationId == null;
  if (typeof data !== "object" || data == null) {
    return null;
  }

  if ("currentUser" in data) {
    const { currentUser } = data;
    if (typeof currentUser === "object" && currentUser != null && "pk" in currentUser) {
      userPk = typeof currentUser.pk === "number" ? currentUser.pk : null;
    }
  }

  if ("reservation" in data) {
    const { reservation } = data;

    // Reservation doesn't exist or user has no access to it
    // have to handle like this otherwise we can't redirect out of the funnel if the reservation was deleted
    if (reservationId != null && reservation == null) {
      hasAccess = true;
    } else if (
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
async function maybeSaveUserLanguage(req: NextRequest, user: User | null): Promise<string | undefined> {
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
        mutation SaveUserLanguage($preferredLanguage: Language!) {
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
function getRedirectProtectedRoute(req: NextRequest, user: User | null): string | null {
  const { headers } = req;

  if (user == null) {
    // on the server we are behind a gateway so get the forwarded headers
    // localhost has no headers
    const currentUrl = req.url;
    const url = new URL(currentUrl);
    const protocol = headers.get("x-forwarded-proto") ?? "http";
    const host = headers.get("x-forwarded-host") ?? url.host;
    const origin = `${protocol}://${host}`;
    return getSignInUrl({
      apiBaseUrl: API_BASE_URL,
      callBackUrl: url.pathname,
      language: getLocalizationLang(getLocalizationFromUrl(url)),
      originOverride: origin,
      client: "customer",
    });
  }
  return null;
}

// Run the middleware only on paths that require authentication
// NOTE don't define nested routes, only single word top level routes are supported
// refactor the matcher or fix the underlining matcher issue in nextjs
// matcher syntax: /hard-path/:path* -> /hard-path/anything
// our syntax: hard-path
const RESERVATION_ROUTES = [
  "reservation", //:path*',
  "reservations", //:path*',
];
const APPLICATION_ROUTES = [
  "applications", //:path*',
  "application", //:path*',
];
const AUTHENTICATED_ROUTES = [...RESERVATION_ROUTES, ...APPLICATION_ROUTES, "success"];

// url matcher that is very specific to our case
function doesUrlMatch(url: string, route: string) {
  const ref: string[] = url.split("/");
  return ref.includes(route);
}

function getLangPrefix(url: URL): "" | "en" | "sv" {
  const capture = url.pathname.match(/^(\/en|\/sv)/);
  const first = capture?.[0] ?? "";
  if (first === "/en") {
    return "en";
  } else if (first === "/sv") {
    return "sv";
  }
  return "";
}

export async function middleware(req: NextRequest) {
  // don't make unnecessary requests to the backend for every asset
  if (!isPageRequest(new URL(req.url))) {
    return NextResponse.next();
  }

  const csrfRedirectUrl = redirectCsrfToken(req, API_BASE_URL);
  if (csrfRedirectUrl) {
    // block infinite redirect loop (there is no graceful way to handle this)
    if (req.url.includes("redirect_to")) {
      // eslint-disable-next-line no-console
      console.error("Middleware: Infinite redirect loop detected");
      return NextResponse.next();
    }
    return NextResponse.redirect(csrfRedirectUrl);
  }

  const url = new URL(req.url);
  let reservationPk: number | null = null;
  let applicationPk: number | null = null;

  if (RESERVATION_ROUTES.some((route) => doesUrlMatch(req.url, route))) {
    const id = url.pathname.match(/\/reservations?\/(\d+)/)?.[1];
    const pk = Number(id);
    if (pk > 0) {
      reservationPk = pk;
    } else if (id != null && id !== "") {
      // can be either an url issues (user error) or a bug in our matcher
      // fall through empty for listing page
      // eslint-disable-next-line no-console
      console.error("Middleware: Invalid reservation id");
    }
  }
  if (APPLICATION_ROUTES.some((route) => doesUrlMatch(req.url, route))) {
    const id = url.pathname.match(/\/applications?\/(\d+)/)?.[1];
    const pk = Number(id);
    if (pk > 0) {
      applicationPk = pk;
    } else if (id == null && id !== "") {
      // can be either an url issues (user error) or a bug in our matcher
      // fall through empty for listing page
      // eslint-disable-next-line no-console
      console.error("Middleware: Invalid application id");
    }
  }

  const options = {
    applicationPk,
    reservationPk,
  };

  const langPrefix = getLangPrefix(url);

  // Fallback all query errors to 503 page
  try {
    const data = await fetchUserData(req, options);

    const user = data?.user ?? null;
    if (user != null && !user.hasAccess) {
      return NextResponse.error();
    }

    // only check /reservations/:id/* path (not the funnel page)
    const reservationsPath = /^(\/\w+)?\/reservations\/\d+(\/?\w+)?/;
    // listing page has no reservation data
    const checkReservationPage = url.pathname.match(reservationsPath);
    if (data?.reservation != null && checkReservationPage) {
      // type can be null for regular users
      if (data.reservation.state == null) {
        return NextResponse.error();
      }

      if (data.reservation.state === ReservationStateChoice.Created) {
        const { resUnitPk } = data.reservation;
        const redirectUrl = new URL(`${langPrefix}${getReservationInProgressPath(resUnitPk, reservationPk)}`, req.url);
        return NextResponse.redirect(redirectUrl);
      }
      // Because we use url rewrite for Seasonal we have to allow both here (and do per page SSR checks instead)
      if (
        data.reservation.type != null &&
        data.reservation.type !== ReservationTypeChoice.Normal &&
        data.reservation.type !== ReservationTypeChoice.Seasonal
      ) {
        return NextResponse.error();
      }
    }

    if (AUTHENTICATED_ROUTES.some((route) => doesUrlMatch(req.url, route))) {
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
  } catch {
    // NOTE all backend errors will return the 503 page
    // if the middleware request fails there is no way to recover
    const redirectUrl = new URL(`${langPrefix}/503`, req.url);
    return NextResponse.rewrite(redirectUrl);
  }
}

export const config = {
  /* i18n locale router and middleware have a bug in nextjs, matcher breaks the router
  matcher: undefined
  */
  // TODO nodejs runtime doesn't work for some reason
  // runtime: "nodejs",
};
