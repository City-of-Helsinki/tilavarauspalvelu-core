/// NOTE don't include nodejs packages (like node:* or lodash) this requires edge runtime due to NextJs design
import type { NextRequest } from "next/server";
import { EconnRefusedError, GraphQLFetchError } from "./modules/errors";
import { buildGraphQLUrl } from "./modules/urlBuilder";

/// Check if the request is a page request
/// @param url - URL
export function isPageRequest(url: URL, basePath = ""): boolean {
  if (
    // ignore healthcheck because it's for automated test suite that can't do redirects
    url.pathname.startsWith(`${basePath}/healthcheck`) ||
    url.pathname.startsWith(`${basePath}/api/healthcheck`) ||
    url.pathname.startsWith(`${basePath}/_next`) ||
    url.pathname.match(/\.(webmanifest|js|css|png|jpg|jpeg|svg|gif|ico|json|woff|woff2|ttf|eot|otf|pdf)$/) ||
    url.pathname.startsWith(`${basePath}/503`) ||
    url.pathname.startsWith(`${basePath}/en/503`) ||
    url.pathname.startsWith(`${basePath}/sv/503`)
  ) {
    return false;
  }
  return true;
}

/// check if csrftoken is missing and construct redirect url for it
/// if we should redirect then construct the backend url with (original) req url as the return address
/// @param req The request processed in the middleware
/// @param apiBaseUrl Host url for backend
/// @return redirect url or undefined if we should not redirect
export function redirectCsrfToken(req: NextRequest, apiBaseUrl: string): URL | undefined {
  const { cookies } = req;
  const hasCsrfToken = cookies.has("csrftoken");
  if (hasCsrfToken) {
    return undefined;
  }

  const requestUrl = new URL(req.url);
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

export type GqlQuery = {
  query: string;
  // TODO don't type to unknown (undefined and Date break JSON.stringify)
  variables?: Record<string, unknown>;
};

/// Fetch a query from the backend
/// @param req - NextRequest used to copy headers etc.
/// @param query - Query object with query and variables
/// @returns Promise<Response>
/// custom function so we don't have to import apollo client in middleware
export async function gqlQueryFetch(req: NextRequest, query: GqlQuery, apiUrl: string): Promise<unknown> {
  const { cookies, headers } = req;
  // TODO this is copy to the createApolloClient function but different header types
  // NextRequest vs. RequestInit
  const newHeaders = new Headers({
    ...headers,
    "Content-Type": "application/json",
  });

  const sessionid = cookies.get("sessionid");
  const csrfToken = cookies.get("csrftoken");

  // TODO throw instead
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

  try {
    const res = await fetch({
      method: "POST",
      url: buildGraphQLUrl(apiUrl),
      headers: newHeaders,
      // @ts-expect-error -- something broken in node types, body can be a string
      body,
    });

    const data: unknown = await res.json();

    if (!res.ok) {
      const { status, statusText } = res;
      throw new GraphQLFetchError(status, statusText, query, data);
    }
    return data;
  } catch (err) {
    if (
      err instanceof TypeError &&
      typeof err.cause === "object" &&
      err.cause != null &&
      "code" in err.cause &&
      err.cause?.code === "ECONNREFUSED"
    ) {
      throw new EconnRefusedError(err.message);
    }
    throw err;
  }
}
