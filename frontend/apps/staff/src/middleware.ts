import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import z from "zod";
import { isPageRequest, gqlQueryFetch, redirectCsrfToken } from "ui/src/middlewareHelpers";
import type { GqlQuery } from "ui/src/middlewareHelpers";
import { GraphQLFetchError, EconnRefusedError } from "@ui/modules/errors";
import { env } from "@/env.mjs";
import { PUBLIC_URL } from "./modules/const";

const API_BASE_URL = env.TILAVARAUS_API_URL ?? "";

const CurrentUserSchema = z.object({
  pk: z.number(),
});
const QueryResultSchema = z.object({
  currentUser: CurrentUserSchema.nullable(),
});
const CurrentUserQuerySchema = z.object({
  data: QueryResultSchema,
});

type QueryResultType = z.infer<typeof QueryResultSchema>;

async function fetchUserData(req: NextRequest): Promise<QueryResultType | null> {
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

  try {
    const res = await gqlQueryFetch(req, userQuery, API_BASE_URL);
    const data: unknown = await res.json();

    if (!res.ok) {
      const { status, statusText } = res;
      throw new GraphQLFetchError(status, statusText, userQuery, data);
    }

    return CurrentUserQuerySchema.parse(data).data;
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

export async function middleware(req: NextRequest) {
  if (!isPageRequest(new URL(req.url), PUBLIC_URL)) {
    return NextResponse.next();
  }

  const csrfRedirectUrl = redirectCsrfToken(req, API_BASE_URL);
  if (csrfRedirectUrl) {
    // block infinite redirect loop (there is no graceful way to handle this)
    if (req.url.includes("redirect_to")) {
      Sentry.captureMessage("Middleware: Infinite redirect loop detected", "error");
      return NextResponse.next();
    }
    return NextResponse.redirect(csrfRedirectUrl);
  }

  // Do a user query to check that backend is alive
  // => if it's not return a 503 page instead of 500 (uncaught exception)
  try {
    const data = await fetchUserData(req);
    const res = NextResponse.next();
    res.headers.set("x-session-is-valid", String(data?.currentUser?.pk != null));
    return res;
    // TODO could add check here to rewrite the main page (instead of returning it from the React component)
  } catch (err) {
    if (err instanceof GraphQLFetchError) {
      const ctx_extra = {
        data: JSON.stringify(err.data),
        operation: JSON.stringify(err.operation),
      };
      Sentry.captureException(err, { extra: ctx_extra });
    } else {
      Sentry.captureException(err);
    }
    // TODO check for GraphQL errors vs. network errors (e.g. Connection refused / 503)
    const rewriteUrl = new URL(`${env.NEXT_PUBLIC_BASE_URL ?? ""}/503`, req.url);
    return NextResponse.rewrite(rewriteUrl);
  }
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
