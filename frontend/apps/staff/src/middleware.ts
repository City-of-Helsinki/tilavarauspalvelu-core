import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import z from "zod";
import { isPageRequest, gqlQueryFetch, redirectCsrfToken } from "ui/src/middlewareHelpers";
import type { GqlQuery } from "ui/src/middlewareHelpers";
import { logError } from "@ui/modules/errors";
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

  const data = await gqlQueryFetch(req, userQuery, API_BASE_URL);
  return CurrentUserQuerySchema.parse(data).data;
}

export async function middleware(req: NextRequest) {
  if (!isPageRequest(new URL(req.url), PUBLIC_URL)) {
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

  // Do a user query to check that backend is alive
  // => if it's not return a 503 page instead of 500 (uncaught exception)
  try {
    const data = await fetchUserData(req);
    const res = NextResponse.next();
    res.headers.set("x-session-is-valid", String(data?.currentUser?.pk != null));
    return res;
  } catch (err) {
    logError(err);
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
