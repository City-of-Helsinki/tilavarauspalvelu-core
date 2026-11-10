// Shared helpers for browser tests against a running development stack.
// Import this file by its absolute path from a test script. It also exports Playwright,
// so the test script does not need its own Playwright install:
//   import { chromium, detect, newSession } from "/<repo>/.agents/skills/browser-test/lib.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export { chromium } from "playwright";

// The default gateway name in the Docker network. Compose names it after the checkout directory.
export const DEFAULT_GATEWAY = "http://tilavarauspalvelu-core-gateway-1:8080";

// Test identities in the Suomi.fi test identification. The roles come from the shared test data.
export const USERS = {
  noaccess: "210281-9988",
  admin: "090909-900D",
};

// Saved sessions have live session cookies. Keep them out of the repository.
export const STATE_DIR = path.join(os.tmpdir(), "varaamo-browser-test");

async function probe(url) {
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    return res.status;
  } catch {
    return 0;
  }
}

// Find the URLs of the running setup.
// "gateway": one address on localhost:8000. The single address setup in Docker,
//            or the browser-proxy script in front of a gateway in another container.
// "host":    the backend on localhost:8000 and the frontends on localhost:3000 and localhost:3001.
// "container": a gateway in the Docker network, but no proxy on localhost:8000 yet. Start browser-proxy.
export async function detect({ gateway = DEFAULT_GATEWAY } = {}) {
  const staffOn8000 = await probe("http://localhost:8000/kasittely");
  // Django gives 404 for /kasittely. A gateway gives the staff UI.
  if (staffOn8000 >= 200 && staffOn8000 < 400) {
    const base = "http://localhost:8000";
    return { setup: "gateway", customer: base, staff: `${base}/kasittely`, api: base };
  }
  const backend = await probe("http://localhost:8000/admin/login/");
  const customer = await probe("http://localhost:3000/");
  const staff = await probe("http://localhost:3001/kasittely");
  if (backend === 200 && customer > 0 && staff > 0) {
    return {
      setup: "host",
      customer: "http://localhost:3000",
      staff: "http://localhost:3001/kasittely",
      api: "http://localhost:8000",
    };
  }
  if ((await probe(`${gateway}/admin/login/`)) === 200) {
    return { setup: "container", gateway };
  }
  return {
    setup: "none",
    found: { "localhost:8000/admin/login/": backend, "localhost:3000/": customer, "localhost:3001/kasittely": staff },
  };
}

export async function urls(options) {
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
  // Confirmation pages of the identification service, until the browser is back on localhost.
  const isLocal = (u) => u.hostname === "localhost";
  for (let i = 0; i < 6 && !isLocal(new URL(page.url())); i++) {
    await page.waitForLoadState("networkidle").catch(() => {});
    if (isLocal(new URL(page.url()))) break;
    const before = page.url();
    await page
      .locator("#continue-button, button[type=submit]:visible, input[type=submit]:visible")
      .or(page.getByRole("button", { name: /jatka|continue|hyväksy|accept/i }))
      .first()
      .click({ timeout: 10000 });
    await page.waitForURL((u) => u.href !== before, { timeout: 15000 }).catch(() => {});
  }
  // The backend handles the callback on its own paths and then redirects to the frontend.
  const inApp = (u) => isLocal(u) && !/^\/(pysocial|helauth)\//.test(u.pathname);
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
  const file = path.join(STATE_DIR, `${env.setup}-${hetu}.json`);
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
