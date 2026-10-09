/// Error name of a request that fetchWithTimeout stopped.
/// It is the same name that AbortSignal.timeout uses.
export const FETCH_TIMEOUT_ERROR_NAME = "TimeoutError";

/// fetch that stops the request with a TimeoutError if there is no response in timeoutMs.
/// The caller can still stop the request with init.signal.
/// NOTE the timeout covers the wait for the response headers, not the read of the body.
/// The backend sends the headers when the response is ready, so this is where a slow backend makes us wait.
/// NOTE uses AbortController and not AbortSignal.any, because older browsers do not have AbortSignal.any.
export async function fetchWithTimeout(
  url: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const callerSignal = init?.signal;
  const onCallerAbort = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) {
    onCallerAbort();
  } else {
    callerSignal?.addEventListener("abort", onCallerAbort, { once: true });
  }
  const timer = setTimeout(() => {
    controller.abort(new DOMException(`Request timed out after ${timeoutMs} ms`, FETCH_TIMEOUT_ERROR_NAME));
  }, timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", onCallerAbort);
  }
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === FETCH_TIMEOUT_ERROR_NAME;
}
