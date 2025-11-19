import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPageRequest, gqlQueryFetch, redirectCsrfToken } from "ui/src/middlewareHelpers";
import type { GqlQuery } from "ui/src/middlewareHelpers";
import { env } from "@/env.mjs";
import { PUBLIC_URL } from "./modules/const";

const API_BASE_URL = env.TILAVARAUS_API_URL ?? "";

type User = {
  pk: number;
};
type Data = {
  user: User;
};

async function fetchUserData(req: NextRequest): Promise<Data | null> {
  const { cookies } = req;
  const sessionid = cookies.get("sessionid");

  if (sessionid == null) {
    return null;
  }
  const userQuery: GqlQuery = {
    query: `
      query GetCurrentUser {
        currentUser {
          pk
        }
      }
    `,
    variables: {},
  };

  const res = await gqlQueryFetch(req, userQuery, API_BASE_URL);
  if (!res.ok) {
    throw new Error(res.statusText);
  }

  const data: unknown = await res.json();
  if (typeof data !== "object" || data == null) {
    return null;
  }

  if ("currentUser" in data) {
    const { currentUser } = data;
    if (
      typeof currentUser === "object" &&
      currentUser != null &&
      "pk" in currentUser &&
      typeof currentUser.pk === "number"
    ) {
      return { user: { pk: currentUser.pk } };
    }
  }
  return null;
}

export async function middleware(req: NextRequest) {
  if (!isPageRequest(new URL(req.url), PUBLIC_URL)) {
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

  // Do a user query to check that backend is alive
  // => if it's not return 503 page instead of 500 (uncaught exception)
  try {
    const _user = await fetchUserData(req);
    // TODO could add check here to rewrite the main page (instead of returning it from the React component)
  } catch {
    // TODO check for GraphQL errors vs. network errors (e.g. Connection refused / 503)
    // TODO report to sentry any GraphQL errors (not connection refused)
    const rewriteUrl = new URL(`${env.NEXT_PUBLIC_BASE_URL ?? ""}/503`, req.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      // regex matching page patterns is too error prone, match inside the middleware instead
      source: "/:path*",
    },
  ],
  // undici has some weird behaviour with URLs so nodejs runtime doesn't work
  // runtime: "nodejs",
};
