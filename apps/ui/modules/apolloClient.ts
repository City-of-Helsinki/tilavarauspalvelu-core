import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { getCookie } from "typescript-cookie";
import { relayStylePagination } from "@apollo/client/utilities";
import qs, { ParsedUrlQuery } from "querystring";
import { GetServerSidePropsContext, PreviewData } from "next";
import { IncomingHttpHeaders } from "node:http";
import { buildGraphQLUrl } from "common/src/urlBuilder";
import { env } from "@/env.mjs";
import { isBrowser } from "./const";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { errorLink } from "common/src/apolloUtils";

if (process.env.NODE_ENV === "development") {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

function getServerCookie(headers: IncomingHttpHeaders | undefined, name: string) {
  const cookie = headers?.cookie;
  if (cookie == null) {
    return null;
  }
  const decoded = qs.decode(cookie, "; ");
  const token = decoded[name];
  if (token == null) {
    return null;
  }
  if (Array.isArray(token)) {
    // eslint-disable-next-line no-console
    console.warn(`multiple ${name} in cookies`, token);
    return token[0];
  }
  return token;
}

export function createApolloClient(hostUrl: string, ctx?: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) {
  const isServer = typeof window === "undefined";

  const uri = buildGraphQLUrl(hostUrl, env.ENABLE_FETCH_HACK);
  const csrfToken = isServer ? getServerCookie(ctx?.req?.headers, "csrftoken") : getCookie("csrftoken");

  const enchancedFetch = (url: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers({
      ...(init?.headers != null ? init.headers : {}),
      // TODO missing csrf token is a non recoverable error
      ...(csrfToken != null ? { "X-Csrftoken": csrfToken } : {}),
    });

    // NOTE server requests don't include cookies by default
    // TODO do we want to copy request headers from client or no?
    if (isServer) {
      if (csrfToken == null) {
        throw new Error("csrftoken not found in cookies");
      }
      headers.append("Set-Cookie", `csrftoken=${csrfToken}`);
      headers.append("Cookie", `csrftoken=${csrfToken}`);
      // Django fails with 403 if there is no referer (only on Kubernetes)
      const requestUrl = ctx?.req?.url ?? "";
      const hostname = ctx?.req?.headers?.["x-forwarded-host"] ?? ctx?.req?.headers?.host ?? "";
      // NOTE not exactly correct
      // For our case this is sufficent because we are always behind a proxy,
      // but technically there is a case where we are not behind a gateway and not localhost
      // so the proto would be https and no x-forwarded-proto set
      // TODO we have .json blobs in the referer (translations), does it matter?
      const proto = ctx?.req?.headers?.["x-forwarded-proto"] ?? "http";
      headers.append("Referer", `${proto}://${hostname}${requestUrl}`);

      const sessionCookie = getServerCookie(ctx?.req?.headers, "sessionid");
      if (sessionCookie != null) {
        headers.append("Cookie", `sessionid=${sessionCookie}`);
        headers.append("Set-Cookie", `sessionid=${sessionCookie}`);
      }
    }

    return fetch(url, {
      ...init,
      headers,
    });
  };

  const httpLink = new HttpLink({
    uri,
    // TODO this might be useless
    credentials: "include",
    fetch: enchancedFetch,
  });

  return new ApolloClient({
    ssrMode: isServer,
    link: from([errorLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        errorPolicy: "ignore",
      },
      query: {
        errorPolicy: "ignore",
        fetchPolicy: isBrowser ? "cache-first" : "no-cache",
      },
    },
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            reservationUnits: relayStylePagination(),
          },
        },
      },
    }),
  });
}
