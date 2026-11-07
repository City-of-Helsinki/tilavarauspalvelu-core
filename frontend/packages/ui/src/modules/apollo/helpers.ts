import type { IncomingMessage, IncomingHttpHeaders } from "node:http";
import { ErrorLink } from "@apollo/client/link/error";
import { getMainDefinition } from "@apollo/client/utilities";
import * as Sentry from "@sentry/nextjs";
import { getOperationAST, Kind, OperationTypeNode, print } from "graphql";
import { Roarr as log } from "roarr";
import { getCookie } from "typescript-cookie";
import type { ApolloLink } from "@apollo/client";
import type { DocumentNode } from "graphql";
import { RESERVEE_PI_FIELDS } from "@ui/components/reservation-form/utils";
import { toast } from "../../components/toast";
import {
  CLIENT_FETCH_TIMEOUT_MS,
  CLIENT_UPLOAD_TIMEOUT_MS,
  SERVER_MUTATION_TIMEOUT_MS,
  SERVER_QUERY_TIMEOUT_MS,
} from "../const";
import { CsrfTokenNotFound } from "../errors";
import { fetchWithTimeout, getOperationType } from "../fetch";
import { getLocalizationLang, isBrowser } from "../helpers";
import { getClientOrigin } from "../urlBuilder";
import type { LocalizationLanguages } from "../urlBuilder";
import { classifyError, isPermissionErrorCode, isToastedByErrorLink } from "./errors";
import type { ApiError, FetchError } from "./errors";

/// Log all errors of the backend requests to Sentry, and toast the errors that the UI can not handle.
/// This is the only place that logs these errors, so the callers don't have to.
export const errorLink = new ErrorLink(({ error, operation }) => {
  const fetchError = classifyError(error);
  toastFetchError(fetchError, operation);
  logFetchError(fetchError, operation);
});

const NETWORK_ERROR_TRANSLATIONS: Record<LocalizationLanguages, string> = {
  en: "Unable to connect to the service. Please try again.",
  fi: "Palveluun ei saada yhteyttä, yritä uudelleen.",
  sv: "Det går inte att ansluta till tjänsten. Försök igen.",
};

// A mutation that timed out can still complete on the backend, so don't tell the user to try again
const MUTATION_TIMEOUT_TRANSLATIONS: Record<LocalizationLanguages, string> = {
  en: "The service did not respond in time. Your change can still be saved. Refresh the page before you try again.",
  fi: "Palvelu ei vastannut ajoissa. Muutoksesi voi silti tallentua. Päivitä sivu ennen kuin yrität uudelleen.",
  sv: "Tjänsten svarade inte i tid. Din ändring kan ändå sparas. Uppdatera sidan innan du försöker igen.",
};

function isMutation(operation: ApolloLink.Operation): boolean {
  const definition = getMainDefinition(operation.query);
  return definition.kind === Kind.OPERATION_DEFINITION && definition.operation === OperationTypeNode.MUTATION;
}

function toastFetchError(error: FetchError, operation: ApolloLink.Operation): void {
  if (!isBrowser) {
    return;
  }
  // The admin UI has no middleware that could redirect to the backend when the CSRF token is missing.
  // In practice this is not a problem, because login sets the CSRF token and the login page is static.
  if (!isToastedByErrorLink(error)) {
    return;
  }
  const isMutationTimeout = error.kind === "timeout" && isMutation(operation);
  // The mutation timeout has its own toast, so an open network error toast does not hide it
  const errorToastId = isMutationTimeout ? "mutation_timeout_error" : "network_error";
  // don't create multiple toasts
  if (document.querySelector(`#${errorToastId}`)) {
    return;
  }
  // Not translated because of how difficult it is to pass the translation function here
  const lang = getLocalizationLang(document.documentElement.lang);
  let errorMsg = isMutationTimeout ? MUTATION_TIMEOUT_TRANSLATIONS[lang] : NETWORK_ERROR_TRANSLATIONS[lang];
  if (error.kind === "http") {
    errorMsg += `: ${error.status}`;
  }
  toast({
    text: errorMsg,
    type: "error",
    options: { toastId: errorToastId },
  });
}

function getServerCookie(headers: IncomingHttpHeaders | undefined, name: string) {
  const cookie = headers?.cookie;
  if (cookie == null) {
    return null;
  }
  const decoded = cookie.split(";").map((x) => x.trim().split("="));
  const line = decoded.find((x) => x[0] === name);
  if (line == null) {
    return null;
  }
  const token = line[1];
  return token;
}

function getTimeoutMs(isServer: boolean, init: RequestInit | undefined, clientTimeoutMs: number): number {
  if (isServer) {
    // A mutation can call external services, and after a timeout we do not know if it completed
    return getOperationType(init?.body) === OperationTypeNode.MUTATION
      ? SERVER_MUTATION_TIMEOUT_MS
      : SERVER_QUERY_TIMEOUT_MS;
  }
  // The upload link sends files as multipart form data
  if (init?.body instanceof FormData) {
    return Math.max(clientTimeoutMs, CLIENT_UPLOAD_TIMEOUT_MS);
  }
  return clientTimeoutMs;
}

/// @param req - the incoming request, required on the server
/// @param clientTimeoutMs - timeout in the browser. The server uses SERVER_QUERY_TIMEOUT_MS or SERVER_MUTATION_TIMEOUT_MS.
export function enchancedFetch(req?: IncomingMessage, clientTimeoutMs: number = CLIENT_FETCH_TIMEOUT_MS) {
  return (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const isServer = typeof window === "undefined";
    const csrfToken = isServer ? getServerCookie(req?.headers, "csrftoken") : getCookie("csrftoken");

    const headers = new Headers(init?.headers);
    // missing csrf token is a non recoverable error
    if (csrfToken != null) {
      headers.set("X-Csrftoken", csrfToken);
    }

    // NOTE server requests don't include cookies by default
    if (isServer) {
      if (req == null) {
        throw new Error("request is required for server-side fetch");
      }
      if (req?.headers == null) {
        throw new Error("request headers must be defined for server-side fetch");
      }
      if (csrfToken == null) {
        throw new CsrfTokenNotFound();
      }
      headers.append("Cookie", `csrftoken=${csrfToken}`);
      // Django fails with 403 if there is no referer (only on Kubernetes)
      const requestUrl = req.url ?? "";
      // A TLS socket has "encrypted" set to true.
      const isEncrypted = req.socket != null && "encrypted" in req.socket && req.socket.encrypted === true;
      const requestProtocol = isEncrypted ? "https" : "http";
      headers.append("Referer", `${getClientOrigin(req.headers, requestProtocol) ?? ""}${requestUrl}`);
      // Forward the browser values, so backend logs and traces don't show the Node.js fetch defaults
      const userAgent = req.headers["user-agent"];
      if (userAgent != null) {
        headers.set("User-Agent", userAgent);
      }
      const acceptLanguage = req.headers["accept-language"];
      if (acceptLanguage != null) {
        headers.set("Accept-Language", acceptLanguage);
      }

      const sessionCookie = getServerCookie(req?.headers, "sessionid");
      if (sessionCookie != null) {
        headers.append("Cookie", `sessionid=${sessionCookie}`);
      }
    }

    return fetchWithTimeout(url, { ...init, headers }, getTimeoutMs(isServer, init, clientTimeoutMs));
  };
}

function getErrorCodes(error: ApiError): string[] {
  if ("validation_code" in error && typeof error.validation_code === "string") {
    return [error.code, error.validation_code];
  }
  return [error.code];
}

/// Sentry groups the events by the fingerprint, and shows the name as the title
function getSentryEvent(error: FetchError, operationName: string): { name: string; fingerprint: string[] } {
  switch (error.kind) {
    case "graphql": {
      // NOTE in case we have multiple errors in the response this will create separate buckets for those
      const codes = [...new Set(error.errors.flatMap(getErrorCodes))];
      return {
        name: `GraphQL error: ${operationName} ${codes.join(",")}`,
        fingerprint: ["graphql_error", operationName, ...codes],
      };
    }
    case "invalid_query":
      return { name: `Invalid GraphQL query: ${operationName}`, fingerprint: ["invalid_query", operationName] };
    case "csrf":
      return { name: "CSRF error", fingerprint: ["csrf_error"] };
    case "timeout":
      return { name: `TIMEOUT: ${operationName}`, fingerprint: ["timeout", operationName] };
    case "connection":
      return { name: `Connection error: ${error.code}`, fingerprint: ["connection_error", error.code] };
    case "http":
      return { name: `HTTP error: ${error.status}`, fingerprint: ["http_error", String(error.status)] };
    case "unknown":
      return { name: `Unknown error: ${error.message}`, fingerprint: ["unknown_error", error.message] };
  }
}

/// Log the error to the console and to Sentry
export function logFetchError(error: FetchError, operation?: ApolloLink.Operation): void {
  const operationName = operation?.operationName ?? "";
  const isPermissionError = error.kind === "graphql" && error.errors.some((e) => isPermissionErrorCode(e.code));
  log.error(`${isPermissionError ? "graphql permission error" : error.kind}: ${JSON.stringify(error)}`);

  const { name, fingerprint } = getSentryEvent(error, operationName);
  Sentry.captureMessage(name, {
    level: "error",
    fingerprint,
    extra: {
      details: JSON.stringify(error),
      ...(operation != null
        ? {
            operationName,
            query: print(operation.query),
            variables: JSON.stringify(removePi(operation.variables)),
          }
        : {}),
    },
  });
}

/// Hide the personal information of the reservee. Returns a copy, the operation must not change.
function removePi(variables: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...variables };
  const input =
    typeof variables["input"] === "object" && variables["input"] != null
      ? { ...(variables["input"] as Record<string, unknown>) }
      : null;
  for (const field of RESERVEE_PI_FIELDS) {
    if (masked[field] != null) {
      masked[field] = "*****";
    }
    if (input != null && field in input) {
      input[field] = "*****";
    }
  }
  if (input != null) {
    masked["input"] = input;
  }
  return masked;
}

function getOperationName(doc: DocumentNode): string {
  return getOperationAST(doc)?.name?.value ?? "";
}

export function logGraphQLQuery(
  timeMs: number,
  url: string | undefined,
  documents: DocumentNode | DocumentNode[]
): void {
  const operationName = Array.isArray(documents)
    ? documents.map((doc) => getOperationName(doc))
    : getOperationName(documents);
  const t = Math.round(timeMs);
  const queryName = Array.isArray(operationName) ? operationName.join(",") : operationName;
  log.info(
    {
      timeMs: t,
      url,
      operationName,
    },
    `GQL query ${queryName} took: ${t} ms`
  );
}
