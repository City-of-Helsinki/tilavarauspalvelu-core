import type { NextRequest } from "next/server";
import { SERVER_FETCH_TIMEOUT_MS } from "./modules/const";
import { GraphQLFetchError } from "./modules/errors";
import { fetchWithTimeout } from "./modules/fetch";
import { buildGraphQLUrl, getBrowserApiBaseUrl, getClientOrigin } from "./modules/urlBuilder";

// The regexes below work on a path with or without a query string and with or without a base path.
// Only the part before the query string can match.
const FILE_EXTENSIONS = "webmanifest|js|css|png|jpe?g|svg|gif|ico|json|woff2?|ttf|eot|otf|pdf|txt";

/// Matches the paths of requests that are not pages: Next.js files, API routes, the Sentry tunnel and public files.
/// The proxy skips these requests. The Sentry server configs drop the proxy transactions for them.
/// The Sentry tunnel is the tunnelRoute in next.config.ts. The SDK does not drop it when the app has a base path.
/// /_next/, /api/ and /monitoring match only at the root or after the base path, which is one segment, such as /kasittely.
/// Deeper paths do not match, because catch-all pages accept them, such as /reservation-unit/1/reservation/2/api/x.
export const NON_PAGE_PATH = new RegExp(
  `^(/[^/?]+)?(/(_next|api)/|/monitoring/?(\\?|$))|^[^?]*\\.(${FILE_EXTENSIONS})(\\?|$)`
);

/// Matches the paths of public files, such as /favicon.svg. Paths under /_next/ do not match.
/// The Sentry server configs drop the transactions for these files.
/// NOTE Do not include /_next/ here. Requests to /_next/data/ run getServerSideProps on client navigation.
export const PUBLIC_FILE_PATH = new RegExp(`^(?![^?]*/_next/)[^?]*\\.(${FILE_EXTENSIONS})(\\?|$)`);

/// Check if the request is a page request
/// @param url - URL
export function isPageRequest(url: URL, basePath = ""): boolean {
  if (
    // ignore healthcheck because it's for automated test suite that can't do redirects
    url.pathname.startsWith(`${basePath}/healthcheck`) ||
    NON_PAGE_PATH.test(url.pathname) ||
    url.pathname.startsWith(`${basePath}/503`) ||
    url.pathname.startsWith(`${basePath}/en/503`) ||
    url.pathname.startsWith(`${basePath}/sv/503`)
  ) {
    return false;
  }
  return true;
}

/// Returns the request url with the origin that the client used.
/// Use it for urls that go back to the browser, for example redirects.
/// req.url has the address that the server listens on, for example "http://0.0.0.0:3000" in a container.
/// Internal rewrites can use req.url.
/// @param req - NextRequest
export function getClientUrl(req: NextRequest): URL {
  const url = new URL(req.url);
  const origin = getClientOrigin(req.headers, url.protocol.replace(/:$/, ""));
  if (origin == null) {
    return url;
  }
  return new URL(`${url.pathname}${url.search}`, origin);
}

/// check if csrftoken is missing and construct redirect url for it
/// if we should redirect then construct the backend url with (original) req url as the return address
/// The backend is at getBrowserApiBaseUrl. When it is empty, the backend is on the same origin as the client.
/// @param req The request processed in the middleware
/// @return redirect url or undefined if we should not redirect
export function redirectCsrfToken(req: NextRequest): URL | undefined {
  const { cookies } = req;
  const hasCsrfToken = cookies.has("csrftoken");
  if (hasCsrfToken) {
    return undefined;
  }

  const requestUrl = getClientUrl(req);
  const apiBaseUrl = getBrowserApiBaseUrl();
  const redirectUrl = new URL(`${apiBaseUrl}/csrf/`, requestUrl.origin);

  // On the same origin, a path is enough. A backend on another origin needs the full url to redirect back.
  // Keep the query string. Pages like /search store their filters in it.
  const path = `${requestUrl.pathname}${requestUrl.search}`;
  const next = apiBaseUrl === "" ? path : `${requestUrl.origin}${path}`;
  redirectUrl.searchParams.set("redirect_to", next);

  return redirectUrl;
}

export type GqlQuery = {
  query: string;
  variables?: Record<string, unknown>;
};

/// Fetch a query from the backend
/// @param req - NextRequest used to read cookies and the referer
/// @param query - Query object with query and variables
/// @returns Promise<Response>
/// custom function so we don't have to import apollo client in middleware
export async function gqlQueryFetch(req: NextRequest, query: GqlQuery, apiUrl: string): Promise<unknown> {
  const { cookies, headers } = req;
  const newHeaders = new Headers({
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

  const clientUrl = getClientUrl(req);
  newHeaders.append("Referer", `${clientUrl.origin}${clientUrl.pathname}`);
  // Forward the browser values, so backend logs and traces don't show the Node.js fetch defaults
  const userAgent = headers.get("user-agent");
  if (userAgent != null) {
    newHeaders.set("User-Agent", userAgent);
  }
  const acceptLanguage = headers.get("accept-language");
  if (acceptLanguage != null) {
    newHeaders.set("Accept-Language", acceptLanguage);
  }
  // Use of fetch requires a string body (vs. gql query object)
  // the request returns either a valid user (e.g. pk) or null if user was not found
  const body: string = JSON.stringify(query);

  const res = await fetchWithTimeout(
    buildGraphQLUrl(apiUrl),
    {
      method: "POST",
      headers: newHeaders,
      body,
    },
    SERVER_FETCH_TIMEOUT_MS
  );

  const data: unknown = await res.json();

  if (!res.ok) {
    const { status, statusText } = res;
    throw new GraphQLFetchError(status, statusText, query, data);
  }
  return data;
}
