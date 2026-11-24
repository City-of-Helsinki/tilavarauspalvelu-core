// Shared helpers for browser tests against a running development stack.
// Import this file by its absolute path from a test script. It also exports Playwright,
// so the test script does not need its own Playwright install:
//   import { chromium, detect, newSession } from "/<repo>/.agents/skills/browser-test/lib.mjs";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export { chromium } from "playwright";

// Compose names the containers after the project, which is the name of the checkout directory by default.
export const DEFAULT_PROJECT = "tilavarauspalvelu-core";

// The addresses of the development stack in the Docker network. See docker-compose.yml.
// The frontends share the network namespace of "frontend-net".
export function dockerUrls(project = DEFAULT_PROJECT) {
  return {
    gateway: `http://${project}-gateway-1:8080`,
    backend: `http://${project}-backend-1:8000`,
    customer: `http://${project}-frontend-net-1:3000`,
    staff: `http://${project}-frontend-net-1:3001`,
  };
}

// The shared environments, the same as in scripts/release-check.sh.
// Production is left out on purpose. Never run browser tests against production.
export const REMOTE_ENVS = {
  dev: "https://varaamo.dev.hel.ninja",
  test: "https://varaamo.test.hel.ninja",
  stage: "https://varaamo.stage.hel.ninja",
};
const REMOTE_ALIASES = { staging: "stage" };
const PRODUCTION_NAMES = ["prod", "production"];

// Test identities in the Suomi.fi test identification. The roles come from the shared test data.
export const USERS = {
  noaccess: "210281-9988",
  admin: "090909-900D",
  "unit-reserver": "010101-900V",
  "unit-viewer": "020202-900V",
  "unit-handler": "030303-900V",
  "unit-admin": "040404-900V",
};

// Saved sessions have live session cookies. Keep them out of the repository.
export const STATE_DIR = path.join(os.tmpdir(), "varaamo-browser-test");

async function request(url) {
  try {
    return await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  } catch {
    return null;
  }
}

async function probe(url) {
  return (await request(url))?.status ?? 0;
}

// Find the backend that the browser uses, from the build of the customer UI.
// Without a csrftoken cookie, the proxy of the frontend redirects a page to "<NEXT_PUBLIC_LOCAL_API_URL>/csrf/".
// Gives the origin of the backend, "same-origin" when the variable is empty, or null when there is no such redirect.
async function browserBackend(customerUrl) {
  const location = (await request(`${customerUrl}/`))?.headers.get("location");
  if (!location) return null;
  const target = new URL(location, customerUrl);
  if (!target.pathname.startsWith("/csrf/")) return null;
  return target.origin === new URL(customerUrl).origin ? "same-origin" : target.origin;
}

const PROXY = ".agents/skills/browser-test/browser-proxy";

// Find the URLs of the running setup.
// "direct":    the frontends on localhost:3000 and localhost:3001, the backend on localhost:8000.
//              From "just stack up", "just stack up-no-gateway", or the servers on the host.
//              A gateway on localhost:8080 can also run. It is not used, because the frontends send
//              the browser to the backend on localhost:8000.
// "gateway":   the frontends have an empty NEXT_PUBLIC_LOCAL_API_URL, so all goes through the gateway on localhost:8080.
// "proxy":     the browser-proxy script on localhost:8000, in front of a stack in other containers.
// "container": a stack in the Docker network, but no proxy on localhost:8000 yet. Start browser-proxy.
export async function detect({ project = DEFAULT_PROJECT } = {}) {
  // Django gives 404 for /kasittely. The browser-proxy gives the staff UI.
  const staffOn8000 = await probe("http://localhost:8000/kasittely");
  if (staffOn8000 >= 200 && staffOn8000 < 400) {
    const base = "http://localhost:8000";
    return { setup: "proxy", customer: base, staff: `${base}/kasittely`, api: base };
  }

  const found = {};
  const customer = await probe("http://localhost:3000/");
  found["localhost:3000/"] = customer;
  if (customer > 0) {
    // An older frontend without the csrf redirect uses localhost:8000.
    const api = (await browserBackend("http://localhost:3000")) ?? "http://localhost:8000";
    found.browserBackend = api;
    if (api === "same-origin") {
      const gateway = "http://localhost:8080";
      found["localhost:8080/admin/login/"] = await probe(`${gateway}/admin/login/`);
      if (found["localhost:8080/admin/login/"] === 200) {
        return { setup: "gateway", customer: gateway, staff: `${gateway}/kasittely`, api: gateway };
      }
      return { setup: "none", reason: "frontend-needs-gateway", found };
    }
    found[`${api}/admin/login/`] = await probe(`${api}/admin/login/`);
    found["localhost:3001/kasittely"] = await probe("http://localhost:3001/kasittely");
    if (found[`${api}/admin/login/`] === 200 && found["localhost:3001/kasittely"] > 0) {
      return { setup: "direct", customer: "http://localhost:3000", staff: "http://localhost:3001/kasittely", api };
    }
    return { setup: "none", reason: "incomplete", found };
  }

  // Nothing on localhost. Look for the stack in the Docker network.
  const docker = dockerUrls(project);
  const projectArg = project === DEFAULT_PROJECT ? "" : ` --project ${project}`;
  if ((await probe(`${docker.gateway}/admin/login/`)) === 200) {
    return { setup: "container", proxy: `${PROXY}${projectArg}` };
  }
  if ((await probe(`${docker.backend}/admin/login/`)) === 200) {
    const frontends = (await probe(`${docker.customer}/`)) > 0;
    return {
      setup: "container",
      proxy: `${PROXY} --no-gateway${frontends ? "" : " --frontend local"}${projectArg}`,
      ...(frontends ? {} : { reason: "no-frontends" }),
    };
  }
  return { setup: "none", reason: "nothing", found };
}

// The URLs of a shared environment. All parts of the service are on one domain.
export async function remote(name) {
  if (PRODUCTION_NAMES.includes(name)) {
    throw new Error("Browser tests do not run against production. Use dev, test or stage.");
  }
  const key = REMOTE_ALIASES[name] ?? name;
  const base = REMOTE_ENVS[key];
  if (!base) {
    throw new Error(`Unknown env "${name}". Use ${Object.keys(REMOTE_ENVS).join(", ")}.`);
  }
  const status = await probe(`${base}/healthcheck`);
  if (status !== 200) {
    throw new Error(`${base}/healthcheck gives ${status || "no answer"}. The env does not run or is not reachable.`);
  }
  return { setup: "remote", name: key, customer: base, staff: `${base}/kasittely`, api: base };
}

// Gives the URLs of the local setup, or of a shared environment with { env: "dev" | "test" | "stage" }.
export async function urls(options = {}) {
  if (options.env) return remote(options.env);
  const env = await detect(options);
  if (!env.customer) {
    throw new Error(`No usable setup: ${JSON.stringify(env)}. Run browser-env for help.`);
  }
  return env;
}

// Log in through Tunnistamo test and the Suomi.fi test identification.
export async function login(page, env, hetu) {
  await page.goto(`${env.customer}/`);
  await page.locator("#login").click();
  await page.locator("#social-suomi_fi").click();
  await page.locator("#fakevetuma2").click();
  // The page validates on key events. A plain fill() of the default value leaves the button disabled.
  const hetuInput = page.locator("#hetu_input");
  await hetuInput.fill("");
  await hetuInput.pressSequentially(hetu, { delay: 20 });
  await hetuInput.blur();
  await page.locator("#tunnistaudu").click();
  // Confirmation pages of the identification service, until the browser is back on the host of the service.
  const appHost = new URL(env.customer).hostname;
  const isApp = (u) => u.hostname === appHost;
  for (let i = 0; i < 6 && !isApp(new URL(page.url())); i++) {
    await page.waitForLoadState("networkidle").catch(() => {});
    if (isApp(new URL(page.url()))) break;
    const before = page.url();
    await page
      .locator("#continue-button, button[type=submit]:visible, input[type=submit]:visible")
      .or(page.getByRole("button", { name: /jatka|continue|hyväksy|accept/i }))
      .first()
      .click({ timeout: 10000 });
    await page.waitForURL((u) => u.href !== before, { timeout: 15000 }).catch(() => {});
  }
  // The backend handles the callback on its own paths and then redirects to the frontend.
  const inApp = (u) => isApp(u) && !/^\/(pysocial|helauth)\//.test(u.pathname);
  await page.waitForURL(inApp, { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
}

// Ask the backend who the session belongs to. Gives null without a valid session.
export async function currentUser(context, env) {
  const cookies = await context.cookies(env.api);
  const csrf = cookies.find((c) => c.name === "csrftoken")?.value ?? "";
  const res = await context.request.post(`${env.api}/graphql/`, {
    headers: { "X-CSRFToken": csrf, Origin: new URL(env.customer).origin, Referer: `${env.customer}/` },
    data: {
      query: "{ currentUser { pk firstName lastName isSuperuser generalRoles { role } unitRoles { role } } }",
    },
  });
  const body = await res.json();
  if (body.errors) throw new Error(`currentUser: ${JSON.stringify(body.errors)}`);
  return body.data.currentUser;
}

// A browser context that is logged in as the given test identity, or anonymous with hetu null.
// Reuses a saved session while the backend still accepts it. Otherwise logs in again.
export async function newSession(browser, env, hetu, contextOptions = {}) {
  const options = { locale: "fi-FI", ...contextOptions };
  if (!hetu) return browser.newContext(options);
  const key = env.setup === "remote" ? `remote-${env.name}` : env.setup;
  const file = path.join(STATE_DIR, `${key}-${hetu}.json`);
  if (fs.existsSync(file)) {
    const context = await browser.newContext({ ...options, storageState: file });
    if (await currentUser(context, env).catch(() => null)) return context;
    await context.close();
  }
  const context = await browser.newContext(options);
  const page = await context.newPage();
  try {
    await login(page, env, hetu);
  } catch (e) {
    const shot = path.join(STATE_DIR, `login-failed-${hetu}.png`);
    await page.screenshot({ path: shot }).catch(() => {});
    throw new Error(`Login as ${hetu} failed at ${page.url()}. Screenshot: ${shot}\n${e.message}`);
  }
  await page.close();
  fs.mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
  await context.storageState({ path: file });
  return context;
}

// --- Stale checkout ---------------------------------------------------------------------------------------------------

// The browser-proxy tells on this path if it sends the frontend paths to the stack or to "next dev" in this container.
export const PROXY_STATUS_PATH = "/__browser-proxy";

export async function proxyFrontend() {
  try {
    const res = await fetch(`http://localhost:8000${PROXY_STATUS_PATH}`, { signal: AbortSignal.timeout(5000) });
    return res.ok ? (await res.json()).frontend : null;
  } catch {
    return null;
  }
}

// The main checkout of the repository, also when the script runs in a worktree.
// The stack of the user runs from there.
export function mainCheckout() {
  const out = execFileSync("git", ["worktree", "list", "--porcelain"], { encoding: "utf8" });
  return out.split("\n")[0].replace(/^worktree /, "");
}

const mtime = (file) => (fs.existsSync(file) ? fs.statSync(file).mtimeMs : null);

// The codegen projects in frontend/graphql.config.ts.
const CODEGEN_DIRS = ["apps/customer", "apps/staff", "packages/ui"];

// Finds generated GraphQL types in the frontend of a checkout that are older than their sources.
// Does not check node_modules. The stack keeps them in Docker volumes, not in the checkout.
// After a branch switch without "pnpm codegen", the frontend sends queries that the backend does not know.
// Compares file times only, so an edit of a query that codegen does not change also counts as stale.
export function staleCheckout(root = mainCheckout()) {
  const frontend = path.join(root, "frontend");
  const stale = [];
  const schema = mtime(path.join(root, "tilavaraus.graphql")) ?? 0;
  for (const dir of CODEGEN_DIRS) {
    const generated = mtime(path.join(frontend, dir, "gql", "gql-types.ts"));
    if (!generated) {
      stale.push(`frontend/${dir}/gql/gql-types.ts is missing`);
      continue;
    }
    if (schema > generated) {
      stale.push(`frontend/${dir}/gql/gql-types.ts is older than tilavaraus.graphql`);
      continue;
    }
    let documents = [];
    try {
      // Files with a GraphQL document. "git grep" exits with 1 when nothing matches.
      const out = execFileSync("git", ["-C", root, "grep", "-l", "-e", "gql`", "--", `frontend/${dir}`], {
        encoding: "utf8",
      });
      documents = out.split("\n").filter(Boolean);
    } catch {}
    const newer = documents.filter((file) => (mtime(path.join(root, file)) ?? 0) > generated);
    if (newer.length > 0) {
      const sample = newer.slice(0, 3).join(", ") + (newer.length > 3 ? ", ..." : "");
      stale.push(`frontend/${dir}/gql/gql-types.ts is older than ${newer.length} document file(s): ${sample}`);
    }
  }
  return stale;
}
