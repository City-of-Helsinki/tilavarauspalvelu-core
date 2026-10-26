/** Robot Framework RequestsLibrary keywords the suite uses, with the same names. Uses Node's fetch. */
import { argsOf, library } from "./robot";
import type { RobotValue } from "./robot";

/** The parts of a Python requests Response the suite reads: `${response.status_code}`, `.json()`, `.text`. */
export interface RequestsResponse {
  status_code: number;
  text: string;
  headers: Record<string, string>;
  ok: boolean;
  json: () => RobotValue;
}

const sessions = new Map<string, { url: string; headers: Record<string, string> }>();

async function send(
  method: string,
  url: string,
  options: { headers?: Record<string, string>; json?: RobotValue; data?: RobotValue },
  expectedStatus: RobotValue
): Promise<RequestsResponse> {
  const headers: Record<string, string> = { ...options.headers };
  let body: string | undefined;
  if (options.json !== undefined) {
    body = JSON.stringify(options.json);
    headers["Content-Type"] ??= "application/json";
  } else if (options.data != null) {
    body = typeof options.data === "string" ? options.data : JSON.stringify(options.data);
  }
  const response = await fetch(url, { method, headers, body });
  const text = await response.text();
  const result: RequestsResponse = {
    status_code: response.status,
    text,
    headers: Object.fromEntries(response.headers.entries()),
    ok: response.ok,
    json: () => JSON.parse(text),
  };
  const expected = expectedStatus == null ? null : String(expectedStatus).toLowerCase();
  if (expected == null && !response.ok) {
    throw new Error(`HTTPError: ${response.status} ${response.statusText} for url: ${url}`);
  }
  if (expected != null && expected !== "any" && expected !== "anything" && Number(expected) !== response.status) {
    throw new Error(`Url: ${url} Expected status: ${response.status} != ${expected}`);
  }
  return result;
}

export const RequestsLibrary = library("RequestsLibrary", {
  "Create Session": (...args: RobotValue[]) => {
    const { alias, url, headers } = argsOf(args, ["alias", "url", "headers"], { headers: {} });
    sessions.set(String(alias), { url: String(url), headers });
  },

  "POST On Session": (...args: RobotValue[]) => {
    const { alias, url, json, data, headers, expected_status } = argsOf(args, ["alias", "url", "data", "json"]);
    const session = sessions.get(String(alias));
    if (session == null) {
      throw new Error(`Non-existing index or alias '${String(alias)}'.`);
    }
    return send(
      "POST",
      `${session.url.replace(/\/$/, "")}${String(url)}`,
      { headers: { ...session.headers, ...headers }, json, data },
      expected_status
    );
  },

  POST: (...args: RobotValue[]) => {
    const { url, data, json, headers, expected_status } = argsOf(args, ["url", "data", "json"]);
    return send("POST", String(url), { headers, json, data }, expected_status);
  },
});
