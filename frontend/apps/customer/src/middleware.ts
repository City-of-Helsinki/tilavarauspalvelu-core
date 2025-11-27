// Dynamic Code Evaluation
// This is because Vercel doesn't support NodeJs as a runtime environment
// and edge doesn't allow Dynamic Code Evaluation
// This app is not edge compatible, but it's impossible to disable the checks.
// Workaround as long as the function isn't needed is to split imports in such a way
// that libraries are not imported in the middleware.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import z from "zod";
import { gqlQueryFetch, isPageRequest, redirectCsrfToken } from "ui/src/middlewareHelpers";
import type { GqlQuery } from "ui/src/middlewareHelpers";
import { createNodeId, getLocalizationLang } from "ui/src/modules/helpers";
import { getSignInUrl } from "ui/src/modules/urlBuilder";
import type { LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { logError } from "@ui/modules/errors";
import { env } from "@/env.mjs";
import { ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";
import { getReservationInProgressPath } from "./modules/urls";

const API_BASE_URL = env.TILAVARAUS_API_URL ?? "";

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

const CurrentUserSchema = z.object({
  pk: z.number(),
});
const ReservationSchema = z.object({
  type: z.enum(ReservationTypeChoice),
  state: z.enum(ReservationStateChoice),
  user: CurrentUserSchema,
  reservationUnit: z.object({
    pk: z.number(),
  }),
});
const ApplicationSchema = z.object({
  id: z.string(),
  user: CurrentUserSchema,
});
const QueryResultSchema = z.object({
  currentUser: CurrentUserSchema.nullable(),
  reservation: ReservationSchema.nullish(),
  application: ApplicationSchema.nullish(),
});
const MiddlewareQuerySchema = z.object({
  data: QueryResultSchema,
});

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

  const sessionid = cookies.get("sessionid");

  if (sessionid == null) {
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

  const query: GqlQuery = {
    query: `
      query MiddlewareQuery ${params} {
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
  const data = await gqlQueryFetch(req, query, API_BASE_URL);

  const parsed = MiddlewareQuerySchema.parse(data);
  const res = parsed.data;
  if (res.currentUser == null) {
    return null;
  }

  const userPkToCheck = res.reservation?.user.pk || res.application?.user.pk;
  return {
    reservation: {
      state: res.reservation?.state,
      type: res.reservation?.type,
      resUnitPk: res.reservation?.reservationUnit.pk ?? null,
    },
    user: {
      pk: res.currentUser.pk,
      hasAccess: userPkToCheck == null || res.currentUser.pk === userPkToCheck,
    },
  };
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

    const query: GqlQuery = {
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

    await gqlQueryFetch(req, query, API_BASE_URL);
    return language;
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
      logError("Middleware: Infinite redirect loop detected");
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
      logError(`Middleware: Invalid reservation id: ${id}`);
    }
  }
  if (APPLICATION_ROUTES.some((route) => doesUrlMatch(req.url, route))) {
    const id = url.pathname.match(/\/applications?\/(\d+)/)?.[1];
    const pk = Number(id);
    if (pk > 0) {
      applicationPk = pk;
    } else if (id == null && id !== "") {
      logError(`Middleware: Invalid application id: ${id}`);
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

    // App is fully functional even if this fails
    try {
      const lang = await maybeSaveUserLanguage(req, user);

      if (lang != null) {
        const n = NextResponse.next();
        n.cookies.set("language", lang);
        return n;
      }
    } catch (err) {
      logError(err);
    }
    return NextResponse.next();
  } catch (err) {
    logError(err);
    // NOTE all backend errors will return the 503 page
    // if the middleware request fails there is no way to recover
    const rewriteUrl = new URL(`${langPrefix}/503`, req.url);
    return NextResponse.rewrite(rewriteUrl);
  }
}

export const config = {
  /* i18n locale router and middleware have a bug in nextjs, matcher breaks the router
  matcher: undefined
  */
  // undici has some weird behaviour with URLs so nodejs runtime doesn't work
  // runtime: "nodejs",
};
