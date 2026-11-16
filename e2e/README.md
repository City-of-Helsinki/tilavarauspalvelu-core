# Varaamo end-to-end tests

Playwright tests for Varaamo's customer site, admin UI (`/kasittely`) and Django admin. They run against the shared
test environment, https://varaamo.test.hel.ninja/.

> [!WARNING]
> A test run deletes and recreates the test data (everything under the unit Harakka) in the shared test environment.
> Never start two runs at the same time, locally or in CI.

## Setup

You need Node 24 and pnpm 11 (`corepack enable` sets up pnpm). This folder is a pnpm project of its own: run all
commands here.

```bash
pnpm install
pnpm e2e:install-deps   # Chromium, Firefox and WebKit, with their system packages
cp TestSuites/Resources/.env.example TestSuites/Resources/.env
```

Then fill in the three secrets in `.env`: `WAF_BYPASS_SECRET`, `ROBOT_API_TOKEN` and `DJANGO_ADMIN_PASSWORD`.

## Run the tests

| Command                   | Runs                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| `pnpm test:all`           | Everything: `pnpm test`, then `pnpm test:notifications`, even if the first fails |
| `pnpm test`               | All suites in parallel, except the notification suite                            |
| `pnpm test:notifications` | The notification suite, one test at a time                                       |
| `pnpm test:smoke`         | The customer and admin login tests on desktop                                    |
| `pnpm test:sequential`    | Like `pnpm test`, with one worker and shared users                               |
| `pnpm report`             | Opens the HTML report                                                            |

One suite, or one test in it:

```bash
pnpm exec playwright test --project Tests_user_desktop_FI
pnpm exec playwright test --project Tests_user_desktop_FI -g "User logs in and out with suomi_fi"
```

Add `--headed` to watch the browser, `--ui` for the UI mode or `--debug` for the inspector.

- A run first recreates the test data (the `create_data` project), even for one test. It waits until the new data is
  saved (at most 5 min) and the site answers normally three times in a row (at most 2 min).
- The notification suite runs on its own, because its banners show on every page of the shared environment. It
  doesn't recreate the test data. Its setup project, `notifications_login`, logs in its admin once.

## Suites

| Project                            | Tests | Covers                                                                                |
| ---------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| `Tests_user_desktop_FI`            | 11    | Customer site on desktop Chromium: login, single, paid and recurring bookings, emails |
| `Tests_user_mobile_android_FI`     | 6     | Customer tests on a Pixel 5 (Chromium)                                                |
| `Tests_user_mobile_iphone_FI`      | 6     | Customer tests on an iPhone 14 (WebKit)                                               |
| `Tests_admin_desktop_FI`           | 5     | Admin UI: login, reservation types, permissions (with Django admin in Firefox)        |
| `Tests_users_with_admin_desktop`   | 3     | A customer books, an admin handles the booking, the customer checks the result        |
| `Tests_admin_notifications_serial` | 4     | Banner notifications, one test at a time                                              |

## Results

- **HTML report:** `pnpm report`. It shows each test's keyword steps with their arguments, and under "Before Hooks"
  the users that the test's tags chose.
- **Backend errors:** the report lists them at the top of each attempt: 5xx responses, failed or slow requests,
  GraphQL errors, the apps' error pages and errors in the page. They show whether a failure came from the backend.
- **Failed tests** keep a full-page screenshot of each open page, a video and an `error-context.md` (the page's
  accessibility snapshot) in `test-results/`.
- **Text summary:** `python3 tools/report_summary.py [report folder]` prints the totals, the warnings and each failed
  or flaky test with its error, failing step, attachments and backend errors. It reads reports downloaded from CI too.
  `--all` adds the passed tests.
- **After `pnpm test:all`**, the notification suite has a report of its own:
  `pnpm exec playwright show-report playwright-report/notifications`. Its files are in `test-results/notifications/`.

## Troubleshooting

| Problem                                                                          | Cause and fix                                                                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `create_data` fails: `ROBOT_API_TOKEN not provided …` or `Unexpected status 401` | `ROBOT_API_TOKEN` is missing or wrong                                          |
| `create_data` fails: `Unexpected status 429`                                     | The test data was requested less than a minute ago. Wait a minute              |
| `create_data` fails: `Unexpected status 425`                                     | The backend is still creating the test data of an earlier request. Wait for it |
| The run stops: `Invalid environment variables`                                   | A setting has an invalid value. The message names it                           |

## Write a test

- **Where:** customer tests go in `TestSuites/customer-tests.ts`, the others in their suite's `Tests_*.spec.ts`.
- **Fixtures:** use the `test` from `TestSuites/fixtures.ts`. The page objects and `testData` (the users and units)
  are its fixtures: `async ({ appCommon, appUser, testData }) => { … }`.
- **Keywords:** tests mostly call the workflow keywords in `TestSuites/PO/App/`.
- **Sections:** group a test's steps with `await test.step("User pays the reservation", async () => { … })`.
- **Resources:** `TestSuites/Resources/` has the shared keywords and the constants (URLs, texts, units, selectors),
  like `variables.ts` and `texts_FI.ts`.
- **Waiting:** rely on Playwright's auto-waiting and `expect` (10 s by default; actions and navigations wait 40 s).
  Use a fixed sleep only when nothing on the page tells when to go on.
- **Time:** the tests run in Helsinki time, like the app. The config sets `TZ` and the browsers' time zone.
- **Skips:** a skipped test fails the run.

### Tags

Tags pick the test's users and units before it starts (`TestSuites/test-data.ts`). Add them like this:
`test("…", { tag: ["@user-data-set-N", "@also-on-phones"] }, async (…) => { … })`.

- A data set tag of its own: `@user-data-set-N` (customer test), `@admin-test-data-set-N` (admin test) or
  `@combined-test-data-set-N` (customer and admin test). The sets are in `Resources/test_users.ts`.
- Admin and combined tests: the suite tag `@admin-suite` or `@combined-suite`.
- Customer tests that also run on phones: `@also-on-phones`, or `@phone-only` for phones only.
- `@smoke`: a desktop customer or admin test also runs in `pnpm test:smoke`.

A wrong data set or suite tag fails the test at its start. A missing one doesn't: without a data set tag, the test
silently gets the shared customer user, and without a suite tag, the desktop units.

### Page objects

Page objects are classes in `TestSuites/PO/`, one per file. A keyword is a page object method with a step name. The
report shows each call as a step with its arguments:

```ts
@step("app_common.User Logs In With Suomi Fi")
async userLogsInWithSuomiFi() { … }
```

- `step`, `log()` and `expect` come from `lib/runtime.ts`.
- In a page object, use `this.page` (the Playwright page), `this.pages` (the other page objects), `this.testData`
  (users and units), `this.state` (values that earlier keywords saved, in `TestSuites/state.ts`), `this.isMobile`
  (true on phones) and `this.session` (the test's pages: `switchTo(page)` changes the one the keywords use).
- A new page object goes in `TestSuites/pages.ts`, and as a fixture in `TestSuites/fixtures.ts`.

## Settings

Set them in the environment, like `WORKERS=3 pnpm test`, or in `TestSuites/Resources/.env`. The environment wins.
`.env.example` lists them all.

| Variable               | Default | Effect                                                                                 |
| ---------------------- | ------- | -------------------------------------------------------------------------------------- |
| `WORKERS`              | `5`     | Parallel workers                                                                       |
| `RETRIES`              | `1`     | Retries of a failed test                                                               |
| `FORCE_SINGLE_USER`    | `false` | `true`: all tests use the same shared users, as they always do with one worker         |
| `PW_TRACE`             | `off`   | A Playwright trace mode, like `on` or `retain-on-failure`. Ignored in CI               |
| `ENABLE_HAR_RECORDING` | `false` | `true`: a HAR file of each browser context in the test's `test-results/` folder        |
| `LOG_LEVEL`            | `INFO`  | The lowest level of `log()` messages in the report: `DEBUG`, `INFO`, `WARN` or `ERROR` |

Booleans take `true`/`false` or `1`/`0`, in any case. HAR files and traces are for local debugging only: don't upload
them as CI artifacts.

## Checks

These need no test environment. The "E2E checks" workflow (`.github/workflows/test-e2e.yml`) runs them on pull
requests and pushes to `main` that change `e2e/` or `tilavaraus.graphql`.

```bash
pnpm codegen     # writes the GraphQL query types to gql/gql-types.ts (not committed); pnpm lint needs them
pnpm lint        # oxlint with type checking and the frontend's rules; pnpm lint:fix fixes what it can
pnpm format      # formats with oxfmt; pnpm format:check only checks
pnpm run list    # lists the tests, which fails if a file doesn't load
pnpm test:unit   # unit tests of lib/ and of the keywords, against local pages
```

## CI (GitHub Actions)

The "E2E tests" workflow (`.github/workflows/run-e2e.yml`) runs the suites against the test environment. Start it by
hand in the Actions tab and pick the suite ("All Tests" is `pnpm test:all`), the mode (sequential is one worker with
shared users) and the workers of a parallel run (3, 4 or 5).

- One run goes at a time.
- The secrets are repository secrets with the same names.
- The job summary lists the results. The reports are in the `e2e-reports-<run number>` artifact for 30 days.
- Both e2e workflows (E2E checks and E2E tests) run in the official Playwright image of the `@playwright/test` version
  in `package.json`, which has the browsers. Keep that version exact, without `^`.

## History

Converted from the Robot Framework suite
[tilavarauspalvelu-robot](https://github.com/City-of-Helsinki/tilavarauspalvelu-robot) (commit `dc72ec3`), which it
replaced. Many names come from there, like the project names, the keyword step names and the `ROBOT_*` variables.
