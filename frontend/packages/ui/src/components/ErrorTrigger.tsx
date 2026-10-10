import { useEffect, useState } from "react";
import type { ParsedUrlQuery } from "node:querystring";
import type { NextPageContext } from "next";
import { useRouter } from "next/router";

// Throws a test error on any page that has the "throw" query parameter, for example "/?throw=render".
// Use it to test the error pages, the logging and Sentry on a server.
// The ENABLE_ERROR_TRIGGER env variable turns it on. Keep it off in production.
const ERROR_TRIGGER_MODES = [
  // Throws in getInitialProps on the server. Shows the 500 page.
  "ssr",
  // Throws during a React render in the browser, after hydration.
  "render",
  // Throws in a timer. React does not catch it, so the page stays visible.
  "async",
  // Rejects a promise that nothing handles.
  "promise",
] as const;

export type ErrorTriggerMode = (typeof ERROR_TRIGGER_MODES)[number];

export function getErrorTriggerMode(query: ParsedUrlQuery): ErrorTriggerMode | null {
  const value = query.throw;
  return ERROR_TRIGGER_MODES.find((mode) => mode === value) ?? null;
}

function createTestError(mode: ErrorTriggerMode): Error {
  return new Error(`Test error from ?throw=${mode}`);
}

/// Call this in _app getInitialProps. It throws for "?throw=ssr" on the server.
export function triggerServerError(enabled: boolean, ctx: Pick<NextPageContext, "err" | "query">): void {
  // Next renders the error page through _app getInitialProps too, and sets ctx.err for it.
  // Do not throw again there, or Next shows its own fallback page instead of ours.
  const isErrorPage = ctx.err != null;
  if (enabled && typeof window === "undefined" && !isErrorPage && getErrorTriggerMode(ctx.query) === "ssr") {
    throw createTestError("ssr");
  }
}

/// Add this to _app. It throws the browser errors.
export function ErrorTrigger({ enabled }: { enabled: boolean }): null {
  const router = useRouter();
  const mode = enabled && router.isReady ? getErrorTriggerMode(router.query) : null;
  const [renderError, setRenderError] = useState<Error | null>(null);

  useEffect(() => {
    switch (mode) {
      case "render":
        // Throw on the next render, so the server render and the hydration succeed
        // oxlint-disable-next-line react/set-state-in-effect -- the error must happen in the browser only
        setRenderError(createTestError("render"));
        break;
      case "async": {
        const timer = setTimeout(() => {
          throw createTestError("async");
        }, 0);
        return () => clearTimeout(timer);
      }
      case "promise":
        void Promise.reject(createTestError("promise"));
        break;
      case "ssr":
      case null:
        break;
    }
    return undefined;
  }, [mode]);

  if (renderError) {
    throw renderError;
  }
  return null;
}
