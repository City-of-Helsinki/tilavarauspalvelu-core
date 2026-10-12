import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // NOTE A Sentry tunnel request (tunnelRoute) adds 12 close listeners to one ServerResponse.
    // Next.js, its proxy for the rewrite (httpxy) and the Sentry SDK each add their own.
    // This is not a leak. The count is fixed per response.
    // With the default limit of 10, Node.js logs a MaxListenersExceededWarning for each tunnel request.
    // Remove this if the tunnel moves out of Next.js or the listener count goes down.
    const { setMaxListeners } = await import("node:events");
    setMaxListeners(12);
    await import("../sentry.server.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
