// Fault injection proxy for local error testing. See docker-compose.chaos.yml.
// It sits in front of the backend and has one channel for the server side rendering and one for the browser.
// Change the faults of a channel at runtime through the control API. "just stack chaos" calls it.
import http from "node:http";

const BACKEND = new URL(process.env.CHAOS_BACKEND ?? "http://backend:8000");
const CHANNEL_PORTS = { ssr: 8001, client: 8002 };
const CONTROL_PORT = 8099;

const DEFAULT_CONFIG = {
  // Faults apply only to requests whose path starts with this, for example "/graphql/"
  path: "/",
  // Wait delayMs plus a random time from 0 to jitterMs before the request continues
  delayMs: 0,
  jitterMs: 0,
  // Close the connection without a response on every Nth request. 0 turns it off.
  dropEvery: 0,
  // Respond with errorStatus to this share of requests, from 0 to 1
  errorRate: 0,
  errorStatus: 503,
};

const channels = {
  ssr: createChannelState(),
  client: createChannelState(),
};

function createChannelState() {
  return { config: { ...DEFAULT_CONFIG }, requestCount: 0, errorUntil: 0 };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(channelName, message, req) {
  console.log(`[${channelName}] ${message} ${req.method} ${req.url}`);
}

function forward(req, res) {
  const upstream = http.request(
    {
      hostname: BACKEND.hostname,
      port: BACKEND.port,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );
  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
    }
    res.end("chaos proxy: the backend is not available");
  });
  // Stop the backend request if the client goes away
  res.on("close", () => upstream.destroy());
  req.pipe(upstream);
}

async function handleRequest(channelName, req, res) {
  const state = channels[channelName];
  const { config } = state;
  if (!req.url.startsWith(config.path)) {
    forward(req, res);
    return;
  }

  state.requestCount += 1;
  const delay = config.delayMs + Math.random() * config.jitterMs;
  if (delay > 0) {
    await sleep(delay);
  }
  if (res.destroyed) {
    return;
  }

  if (config.dropEvery > 0 && state.requestCount % config.dropEvery === 0) {
    log(channelName, "drop", req);
    req.socket.destroy();
    return;
  }

  if (Date.now() < state.errorUntil || Math.random() < config.errorRate) {
    log(channelName, String(config.errorStatus), req);
    res.writeHead(config.errorStatus, { "Content-Type": "text/plain" });
    res.end(`chaos proxy: injected ${config.errorStatus}`);
    return;
  }

  forward(req, res);
}

class ConfigError extends Error {}

/// Returns the config with the changes of the body.
/// The body can also have errorForSeconds, which makes all requests fail with errorStatus for that time.
function parseConfigChange(currentConfig, body) {
  if (typeof body !== "object" || body == null || Array.isArray(body)) {
    throw new ConfigError("The body must be a JSON object");
  }
  const config = { ...currentConfig };
  let errorForSeconds = 0;
  for (const [key, value] of Object.entries(body)) {
    if (key === "errorForSeconds") {
      if (typeof value !== "number" || value < 0) {
        throw new ConfigError("errorForSeconds must be a number of 0 or more");
      }
      errorForSeconds = value;
    } else if (!(key in DEFAULT_CONFIG)) {
      throw new ConfigError(`Unknown setting "${key}"`);
    } else if (typeof value !== typeof DEFAULT_CONFIG[key]) {
      throw new ConfigError(`"${key}" must be a ${typeof DEFAULT_CONFIG[key]}`);
    } else {
      config[key] = value;
    }
  }
  if (config.errorRate < 0 || config.errorRate > 1) {
    throw new ConfigError("errorRate must be from 0 to 1");
  }
  if (config.errorStatus < 400 || config.errorStatus > 599) {
    throw new ConfigError("errorStatus must be from 400 to 599");
  }
  if (config.delayMs < 0 || config.jitterMs < 0 || config.dropEvery < 0) {
    throw new ConfigError("delayMs, jitterMs and dropEvery must be 0 or more");
  }
  return { config, errorForSeconds };
}

function getStatus() {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(channels).map(([name, state]) => [
      name,
      {
        ...state.config,
        requestCount: state.requestCount,
        errorSecondsLeft: Math.max(0, Math.ceil((state.errorUntil - now) / 1000)),
      },
    ])
  );
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  return body.trim() === "" ? {} : JSON.parse(body);
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(`${JSON.stringify(data, null, 2)}\n`);
}

/// GET / shows the settings of both channels.
/// PUT /ssr, /client or /both changes the given settings. DELETE /ssr, /client or /both resets them.
async function handleControl(req, res) {
  const target = req.url.replace(/^\/+|\/+$/g, "");
  if (req.method === "GET" && target === "") {
    sendJson(res, 200, getStatus());
    return;
  }

  const names = target === "both" ? Object.keys(channels) : [target];
  if (!names.every((name) => name in channels)) {
    sendJson(res, 404, { error: "Use /ssr, /client or /both" });
    return;
  }

  if (req.method === "DELETE") {
    for (const name of names) {
      channels[name] = createChannelState();
    }
    sendJson(res, 200, getStatus());
    return;
  }

  if (req.method !== "PUT" && req.method !== "POST") {
    sendJson(res, 405, { error: "Use GET, PUT or DELETE" });
    return;
  }

  try {
    const body = await readJson(req);
    // Check all channels first, so an error changes nothing
    const changes = names.map((name) => [name, parseConfigChange(channels[name].config, body)]);
    for (const [name, { config, errorForSeconds }] of changes) {
      channels[name].config = config;
      // Count from the change, so "every Nth request" is easy to predict
      channels[name].requestCount = 0;
      if (errorForSeconds > 0) {
        channels[name].errorUntil = Date.now() + errorForSeconds * 1000;
      }
    }
    sendJson(res, 200, getStatus());
  } catch (error) {
    if (error instanceof ConfigError || error instanceof SyntaxError) {
      sendJson(res, 400, { error: error.message });
      return;
    }
    throw error;
  }
}

for (const [name, port] of Object.entries(CHANNEL_PORTS)) {
  http.createServer((req, res) => void handleRequest(name, req, res)).listen(port);
}
http
  .createServer((req, res) => {
    // Do not let an unexpected error, for example a client that goes away during the body, stop the proxy
    handleControl(req, res).catch((error) => {
      console.error("chaos proxy: control request failed", error);
      if (res.headersSent) {
        res.destroy();
      } else {
        sendJson(res, 500, { error: "Internal error" });
      }
    });
  })
  .listen(CONTROL_PORT);

console.log(`chaos proxy: ssr on ${CHANNEL_PORTS.ssr}, client on ${CHANNEL_PORTS.client}, control on ${CONTROL_PORT}`);
