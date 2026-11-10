---
name: browser-test
description: >-
  Test the customer UI and the staff UI in a real browser with Playwright, against a development stack
  that runs locally, with login through the Tunnistamo test environment.
  Use when the user asks to test, check or screenshot a change in the browser, or to do an integration test
  from the frontend to the backend.
---

How to open the UIs in a headless browser, log in as a test user and check a change.
The scripts are next to this file. `lib.mjs` has the shared code for your own test scripts.

## 1. Install once

```bash
npm ci --prefix .agents/skills/browser-test
npm exec --prefix .agents/skills/browser-test -- playwright install chromium
```

This Playwright is not part of the frontend workspace. It does not change `frontend/`.
If Chromium does not start because system libraries are missing, stop and ask the user to install them.
The command is `sudo npm exec --prefix .agents/skills/browser-test -- playwright install-deps chromium`. It needs root.

## 2. Find the setup

Run the scripts from the repository root, as a single command without `cd`, pipes or redirects.
A hook blocks them in any other form.

```bash
.agents/skills/browser-test/browser-env
```

The script prints the setup and its URLs. Use these URLs. Do not guess ports.

| `setup`     | Typical user                                   | What runs                                                                  |
|-------------|------------------------------------------------|----------------------------------------------------------------------------|
| `gateway`   | Frontend developer. All runs in Docker.         | `just stack up-gateway`. One address on `localhost:8000`.                  |
| `host`      | Backend or full-stack developer. All on the host. | The backend on `localhost:8000`, `just fe dev` on `localhost:3000` and `localhost:3001`. |
| `container` | The agent runs in a container of its own.      | The stack runs in other containers. Nothing listens on `localhost:8000` yet. |
| `none`      |                                                | Nothing found. Ask the user to start the stack. Do not start it yourself.  |

The browser must use `localhost`. The backend allows only `localhost` origins,
and Tunnistamo allows only the `localhost:8000` callback. So a plain `just stack up` with the gateway on
`localhost:8080` does not work for login. It looks like the `host` setup, which works.

### The `container` setup

Start the proxy in the background. It puts the routes of `docker/Caddyfile` on `localhost:8000`.

```bash
.agents/skills/browser-test/browser-proxy
```

Then run `browser-env` again. It now gives `gateway`. If Compose gave the gateway another name,
add `--gateway 'http://<name>:8080'` to both scripts.

## 3. Log in

```bash
.agents/skills/browser-test/browser-login admin
.agents/skills/browser-test/browser-login noaccess
```

The script logs in through Tunnistamo test and the Suomi.fi test identification. It prints the user that the backend sees.

| Name       | Test ID       | Access                                                              |
|------------|---------------|---------------------------------------------------------------------|
| `noaccess` | `210281-9988` | No roles. The default ID of the Suomi.fi test identification.       |
| `admin`    | `090909-900D` | The general role `ADMIN` in the permission model. Not a Django superuser. |

The roles come from the local database. If `admin` has no roles, tell the user. Do not change the roles yourself.
Staff users also work in the customer UI. Use `noaccess` only when the test is about limited permissions.
Do not make superusers for tests.

The session is saved in the temp directory of the system and used again while the backend accepts it.
The files have live session cookies. Never print them and never copy them into the repository.

## 4. Write a test script

Put the script in your scratch directory, not in the repository.
Import `lib.mjs` by its absolute path. It also exports Playwright.

```js
import { chromium, newSession, urls, USERS } from "/<repository root>/.agents/skills/browser-test/lib.mjs";

const env = await urls(); // { setup, customer, staff, api }
const browser = await chromium.launch();
const context = await newSession(browser, env, USERS.admin); // null gives an anonymous session
const page = await context.newPage();
await page.goto(`${env.staff}/reservation-units`);
await page.screenshot({ path: "/<scratch>/staff.png", fullPage: true });
await browser.close();
```

- Use `env.customer`, `env.staff` and `env.api`. Never write `localhost:3000` or `localhost:8000` in a test.
- `currentUser(context, env)` asks the backend who is logged in.
- Look at the screenshots with the Read tool. A page that loads is not proof that it is correct.
- Collect `pageerror` and console errors, and report them.
- The UIs are in Finnish by default. Find elements by role and by `id` where you can.

## 5. Which code is under test

The browser tests the code that the servers run, not the code in your worktree. Tell the user which code you tested.

- `gateway` setup from `just stack up-gateway`: the containers run the checkout of the user.
  To test a worktree, the user must start the stack from it. Ask.
- `host` setup: the servers run from where the user started them. Ask if you do not know.
- `container` setup: you can run the frontends from your worktree. Run `pnpm dev` in `frontend/` in the background.
  Then start the proxy as `.agents/skills/browser-test/browser-proxy --frontend local`.
  The backend still comes from the stack of the user. To use a backend from the worktree, add `--backend 'http://127.0.0.1:<port>'`.
  Do not run migrations against the shared database without asking.

Before `pnpm dev` in a worktree, run `pnpm install` and `pnpm codegen` in `frontend/`.
Copy `apps/<app>/.env.example` to `apps/<app>/.env.local`. Do not copy the `.env.local` files of the user.
Leave `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` empty, unless the test is about Sentry.

## 6. Clean up

Stop the proxy and the dev servers that you started. Leave the stack of the user as it is.
