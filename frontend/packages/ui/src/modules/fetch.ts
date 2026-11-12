import { getOperationAST, parse } from "graphql";
import type { OperationTypeNode } from "graphql";

/// The operation type of a GraphQL request body, or null if the body is not a GraphQL request
/// @param body - the body of the fetch request, a JSON string with "query" and "operationName"
export function getOperationType(body: unknown): OperationTypeNode | null {
  if (typeof body !== "string") {
    return null;
  }
  try {
    const request: unknown = JSON.parse(body);
    if (typeof request !== "object" || request == null || !("query" in request) || typeof request.query !== "string") {
      return null;
    }
    const operationName =
      "operationName" in request && typeof request.operationName === "string" ? request.operationName : undefined;
    return getOperationAST(parse(request.query), operationName)?.operation ?? null;
  } catch {
    return null;
  }
}

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

/// The error code when Node.js fetch can not connect (for example ECONNREFUSED or ECONNRESET), else null
export function getConnectionErrorCode(error: unknown): string | null {
  if (!(error instanceof TypeError)) {
    return null;
  }
  const { cause } = error;
  if (typeof cause === "object" && cause != null && "code" in cause && typeof cause.code === "string") {
    return cause.code;
  }
  return null;
}
