---
name: browser-test
description: >-
  Test the customer UI and the staff UI in a real browser with Playwright, against a development stack
  that runs locally or against the shared dev, test and stage environments,
  with login through the Tunnistamo test environment.
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
A worktree has its own copy of the scripts. Run `npm ci` again in the worktree before you use them from there.
If Chromium does not start because system libraries are missing, stop and ask the user to install them.
The command is `sudo npm exec --prefix .agents/skills/browser-test -- playwright install-deps chromium`. It needs root.

## 2. Find the setup

Run the scripts from the repository root, as a single command without `cd`, pipes or redirects.
A hook blocks them in any other form.

```bash
.agents/skills/browser-test/browser-env
```

The script prints the setup and its URLs. Use these URLs. Do not guess ports.

| `setup`     | What runs                                                                                          |
|-------------|----------------------------------------------------------------------------------------------------|
| `direct`    | The frontends on `localhost:3000` and `localhost:3001`, the backend on `localhost:8000`. From `just stack up`, `just stack up-no-gateway`, or the servers on the host. |
| `gateway`   | The frontends have an empty `NEXT_PUBLIC_LOCAL_API_URL`, so all goes through the gateway on `localhost:8080`. |
| `container` | The agent runs in a container of its own. The stack runs in other containers. Nothing listens on `localhost:8000` yet. |
| `proxy`     | The `container` setup after you start `browser-proxy`. One address on `localhost:8000`.             |
| `remote`    | A shared environment, with `--env dev`, `--env test` or `--env stage`. See "Shared environments". |
| `none`      | Nothing usable found. Read `hint`. Ask the user to start the stack. Do not start it yourself.       |

`just stack up` also starts the gateway on `localhost:8080`. The gateway can run while the frontends use the backend
on `localhost:8000`, which is the default in `apps/<app>/.env.local`. Then the gateway does not work for the browser.
So `browser-env` does not choose by the open ports. It asks the customer UI which backend URL the browser gets.

### Out-of-date checkout

When the stack runs the frontend from the checkout of the user, `browser-env` also checks that the generated
GraphQL types in that checkout are newer than the schema and the GraphQL documents.
After a branch switch without codegen, the frontend sends queries that the backend does not know.
Then pages fail with errors such as `Unknown argument` or `Cannot query field`.

If the output has `stale`, the script exits with 1. Stop and ask the user to run `just stack install` in their checkout.
Do not work around it with a frontend from your worktree. The user wants the test to run against their stack.
The check uses the main checkout. If the stack runs from another checkout, add `--checkout <path>`.
The check compares file times. An edit of a query file without a change to the query also counts.
If the user says that the types are current, continue.

The browser must use `localhost`. The backend allows only `localhost` origins.
The login service accepts the callbacks to `localhost:8000` and `localhost:8080`.
So login and logout work in all setups.

### The `container` setup

`browser-env` prints the `proxy` command for the stack: with the gateway, or with `--no-gateway`.
Start that command in the background. It puts the routes of `docker/Caddyfile` on `localhost:8000`.

```bash
.agents/skills/browser-test/browser-proxy
```

Then run `browser-env` again. It now gives `proxy`. If the Compose project of the stack has another name
than `tilavarauspalvelu-core`, add `--project <name>` to both scripts.

### Shared environments

Add `--env dev`, `--env test` or `--env stage` to `browser-env` and `browser-login` to use a shared environment
instead of the local setup. The addresses are the same as in `just infra release-check`.
The scripts refuse production. Never run browser tests against production.

```bash
.agents/skills/browser-test/browser-env --env test
.agents/skills/browser-test/browser-login --env test admin
```

The environments are shared with the team and the testers. You may make test data there, for example a draft application.
Give it a name that shows that it is a test, and tell the user what you made.
Run `just infra release-check <env>` to see which release the env runs.

## 3. Log in

```bash
.agents/skills/browser-test/browser-login admin
.agents/skills/browser-test/browser-login noaccess
```

The script logs in through Tunnistamo test and the Suomi.fi test identification. It prints the user that the backend sees.

| Name            | Test ID       | Access                                                                    |
|-----------------|---------------|---------------------------------------------------------------------------|
| `noaccess`      | `210281-9988` | No roles. The default ID of the Suomi.fi test identification.             |
| `admin`         | `090909-900D` | The general role `ADMIN` in the permission model. Not a Django superuser. |
| `unit-reserver` | `010101-900V` | The unit role `RESERVER` in all units and unit groups.                    |
| `unit-viewer`   | `020202-900V` | The unit role `VIEWER` in all units and unit groups.                      |
| `unit-handler`  | `030303-900V` | The unit role `HANDLER` in all units and unit groups.                     |
| `unit-admin`    | `040404-900V` | The unit role `ADMIN` in all units and unit groups.                       |

Use the unit users to test different permission levels.
The roles come from the database of the setup. In the shared environments they can differ from the table.
Read the `currentUser` that `browser-login` prints. If a user has no roles or other roles, tell the user.
Do not change the roles yourself.
Staff users also work in the customer UI. Use `noaccess` only when the test is about limited permissions.
Do not make superusers for tests.

The session is saved in the temp directory of the system and used again while the backend accepts it.
The files have live session cookies. Never print them and never copy them into the repository.

## 4. Write a test script

Put the script in your scratch directory, not in the repository.
Import `lib.mjs` by its absolute path. It also exports Playwright.

```js
import { chromium, newSession, urls, USERS } from "/<repository root>/.agents/skills/browser-test/lib.mjs";

const env = await urls(); // { setup, customer, staff, api }. urls({ env: "test" }) gives a shared environment.
const browser = await chromium.launch();
const context = await newSession(browser, env, USERS.admin); // null gives an anonymous session
const page = await context.newPage();
await page.goto(`${env.staff}/reservation-units`);
await page.screenshot({ path: "/<scratch>/staff.png", fullPage: true });
await browser.close();
```

- Use `env.customer`, `env.staff` and `env.api`. Never write `localhost:3000`, `localhost:8000` or an env address in a test.
- `currentUser(context, env)` asks the backend who is logged in.
- Look at the screenshots with the Read tool. A page that loads is not proof that it is correct.
- Collect `pageerror` and console errors, and report them.
- The UIs are in Finnish by default. Find elements by role and by `id` where you can.

## 5. Which code is under test

The browser tests the code that the servers run, not the code in your worktree. Tell the user which code you tested.

- `direct` and `gateway` setups: the servers run from where the user started them.
  `just stack` runs the checkout where the user started it. Ask if you do not know.
  To test a worktree, the user must start the stack from it. Ask.
- `container` and `proxy` setups: you can run the frontends from your worktree. Run `pnpm dev` in `frontend/` in the background.
  Then start the proxy with the arguments from `browser-env` and `--frontend local`.
  The backend still comes from the stack of the user. To use a backend from the worktree, add `--backend 'http://127.0.0.1:<port>'`.
  Do not run migrations against the shared database without asking.

- `remote` setup: the release that runs in the env. `just infra release-check <env>` prints its version.

Before `pnpm dev` in a worktree, run `pnpm install` and `pnpm codegen` in `frontend/`.
Copy `apps/<app>/.env.example` to `apps/<app>/.env.local`. Do not copy the `.env.local` files of the user.
Leave `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` empty, unless the test is about Sentry.

## 6. Clean up

Stop the proxy and the dev servers that you started. Leave the stack of the user as it is.
